import { createHash } from 'node:crypto'
import { PgClient } from '@effect/sql-pg/PgClient'
import { and, eq, isNull } from 'drizzle-orm'
import { Effect } from 'effect'
import { DB } from '@/db'
import { event, eventParticipant, workspacePerson } from '@/db/schema/event.schema'
import {
  registryCommitment,
  registryItem,
  registryReservationRequest,
  workspacePlanningSettings,
} from '@/db/schema/planning.schema'
import { ConflictError, EntityNotFoundError, ForbiddenError } from '@/server/effect'
import { retainedEventAccess } from './event-departure.repo'
import { requireJoinableEvent } from './event-lifecycle.repo'
import { lockAuthenticatedGuestProfile } from './device-guest.repo.persistence'

export type RegistryReservationActor =
  | { kind: 'user'; id: string }
  | { kind: 'device_guest'; id: string; credential: string }

export type RegistryReservationCommand = {
  requestId: string
  itemId: string
  quantity?: number
}

const unavailable = () => new EntityNotFoundError({
  category: 'not_found', code: 'REGISTRY_UNAVAILABLE', userMessageKey: 'serverErrors.NOT_FOUND',
})
const forbidden = () => new ForbiddenError({
  category: 'authorization', code: 'REGISTRY_ACCESS_REQUIRED', userMessageKey: 'serverErrors.AUTHORIZATION',
})
const conflict = (code: string) => new ConflictError({
  category: 'conflict', code, userMessageKey: 'serverErrors.CONFLICT',
})

function actorWhere(actor: RegistryReservationActor) {
  return actor.kind === 'user'
    ? and(eq(registryCommitment.userId, actor.id), isNull(registryCommitment.guestProfileId))
    : and(eq(registryCommitment.guestProfileId, actor.id), isNull(registryCommitment.userId))
}
function requestActorWhere(actor: RegistryReservationActor) {
  return actor.kind === 'user'
    ? and(eq(registryReservationRequest.userId, actor.id), isNull(registryReservationRequest.guestProfileId))
    : and(eq(registryReservationRequest.guestProfileId, actor.id), isNull(registryReservationRequest.userId))
}
function commitmentActorValues(actor: RegistryReservationActor) {
  return actor.kind === 'user'
    ? { userId: actor.id, guestProfileId: null }
    : { userId: null, guestProfileId: actor.id }
}
function requestHash(eventId: string, itemId: string, action: 'reserve' | 'cancel', quantity: number | null) {
  return createHash('sha256').update(JSON.stringify([eventId, itemId, action, quantity])).digest('hex')
}

function requireActorAccess(eventId: string, actor: RegistryReservationActor) {
  return Effect.gen(function* () {
    const db = yield* DB
    const [target] = yield* db.select({ organizationId: event.organizationId, parentEventId: event.parentEventId })
      .from(event).where(eq(event.id, eventId)).limit(1)
    if (!target) return yield* Effect.fail(unavailable())

    if (actor.kind === 'user') {
      const [participation] = yield* db.select({ id: eventParticipant.id })
        .from(eventParticipant)
        .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
        .where(and(
          eq(eventParticipant.eventId, eventId),
          eq(workspacePerson.organizationId, target.organizationId),
          eq(workspacePerson.userId, actor.id),
          retainedEventAccess(actor.id, eventParticipant.eventId),
        )).limit(1)
      if (!participation) return yield* Effect.fail(forbidden())
    } else {
      const [participation] = yield* db.select({ id: eventParticipant.id })
        .from(eventParticipant)
        .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
        .where(and(
          eq(eventParticipant.eventId, eventId),
          eq(workspacePerson.organizationId, target.organizationId),
          eq(workspacePerson.guestProfileId, actor.id),
          isNull(workspacePerson.userId),
          eq(eventParticipant.role, 'guest'),
        )).limit(1)
      if (!participation) return yield* Effect.fail(forbidden())
    }

    const [settings] = yield* db.select({ shared: workspacePlanningSettings.registryShared })
      .from(workspacePlanningSettings)
      .where(eq(workspacePlanningSettings.organizationId, target.organizationId)).limit(1).for('share')
    if (!settings?.shared) return yield* Effect.fail(unavailable())
    return target
  })
}

function eventIsOpen(eventId: string) {
  return Effect.gen(function* () {
    const db = yield* DB
    const [target] = yield* db.select({
      status: event.status,
      planningStatus: event.planningStatus,
      completionStatus: event.completionStatus,
      parentEventId: event.parentEventId,
    }).from(event).where(eq(event.id, eventId)).limit(1)
    if (!target) return false
    const [root] = yield* db.select({ status: event.status }).from(event)
      .where(eq(event.id, target.parentEventId ?? eventId)).limit(1)
    return Boolean(root && target.status !== 'cancelled' && target.status !== 'finished' &&
      target.planningStatus !== 'cancelled' && target.planningStatus !== 'archived' && target.completionStatus !== 'complete' &&
      root.status !== 'cancelled' && root.status !== 'finished')
  })
}

function readItems(eventId: string, actor: RegistryReservationActor, canReserve: boolean) {
  return Effect.gen(function* () {
    const db = yield* DB
    const items = yield* db.select().from(registryItem)
      .where(eq(registryItem.eventId, eventId))
      .orderBy(registryItem.createdAt, registryItem.id)
    const result = []
    for (const item of items) {
      const commitments = yield* db.select({ quantity: registryCommitment.quantity })
        .from(registryCommitment)
        .where(and(eq(registryCommitment.registryItemId, item.id), eq(registryCommitment.status, 'active')))
      const committedCount = commitments.reduce((sum, row) => sum + row.quantity, 0)
      const [own] = yield* db.select({ quantity: registryCommitment.quantity })
        .from(registryCommitment)
        .where(and(eq(registryCommitment.registryItemId, item.id), eq(registryCommitment.status, 'active'), actorWhere(actor)!))
        .limit(1)
      const reservedQuantity = own?.quantity ?? 0
      const knownQuantity = Number.isSafeInteger(item.quantity) && item.quantity > 0
      const availableCount = knownQuantity ? Math.max(item.quantity - committedCount, 0) : null
      const capacityForActor = knownQuantity ? item.quantity - (committedCount - reservedQuantity) : 0
      result.push({
        id: item.id, eventId: item.eventId, title: item.title, note: item.note,
        category: item.category, price: item.price,
        quantity: knownQuantity ? item.quantity : null,
        committedCount, availableCount, reservedQuantity,
        isReservedByViewer: reservedQuantity > 0,
        canReserve: canReserve && capacityForActor > 0,
      })
    }
    return result
  })
}

function currentItemState(eventId: string, itemId: string, actor: RegistryReservationActor, replayed = false) {
  return Effect.gen(function* () {
    const db = yield* DB
    const [item] = yield* db.select().from(registryItem)
      .where(and(eq(registryItem.id, itemId), eq(registryItem.eventId, eventId))).limit(1)
    if (!item) return yield* Effect.fail(unavailable())
    const rows = yield* db.select({ quantity: registryCommitment.quantity })
      .from(registryCommitment)
      .where(and(eq(registryCommitment.registryItemId, itemId), eq(registryCommitment.status, 'active')))
    const committedCount = rows.reduce((sum, row) => sum + row.quantity, 0)
    const [own] = yield* db.select({ quantity: registryCommitment.quantity })
      .from(registryCommitment)
      .where(and(eq(registryCommitment.registryItemId, itemId), eq(registryCommitment.status, 'active'), actorWhere(actor)!)).limit(1)
    const reservedQuantity = own?.quantity ?? 0
    const knownQuantity = Number.isSafeInteger(item.quantity) && item.quantity > 0
    const availableCount = knownQuantity ? Math.max(item.quantity - committedCount, 0) : null
    const open = yield* eventIsOpen(eventId)
    return {
      eventId, itemId, quantity: knownQuantity ? item.quantity : null,
      committedCount, availableCount, reservedQuantity,
      isReservedByViewer: reservedQuantity > 0,
      canReserve: open && knownQuantity && item.quantity - (committedCount - reservedQuantity) > 0,
      replayed,
    }
  })
}

export function listVisibleRegistry(eventId: string, actor: RegistryReservationActor) {
  return Effect.gen(function* () {
    const pg = yield* PgClient
    return yield* pg.withTransaction(Effect.gen(function* () {
      if (actor.kind === 'device_guest') {
        const db = yield* DB
        const profile = yield* lockAuthenticatedGuestProfile(db, actor.id, actor.credential)
        if (profile.claimedAt || profile.claimedByUserId) return yield* Effect.fail(forbidden())
      }
      yield* requireActorAccess(eventId, actor)
      const canReserve = yield* eventIsOpen(eventId)
      return { eventId, shared: true, canReserve, items: yield* readItems(eventId, actor, canReserve) }
    }))
  })
}

function applyCommand(eventId: string, actor: RegistryReservationActor, command: RegistryReservationCommand, action: 'reserve' | 'cancel') {
  return Effect.gen(function* () {
    const db = yield* DB
    const [item] = yield* db.select().from(registryItem)
      .where(and(eq(registryItem.id, command.itemId), eq(registryItem.eventId, eventId)))
      .limit(1).for('update')
    if (!item) return yield* Effect.fail(unavailable())
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) return yield* Effect.fail(unavailable())

    const quantity = action === 'reserve' ? command.quantity ?? 1 : null
    const hash = requestHash(eventId, command.itemId, action, quantity)
    const receiptWhere = and(requestActorWhere(actor), eq(registryReservationRequest.requestId, command.requestId))
    const [prior] = yield* db.select().from(registryReservationRequest)
      .where(receiptWhere).limit(1).for('update')
    if (prior) {
      if (prior.requestHash !== hash) return yield* Effect.fail(conflict('REGISTRY_REQUEST_ID_REUSED'))
      return yield* currentItemState(eventId, command.itemId, actor, true)
    }

    const receiptValues: typeof registryReservationRequest.$inferInsert = {
      userId: actor.kind === 'user' ? actor.id : null,
      guestProfileId: actor.kind === 'device_guest' ? actor.id : null,
      requestId: command.requestId,
      registryItemId: command.itemId,
      requestHash: hash,
      result: { pending: true },
    }
    const [receipt] = yield* db.insert(registryReservationRequest).values(receiptValues)
      .onConflictDoNothing().returning({ id: registryReservationRequest.id })
    if (!receipt) {
      const [collision] = yield* db.select().from(registryReservationRequest)
        .where(receiptWhere).limit(1).for('update')
      if (!collision) return yield* Effect.fail(conflict('REGISTRY_REQUEST_RETRY_REQUIRED'))
      if (collision.requestHash !== hash) return yield* Effect.fail(conflict('REGISTRY_REQUEST_ID_REUSED'))
      return yield* currentItemState(eventId, command.itemId, actor, true)
    }

    const [own] = yield* db.select().from(registryCommitment)
      .where(and(eq(registryCommitment.registryItemId, item.id), actorWhere(actor)!))
      .limit(1).for('update')
    if (action === 'cancel') {
      if (own) yield* db.update(registryCommitment)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(registryCommitment.id, own.id))
    } else {
      if (!Number.isSafeInteger(quantity) || quantity! < 1) return yield* Effect.fail(conflict('REGISTRY_QUANTITY_INVALID'))
      const rows = yield* db.select({ quantity: registryCommitment.quantity })
        .from(registryCommitment)
        .where(and(eq(registryCommitment.registryItemId, item.id), eq(registryCommitment.status, 'active')))
      const committedCount = rows.reduce((sum, row) => sum + row.quantity, 0)
      const previousQuantity = own?.status === 'active' ? own.quantity : 0
      if (quantity! > item.quantity - (committedCount - previousQuantity))
        return yield* Effect.fail(conflict('REGISTRY_CAPACITY_UNAVAILABLE'))
      if (own) yield* db.update(registryCommitment)
        .set({ quantity: quantity!, status: 'active', updatedAt: new Date() })
        .where(eq(registryCommitment.id, own.id))
      else yield* db.insert(registryCommitment).values({
        registryItemId: item.id, ...commitmentActorValues(actor), quantity: quantity!, status: 'active',
      })
    }
    const result = yield* currentItemState(eventId, command.itemId, actor)
    yield* db.update(registryReservationRequest).set({ result }).where(eq(registryReservationRequest.id, receipt.id))
    return result
  })
}

export function changeRegistryReservation(
  eventId: string,
  actor: RegistryReservationActor,
  command: RegistryReservationCommand,
  action: 'reserve' | 'cancel',
) {
  return Effect.gen(function* () {
    const pg = yield* PgClient
    return yield* pg.withTransaction(Effect.gen(function* () {
      if (actor.kind === 'device_guest') {
        const db = yield* DB
        const profile = yield* lockAuthenticatedGuestProfile(db, actor.id, actor.credential)
        if (profile.claimedAt || profile.claimedByUserId) return yield* Effect.fail(forbidden())
      }
      // Lock the root/child lifecycle before touching the registry item, matching
      // event sync and the guest profile claim lock order.
      yield* requireJoinableEvent(eventId)
      yield* requireActorAccess(eventId, actor)
      if (!(yield* eventIsOpen(eventId))) return yield* Effect.fail(conflict('EVENT_CLOSED'))
      return yield* applyCommand(eventId, actor, command, action)
    }))
  })
}
