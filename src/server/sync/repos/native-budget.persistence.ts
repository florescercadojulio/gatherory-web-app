import { and, eq, inArray, isNull, or } from 'drizzle-orm'
import { MoneyDecimal } from '@/lib/money'

import { db } from '@/db'
import { event, eventParticipant, workspacePerson } from '@/db/schema/event.schema'
import { workspacePlanningSettings } from '@/db/schema/planning.schema'
import {
  nativeSyncChange,
  nativeSyncEntity,
  nativeSyncMutationReceipt,
  nativeWorkspaceSnapshot,
} from '@/db/schema/sync.schema'
import { retainedEventAccess } from '@/server/events/repos/event-departure.persistence'

import type { NativeMutation, NativePushResult } from '../contracts/native-sync.contracts'
import {
  budgetCentsToDecimal,
  budgetCentsToNativeNumber,
  decodeBudgetArchive,
  decodeNativeBudgetMutationPayload,
  type NativeWorkspaceBudgetValues,
} from '../contracts/native-budget-mutation.contract'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

const encode = (value: unknown) => Buffer.from(JSON.stringify(value), 'utf8').toString('base64')

function decimalToCents(value: string | null) {
  if (value === null) return null
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(value)
  if (!match) return undefined
  return new MoneyDecimal(value).mul(100)
}

function managerPermission(
  transaction: Transaction,
  input: { rootEventId: string; userId: string }
) {
  return transaction
    .select({ role: eventParticipant.role, permission: eventParticipant.planningPermission })
    .from(eventParticipant)
    .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
    .innerJoin(event, eq(event.id, eventParticipant.eventId))
    .where(
      and(
        eq(event.id, input.rootEventId),
        eq(workspacePerson.userId, input.userId),
        eq(event.organizationId, workspacePerson.organizationId),
        isNull(event.parentEventId),
        retainedEventAccess(input.userId, event.id)
      )
    )
    .limit(1)
}

export async function isNativeBudgetManager(
  transaction: Transaction,
  input: { rootEventId: string; userId: string }
) {
  const [root] = await transaction
    .select({ status: event.status, parentEventId: event.parentEventId })
    .from(event)
    .where(eq(event.id, input.rootEventId))
    .limit(1)
  if (
    !root ||
    root.parentEventId !== null ||
    root.status === 'finished' ||
    root.status === 'cancelled'
  )
    return false
  const [actor] = await managerPermission(transaction, input)
  return actor?.role === 'host' || (actor?.role === 'collaborator' && actor.permission === 'manage')
}

export async function isNativeEventBudgetManager(
  transaction: Transaction,
  input: { eventId: string; userId: string }
) {
  const [target] = await transaction
    .select({
      parentEventId: event.parentEventId,
      planningStatus: event.planningStatus,
      completionStatus: event.completionStatus,
    })
    .from(event)
    .where(eq(event.id, input.eventId))
    .limit(1)
  if (
    !target ||
    !target.parentEventId ||
    target.planningStatus === 'archived' ||
    target.planningStatus === 'cancelled' ||
    target.completionStatus === 'complete'
  ) {
    return false
  }
  const [actor] = await transaction
    .select({ role: eventParticipant.role, permission: eventParticipant.planningPermission })
    .from(eventParticipant)
    .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
    .innerJoin(event, eq(event.id, eventParticipant.eventId))
    .where(
      and(
        eq(event.id, input.eventId),
        eq(workspacePerson.userId, input.userId),
        eq(event.organizationId, workspacePerson.organizationId),
        retainedEventAccess(input.userId, event.id)
      )
    )
    .limit(1)
  return actor?.role === 'host' || (actor?.role === 'collaborator' && actor.permission === 'manage')
}

export async function readNativeWorkspaceBudgetValues(
  transaction: Transaction,
  rootEventId: string
): Promise<NativeWorkspaceBudgetValues | null> {
  const [root] = await transaction
    .select({
      id: event.id,
      organizationId: event.organizationId,
      parentEventId: event.parentEventId,
      budgetCap: event.budgetCap,
    })
    .from(event)
    .where(eq(event.id, rootEventId))
    .limit(1)
  if (!root || root.parentEventId !== null) return null
  const rows = await transaction
    .select({ id: event.id, parentEventId: event.parentEventId, budgetCap: event.budgetCap })
    .from(event)
    .where(
      and(
        eq(event.organizationId, root.organizationId),
        or(eq(event.id, root.id), eq(event.parentEventId, root.id))
      )
    )
  const [settings] = await transaction
    .select({ budgetCap: workspacePlanningSettings.budgetCap })
    .from(workspacePlanningSettings)
    .where(eq(workspacePlanningSettings.organizationId, root.organizationId))
    .limit(1)
  return {
    workspaceCap: settings?.budgetCap ?? null,
    mainAllocation: root.budgetCap,
    childAllocations: new Map(
      rows.filter((row) => row.id !== root.id).map((row) => [row.id, row.budgetCap] as const)
    ),
  }
}

function replaceArchiveBudget(
  payload: string,
  input: {
    workspaceCapCents: number | null
    rootEventId: string
    allocations: Map<string, number | null>
  }
) {
  const archive = decodeBudgetArchive(payload)
  if (!archive) return null
  archive.workspaceBudgetCap = budgetCentsToNativeNumber(input.workspaceCapCents)
  archive.mainEventBudgetCap = budgetCentsToNativeNumber(
    input.allocations.get(input.rootEventId) ?? null
  )
  const timeline = Array.isArray(archive.timeline) ? archive.timeline : []
  archive.timeline = timeline.flatMap((value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [value]
    const child = value as Record<string, unknown>
    const id = typeof child.id === 'string' ? child.id.toLowerCase() : null
    if (!id || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/.test(id)) return [child]
    if (!input.allocations.has(id)) return []
    return [{ ...child, budgetCap: budgetCentsToNativeNumber(input.allocations.get(id) ?? null) }]
  })
  return encode(archive)
}

async function patchVersionedEventBudget(
  transaction: Transaction,
  input: {
    userId: string
    rootId: string
    eventIds: string[]
    allocationCents: Map<string, number | null>
  }
) {
  const versionedEvents = await transaction
    .select()
    .from(nativeSyncEntity)
    .where(
      and(
        eq(nativeSyncEntity.scopeId, input.rootId),
        eq(nativeSyncEntity.entityType, 'event'),
        inArray(nativeSyncEntity.entityId, input.eventIds),
        eq(nativeSyncEntity.isDeleted, false)
      )
    )
    .for('update')

  for (const entity of versionedEvents) {
    const archive = decodeBudgetArchive(entity.payload)
    if (!archive) continue
    const nextPayload = encode({
      ...archive,
      budgetCap: budgetCentsToNativeNumber(input.allocationCents.get(entity.entityId) ?? null),
    })
    const serverVersion = entity.serverVersion + 1
    await transaction
      .update(nativeSyncEntity)
      .set({ payload: nextPayload, serverVersion, updatedAt: new Date() })
      .where(
        and(
          eq(nativeSyncEntity.scopeId, input.rootId),
          eq(nativeSyncEntity.entityType, 'event'),
          eq(nativeSyncEntity.entityId, entity.entityId)
        )
      )
    await transaction.insert(nativeSyncChange).values({
      ownerUserId: input.userId,
      scopeId: input.rootId,
      entityType: 'event',
      entityId: entity.entityId,
      operation: 'update',
      payload: nextPayload,
      serverVersion,
    })
  }
}

export async function applyNativeBudgetReplacement(
  transaction: Transaction,
  input: {
    userId: string
    mutation: NativeMutation
    snapshot: typeof nativeWorkspaceSnapshot.$inferSelect
  }
): Promise<NativePushResult> {
  const { mutation, snapshot, userId } = input
  const reject = async (failureCode: string) => {
    await transaction.insert(nativeSyncMutationReceipt).values({
      mutationId: mutation.id,
      ownerUserId: userId,
      scopeId: mutation.scopeID,
      disposition: 'rejected',
      failureCode,
    })
    return {
      mutationID: mutation.id,
      disposition: 'rejected',
      serverVersion: null,
      failureCode,
    } satisfies NativePushResult
  }
  const conflict = async (serverVersion: number) => {
    await transaction.insert(nativeSyncMutationReceipt).values({
      mutationId: mutation.id,
      ownerUserId: userId,
      scopeId: mutation.scopeID,
      disposition: 'conflict',
      serverVersion,
      failureCode: 'BUDGET_VERSION_CONFLICT',
    })
    return {
      mutationID: mutation.id,
      disposition: 'conflict',
      serverVersion,
      failureCode: 'BUDGET_VERSION_CONFLICT',
    } satisfies NativePushResult
  }

  if (mutation.operation !== 'update' || mutation.entityID !== mutation.scopeID)
    return reject('BUDGET_COMMAND_INVALID')
  const command = decodeNativeBudgetMutationPayload(mutation.payload)
  if (!command) return reject('BUDGET_COMMAND_INVALID')
  const currentRevision = await transaction
    .select({ serverVersion: nativeSyncEntity.serverVersion })
    .from(nativeSyncEntity)
    .where(
      and(
        eq(nativeSyncEntity.scopeId, mutation.scopeID),
        eq(nativeSyncEntity.entityType, 'budget_transfer'),
        eq(nativeSyncEntity.entityId, mutation.scopeID),
        eq(nativeSyncEntity.isDeleted, false)
      )
    )
    .limit(1)
    .for('update')
  const budgetVersion = currentRevision[0]?.serverVersion ?? 0
  if (command.expectedBudgetVersion !== budgetVersion) return conflict(budgetVersion)

  const [root] = await transaction
    .select({
      id: event.id,
      organizationId: event.organizationId,
      parentEventId: event.parentEventId,
    })
    .from(event)
    .where(eq(event.id, mutation.scopeID))
    .limit(1)
  if (!root || root.parentEventId !== null || root.id !== snapshot.scopeId)
    return reject('BUDGET_SCOPE_FORBIDDEN')
  if (!(await isNativeBudgetManager(transaction, { rootEventId: root.id, userId })))
    return reject('BUDGET_MANAGER_REQUIRED')

  const currentEvents = await transaction
    .select({ id: event.id, parentEventId: event.parentEventId, budgetCap: event.budgetCap })
    .from(event)
    .where(
      and(
        eq(event.organizationId, root.organizationId),
        or(eq(event.id, root.id), eq(event.parentEventId, root.id))
      )
    )
    .for('update')
  const eventIDs = currentEvents.map(({ id }) => id).sort()
  const requested = command.allocations.map(({ eventID }) => eventID).sort()
  if (
    eventIDs.length !== requested.length ||
    eventIDs.some((id, index) => id !== requested[index])
  ) {
    return reject('BUDGET_EVENT_SET_MISMATCH')
  }

  const cap = budgetCentsToDecimal(command.workspaceCapCents)
  const total = command.allocations.reduce(
    (sum, allocation) => sum.plus(allocation.amountCents ?? 0),
    new MoneyDecimal(0)
  )
  if (command.workspaceCapCents !== null && total.greaterThan(command.workspaceCapCents))
    return reject('BUDGET_ALLOCATION_EXCEEDS_CAP')

  const allocations = new Map(
    command.allocations.map(({ eventID, amountCents }) => [eventID, amountCents])
  )
  const currentByID = new Map(currentEvents.map((row) => [row.id, row]))
  const changedChildIDs = command.allocations.flatMap(({ eventID, amountCents }) => {
    if (eventID === root.id) return []
    const previousCents = decimalToCents(currentByID.get(eventID)?.budgetCap ?? null)
    if (previousCents === undefined) return [eventID]
    if (previousCents === null) return amountCents === null ? [] : [eventID]
    return amountCents !== null && previousCents.equals(amountCents) ? [] : [eventID]
  })
  if (
    changedChildIDs.some(
      (eventID) => decimalToCents(currentByID.get(eventID)?.budgetCap ?? null) === undefined
    )
  )
    return reject('BUDGET_VALUE_INVALID')
  const [currentSettings] = await transaction
    .select({ budgetCap: workspacePlanningSettings.budgetCap })
    .from(workspacePlanningSettings)
    .where(eq(workspacePlanningSettings.organizationId, root.organizationId))
    .limit(1)
    .for('update')
  const capAffectedChildren =
    currentSettings?.budgetCap != null && command.workspaceCapCents === null
      ? currentEvents
          .filter((row) => row.id !== root.id && row.budgetCap !== null)
          .map((row) => row.id)
      : []
  for (const childID of new Set([...changedChildIDs, ...capAffectedChildren])) {
    if (!(await isNativeEventBudgetManager(transaction, { eventId: childID, userId })))
      return reject('BUDGET_TARGET_MANAGER_REQUIRED')
  }
  if (
    command.workspaceCapCents === null &&
    command.allocations.some((allocation) => allocation.amountCents !== null)
  ) {
    return reject('BUDGET_CAP_REQUIRED_FOR_ALLOCATIONS')
  }
  const replacementPayload = replaceArchiveBudget(snapshot.payload, {
    workspaceCapCents: command.workspaceCapCents,
    rootEventId: root.id,
    allocations,
  })
  if (!replacementPayload) return reject('BUDGET_SNAPSHOT_INVALID')

  const nextBudgetVersion = budgetVersion + 1
  const nextWorkspaceVersion = snapshot.serverVersion + 1
  await transaction
    .update(workspacePlanningSettings)
    .set({ budgetCap: cap, updatedAt: new Date() })
    .where(eq(workspacePlanningSettings.organizationId, root.organizationId))
  for (const allocation of command.allocations) {
    const amount = budgetCentsToDecimal(allocation.amountCents)
    await transaction
      .update(event)
      .set({ budgetCap: amount, updatedAt: new Date() })
      .where(and(eq(event.id, allocation.eventID), eq(event.organizationId, root.organizationId)))
  }
  await transaction
    .update(nativeWorkspaceSnapshot)
    .set({
      payload: replacementPayload,
      serverVersion: nextWorkspaceVersion,
      updatedAt: new Date(),
    })
    .where(eq(nativeWorkspaceSnapshot.scopeId, mutation.scopeID))
  await patchVersionedEventBudget(transaction, {
    userId,
    rootId: root.id,
    eventIds: eventIDs,
    allocationCents: allocations,
  })
  await transaction
    .insert(nativeSyncEntity)
    .values({
      scopeId: mutation.scopeID,
      entityType: 'budget_transfer',
      entityId: mutation.scopeID,
      ownerUserId: userId,
      payload: mutation.payload,
      serverVersion: nextBudgetVersion,
      isDeleted: false,
    })
    .onConflictDoUpdate({
      target: [nativeSyncEntity.scopeId, nativeSyncEntity.entityType, nativeSyncEntity.entityId],
      set: {
        ownerUserId: userId,
        payload: mutation.payload,
        serverVersion: nextBudgetVersion,
        isDeleted: false,
        updatedAt: new Date(),
      },
    })
  await transaction.insert(nativeSyncChange).values([
    {
      ownerUserId: userId,
      scopeId: mutation.scopeID,
      entityType: 'workspace',
      entityId: mutation.scopeID,
      operation: 'update',
      payload: replacementPayload,
      serverVersion: nextWorkspaceVersion,
    },
    {
      ownerUserId: userId,
      scopeId: mutation.scopeID,
      entityType: 'budget_transfer',
      entityId: mutation.scopeID,
      operation: 'update',
      payload: mutation.payload,
      serverVersion: nextBudgetVersion,
    },
  ])
  await transaction.insert(nativeSyncMutationReceipt).values({
    mutationId: mutation.id,
    ownerUserId: userId,
    scopeId: mutation.scopeID,
    disposition: 'applied',
    serverVersion: nextBudgetVersion,
  })
  return {
    mutationID: mutation.id,
    disposition: 'applied',
    serverVersion: nextBudgetVersion,
    workspaceServerVersion: nextWorkspaceVersion,
    failureCode: null,
  }
}
