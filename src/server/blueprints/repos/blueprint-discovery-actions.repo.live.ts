import { createHash } from 'node:crypto'
import { and, asc, desc, eq, gt, gte, inArray, isNull, lt, or, sql } from 'drizzle-orm'
import { Effect, Layer } from 'effect'
import { DB } from '@/db'
import {
  blueprintDiscoveryExposure,
  blueprintDiscoverySignal,
  blueprintDiscoveryServingDaily,
  blueprintMeasurementSetting,
  blueprintPreference,
  blueprintPreferenceMutation,
} from '@/db/schema/blueprint-discovery.schema'
import { blueprintRevision, blueprintTemplate } from '@/db/schema/blueprint.schema'
import {
  blueprintAttributionAcquisition,
  blueprintQualifiedAdoption,
} from '@/db/schema/blueprint-attribution.schema'
import { ConflictError, serverOperationError } from '@/lib/domain-errors'
import { isBlueprintDiscoveryAccountEligible } from '../services/blueprint-measurement-eligibility'
import {
  BlueprintDiscoveryActionsRepo,
  type BlueprintRankingContext,
} from './blueprint-discovery-actions.repo'

const conflict = (code: string) =>
  new ConflictError({ category: 'conflict', code, userMessageKey: 'serverErrors.CONFLICT' })
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const encodeCursor = (key: string) => Buffer.from(key).toString('base64url')
const decodeCursor = (cursor: string) => {
  try {
    const key = Buffer.from(cursor, 'base64url').toString()
    return key && encodeCursor(key) === cursor ? key : null
  } catch {
    return null
  }
}
const requestKey = (actorId: string, requestId: string) =>
  `blueprint-discovery-request:${actorId}:${requestId}`
const measurementKey = (actorId: string) => `blueprint-measurement:${actorId}`
// Keep consented but abusive clients from growing raw account-linked telemetry without bound.
const MAX_NEW_EXPOSURES_PER_ACCOUNT_PER_MINUTE = 120
const MAX_NEW_EXPOSURES_PER_ACCOUNT_PER_UTC_DAY = 1000
const MAX_MEASUREMENT_PAGE_ITEMS = 40
const decodePgDate = (value: unknown): Date =>
  value instanceof Date ? value : new Date(String(value))

const boundedVersion = (value: string | undefined): string =>
  value && /^[A-Za-z0-9._-]{1,64}$/.test(value) ? value : 'unknown'

const servingPolicy = (item: { rankingContext?: BlueprintRankingContext }) => {
  const context = item.rankingContext
  return {
    policyMode: context?.mode === 'baseline_v1' ? ('baseline_v1' as const) : ('catalog' as const),
    algorithmVersion: boundedVersion(context?.algorithmVersion),
    configurationVersion: boundedVersion(context?.configurationVersion),
    configurationDigest:
      context && /^[a-f0-9]{64}$/.test(context.configurationDigest)
        ? context.configurationDigest
        : 'unknown',
  }
}

export const BlueprintDiscoveryActionsRepoLive = Layer.effect(
  BlueprintDiscoveryActionsRepo,
  Effect.gen(function* () {
    const database = yield* DB
    type DiscoveryTransaction = Parameters<Parameters<typeof database.transaction>[0]>[0]
    const eligibleRevision = (
      tx: DiscoveryTransaction,
      catalogKey: string,
      revision: number,
      contentHash: string
    ) =>
      tx
        .select({
          catalogKey: blueprintRevision.catalogKey,
          creatorUserId: blueprintTemplate.createdByUserId,
        })
        .from(blueprintRevision)
        .leftJoin(blueprintTemplate, eq(blueprintRevision.templateId, blueprintTemplate.id))
        .where(
          and(
            eq(blueprintRevision.catalogKey, catalogKey),
            eq(blueprintRevision.revision, revision),
            eq(blueprintRevision.contentHash, contentHash),
            isNull(blueprintRevision.retiredAt),
            or(
              isNull(blueprintRevision.templateId),
              and(
                eq(blueprintTemplate.listedRevision, revision),
                isNull(blueprintTemplate.retiredAt)
              )
            )
          )
        )
        .limit(1)
    const ledger = <A>(
      tx: DiscoveryTransaction,
      actorId: string,
      requestId: string,
      inputHash: string
    ) =>
      Effect.gen(function* () {
        const [prior] = yield* tx
          .select({
            requestHash: blueprintPreferenceMutation.requestHash,
            response: blueprintPreferenceMutation.response,
          })
          .from(blueprintPreferenceMutation)
          .where(
            and(
              eq(blueprintPreferenceMutation.actorUserId, actorId),
              eq(blueprintPreferenceMutation.requestId, requestId)
            )
          )
          .limit(1)
        if (!prior) return undefined
        if (prior.requestHash !== inputHash)
          return yield* Effect.fail(conflict('BLUEPRINT_REQUEST_ID_REUSED'))
        return prior.response as A
      })

    const saveLedger = (
      tx: DiscoveryTransaction,
      actorId: string,
      requestId: string,
      inputHash: string,
      kind: 'preference' | 'measurementSetting' | 'signal',
      response: unknown
    ) =>
      tx
        .insert(blueprintPreferenceMutation)
        .values({ actorUserId: actorId, requestId, requestHash: inputHash, kind, response })
    const purgeActorMeasurement = (actorId: string) =>
      database.transaction((tx) =>
        Effect.gen(function* () {
          yield* tx.execute(sql`select pg_advisory_xact_lock(hashtext(${measurementKey(actorId)}))`)
          yield* tx
            .delete(blueprintDiscoverySignal)
            .where(eq(blueprintDiscoverySignal.actorUserId, actorId))
          yield* tx
            .delete(blueprintDiscoveryExposure)
            .where(eq(blueprintDiscoveryExposure.actorUserId, actorId))
          yield* tx
            .delete(blueprintDiscoveryServingDaily)
            .where(eq(blueprintDiscoveryServingDaily.actorUserId, actorId))
          yield* tx
            .delete(blueprintPreferenceMutation)
            .where(
              and(
                eq(blueprintPreferenceMutation.actorUserId, actorId),
                eq(blueprintPreferenceMutation.kind, 'signal')
              )
            )
        })
      )

    return {
      listPreferences: (actorId, input) =>
        Effect.gen(function* () {
          const after = input.cursor ? decodeCursor(input.cursor) : undefined
          if (input.cursor && !after)
            return yield* Effect.fail(conflict('BLUEPRINT_PREFERENCE_CURSOR_INVALID'))
          const rows = yield* database
            .select()
            .from(blueprintPreference)
            .where(
              and(
                eq(blueprintPreference.actorUserId, actorId),
                after ? gt(blueprintPreference.catalogKey, after) : undefined
              )
            )
            .orderBy(asc(blueprintPreference.catalogKey))
            .limit(input.limit + 1)
          const hasNext = rows.length > input.limit
          const page = rows.slice(0, input.limit)
          return {
            items: page.map((row) => ({
              catalogKey: row.catalogKey,
              revision: row.bookmarkRevision ?? row.likeRevision ?? row.notInterestedRevision ?? 1,
              contentHash:
                row.bookmarkContentHash ??
                row.likeContentHash ??
                row.notInterestedContentHash ??
                '0'.repeat(64),
              bookmarkRevision: row.bookmarkRevision,
              bookmarkContentHash: row.bookmarkContentHash,
              likeRevision: row.likeRevision,
              likeContentHash: row.likeContentHash,
              notInterestedRevision: row.notInterestedRevision,
              notInterestedContentHash: row.notInterestedContentHash,
              liked: row.liked,
              bookmarked: row.bookmarked,
              notInterested: row.notInterested,
            })),
            ...(hasNext && page.length
              ? { nextCursor: encodeCursor(page[page.length - 1]!.catalogKey) }
              : {}),
          }
        }).pipe(
          Effect.mapError((cause) =>
            cause instanceof ConflictError
              ? cause
              : serverOperationError(cause, {
                  category: 'system',
                  code: 'BLUEPRINT_PREFERENCES_FAILED',
                  userMessageKey: 'serverErrors.SYSTEM',
                })
          )
        ),
      getPreferenceStates: (actorId, catalogKeys) =>
        Effect.gen(function* () {
          if (!catalogKeys.length) return {}
          const rows = yield* database
            .select()
            .from(blueprintPreference)
            .where(
              and(
                eq(blueprintPreference.actorUserId, actorId),
                inArray(blueprintPreference.catalogKey, catalogKeys)
              )
            )
          return Object.fromEntries(
            rows.map((row) => [
              row.catalogKey,
              {
                catalogKey: row.catalogKey,
                revision:
                  row.bookmarkRevision ?? row.likeRevision ?? row.notInterestedRevision ?? 1,
                contentHash:
                  row.bookmarkContentHash ??
                  row.likeContentHash ??
                  row.notInterestedContentHash ??
                  '0'.repeat(64),
                liked: row.liked,
                bookmarked: row.bookmarked,
                notInterested: row.notInterested,
                likeRevision: row.likeRevision,
                likeContentHash: row.likeContentHash,
              },
            ])
          )
        }).pipe(
          Effect.mapError((cause) =>
            serverOperationError(cause, {
              category: 'system',
              code: 'BLUEPRINT_PREFERENCES_FAILED',
              userMessageKey: 'serverErrors.SYSTEM',
            })
          )
        ),

      updatePreference: (actorId, input) =>
        Effect.gen(function* () {
          const inputHash = hash(input)
          return yield* database.transaction((tx) =>
            Effect.gen(function* () {
              yield* tx.execute(
                sql`select pg_advisory_xact_lock(hashtext(${requestKey(actorId, input.requestId)}))`
              )
              yield* tx.execute(
                sql`select pg_advisory_xact_lock(hashtext(${`blueprint-preference:${actorId}:${input.catalogKey}`}))`
              )
              const prior = yield* ledger<{
                requestId: string
                catalogKey: string
                revision: number
                contentHash: string
                liked: boolean
                bookmarked: boolean
                notInterested: boolean
              }>(tx, actorId, input.requestId, inputHash)
              if (prior) {
                const [current] = yield* tx
                  .select()
                  .from(blueprintPreference)
                  .where(
                    and(
                      eq(blueprintPreference.actorUserId, actorId),
                      eq(blueprintPreference.catalogKey, input.catalogKey)
                    )
                  )
                  .limit(1)
                return {
                  ...prior,
                  // The acknowledgement identifies the accepted command, while
                  // flags always reflect the latest state after any later writes.
                  revision: input.revision,
                  contentHash: input.contentHash,
                  liked: current?.liked ?? false,
                  bookmarked: current?.bookmarked ?? false,
                  notInterested: current?.notInterested ?? false,
                }
              }
              const [stored] = yield* tx
                .select()
                .from(blueprintPreference)
                .where(
                  and(
                    eq(blueprintPreference.actorUserId, actorId),
                    eq(blueprintPreference.catalogKey, input.catalogKey)
                  )
                )
                .limit(1)
              if (input.enabled) {
                const [eligible] = yield* eligibleRevision(
                  tx,
                  input.catalogKey,
                  input.revision,
                  input.contentHash
                )
                if (!eligible)
                  return yield* Effect.fail(conflict('BLUEPRINT_PREFERENCE_SOURCE_UNAVAILABLE'))
              } else if (!stored) {
                // The desired state is already absent; this remains an idempotent, safe operation.
              }
              const fields =
                input.kind === 'like'
                  ? {
                      liked: input.enabled,
                      likeRevision: input.enabled ? input.revision : null,
                      likeContentHash: input.enabled ? input.contentHash : null,
                    }
                  : input.kind === 'bookmark'
                    ? {
                        bookmarked: input.enabled,
                        bookmarkRevision: input.enabled ? input.revision : null,
                        bookmarkContentHash: input.enabled ? input.contentHash : null,
                      }
                    : {
                        notInterested: input.enabled,
                        notInterestedRevision: input.enabled ? input.revision : null,
                        notInterestedContentHash: input.enabled ? input.contentHash : null,
                      }
              const nextLiked = input.kind === 'like' ? input.enabled : (stored?.liked ?? false)
              const nextBookmarked =
                input.kind === 'bookmark' ? input.enabled : (stored?.bookmarked ?? false)
              const nextNotInterested =
                input.kind === 'notInterested' ? input.enabled : (stored?.notInterested ?? false)
              if (stored && !nextLiked && !nextBookmarked && !nextNotInterested) {
                yield* tx
                  .delete(blueprintPreference)
                  .where(
                    and(
                      eq(blueprintPreference.actorUserId, actorId),
                      eq(blueprintPreference.catalogKey, input.catalogKey)
                    )
                  )
              } else if (stored) {
                yield* tx
                  .update(blueprintPreference)
                  .set({ ...fields, updatedAt: new Date() })
                  .where(
                    and(
                      eq(blueprintPreference.actorUserId, actorId),
                      eq(blueprintPreference.catalogKey, input.catalogKey)
                    )
                  )
              } else if (input.enabled) {
                yield* tx.insert(blueprintPreference).values({
                  actorUserId: actorId,
                  catalogKey: input.catalogKey,
                  liked: false,
                  bookmarked: false,
                  notInterested: false,
                  ...fields,
                })
              }
              const [current] = yield* tx
                .select()
                .from(blueprintPreference)
                .where(
                  and(
                    eq(blueprintPreference.actorUserId, actorId),
                    eq(blueprintPreference.catalogKey, input.catalogKey)
                  )
                )
                .limit(1)
              const response = {
                requestId: input.requestId,
                catalogKey: input.catalogKey,
                revision: input.revision,
                contentHash: input.contentHash,
                liked: current?.liked ?? false,
                bookmarked: current?.bookmarked ?? false,
                notInterested: current?.notInterested ?? false,
              }
              yield* saveLedger(tx, actorId, input.requestId, inputHash, 'preference', response)
              return response
            })
          )
        }).pipe(
          Effect.mapError((cause) =>
            cause instanceof ConflictError
              ? cause
              : serverOperationError(cause, {
                  category: 'system',
                  code: 'BLUEPRINT_PREFERENCE_UPDATE_FAILED',
                  userMessageKey: 'serverErrors.SYSTEM',
                })
          )
        ),

      getMeasurementSettings: (actorId) =>
        Effect.gen(function* () {
          if (!isBlueprintDiscoveryAccountEligible(actorId)) {
            yield* purgeActorMeasurement(actorId)
            return { enabled: false }
          }
          const [row] = yield* database
            .select({ enabled: blueprintMeasurementSetting.enabled })
            .from(blueprintMeasurementSetting)
            .where(eq(blueprintMeasurementSetting.actorUserId, actorId))
            .limit(1)
          return { enabled: row?.enabled ?? false }
        }).pipe(
          Effect.mapError((cause) =>
            serverOperationError(cause, {
              category: 'system',
              code: 'BLUEPRINT_MEASUREMENT_READ_FAILED',
              userMessageKey: 'serverErrors.SYSTEM',
            })
          )
        ),

      updateMeasurementSettings: (actorId, input) =>
        Effect.gen(function* () {
          const inputHash = hash({ action: 'measurement-setting', ...input })
          return yield* database.transaction((tx) =>
            Effect.gen(function* () {
              yield* tx.execute(
                sql`select pg_advisory_xact_lock(hashtext(${requestKey(actorId, input.requestId)}))`
              )
              yield* tx.execute(
                sql`select pg_advisory_xact_lock(hashtext(${measurementKey(actorId)}))`
              )
              const prior = yield* ledger<{ enabled: boolean }>(
                tx,
                actorId,
                input.requestId,
                inputHash
              )
              if (prior) {
                if (!isBlueprintDiscoveryAccountEligible(actorId)) return { enabled: false }
                const [current] = yield* tx
                  .select({ enabled: blueprintMeasurementSetting.enabled })
                  .from(blueprintMeasurementSetting)
                  .where(eq(blueprintMeasurementSetting.actorUserId, actorId))
                  .limit(1)
                return { enabled: current?.enabled ?? false }
              }
              const enabled = input.enabled && isBlueprintDiscoveryAccountEligible(actorId)
              yield* tx
                .insert(blueprintMeasurementSetting)
                .values({ actorUserId: actorId, enabled, updatedAt: new Date() })
                .onConflictDoUpdate({
                  target: blueprintMeasurementSetting.actorUserId,
                  set: { enabled, updatedAt: new Date() },
                })
              if (!enabled) {
                yield* tx
                  .delete(blueprintDiscoverySignal)
                  .where(eq(blueprintDiscoverySignal.actorUserId, actorId))
                yield* tx
                  .delete(blueprintDiscoveryExposure)
                  .where(eq(blueprintDiscoveryExposure.actorUserId, actorId))
                yield* tx
                  .delete(blueprintDiscoveryServingDaily)
                  .where(eq(blueprintDiscoveryServingDaily.actorUserId, actorId))
                yield* tx
                  .delete(blueprintPreferenceMutation)
                  .where(
                    and(
                      eq(blueprintPreferenceMutation.actorUserId, actorId),
                      eq(blueprintPreferenceMutation.kind, 'signal')
                    )
                  )
              }
              const response = { enabled }
              yield* saveLedger(
                tx,
                actorId,
                input.requestId,
                inputHash,
                'measurementSetting',
                response
              )
              return response
            })
          )
        }).pipe(
          Effect.mapError((cause) =>
            cause instanceof ConflictError
              ? cause
              : serverOperationError(cause, {
                  category: 'system',
                  code: 'BLUEPRINT_MEASUREMENT_UPDATE_FAILED',
                  userMessageKey: 'serverErrors.SYSTEM',
                })
          )
        ),

      issueExposures: (actorId, items) =>
        Effect.gen(function* () {
          if (!isBlueprintDiscoveryAccountEligible(actorId)) {
            yield* purgeActorMeasurement(actorId)
            return []
          }
          if (!items.length) return []
          return yield* database.transaction((tx) =>
            Effect.gen(function* () {
              yield* tx.execute(
                sql`select pg_advisory_xact_lock(hashtext(${measurementKey(actorId)}))`
              )
              const [setting] = yield* tx
                .select({ enabled: blueprintMeasurementSetting.enabled })
                .from(blueprintMeasurementSetting)
                .where(eq(blueprintMeasurementSetting.actorUserId, actorId))
                .limit(1)
              if (!setting?.enabled) return []
              const [clock] = yield* tx
                .select({ now: sql<Date>`clock_timestamp()`.mapWith(decodePgDate) })
                .from(sql`(select 1) as serving_clock`)
                .limit(1)
              const now = clock!.now
              const signalDate = now.toISOString().slice(0, 10)
              const minuteCutoff = new Date(now.getTime() - 60 * 1000)
              const dayStart = new Date(
                Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
              )
              const [minuteUsage] = yield* tx
                .select({ count: sql<number>`count(*)::int` })
                .from(blueprintDiscoveryExposure)
                .where(
                  and(
                    eq(blueprintDiscoveryExposure.actorUserId, actorId),
                    gte(blueprintDiscoveryExposure.issuedAt, minuteCutoff)
                  )
                )
              const [dailyUsage] = yield* tx
                .select({ count: sql<number>`count(*)::int` })
                .from(blueprintDiscoveryExposure)
                .where(
                  and(
                    eq(blueprintDiscoveryExposure.actorUserId, actorId),
                    gte(blueprintDiscoveryExposure.issuedAt, dayStart)
                  )
                )
              let minuteRemaining = Math.max(
                0,
                MAX_NEW_EXPOSURES_PER_ACCOUNT_PER_MINUTE - (minuteUsage?.count ?? 0)
              )
              let dayRemaining = Math.max(
                0,
                MAX_NEW_EXPOSURES_PER_ACCOUNT_PER_UTC_DAY - (dailyUsage?.count ?? 0)
              )
              const expiresAt = new Date(now.getTime() + 30 * 60 * 1000)
              const issued: Array<{ catalogKey: string; exposureId: string; expiresAt: Date }> = []
              type DiagnosticAccumulator = ReturnType<typeof servingPolicy> & {
                surface: 'browse' | 'category' | 'search'
                requestedItemAttempts: number
                eligibleItems: number
                issuedExposures: number
                reusedExposures: number
                quotaDeniedItems: number
                sourceIneligibleItems: number
              }
              const diagnostics = new Map<string, DiagnosticAccumulator>()
              const pageItems = items.slice(0, MAX_MEASUREMENT_PAGE_ITEMS)
              for (const item of pageItems) {
                const policy = servingPolicy(item)
                const key = JSON.stringify([item.surface, ...Object.values(policy)])
                let diagnostic = diagnostics.get(key)
                if (!diagnostic) {
                  diagnostic = {
                    ...policy,
                    surface: item.surface,
                    requestedItemAttempts: 0,
                    eligibleItems: 0,
                    issuedExposures: 0,
                    reusedExposures: 0,
                    quotaDeniedItems: 0,
                    sourceIneligibleItems: 0,
                  }
                  diagnostics.set(key, diagnostic)
                }
                diagnostic.requestedItemAttempts += 1
                const [eligible] = yield* eligibleRevision(
                  tx,
                  item.catalogKey,
                  item.revision,
                  item.contentHash
                )
                if (!eligible || eligible.creatorUserId === actorId) {
                  diagnostic.sourceIneligibleItems += 1
                  continue
                }
                diagnostic.eligibleItems += 1
                const snapshotId = item.snapshotId ? hash(item.snapshotId) : null
                const [existing] = yield* tx
                  .select({
                    exposureId: blueprintDiscoveryExposure.exposureId,
                    expiresAt: blueprintDiscoveryExposure.expiresAt,
                  })
                  .from(blueprintDiscoveryExposure)
                  .where(
                    and(
                      eq(blueprintDiscoveryExposure.actorUserId, actorId),
                      eq(blueprintDiscoveryExposure.catalogKey, item.catalogKey),
                      eq(blueprintDiscoveryExposure.sourceRevision, item.revision),
                      eq(blueprintDiscoveryExposure.contentHash, item.contentHash),
                      eq(blueprintDiscoveryExposure.surface, item.surface),
                      eq(blueprintDiscoveryExposure.rank, item.rank),
                      snapshotId === null
                        ? isNull(blueprintDiscoveryExposure.snapshotId)
                        : eq(blueprintDiscoveryExposure.snapshotId, snapshotId),
                      gt(blueprintDiscoveryExposure.expiresAt, now)
                    )
                  )
                  .limit(1)
                if (existing) {
                  diagnostic.reusedExposures += 1
                  issued.push({
                    catalogKey: item.catalogKey,
                    exposureId: existing.exposureId,
                    expiresAt: existing.expiresAt,
                  })
                  continue
                }
                if (minuteRemaining <= 0 || dayRemaining <= 0) {
                  diagnostic.quotaDeniedItems += 1
                  continue
                }
                const [row] = yield* tx
                  .insert(blueprintDiscoveryExposure)
                  .values({
                    actorUserId: actorId,
                    catalogKey: item.catalogKey,
                    sourceRevision: item.revision,
                    contentHash: item.contentHash,
                    surface: item.surface,
                    rank: item.rank,
                    snapshotId,
                    rankingContext: item.rankingContext ?? null,
                    issuedAt: now,
                    expiresAt,
                  })
                  .returning({ exposureId: blueprintDiscoveryExposure.exposureId })
                if (row)
                  issued.push({
                    catalogKey: item.catalogKey,
                    exposureId: row.exposureId,
                    expiresAt,
                  })
                if (row) {
                  diagnostic.issuedExposures += 1
                  minuteRemaining -= 1
                  dayRemaining -= 1
                }
              }
              for (const diagnostic of diagnostics.values()) {
                yield* tx
                  .insert(blueprintDiscoveryServingDaily)
                  .values({
                    actorUserId: actorId,
                    signalDate,
                    surface: diagnostic.surface,
                    policyMode: diagnostic.policyMode,
                    algorithmVersion: diagnostic.algorithmVersion,
                    configurationVersion: diagnostic.configurationVersion,
                    configurationDigest: diagnostic.configurationDigest,
                    requestedItemAttempts: diagnostic.requestedItemAttempts,
                    eligibleItems: diagnostic.eligibleItems,
                    issuedExposures: diagnostic.issuedExposures,
                    reusedExposures: diagnostic.reusedExposures,
                    quotaDeniedItems: diagnostic.quotaDeniedItems,
                    sourceIneligibleItems: diagnostic.sourceIneligibleItems,
                    lastAcceptedAt: now,
                    updatedAt: now,
                  })
                  .onConflictDoUpdate({
                    target: [
                      blueprintDiscoveryServingDaily.actorUserId,
                      blueprintDiscoveryServingDaily.signalDate,
                      blueprintDiscoveryServingDaily.surface,
                      blueprintDiscoveryServingDaily.policyMode,
                      blueprintDiscoveryServingDaily.algorithmVersion,
                      blueprintDiscoveryServingDaily.configurationVersion,
                      blueprintDiscoveryServingDaily.configurationDigest,
                    ],
                    set: {
                      requestedItemAttempts: sql`${blueprintDiscoveryServingDaily.requestedItemAttempts} + excluded.requested_item_attempts`,
                      eligibleItems: sql`${blueprintDiscoveryServingDaily.eligibleItems} + excluded.eligible_items`,
                      issuedExposures: sql`${blueprintDiscoveryServingDaily.issuedExposures} + excluded.issued_exposures`,
                      reusedExposures: sql`${blueprintDiscoveryServingDaily.reusedExposures} + excluded.reused_exposures`,
                      quotaDeniedItems: sql`${blueprintDiscoveryServingDaily.quotaDeniedItems} + excluded.quota_denied_items`,
                      sourceIneligibleItems: sql`${blueprintDiscoveryServingDaily.sourceIneligibleItems} + excluded.source_ineligible_items`,
                      lastAcceptedAt: sql`greatest(${blueprintDiscoveryServingDaily.lastAcceptedAt}, excluded.last_accepted_at)`,
                      updatedAt: now,
                    },
                  })
              }
              return issued
            })
          )
        }).pipe(Effect.catch(() => Effect.succeed([]))),

      recordSignal: (actorId, input) =>
        Effect.gen(function* () {
          if (!isBlueprintDiscoveryAccountEligible(actorId)) {
            yield* purgeActorMeasurement(actorId)
            return { accepted: true as const }
          }
          const inputHash = hash(input)
          return yield* database.transaction((tx) =>
            Effect.gen(function* () {
              yield* tx.execute(
                sql`select pg_advisory_xact_lock(hashtext(${requestKey(actorId, input.requestId)}))`
              )
              yield* tx.execute(
                sql`select pg_advisory_xact_lock(hashtext(${measurementKey(actorId)}))`
              )
              const prior = yield* ledger<{ accepted: true }>(
                tx,
                actorId,
                input.requestId,
                inputHash
              )
              if (prior) return prior
              const [setting] = yield* tx
                .select({ enabled: blueprintMeasurementSetting.enabled })
                .from(blueprintMeasurementSetting)
                .where(eq(blueprintMeasurementSetting.actorUserId, actorId))
                .limit(1)
              const [exposure] = yield* tx
                .select()
                .from(blueprintDiscoveryExposure)
                .where(
                  and(
                    eq(blueprintDiscoveryExposure.exposureId, input.exposureId),
                    eq(blueprintDiscoveryExposure.actorUserId, actorId)
                  )
                )
                .limit(1)
              if (!setting?.enabled || !exposure) return { accepted: true as const }
              const [eligible] = yield* eligibleRevision(
                tx,
                exposure.catalogKey,
                exposure.sourceRevision,
                exposure.contentHash
              )
              if (!eligible || eligible.creatorUserId === actorId)
                return { accepted: true as const }
              // Capture after both actor lock and consent/source eligibility.
              // createdAt remains PostgreSQL transaction-start metadata and is
              // intentionally not used to order accepted events.
              const [clock] = yield* tx
                .select({ acceptedAt: sql<Date>`clock_timestamp()`.mapWith(decodePgDate) })
                .from(sql`(select 1) as signal_clock`)
                .limit(1)
              const acceptedAt = clock!.acceptedAt
              if (exposure.issuedAt > acceptedAt || exposure.expiresAt <= acceptedAt)
                return { accepted: true as const }
              const signalDate = acceptedAt.toISOString().slice(0, 10)
              const [existingCredit] = yield* tx
                .select({ id: blueprintDiscoverySignal.id })
                .from(blueprintDiscoverySignal)
                .where(
                  and(
                    eq(blueprintDiscoverySignal.actorUserId, actorId),
                    eq(blueprintDiscoverySignal.catalogKey, exposure.catalogKey),
                    eq(blueprintDiscoverySignal.signalDate, signalDate),
                    eq(blueprintDiscoverySignal.kind, input.kind),
                    eq(blueprintDiscoverySignal.rankEligible, true)
                  )
                )
                .limit(1)
              const [priorImpression] =
                input.kind === 'open'
                  ? yield* tx
                      .select({ id: blueprintDiscoverySignal.id })
                      .from(blueprintDiscoverySignal)
                      .where(
                        and(
                          eq(blueprintDiscoverySignal.actorUserId, actorId),
                          eq(blueprintDiscoverySignal.exposureId, input.exposureId),
                          eq(blueprintDiscoverySignal.catalogKey, exposure.catalogKey),
                          eq(blueprintDiscoverySignal.kind, 'impression'),
                          gte(blueprintDiscoverySignal.acceptedAt, exposure.issuedAt),
                          lt(blueprintDiscoverySignal.acceptedAt, exposure.expiresAt)
                        )
                      )
                      .orderBy(desc(blueprintDiscoverySignal.acceptedSequence))
                      .limit(1)
                  : []
              // Retain each deduped per-exposure impression and open. Only the
              // first account/source/kind/UTC-day row receives ranking credit.
              const [inserted] = yield* tx
                .insert(blueprintDiscoverySignal)
                .values({
                  actorUserId: actorId,
                  exposureId: input.exposureId,
                  matchedImpressionId: input.kind === 'open' ? (priorImpression?.id ?? null) : null,
                  catalogKey: exposure.catalogKey,
                  signalDate,
                  requestId: input.requestId,
                  requestHash: inputHash,
                  kind: input.kind,
                  rankEligible: !existingCredit,
                  acceptedAt,
                })
                .onConflictDoNothing()
                .returning({ id: blueprintDiscoverySignal.id })
              if (inserted) {
                const response = { accepted: true as const }
                yield* saveLedger(tx, actorId, input.requestId, inputHash, 'signal', response)
              }
              return { accepted: true as const }
            })
          )
        }).pipe(Effect.catch(() => Effect.succeed({ accepted: true as const }))),

      cleanupExpiredMeasurement: (limit) =>
        Effect.gen(function* () {
          const boundedLimit = Math.max(1, Math.min(limit, 1000))
          const candidateCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          const candidates = yield* database
            .select({
              actorId: sql<string>`stale.actor_user_id`,
              staleAt: sql<Date>`stale.stale_at`,
            })
            .from(
              sql`(
              select actor_user_id, issued_at as stale_at
              from blueprint_discovery_exposure
              where issued_at < ${candidateCutoff}
              union all
              select actor_user_id, created_at as stale_at
              from blueprint_preference_mutation
              where kind = 'signal' and created_at < ${candidateCutoff}
              union all
              select actor_user_id, last_accepted_at as stale_at
              from blueprint_discovery_serving_daily
              where last_accepted_at < ${candidateCutoff}
            ) as stale`
            )
            .orderBy(sql`stale.stale_at`, sql`stale.actor_user_id`)
            .limit(1)
          const candidate = candidates[0]
          if (!candidate) return { deleted: 0 }

          return yield* database.transaction((tx) =>
            Effect.gen(function* () {
              // Process one actor at a time under the same lock used by every
              // telemetry write and opt-out purge. Recheck after acquiring it.
              yield* tx.execute(
                sql`select pg_advisory_xact_lock(hashtext(${measurementKey(candidate.actorId)}))`
              )
              const [clock] = yield* tx
                .select({ now: sql<Date>`clock_timestamp()`.mapWith(decodePgDate) })
                .from(sql`(select 1) as cleanup_clock`)
                .limit(1)
              const retentionCutoff = new Date(clock!.now.getTime() - 30 * 24 * 60 * 60 * 1000)
              let remaining = boundedLimit
              let deleted = 0

              const staleAdoptions = remaining
                ? yield* tx
                    .select({ id: blueprintQualifiedAdoption.id })
                    .from(blueprintQualifiedAdoption)
                    .innerJoin(
                      blueprintAttributionAcquisition,
                      eq(
                        blueprintAttributionAcquisition.id,
                        blueprintQualifiedAdoption.acquisitionId
                      )
                    )
                    .innerJoin(
                      blueprintDiscoveryExposure,
                      eq(
                        blueprintDiscoveryExposure.exposureId,
                        blueprintAttributionAcquisition.exposureId
                      )
                    )
                    .where(
                      and(
                        eq(blueprintQualifiedAdoption.actorUserId, candidate.actorId),
                        lt(blueprintDiscoveryExposure.issuedAt, retentionCutoff)
                      )
                    )
                    .orderBy(blueprintQualifiedAdoption.qualifiedAt, blueprintQualifiedAdoption.id)
                    .limit(remaining)
                : []
              if (staleAdoptions.length) {
                yield* tx.delete(blueprintQualifiedAdoption).where(
                  inArray(
                    blueprintQualifiedAdoption.id,
                    staleAdoptions.map((row) => row.id)
                  )
                )
                deleted += staleAdoptions.length
                remaining -= staleAdoptions.length
              }

              const staleAcquisitions = remaining
                ? yield* tx
                    .select({ id: blueprintAttributionAcquisition.id })
                    .from(blueprintAttributionAcquisition)
                    .innerJoin(
                      blueprintDiscoveryExposure,
                      eq(
                        blueprintDiscoveryExposure.exposureId,
                        blueprintAttributionAcquisition.exposureId
                      )
                    )
                    .where(
                      and(
                        eq(blueprintAttributionAcquisition.actorUserId, candidate.actorId),
                        lt(blueprintDiscoveryExposure.issuedAt, retentionCutoff)
                      )
                    )
                    .orderBy(
                      blueprintAttributionAcquisition.expiresAt,
                      blueprintAttributionAcquisition.id
                    )
                    .limit(remaining)
                : []
              if (staleAcquisitions.length) {
                yield* tx.delete(blueprintAttributionAcquisition).where(
                  inArray(
                    blueprintAttributionAcquisition.id,
                    staleAcquisitions.map((row) => row.id)
                  )
                )
                deleted += staleAcquisitions.length
                remaining -= staleAcquisitions.length
              }

              const staleOpens = remaining
                ? yield* tx
                    .select({ id: blueprintDiscoverySignal.id })
                    .from(blueprintDiscoverySignal)
                    .where(
                      and(
                        eq(blueprintDiscoverySignal.actorUserId, candidate.actorId),
                        eq(blueprintDiscoverySignal.kind, 'open'),
                        sql`exists (
                          select 1 from blueprint_discovery_exposure e
                          where e.exposure_id = ${blueprintDiscoverySignal.exposureId}
                            and e.issued_at < ${retentionCutoff}
                        )`
                      )
                    )
                    .orderBy(blueprintDiscoverySignal.acceptedAt, blueprintDiscoverySignal.id)
                    .limit(remaining)
                : []
              if (staleOpens.length) {
                yield* tx.delete(blueprintDiscoverySignal).where(
                  inArray(
                    blueprintDiscoverySignal.id,
                    staleOpens.map((row) => row.id)
                  )
                )
                deleted += staleOpens.length
                remaining -= staleOpens.length
              }

              const staleImpressions = remaining
                ? yield* tx
                    .select({ id: blueprintDiscoverySignal.id })
                    .from(blueprintDiscoverySignal)
                    .where(
                      and(
                        eq(blueprintDiscoverySignal.actorUserId, candidate.actorId),
                        eq(blueprintDiscoverySignal.kind, 'impression'),
                        sql`exists (
                          select 1 from blueprint_discovery_exposure e
                          where e.exposure_id = ${blueprintDiscoverySignal.exposureId}
                            and e.issued_at < ${retentionCutoff}
                        )`
                      )
                    )
                    .orderBy(blueprintDiscoverySignal.acceptedAt, blueprintDiscoverySignal.id)
                    .limit(remaining)
                : []
              if (staleImpressions.length) {
                yield* tx.delete(blueprintDiscoverySignal).where(
                  inArray(
                    blueprintDiscoverySignal.id,
                    staleImpressions.map((row) => row.id)
                  )
                )
                deleted += staleImpressions.length
                remaining -= staleImpressions.length
              }

              const staleSignalRequests = remaining
                ? yield* tx
                    .select({ requestId: blueprintPreferenceMutation.requestId })
                    .from(blueprintPreferenceMutation)
                    .where(
                      and(
                        eq(blueprintPreferenceMutation.actorUserId, candidate.actorId),
                        eq(blueprintPreferenceMutation.kind, 'signal'),
                        lt(blueprintPreferenceMutation.createdAt, retentionCutoff)
                      )
                    )
                    .orderBy(
                      blueprintPreferenceMutation.createdAt,
                      blueprintPreferenceMutation.requestId
                    )
                    .limit(remaining)
                : []
              if (staleSignalRequests.length) {
                yield* tx.delete(blueprintPreferenceMutation).where(
                  and(
                    eq(blueprintPreferenceMutation.actorUserId, candidate.actorId),
                    eq(blueprintPreferenceMutation.kind, 'signal'),
                    inArray(
                      blueprintPreferenceMutation.requestId,
                      staleSignalRequests.map((row) => row.requestId)
                    )
                  )
                )
                deleted += staleSignalRequests.length
                remaining -= staleSignalRequests.length
              }

              const staleDiagnostics = remaining
                ? yield* tx
                    .select({
                      signalDate: blueprintDiscoveryServingDaily.signalDate,
                      surface: blueprintDiscoveryServingDaily.surface,
                      policyMode: blueprintDiscoveryServingDaily.policyMode,
                      algorithmVersion: blueprintDiscoveryServingDaily.algorithmVersion,
                      configurationVersion: blueprintDiscoveryServingDaily.configurationVersion,
                      configurationDigest: blueprintDiscoveryServingDaily.configurationDigest,
                    })
                    .from(blueprintDiscoveryServingDaily)
                    .where(
                      and(
                        eq(blueprintDiscoveryServingDaily.actorUserId, candidate.actorId),
                        lt(blueprintDiscoveryServingDaily.lastAcceptedAt, retentionCutoff)
                      )
                    )
                    .orderBy(blueprintDiscoveryServingDaily.lastAcceptedAt)
                    .limit(remaining)
                : []
              if (staleDiagnostics.length) {
                yield* tx.delete(blueprintDiscoveryServingDaily).where(
                  and(
                    eq(blueprintDiscoveryServingDaily.actorUserId, candidate.actorId),
                    sql`(${blueprintDiscoveryServingDaily.signalDate}, ${blueprintDiscoveryServingDaily.surface}, ${blueprintDiscoveryServingDaily.policyMode}, ${blueprintDiscoveryServingDaily.algorithmVersion}, ${blueprintDiscoveryServingDaily.configurationVersion}, ${blueprintDiscoveryServingDaily.configurationDigest}) in (${sql.join(
                      staleDiagnostics.map(
                        (row) =>
                          sql`(${row.signalDate}, ${row.surface}, ${row.policyMode}, ${row.algorithmVersion}, ${row.configurationVersion}, ${row.configurationDigest})`
                      ),
                      sql`, `
                    )})`
                  )
                )
                deleted += staleDiagnostics.length
                remaining -= staleDiagnostics.length
              }

              const staleExposures = remaining
                ? yield* tx
                    .select({ exposureId: blueprintDiscoveryExposure.exposureId })
                    .from(blueprintDiscoveryExposure)
                    .where(
                      and(
                        eq(blueprintDiscoveryExposure.actorUserId, candidate.actorId),
                        lt(blueprintDiscoveryExposure.issuedAt, retentionCutoff),
                        sql`not exists (select 1 from blueprint_discovery_signal s where s.exposure_id = ${blueprintDiscoveryExposure.exposureId})`,
                        sql`not exists (select 1 from blueprint_attribution_acquisition a where a.exposure_id = ${blueprintDiscoveryExposure.exposureId})`
                      )
                    )
                    .orderBy(
                      blueprintDiscoveryExposure.issuedAt,
                      blueprintDiscoveryExposure.exposureId
                    )
                    .limit(remaining)
                : []
              if (staleExposures.length) {
                yield* tx.delete(blueprintDiscoveryExposure).where(
                  inArray(
                    blueprintDiscoveryExposure.exposureId,
                    staleExposures.map((row) => row.exposureId)
                  )
                )
                deleted += staleExposures.length
              }
              return { deleted }
            })
          )
        }).pipe(
          Effect.mapError((cause) =>
            serverOperationError(cause, {
              category: 'system',
              code: 'BLUEPRINT_MEASUREMENT_CLEANUP_FAILED',
              userMessageKey: 'serverErrors.SYSTEM',
            })
          )
        ),
    }
  })
)
