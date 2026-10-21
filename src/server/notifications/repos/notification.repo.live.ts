import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto'
import { and, asc, eq, isNotNull, isNull, lte, or, sql } from 'drizzle-orm'
import { Effect } from 'effect'
import { DB } from '@/db'
import {
  event,
  eventDeparture,
  eventGuestProfile,
  eventParticipant,
  workspacePerson,
} from '@/db/schema/event.schema'
import { eventTodo } from '@/db/schema/planning.schema'
import { eventAnnouncement } from '@/db/schema/announcement.schema'
import { announcementAccess } from '@/server/announcements/repos/announcement-access.persistence'
import { announcementNotificationAllowed } from '@/server/announcements/services/announcement-policy'
import { nativeNotificationOutbox, notificationInstallation } from '@/db/schema/notification.schema'
import { env } from '@/env'
import { ConflictError, ForbiddenError, InvalidInputError } from '@/server/effect-utils'
import type {
  ClaimedNotification,
  NotificationIdentity,
  NotificationType,
} from '../contracts/notification.contracts'

const hash = (value: string) => createHash('sha256').update(value).digest('hex')
// Tokens use the existing app secret to avoid a second secret store; rotate by re-registering devices.
const encryptionKey = () =>
  createHash('sha256').update(`gatherory-notification-token:${env.BETTER_AUTH_SECRET}`).digest()
const encryptToken = (token: string) => {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url')
}
const decryptToken = (value: string) => {
  const buffer = Buffer.from(value, 'base64url')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), buffer.subarray(0, 12))
  decipher.setAuthTag(buffer.subarray(12, 28))
  return Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]).toString('utf8')
}
const sameHash = (left: string, right: string) => {
  const a = Buffer.from(left, 'hex')
  const b = Buffer.from(right, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

type DrizzleDatabase = Effect.Success<typeof DB>
type NotificationTransaction = Parameters<Parameters<DrizzleDatabase['transaction']>[0]>[0]
type NotificationExecutor = DrizzleDatabase | NotificationTransaction

function recipientEligible(
  executor: NotificationExecutor,
  eventId: string,
  entityId: string,
  recipient: NotificationIdentity,
  type: NotificationType
) {
  return Effect.gen(function* () {
    const [eventRow] = yield* executor
      .select({ completionStatus: event.completionStatus })
      .from(event)
      .where(eq(event.id, eventId))
      .limit(1)
    if (!eventRow || eventRow.completionStatus === 'complete') return false
    if (type === 'event_announcement') {
      const access = yield* announcementAccess(executor, eventId, recipient)
      if (!access) return false
      const [announcement] = yield* executor
        .select({
          authorUserId: eventAnnouncement.authorUserId,
          audience: eventAnnouncement.audience,
        })
        .from(eventAnnouncement)
        .where(and(eq(eventAnnouncement.id, entityId), eq(eventAnnouncement.eventId, eventId)))
        .limit(1)
      if (
        !announcement?.authorUserId ||
        (recipient.kind === 'user' && recipient.id === announcement.authorUserId)
      )
        return false
      if (!announcementNotificationAllowed(access, announcement.audience)) return false
      const authorAccess = yield* announcementAccess(executor, eventId, {
        kind: 'user',
        id: announcement.authorUserId,
      })
      return authorAccess?.allowedAudiences.includes(announcement.audience) === true
    }
    const whereRecipient =
      recipient.kind === 'user'
        ? eq(workspacePerson.userId, recipient.id)
        : eq(workspacePerson.guestProfileId, recipient.id)
    const [membership] = yield* executor
      .select({ permission: eventParticipant.planningPermission })
      .from(eventParticipant)
      .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
      .where(and(eq(eventParticipant.eventId, eventId), whereRecipient))
      .limit(1)
    if (!membership) return false
    if (recipient.kind === 'user') {
      const [departure] = yield* executor
        .select({ userId: eventDeparture.userId })
        .from(eventDeparture)
        .where(and(eq(eventDeparture.eventId, eventId), eq(eventDeparture.userId, recipient.id)))
        .limit(1)
      if (departure) return false
    } else {
      const [profile] = yield* executor
        .select({ claimedAt: eventGuestProfile.claimedAt })
        .from(eventGuestProfile)
        .where(eq(eventGuestProfile.id, recipient.id))
        .limit(1)
      if (!profile || profile.claimedAt) return false
    }
    if (type === 'assignment_changed') {
      if (
        recipient.kind !== 'user' ||
        (membership.permission !== 'manage' && membership.permission !== 'contribute')
      )
        return false
      const [todo] = yield* executor
        .select({ id: eventTodo.id })
        .from(eventTodo)
        .innerJoin(workspacePerson, eq(workspacePerson.id, eventTodo.assigneePersonId))
        .innerJoin(
          eventParticipant,
          and(
            eq(eventParticipant.personId, workspacePerson.id),
            eq(eventParticipant.eventId, eventTodo.eventId)
          )
        )
        .where(
          and(
            eq(eventTodo.id, entityId),
            eq(eventTodo.eventId, eventId),
            eq(eventTodo.isCompleted, false),
            eq(workspacePerson.userId, recipient.id),
            sql`${eventParticipant.role} in ('host', 'collaborator')`,
            sql`${eventParticipant.planningPermission} in ('manage', 'contribute')`
          )
        )
        .limit(1)
      return Boolean(todo)
    }
    return true
  })
}

export const notificationRepo = {
  register(input: {
    id: string
    secret: string
    revision: number
    recipient: NotificationIdentity
    platform: 'ios' | 'android'
    locale: 'en' | 'es'
    token: string
    enabled: boolean
  }) {
    return Effect.gen(function* () {
      const database = yield* DB
      const secretHash = hash(input.secret)
      const tokenHash = hash(input.token)
      return yield* database.transaction((tx) =>
        Effect.gen(function* () {
          yield* tx.execute(sql`select pg_advisory_xact_lock(hashtext(${input.id}))`)
          const [existing] = yield* tx
            .select()
            .from(notificationInstallation)
            .where(eq(notificationInstallation.id, input.id))
            .limit(1)
            .for('update')
          if (existing && !sameHash(existing.installationSecretHash, secretHash)) {
            return yield* Effect.fail(
              new ForbiddenError({
                category: 'authorization',
                code: 'INSTALLATION_PROOF_INVALID',
                userMessageKey: 'serverErrors.AUTHORIZATION',
              })
            )
          }
          if (existing && input.revision < existing.revision) {
            return {
              installationId: input.id,
              bindingGeneration: existing.bindingGeneration,
              revision: existing.revision,
              accepted: false,
            }
          }
          if (existing && input.revision === existing.revision) {
            const sameBinding =
              existing.recipientKind === input.recipient.kind &&
              existing.recipientId === input.recipient.id &&
              existing.tokenHash === tokenHash &&
              existing.platform === input.platform &&
              existing.locale === input.locale &&
              existing.enabled === input.enabled &&
              existing.detachedAt === null
            if (!sameBinding)
              return yield* Effect.fail(
                new ConflictError({
                  category: 'conflict',
                  code: 'INSTALLATION_REVISION_CONFLICT',
                  userMessageKey: 'serverErrors.CONFLICT',
                })
              )
            return {
              installationId: input.id,
              bindingGeneration: existing.bindingGeneration,
              revision: existing.revision,
              accepted: true,
            }
          }
          const [tokenOwner] = yield* tx
            .select({ id: notificationInstallation.id })
            .from(notificationInstallation)
            .where(
              and(
                eq(notificationInstallation.tokenHash, tokenHash),
                isNull(notificationInstallation.detachedAt)
              )
            )
            .limit(1)
            .for('update')
          if (tokenOwner && tokenOwner.id !== input.id) {
            return yield* Effect.fail(
              new ConflictError({
                category: 'conflict',
                code: 'NOTIFICATION_TOKEN_ALREADY_REGISTERED',
                userMessageKey: 'serverErrors.CONFLICT',
              })
            )
          }
          const ownerChanged =
            existing &&
            (existing.recipientKind !== input.recipient.kind ||
              existing.recipientId !== input.recipient.id)
          const bindingGeneration = existing
            ? existing.bindingGeneration + (ownerChanged ? 1 : 0)
            : 1
          const values = {
            id: input.id,
            installationSecretHash: secretHash,
            recipientKind: input.recipient.kind,
            recipientId: input.recipient.id,
            platform: input.platform,
            locale: input.locale,
            tokenHash,
            tokenCiphertext: encryptToken(input.token),
            enabled: input.enabled,
            bindingGeneration,
            revision: input.revision,
            detachedAt: null,
            updatedAt: new Date(),
          }
          yield* tx
            .insert(notificationInstallation)
            .values(values)
            .onConflictDoUpdate({ target: notificationInstallation.id, set: values })
          return {
            installationId: input.id,
            bindingGeneration,
            revision: input.revision,
            accepted: true,
          }
        })
      )
    })
  },

  detach(input: { id: string; secret: string; revision: number }) {
    return Effect.gen(function* () {
      const database = yield* DB
      return yield* database.transaction((tx) =>
        Effect.gen(function* () {
          yield* tx.execute(sql`select pg_advisory_xact_lock(hashtext(${input.id}))`)
          const [row] = yield* tx
            .select()
            .from(notificationInstallation)
            .where(eq(notificationInstallation.id, input.id))
            .limit(1)
            .for('update')
          if (!row) {
            yield* tx.insert(notificationInstallation).values({
              id: input.id,
              installationSecretHash: hash(input.secret),
              recipientKind: null,
              recipientId: null,
              platform: null,
              locale: 'en',
              tokenHash: null,
              tokenCiphertext: null,
              enabled: false,
              bindingGeneration: 1,
              revision: input.revision,
              detachedAt: new Date(),
              updatedAt: new Date(),
            })
            return { detached: true, revision: input.revision, accepted: true }
          }
          if (!sameHash(row.installationSecretHash, hash(input.secret))) {
            return yield* Effect.fail(
              new ForbiddenError({
                category: 'authorization',
                code: 'INSTALLATION_PROOF_INVALID',
                userMessageKey: 'serverErrors.AUTHORIZATION',
              })
            )
          }
          if (input.revision < row.revision)
            return { detached: false, revision: row.revision, accepted: false }
          if (input.revision === row.revision && row.detachedAt)
            return { detached: true, revision: row.revision, accepted: true }
          yield* tx
            .update(notificationInstallation)
            .set({
              enabled: false,
              detachedAt: new Date(),
              revision: input.revision,
              recipientKind: null,
              recipientId: null,
              platform: null,
              tokenHash: null,
              tokenCiphertext: null,
              updatedAt: new Date(),
            })
            .where(eq(notificationInstallation.id, input.id))
          return { detached: true, revision: input.revision, accepted: true }
        })
      )
    })
  },

  claimPending(limit = 20) {
    return Effect.gen(function* () {
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        return yield* Effect.fail(
          new InvalidInputError({
            category: 'validation',
            code: 'INVALID_NOTIFICATION_BATCH_SIZE',
            userMessageKey: 'serverErrors.VALIDATION',
          })
        )
      }
      const database = yield* DB
      return yield* database.transaction((tx) =>
        Effect.gen(function* () {
          const now = new Date()
          const rows = yield* tx
            .select()
            .from(nativeNotificationOutbox)
            .where(
              and(
                or(
                  eq(nativeNotificationOutbox.state, 'pending'),
                  and(
                    eq(nativeNotificationOutbox.state, 'leased'),
                    lte(nativeNotificationOutbox.leaseUntil, now)
                  )
                ),
                lte(nativeNotificationOutbox.nextAttemptAt, now)
              )
            )
            .orderBy(asc(nativeNotificationOutbox.createdAt))
            .limit(limit)
            .for('update', { skipLocked: true })
          const claimed: ClaimedNotification[] = []
          for (const row of rows) {
            const leaseKey = randomUUID()
            yield* tx
              .update(nativeNotificationOutbox)
              .set({
                state: 'leased',
                leaseUntil: new Date(Date.now() + 10 * 60_000),
                leaseKey,
                attempts: row.attempts + 1,
              })
              .where(eq(nativeNotificationOutbox.id, row.id))
            const recipient = {
              kind: row.recipientKind,
              id: row.recipientId,
            } satisfies NotificationIdentity
            if (!(yield* recipientEligible(tx, row.eventId, row.entityId, recipient, row.type))) {
              yield* tx
                .update(nativeNotificationOutbox)
                .set({ state: 'discarded', leaseKey: null, leaseUntil: null })
                .where(eq(nativeNotificationOutbox.id, row.id))
              continue
            }
            const installs = yield* tx
              .select()
              .from(notificationInstallation)
              .where(
                and(
                  eq(notificationInstallation.recipientKind, row.recipientKind),
                  eq(notificationInstallation.recipientId, row.recipientId),
                  eq(notificationInstallation.enabled, true),
                  isNull(notificationInstallation.detachedAt),
                  isNotNull(notificationInstallation.tokenHash),
                  isNotNull(notificationInstallation.tokenCiphertext)
                )
              )
            const installationsWithTokens = []
            for (const install of installs) {
              if (!install.tokenHash || !install.tokenCiphertext) continue
              try {
                installationsWithTokens.push({
                  id: install.id,
                  generation: install.bindingGeneration,
                  revision: install.revision,
                  tokenHash: install.tokenHash,
                  locale: install.locale as 'en' | 'es',
                  token: decryptToken(install.tokenCiphertext),
                })
              } catch {
                // A damaged ciphertext must not crash the worker or be logged. Disable only
                // the exact revision so a concurrent token refresh remains usable.
                yield* tx
                  .update(notificationInstallation)
                  .set({ enabled: false, detachedAt: new Date(), updatedAt: new Date() })
                  .where(
                    and(
                      eq(notificationInstallation.id, install.id),
                      eq(notificationInstallation.revision, install.revision),
                      eq(notificationInstallation.tokenHash, install.tokenHash)
                    )
                  )
              }
            }
            claimed.push({
              id: row.id,
              eventId: row.eventId,
              entityId: row.entityId,
              recipient,
              type: row.type,
              leaseKey,
              acceptedInstallationIds: row.acceptedInstallationIds,
              installations: installationsWithTokens,
            })
          }
          return claimed
        })
      )
    })
  },

  isStillBound(
    item: ClaimedNotification,
    installation: ClaimedNotification['installations'][number]
  ) {
    return Effect.gen(function* () {
      const database = yield* DB
      const now = new Date()
      const [lease] = yield* database
        .update(nativeNotificationOutbox)
        .set({ leaseUntil: new Date(now.getTime() + 10 * 60_000) })
        .where(
          and(
            eq(nativeNotificationOutbox.id, item.id),
            eq(nativeNotificationOutbox.state, 'leased'),
            eq(nativeNotificationOutbox.leaseKey, item.leaseKey),
            sql`${nativeNotificationOutbox.leaseUntil} > ${now}`
          )
        )
        .returning({ id: nativeNotificationOutbox.id })
      if (!lease) return false
      const [row] = yield* database
        .select({ id: notificationInstallation.id })
        .from(notificationInstallation)
        .where(
          and(
            eq(notificationInstallation.id, installation.id),
            eq(notificationInstallation.bindingGeneration, installation.generation),
            eq(notificationInstallation.revision, installation.revision),
            eq(notificationInstallation.tokenHash, installation.tokenHash),
            eq(notificationInstallation.recipientKind, item.recipient.kind),
            eq(notificationInstallation.recipientId, item.recipient.id),
            eq(notificationInstallation.enabled, true),
            isNull(notificationInstallation.detachedAt)
          )
        )
        .limit(1)
      return (
        Boolean(row) &&
        (yield* recipientEligible(database, item.eventId, item.entityId, item.recipient, item.type))
      )
    })
  },

  delivered(item: ClaimedNotification) {
    return Effect.gen(function* () {
      const database = yield* DB
      yield* database
        .update(nativeNotificationOutbox)
        .set({
          state: 'delivered',
          deliveredAt: new Date(),
          leaseKey: null,
          leaseUntil: null,
          lastFailure: null,
        })
        .where(
          and(
            eq(nativeNotificationOutbox.id, item.id),
            eq(nativeNotificationOutbox.leaseKey, item.leaseKey)
          )
        )
    })
  },

  markInstallationAccepted(item: ClaimedNotification, installationId: string) {
    return Effect.gen(function* () {
      const database = yield* DB
      yield* database
        .update(nativeNotificationOutbox)
        .set({
          acceptedInstallationIds: sql`array(select distinct unnest(${nativeNotificationOutbox.acceptedInstallationIds} || array[${installationId}]::text[]))`,
        })
        .where(
          and(
            eq(nativeNotificationOutbox.id, item.id),
            eq(nativeNotificationOutbox.leaseKey, item.leaseKey)
          )
        )
    })
  },

  disableInstallation(installation: ClaimedNotification['installations'][number]) {
    return Effect.gen(function* () {
      const database = yield* DB
      yield* database
        .update(notificationInstallation)
        .set({
          enabled: false,
          detachedAt: new Date(),
          recipientKind: null,
          recipientId: null,
          platform: null,
          tokenHash: null,
          tokenCiphertext: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(notificationInstallation.id, installation.id),
            eq(notificationInstallation.bindingGeneration, installation.generation),
            eq(notificationInstallation.revision, installation.revision),
            eq(notificationInstallation.tokenHash, installation.tokenHash)
          )
        )
    })
  },

  retry(item: ClaimedNotification, reason: string, discard = false) {
    return Effect.gen(function* () {
      const database = yield* DB
      yield* database
        .update(nativeNotificationOutbox)
        .set({
          state: discard ? 'discarded' : 'pending',
          nextAttemptAt: new Date(Date.now() + 16 * 60_000),
          leaseKey: null,
          leaseUntil: null,
          lastFailure: reason.slice(0, 64),
        })
        .where(
          and(
            eq(nativeNotificationOutbox.id, item.id),
            eq(nativeNotificationOutbox.leaseKey, item.leaseKey)
          )
        )
    })
  },
}
