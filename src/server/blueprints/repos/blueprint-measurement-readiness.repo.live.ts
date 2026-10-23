import { and, eq, gt, gte, lt, lte, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { Effect, Layer } from 'effect'
import { DB } from '@/db'
import { user } from '@/db/schema/auth.schema'
import {
  blueprintAttributionAcquisition,
  blueprintQualifiedAdoption,
} from '@/db/schema/blueprint-attribution.schema'
import {
  blueprintDiscoveryExposure,
  blueprintDiscoveryServingDaily,
  blueprintDiscoverySignal,
  blueprintMeasurementSetting,
} from '@/db/schema/blueprint-discovery.schema'
import {
  blueprintInstallation,
  blueprintRevision,
  blueprintTemplate,
} from '@/db/schema/blueprint.schema'
import type {
  BlueprintMeasurementReadinessInput,
  BlueprintMeasurementReadinessRankingContext,
} from '../contracts/blueprint-measurement-readiness.contracts'
import { isBlueprintDiscoveryAccountEligible } from '../services/blueprint-measurement-eligibility'
import { validateBlueprintMeasurementReadinessWindow } from '../services/blueprint-measurement-readiness'
import { BlueprintMeasurementReadinessRepo } from './blueprint-measurement-readiness.repo'

const MAX_ROWS = 20_000
const MAX_ROWS_PLUS_ONE = MAX_ROWS + 1
const ROW_LIMIT_MESSAGE = 'Measurement readiness report exceeds the bounded row limit.'
const priorCopyRevision = alias(blueprintRevision, 'measurement_prior_copy_revision')
const priorInstallationRevision = alias(
  blueprintRevision,
  'measurement_prior_installation_revision'
)

const failIfTooMany = (length: number): void => {
  if (length > MAX_ROWS) throw new Error(ROW_LIMIT_MESSAGE)
}

const iso = (value: Date): string => value.toISOString()

const validRankingContext = (
  value: unknown
): BlueprintMeasurementReadinessRankingContext | null => {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  if (
    (row.mode !== 'baseline_v1' && row.mode !== 'catalog') ||
    typeof row.algorithmVersion !== 'string' ||
    typeof row.configurationVersion !== 'string' ||
    typeof row.configurationDigest !== 'string'
  )
    return null
  return {
    mode: row.mode,
    algorithmVersion: row.algorithmVersion,
    configurationVersion: row.configurationVersion,
    configurationDigest: row.configurationDigest,
  }
}

export const BlueprintMeasurementReadinessRepoLive = Layer.effect(
  BlueprintMeasurementReadinessRepo,
  Effect.gen(function* () {
    const database = yield* DB

    return {
      read: (
        input: Pick<BlueprintMeasurementReadinessInput, 'cohortStart' | 'cohortEnd' | 'asOf'>
      ) =>
        database
          .transaction((tx) =>
            Effect.gen(function* () {
              // Must be the first statement in this transaction; all later joins
              // observe a single read-only snapshot of current consent/public state.
              yield* tx.execute(sql`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY`)

              const start = new Date(input.cohortStart)
              const asOf = new Date(input.asOf)
              const [clock] = yield* tx
                .select({ readAt: sql<Date>`transaction_timestamp()` })
                .from(sql`(select 1) as measurement_clock`)
                .limit(1)
              const readAt = clock!.readAt
              validateBlueprintMeasurementReadinessWindow({ ...input, readAt: iso(readAt) })
              // Discovery exposure.expiresAt is the short-lived bearer-token TTL.
              // Telemetry retention is logical: issuedAt + 30 days.
              const retainedStart = new Date(readAt.getTime() - 30 * 24 * 60 * 60 * 1000)
              const dailyScopeAligned =
                start.getUTCHours() === 0 &&
                start.getUTCMinutes() === 0 &&
                start.getUTCSeconds() === 0 &&
                start.getUTCMilliseconds() === 0 &&
                new Date(input.cohortEnd).getUTCHours() === 0 &&
                new Date(input.cohortEnd).getUTCMinutes() === 0 &&
                new Date(input.cohortEnd).getUTCSeconds() === 0 &&
                new Date(input.cohortEnd).getUTCMilliseconds() === 0

              // Include cohort and continuation exposures. The report's denominator
              // remains cohort-only; continuation rows support attribution validation.
              const exposureRows = yield* tx
                .select({
                  actorId: blueprintDiscoveryExposure.actorUserId,
                  actorExists: user.id,
                  settingExists: blueprintMeasurementSetting.actorUserId,
                  consentEnabled: blueprintMeasurementSetting.enabled,
                  exposureId: blueprintDiscoveryExposure.exposureId,
                  catalogKey: blueprintDiscoveryExposure.catalogKey,
                  sourceRevision: blueprintDiscoveryExposure.sourceRevision,
                  sourceContentHash: blueprintDiscoveryExposure.contentHash,
                  surface: blueprintDiscoveryExposure.surface,
                  rank: blueprintDiscoveryExposure.rank,
                  issuedAt: blueprintDiscoveryExposure.issuedAt,
                  expiresAt: blueprintDiscoveryExposure.expiresAt,
                  rankingContext: blueprintDiscoveryExposure.rankingContext,
                  exactRevisionId: blueprintRevision.id,
                  revisionRetiredAt: blueprintRevision.retiredAt,
                  templateId: blueprintRevision.templateId,
                  creatorUserId: blueprintTemplate.createdByUserId,
                  listedRevision: blueprintTemplate.listedRevision,
                  templateRetiredAt: blueprintTemplate.retiredAt,
                })
                .from(blueprintDiscoveryExposure)
                .leftJoin(user, eq(user.id, blueprintDiscoveryExposure.actorUserId))
                .leftJoin(
                  blueprintMeasurementSetting,
                  eq(
                    blueprintMeasurementSetting.actorUserId,
                    blueprintDiscoveryExposure.actorUserId
                  )
                )
                .leftJoin(
                  blueprintRevision,
                  and(
                    eq(blueprintRevision.catalogKey, blueprintDiscoveryExposure.catalogKey),
                    eq(blueprintRevision.revision, blueprintDiscoveryExposure.sourceRevision),
                    eq(blueprintRevision.contentHash, blueprintDiscoveryExposure.contentHash)
                  )
                )
                .leftJoin(blueprintTemplate, eq(blueprintTemplate.id, blueprintRevision.templateId))
                .where(
                  and(
                    gt(blueprintDiscoveryExposure.issuedAt, retainedStart),
                    lte(blueprintDiscoveryExposure.issuedAt, asOf)
                  )
                )
                .orderBy(blueprintDiscoveryExposure.issuedAt, blueprintDiscoveryExposure.exposureId)
                .limit(MAX_ROWS_PLUS_ONE)
              failIfTooMany(exposureRows.length)

              const exposures: BlueprintMeasurementReadinessInput['exposures'] = exposureRows.map(
                (row) => {
                  const isPublicNow =
                    row.exactRevisionId !== null &&
                    row.revisionRetiredAt === null &&
                    (row.templateId === null ||
                      (row.templateRetiredAt === null && row.listedRevision === row.sourceRevision))
                  const exactSourceStatus = isPublicNow
                    ? 'current'
                    : row.exactRevisionId !== null
                      ? 'withdrawn'
                      : 'missing'
                  const actorDisposition =
                    row.actorExists === null
                      ? 'deleted'
                      : !isBlueprintDiscoveryAccountEligible(row.actorId)
                        ? 'excluded'
                        : row.creatorUserId === row.actorId
                          ? 'self'
                          : 'eligible'
                  const consent =
                    row.consentEnabled === true
                      ? 'enabled'
                      : row.settingExists !== null
                        ? 'withdrawn'
                        : 'missing'
                  if (
                    row.surface !== 'browse' &&
                    row.surface !== 'category' &&
                    row.surface !== 'search'
                  ) {
                    throw new Error(
                      'Measurement readiness report contains an invalid exposure surface.'
                    )
                  }
                  return {
                    actorId: row.actorId,
                    exposureId: row.exposureId,
                    catalogKey: row.catalogKey,
                    sourceRevision: row.sourceRevision,
                    sourceContentHash: row.sourceContentHash,
                    surface: row.surface,
                    rank: row.rank,
                    issuedAt: iso(row.issuedAt),
                    expiresAt: iso(row.expiresAt),
                    rankingContext: validRankingContext(row.rankingContext),
                    actorDisposition,
                    consent,
                    exactSourceStatus,
                  }
                }
              )

              const signalsRows = yield* tx
                .select({
                  signalId: blueprintDiscoverySignal.id,
                  actorId: blueprintDiscoverySignal.actorUserId,
                  exposureId: blueprintDiscoverySignal.exposureId,
                  catalogKey: blueprintDiscoverySignal.catalogKey,
                  kind: blueprintDiscoverySignal.kind,
                  rankEligible: blueprintDiscoverySignal.rankEligible,
                  acceptedAt: blueprintDiscoverySignal.acceptedAt,
                  acceptedSequence: blueprintDiscoverySignal.acceptedSequence,
                  matchedImpressionId: blueprintDiscoverySignal.matchedImpressionId,
                })
                .from(blueprintDiscoverySignal)
                .innerJoin(
                  blueprintDiscoveryExposure,
                  eq(blueprintDiscoveryExposure.exposureId, blueprintDiscoverySignal.exposureId)
                )
                .innerJoin(user, eq(user.id, blueprintDiscoverySignal.actorUserId))
                .innerJoin(
                  blueprintMeasurementSetting,
                  and(
                    eq(
                      blueprintMeasurementSetting.actorUserId,
                      blueprintDiscoverySignal.actorUserId
                    ),
                    eq(blueprintMeasurementSetting.enabled, true)
                  )
                )
                .where(
                  and(
                    gt(blueprintDiscoveryExposure.issuedAt, retainedStart),
                    lte(blueprintDiscoveryExposure.issuedAt, asOf),
                    lte(blueprintDiscoverySignal.acceptedAt, asOf)
                  )
                )
                .orderBy(blueprintDiscoverySignal.acceptedSequence, blueprintDiscoverySignal.id)
                .limit(MAX_ROWS_PLUS_ONE)
              failIfTooMany(signalsRows.length)
              const signals: BlueprintMeasurementReadinessInput['signals'] = signalsRows
                .filter((row) => isBlueprintDiscoveryAccountEligible(row.actorId))
                .map((row) => {
                  if (row.kind !== 'impression' && row.kind !== 'open') {
                    throw new Error('Measurement readiness report contains an invalid signal kind.')
                  }
                  return {
                    ...row,
                    acceptedAt: iso(row.acceptedAt),
                    acceptedSequence: row.acceptedSequence.toString(),
                  }
                })

              const diagnosticRows = dailyScopeAligned
                ? yield* tx
                    .select({
                      actorId: blueprintDiscoveryServingDaily.actorUserId,
                      signalDate: blueprintDiscoveryServingDaily.signalDate,
                      surface: blueprintDiscoveryServingDaily.surface,
                      policyMode: blueprintDiscoveryServingDaily.policyMode,
                      algorithmVersion: blueprintDiscoveryServingDaily.algorithmVersion,
                      configurationVersion: blueprintDiscoveryServingDaily.configurationVersion,
                      configurationDigest: blueprintDiscoveryServingDaily.configurationDigest,
                      requestedItemAttempts: blueprintDiscoveryServingDaily.requestedItemAttempts,
                      eligibleItems: blueprintDiscoveryServingDaily.eligibleItems,
                      issuedExposures: blueprintDiscoveryServingDaily.issuedExposures,
                      reusedExposures: blueprintDiscoveryServingDaily.reusedExposures,
                      quotaDeniedItems: blueprintDiscoveryServingDaily.quotaDeniedItems,
                      sourceIneligibleItems: blueprintDiscoveryServingDaily.sourceIneligibleItems,
                      lastAcceptedAt: blueprintDiscoveryServingDaily.lastAcceptedAt,
                    })
                    .from(blueprintDiscoveryServingDaily)
                    .innerJoin(user, eq(user.id, blueprintDiscoveryServingDaily.actorUserId))
                    .innerJoin(
                      blueprintMeasurementSetting,
                      and(
                        eq(
                          blueprintMeasurementSetting.actorUserId,
                          blueprintDiscoveryServingDaily.actorUserId
                        ),
                        eq(blueprintMeasurementSetting.enabled, true)
                      )
                    )
                    .where(
                      and(
                        gte(
                          blueprintDiscoveryServingDaily.signalDate,
                          start.toISOString().slice(0, 10)
                        ),
                        lt(
                          blueprintDiscoveryServingDaily.signalDate,
                          new Date(input.cohortEnd).toISOString().slice(0, 10)
                        ),
                        gt(blueprintDiscoveryServingDaily.lastAcceptedAt, retainedStart),
                        lte(blueprintDiscoveryServingDaily.lastAcceptedAt, asOf)
                      )
                    )
                    .orderBy(
                      blueprintDiscoveryServingDaily.signalDate,
                      blueprintDiscoveryServingDaily.surface,
                      blueprintDiscoveryServingDaily.policyMode,
                      blueprintDiscoveryServingDaily.algorithmVersion,
                      blueprintDiscoveryServingDaily.configurationVersion,
                      blueprintDiscoveryServingDaily.configurationDigest,
                      blueprintDiscoveryServingDaily.actorUserId
                    )
                    .limit(MAX_ROWS_PLUS_ONE)
                : []
              failIfTooMany(diagnosticRows.length)
              const servingDiagnostics: BlueprintMeasurementReadinessInput['servingDiagnostics'] =
                diagnosticRows
                  .filter((row) => isBlueprintDiscoveryAccountEligible(row.actorId))
                  .map((row) => ({ ...row, lastAcceptedAt: iso(row.lastAcceptedAt) }))

              const acquisitionRows = yield* tx
                .select({
                  acquisitionId: blueprintAttributionAcquisition.id,
                  actorId: blueprintAttributionAcquisition.actorUserId,
                  exposureId: blueprintAttributionAcquisition.exposureId,
                  sourceCatalogKey: blueprintAttributionAcquisition.sourceCatalogKey,
                  sourceRevision: blueprintAttributionAcquisition.sourceRevision,
                  sourceContentHash: blueprintAttributionAcquisition.sourceContentHash,
                  copyContentHash: blueprintAttributionAcquisition.copyContentHash,
                  acquiredAt: blueprintAttributionAcquisition.acquiredAt,
                  expiresAt: blueprintAttributionAcquisition.expiresAt,
                  copyRevisionId: blueprintAttributionAcquisition.copyRevisionId,
                  copyTemplateId: blueprintAttributionAcquisition.copyTemplateId,
                  copyRevisionHash: blueprintRevision.contentHash,
                  copyRevisionTemplateId: blueprintRevision.templateId,
                })
                .from(blueprintAttributionAcquisition)
                .innerJoin(
                  blueprintDiscoveryExposure,
                  eq(
                    blueprintDiscoveryExposure.exposureId,
                    blueprintAttributionAcquisition.exposureId
                  )
                )
                .innerJoin(user, eq(user.id, blueprintAttributionAcquisition.actorUserId))
                .innerJoin(
                  blueprintMeasurementSetting,
                  and(
                    eq(
                      blueprintMeasurementSetting.actorUserId,
                      blueprintAttributionAcquisition.actorUserId
                    ),
                    eq(blueprintMeasurementSetting.enabled, true)
                  )
                )
                .leftJoin(
                  blueprintRevision,
                  eq(blueprintRevision.id, blueprintAttributionAcquisition.copyRevisionId)
                )
                .where(
                  and(
                    gt(blueprintDiscoveryExposure.issuedAt, retainedStart),
                    lte(blueprintDiscoveryExposure.issuedAt, asOf),
                    lte(blueprintAttributionAcquisition.acquiredAt, asOf),
                    gt(blueprintAttributionAcquisition.expiresAt, readAt)
                  )
                )
                .orderBy(
                  blueprintAttributionAcquisition.acquiredAt,
                  blueprintAttributionAcquisition.id
                )
                .limit(MAX_ROWS_PLUS_ONE)
              failIfTooMany(acquisitionRows.length)
              const acquisitions: BlueprintMeasurementReadinessInput['acquisitions'] =
                acquisitionRows
                  .filter((row) => isBlueprintDiscoveryAccountEligible(row.actorId))
                  .map((row) => ({
                    acquisitionId: row.acquisitionId,
                    actorId: row.actorId,
                    exposureId: row.exposureId,
                    sourceCatalogKey: row.sourceCatalogKey,
                    sourceRevision: row.sourceRevision,
                    sourceContentHash: row.sourceContentHash,
                    copyContentHash: row.copyContentHash,
                    acquiredAt: iso(row.acquiredAt),
                    expiresAt: iso(row.expiresAt),
                    copyRevisionMatchesHash:
                      row.copyRevisionHash === row.copyContentHash &&
                      row.copyRevisionTemplateId === row.copyTemplateId,
                  }))

              const adoptionRows = yield* tx
                .select({
                  actorId: blueprintQualifiedAdoption.actorUserId,
                  acquisitionId: blueprintQualifiedAdoption.acquisitionId,
                  installationId: blueprintQualifiedAdoption.installationId,
                  sourceCatalogKey: blueprintQualifiedAdoption.sourceCatalogKey,
                  sourceRevision: blueprintQualifiedAdoption.sourceRevision,
                  sourceContentHash: blueprintQualifiedAdoption.sourceContentHash,
                  qualifiedAt: blueprintQualifiedAdoption.qualifiedAt,
                  acquisitionActorId: blueprintAttributionAcquisition.actorUserId,
                  acquisitionExposureId: blueprintAttributionAcquisition.exposureId,
                  acquisitionSourceCatalogKey: blueprintAttributionAcquisition.sourceCatalogKey,
                  acquisitionSourceRevision: blueprintAttributionAcquisition.sourceRevision,
                  acquisitionSourceContentHash: blueprintAttributionAcquisition.sourceContentHash,
                  copyTemplateId: blueprintAttributionAcquisition.copyTemplateId,
                  copyRevisionId: blueprintAttributionAcquisition.copyRevisionId,
                  installationActorId: blueprintInstallation.actorUserId,
                  installationRevisionId: blueprintInstallation.revisionId,
                  installationState: blueprintInstallation.state,
                  installationTemplateId: blueprintRevision.templateId,
                  installationSnapshotMatchesCopy: sql<boolean>`
                  ${blueprintInstallation.sourceSnapshot} = ${blueprintRevision.document}
                `,
                })
                .from(blueprintQualifiedAdoption)
                .innerJoin(user, eq(user.id, blueprintQualifiedAdoption.actorUserId))
                .innerJoin(
                  blueprintMeasurementSetting,
                  and(
                    eq(
                      blueprintMeasurementSetting.actorUserId,
                      blueprintQualifiedAdoption.actorUserId
                    ),
                    eq(blueprintMeasurementSetting.enabled, true)
                  )
                )
                .leftJoin(
                  blueprintAttributionAcquisition,
                  eq(blueprintAttributionAcquisition.id, blueprintQualifiedAdoption.acquisitionId)
                )
                .leftJoin(
                  blueprintDiscoveryExposure,
                  eq(
                    blueprintDiscoveryExposure.exposureId,
                    blueprintAttributionAcquisition.exposureId
                  )
                )
                .leftJoin(
                  blueprintInstallation,
                  eq(blueprintInstallation.id, blueprintQualifiedAdoption.installationId)
                )
                .leftJoin(
                  blueprintRevision,
                  eq(blueprintRevision.id, blueprintInstallation.revisionId)
                )
                .where(
                  and(
                    gt(blueprintDiscoveryExposure.issuedAt, retainedStart),
                    lte(blueprintDiscoveryExposure.issuedAt, asOf),
                    lte(blueprintQualifiedAdoption.qualifiedAt, asOf),
                    gt(blueprintAttributionAcquisition.expiresAt, readAt)
                  )
                )
                .orderBy(blueprintQualifiedAdoption.qualifiedAt, blueprintQualifiedAdoption.id)
                .limit(MAX_ROWS_PLUS_ONE)
              failIfTooMany(adoptionRows.length)
              const qualifiedAdoptions: BlueprintMeasurementReadinessInput['qualifiedAdoptions'] =
                adoptionRows
                  .filter((row) => isBlueprintDiscoveryAccountEligible(row.actorId))
                  .map((row) => {
                    if (
                      row.acquisitionActorId === null ||
                      row.acquisitionExposureId === null ||
                      row.installationActorId === null ||
                      row.installationState === null
                    )
                      throw new Error(
                        'Measurement readiness report contains an incomplete adoption chain.'
                      )
                    return {
                      actorId: row.actorId,
                      acquisitionId: row.acquisitionId,
                      installationId: row.installationId,
                      sourceCatalogKey: row.sourceCatalogKey,
                      sourceRevision: row.sourceRevision,
                      sourceContentHash: row.sourceContentHash,
                      installationStatus:
                        row.installationState === 'completed' ? 'completed' : 'other',
                      installationMatchesAcquisition:
                        row.installationActorId === row.acquisitionActorId &&
                        row.installationActorId === row.actorId &&
                        row.installationRevisionId !== null &&
                        row.installationRevisionId === row.copyRevisionId &&
                        row.installationTemplateId === row.copyTemplateId &&
                        row.installationSnapshotMatchesCopy === true &&
                        row.sourceCatalogKey === row.acquisitionSourceCatalogKey &&
                        row.sourceRevision === row.acquisitionSourceRevision &&
                        row.sourceContentHash === row.acquisitionSourceContentHash,
                      qualifiedAt: iso(row.qualifiedAt),
                    }
                  })

              const priorRows = yield* tx
                .select({
                  actorId: blueprintQualifiedAdoption.actorUserId,
                  catalogKey: blueprintQualifiedAdoption.sourceCatalogKey,
                  qualifiedAt: blueprintQualifiedAdoption.qualifiedAt,
                  adoptionRevision: blueprintQualifiedAdoption.sourceRevision,
                  adoptionContentHash: blueprintQualifiedAdoption.sourceContentHash,
                  exposureRetentionExpiresAt: sql<Date>`${blueprintDiscoveryExposure.issuedAt} + interval '30 days'`,
                  acquisitionActorId: blueprintAttributionAcquisition.actorUserId,
                  acquisitionCatalogKey: blueprintAttributionAcquisition.sourceCatalogKey,
                  acquisitionRevision: blueprintAttributionAcquisition.sourceRevision,
                  acquisitionContentHash: blueprintAttributionAcquisition.sourceContentHash,
                  exposureActorId: blueprintDiscoveryExposure.actorUserId,
                  exposureCatalogKey: blueprintDiscoveryExposure.catalogKey,
                  exposureSourceRevision: blueprintDiscoveryExposure.sourceRevision,
                  exposureSourceContentHash: blueprintDiscoveryExposure.contentHash,
                  acquisitionCopyHash: blueprintAttributionAcquisition.copyContentHash,
                  acquisitionCopyRevisionId: blueprintAttributionAcquisition.copyRevisionId,
                  acquisitionCopyTemplateId: blueprintAttributionAcquisition.copyTemplateId,
                  acquisitionAcquiredAt: blueprintAttributionAcquisition.acquiredAt,
                  acquisitionExpiresAt: blueprintAttributionAcquisition.expiresAt,
                  priorOpenSupportsAcquisition: sql<boolean>`exists (
                  select 1
                  from blueprint_discovery_signal as prior_open
                  where prior_open.actor_user_id = ${blueprintAttributionAcquisition.actorUserId}
                    and prior_open.exposure_id = ${blueprintAttributionAcquisition.exposureId}
                    and prior_open.catalog_key = ${blueprintAttributionAcquisition.sourceCatalogKey}
                    and prior_open.kind = 'open'
                    and prior_open.accepted_at >= ${blueprintDiscoveryExposure.issuedAt}
                    and prior_open.accepted_at < ${blueprintDiscoveryExposure.expiresAt}
                    and prior_open.accepted_at <= ${blueprintAttributionAcquisition.acquiredAt}
                )`,
                  priorChainTimingValid: sql<boolean>`
                  ${blueprintAttributionAcquisition.acquiredAt} >= ${blueprintDiscoveryExposure.issuedAt}
                  and ${blueprintAttributionAcquisition.acquiredAt} < ${blueprintDiscoveryExposure.expiresAt}
                  and ${blueprintQualifiedAdoption.qualifiedAt} >= ${blueprintAttributionAcquisition.acquiredAt}
                  and ${blueprintQualifiedAdoption.qualifiedAt} < ${blueprintAttributionAcquisition.expiresAt}
                  and ${blueprintQualifiedAdoption.qualifiedAt} < ${blueprintDiscoveryExposure.issuedAt} + interval '30 days'
                `,
                  acquisitionExposureId: blueprintAttributionAcquisition.exposureId,
                  installationActorId: blueprintInstallation.actorUserId,
                  installationId: blueprintInstallation.id,
                  adoptionInstallationId: blueprintQualifiedAdoption.installationId,
                  installationRevisionId: blueprintInstallation.revisionId,
                  installationState: blueprintInstallation.state,
                  installationTemplateId: priorInstallationRevision.templateId,
                  copyRevisionHash: priorCopyRevision.contentHash,
                  copyRevisionTemplateId: priorCopyRevision.templateId,
                  installationSnapshotMatchesCopy: sql<boolean>`
                  ${blueprintInstallation.sourceSnapshot} = ${priorCopyRevision.document}
                `,
                })
                .from(blueprintQualifiedAdoption)
                .innerJoin(
                  blueprintAttributionAcquisition,
                  eq(blueprintAttributionAcquisition.id, blueprintQualifiedAdoption.acquisitionId)
                )
                .innerJoin(
                  blueprintDiscoveryExposure,
                  eq(
                    blueprintDiscoveryExposure.exposureId,
                    blueprintAttributionAcquisition.exposureId
                  )
                )
                .innerJoin(user, eq(user.id, blueprintQualifiedAdoption.actorUserId))
                .innerJoin(
                  blueprintMeasurementSetting,
                  and(
                    eq(
                      blueprintMeasurementSetting.actorUserId,
                      blueprintQualifiedAdoption.actorUserId
                    ),
                    eq(blueprintMeasurementSetting.enabled, true)
                  )
                )
                .leftJoin(
                  blueprintInstallation,
                  eq(blueprintInstallation.id, blueprintQualifiedAdoption.installationId)
                )
                .leftJoin(
                  priorCopyRevision,
                  eq(priorCopyRevision.id, blueprintAttributionAcquisition.copyRevisionId)
                )
                .leftJoin(
                  priorInstallationRevision,
                  eq(priorInstallationRevision.id, blueprintInstallation.revisionId)
                )
                .where(
                  and(
                    lt(blueprintDiscoveryExposure.issuedAt, start),
                    gt(blueprintDiscoveryExposure.issuedAt, retainedStart),
                    lte(blueprintQualifiedAdoption.qualifiedAt, asOf),
                    gt(blueprintAttributionAcquisition.expiresAt, readAt)
                  )
                )
                .orderBy(blueprintQualifiedAdoption.qualifiedAt, blueprintQualifiedAdoption.id)
                .limit(MAX_ROWS_PLUS_ONE)
              failIfTooMany(priorRows.length)

              return {
                ...input,
                dataOrigin: 'current_retained_database',
                readAt: iso(readAt),
                coverage: {
                  eligibleSessions: 'unknown',
                  supportedClientVersions: 'unknown',
                  optInDenominator: 'unknown',
                },
                exposures,
                signals,
                servingDiagnostics,
                acquisitions,
                qualifiedAdoptions,
                priorCreditedActorSources: priorRows.map((row) => ({
                  actorId: row.actorId,
                  catalogKey: row.catalogKey,
                  qualifiedAt: iso(row.qualifiedAt),
                  exposureRetentionExpiresAt: iso(row.exposureRetentionExpiresAt),
                  valid:
                    row.acquisitionActorId === row.actorId &&
                    row.acquisitionExposureId !== null &&
                    row.priorOpenSupportsAcquisition === true &&
                    row.priorChainTimingValid === true &&
                    row.acquisitionAcquiredAt <= row.qualifiedAt &&
                    row.acquisitionExpiresAt > row.qualifiedAt &&
                    row.exposureActorId === row.actorId &&
                    row.exposureCatalogKey === row.catalogKey &&
                    row.exposureSourceRevision === row.acquisitionRevision &&
                    row.exposureSourceContentHash === row.acquisitionContentHash &&
                    row.acquisitionCatalogKey === row.catalogKey &&
                    row.acquisitionRevision === row.adoptionRevision &&
                    row.acquisitionContentHash === row.adoptionContentHash &&
                    row.installationActorId === row.actorId &&
                    row.installationId === row.adoptionInstallationId &&
                    row.installationState === 'completed' &&
                    row.installationRevisionId === row.acquisitionCopyRevisionId &&
                    row.installationTemplateId === row.acquisitionCopyTemplateId &&
                    row.copyRevisionTemplateId === row.acquisitionCopyTemplateId &&
                    row.copyRevisionHash === row.acquisitionCopyHash &&
                    row.installationSnapshotMatchesCopy === true,
                })),
              } as BlueprintMeasurementReadinessInput
            })
          )
          .pipe(
            Effect.mapError((error) =>
              error instanceof Error && error.message === ROW_LIMIT_MESSAGE
                ? error
                : new Error('Measurement readiness database read failed.')
            )
          ) as Effect.Effect<BlueprintMeasurementReadinessInput, Error>,
    }
  })
)
