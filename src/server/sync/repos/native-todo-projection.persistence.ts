import { and, asc, eq, inArray, or } from 'drizzle-orm'
import { db } from '@/db'
import { event, eventParticipant, workspacePerson } from '@/db/schema/event.schema'
import { eventTodo } from '@/db/schema/planning.schema'
import { nativeSyncEntity } from '@/db/schema/sync.schema'
import { retainedEventAccess } from '@/server/events/repos/event-departure.repo'
import { todoUpgradeRequired } from '../native-sync-compatibility'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
type Executor = typeof db | Transaction
export type NativeTodo = {
  id: string
  eventID: string
  title: string
  dueDate: string | null
  websiteURL: string | null
  assigneePersonID: string | null
  isCompleted: boolean
  createdAt: number
}

export function nativeTodoFromRow(row: typeof eventTodo.$inferSelect): NativeTodo {
  return {
    id: row.id,
    eventID: row.eventId,
    title: row.title,
    dueDate: row.dueDate,
    websiteURL: row.websiteUrl,
    assigneePersonID: row.assigneePersonId,
    isCompleted: row.isCompleted,
    createdAt: row.createdAt.getTime() / 1000 - 978307200,
  }
}

export function encodeNativeTodo(todo: NativeTodo): string {
  return Buffer.from(JSON.stringify(todo)).toString('base64')
}

export async function canonicalTodoForSync(
  executor: Executor,
  organizationId: string,
  todoId: string
): Promise<NativeTodo | null> {
  const [row] = await executor
    .select()
    .from(eventTodo)
    .where(and(eq(eventTodo.organizationId, organizationId), eq(eventTodo.id, todoId)))
    .limit(1)
  return row ? nativeTodoFromRow(row) : null
}

export function todoEventID(payload: string): string | null {
  try {
    const value = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
    return typeof value?.eventID === 'string' ? value.eventID.toLowerCase() : null
  } catch {
    return null
  }
}

/** A root replication grant never substitutes for the child's planner grant. */
export async function readableTodoEventIDs(executor: Executor, userId: string, scopes: string[]) {
  if (!scopes.length) return new Set<string>()
  // Do not turn a child grant into permission to probe its parent's stream.
  const grantedScopes = await executor
    .select({ id: event.id })
    .from(event)
    .innerJoin(eventParticipant, eq(eventParticipant.eventId, event.id))
    .innerJoin(
      workspacePerson,
      and(
        eq(workspacePerson.id, eventParticipant.personId),
        eq(workspacePerson.organizationId, event.organizationId)
      )
    )
    .where(
      and(
        inArray(event.id, scopes),
        eq(workspacePerson.userId, userId),
        inArray(eventParticipant.role, ['host', 'collaborator']),
        retainedEventAccess(userId, event.id)
      )
    )
  const granted = grantedScopes.map(({ id }) => id)
  if (!granted.length) return new Set<string>()
  const rows = await executor
    .select({ id: event.id })
    .from(event)
    .innerJoin(eventParticipant, eq(eventParticipant.eventId, event.id))
    .innerJoin(
      workspacePerson,
      and(
        eq(workspacePerson.id, eventParticipant.personId),
        eq(workspacePerson.organizationId, event.organizationId)
      )
    )
    .where(
      and(
        or(inArray(event.id, granted), inArray(event.parentEventId, granted)),
        eq(workspacePerson.userId, userId),
        inArray(eventParticipant.role, ['host', 'collaborator']),
        retainedEventAccess(userId, event.id)
      )
    )
  return new Set(rows.map(({ id }) => id))
}

export async function canonicalTodos(executor: Executor, userId: string, scopes: string[]) {
  const readable = await readableTodoEventIDs(executor, userId, scopes)
  if (!readable.size) return []
  const rows = await executor
    .select()
    .from(eventTodo)
    .where(inArray(eventTodo.eventId, [...readable]))
    .orderBy(asc(eventTodo.createdAt), asc(eventTodo.id))
  return rows.map(nativeTodoFromRow)
}

export function projectTodos(payload: string, todos: NativeTodo[]): string {
  let archive: Record<string, unknown>
  try {
    archive = JSON.parse(payload)
  } catch {
    try {
      archive = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
    } catch {
      return payload
    }
  }
  // Leave malformed input to the existing materializer's typed rejection path.
  if (!archive || typeof archive !== 'object' || Array.isArray(archive)) return payload
  archive.todos = todos
  return Buffer.from(JSON.stringify(archive)).toString('base64')
}

/** Includes tombstones: old enum decoders cannot safely consume deleted tasks. */
export async function assertTodoCapabilityForScopes(
  input: {
    userId: string
    scopeIds: string[]
    supportsTodos?: boolean
  },
  executor: Executor = db
) {
  if (input.supportsTodos || !input.scopeIds.length) return
  const readable = await readableTodoEventIDs(executor, input.userId, input.scopeIds)
  if (!readable.size) return
  const active = await executor
    .select({ id: eventTodo.id })
    .from(eventTodo)
    .where(inArray(eventTodo.eventId, [...readable]))
    .limit(1)
  const events = await executor
    .select({ id: event.id, parent: event.parentEventId })
    .from(event)
    .where(inArray(event.id, [...readable]))
  const logScopes = [...new Set(events.flatMap(({ id, parent }) => (parent ? [parent, id] : [id])))]
  const history = active.length
    ? []
    : await executor
        .select({ payload: nativeSyncEntity.payload })
        .from(nativeSyncEntity)
        .where(
          and(inArray(nativeSyncEntity.scopeId, logScopes), eq(nativeSyncEntity.entityType, 'todo'))
        )
  if (
    active.length ||
    history.some(({ payload }) => {
      const eventID = todoEventID(payload)
      return eventID !== null && readable.has(eventID)
    })
  )
    throw todoUpgradeRequired(input.scopeIds)
}
