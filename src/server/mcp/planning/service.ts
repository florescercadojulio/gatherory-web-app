import type { EventPermissions } from '@/lib/permissions'
import type { NativeWorkspaceSnapshots } from '@/server/sync/contracts/native-sync.contracts'
import { McpContentError, type McpContentPort } from '@/server/mcp/content/service'
import {
  assertMcpApplied,
  decodeMcpPayload,
  fromNativeDate,
  makeMcpMutation,
  mcpEntityId,
  mcpPage,
  resolveMcpEventScope,
} from '@/server/mcp/mutations'
import { MCP_PLANNING_TOOL_SCHEMAS, type McpPlanningToolName } from './contracts'
import { z } from 'zod'

type Snapshot = NativeWorkspaceSnapshots['snapshots'][number]
type Entity = NativeWorkspaceSnapshots['entities'][number]
type Note = { id: string; eventId: string; body: string; sentAt: string; version: number }
type Task = {
  id: string
  eventId: string
  title: string
  dueDate: string | null
  websiteURL: string | null
  assigneePersonId: string | null
  isCompleted: boolean
  createdAt: string | null
  version: number
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}
function decode(value: string): Record<string, unknown> {
  return decodeMcpPayload(value)
}
function appleDate(value: unknown): string | null {
  return fromNativeDate(value)
}
function decodeNote(entity: Entity): Note | null {
  if (entity.entityType !== 'note') return null
  const value = decode(entity.payload)
  if (
    typeof value.id !== 'string' ||
    typeof value.eventID !== 'string' ||
    typeof value.body !== 'string'
  )
    return null
  return {
    id: entity.entityID.toLowerCase(),
    eventId: value.eventID.toLowerCase(),
    body: value.body,
    sentAt: appleDate(value.sentAt) ?? entity.updatedAt,
    version: entity.serverVersion,
  }
}
function decodeTask(entity: Entity): Task | null {
  if (entity.entityType !== 'todo') return null
  const value = decode(entity.payload)
  if (
    typeof value.id !== 'string' ||
    typeof value.eventID !== 'string' ||
    typeof value.title !== 'string'
  )
    return null
  return {
    id: entity.entityID.toLowerCase(),
    eventId: value.eventID.toLowerCase(),
    title: value.title,
    dueDate: typeof value.dueDate === 'string' ? value.dueDate : null,
    websiteURL: typeof value.websiteURL === 'string' && value.websiteURL ? value.websiteURL : null,
    assigneePersonId:
      typeof value.assigneePersonID === 'string' ? value.assigneePersonID.toLowerCase() : null,
    isCompleted: value.isCompleted === true,
    createdAt: appleDate(value.createdAt),
    version: entity.serverVersion,
  }
}
function assertOpen(snapshot: Snapshot, childPayload: Record<string, unknown>) {
  const value = decode(snapshot.payload)
  const scoped = record(value.scopedEvent)
  if (
    value.mainEventStatus === 'finished' ||
    value.mainEventStatus === 'cancelled' ||
    scoped.status === 'archived' ||
    scoped.status === 'cancelled' ||
    childPayload.status === 'archived' ||
    childPayload.status === 'cancelled' ||
    childPayload.completionStatus === 'complete' ||
    childPayload.isMainEventDeleted === true
  )
    throw new McpContentError('WRITE_REJECTED', 'This event is closed to planning changes.')
}
function scopeEntity(
  data: NativeWorkspaceSnapshots,
  scopeId: string,
  eventId: string,
  type: string,
  entityId?: string
) {
  return data.entities.find((item) => {
    if (
      item.entityType !== type ||
      item.scopeID.toLowerCase() !== scopeId ||
      (entityId && item.entityID.toLowerCase() !== entityId)
    )
      return false
    return decode(item.payload).eventID?.toString().toLowerCase() === eventId
  })
}

export const MCP_PLANNING_TOOLS = [
  {
    name: 'list_notes',
    description:
      'List planning notes visible to people authorized for the event. Follow nextCursor until it is null.',
    inputSchema: MCP_PLANNING_TOOL_SCHEMAS.list_notes,
    readOnly: true,
  },
  {
    name: 'create_note',
    description:
      'Add planning content visible to people authorized for the event. This does not send an announcement or notification; split long source excerpts into labeled notes.',
    inputSchema: MCP_PLANNING_TOOL_SCHEMAS.create_note,
    readOnly: false,
  },
  {
    name: 'update_note',
    description:
      'Edit a planning note you authored. Read it first and pass its latest version as expectedVersion.',
    inputSchema: MCP_PLANNING_TOOL_SCHEMAS.update_note,
    readOnly: false,
  },
  {
    name: 'list_tasks',
    description:
      'List planning tasks for an event you can access. Follow nextCursor until it is null.',
    inputSchema: MCP_PLANNING_TOOL_SCHEMAS.list_tasks,
    readOnly: true,
  },
  {
    name: 'create_task',
    description:
      'Add an unassigned planning task to an event. Do not invent an assignee or claim the task is already completed.',
    inputSchema: MCP_PLANNING_TOOL_SCHEMAS.create_task,
    readOnly: false,
  },
  {
    name: 'update_task',
    description:
      'Update a planning task title, due date, link, or completion state. Read it first and pass its latest version as expectedVersion; assignment is not writable.',
    inputSchema: MCP_PLANNING_TOOL_SCHEMAS.update_task,
    readOnly: false,
  },
] as const

export function createMcpPlanningService(port: McpContentPort) {
  async function push(input: {
    userId: string
    toolName: McpPlanningToolName
    idempotencyKey: string
    eventId: string
    entityId: string
    entityType: 'note' | 'todo'
    operation: 'create' | 'update'
    expectedVersion?: number
    payload: Record<string, unknown>
    requestInput: unknown
  }) {
    const { mutation, fingerprint } = makeMcpMutation({
      userId: input.userId,
      toolName: input.toolName,
      idempotencyKey: input.idempotencyKey,
      scopeId: input.eventId,
      entityId: input.entityId,
      entityType: input.entityType,
      operation: input.operation,
      expectedVersion: input.expectedVersion,
      payload: input.payload,
      requestInput: input.requestInput,
    })
    return assertMcpApplied(await port.push({ userId: input.userId, mutation, fingerprint }))
  }
  return {
    async call(
      name: McpPlanningToolName,
      rawInput: unknown,
      actor: { userId: string }
    ): Promise<unknown> {
      if (!actor.userId)
        throw new McpContentError('WRITE_REJECTED', 'An authenticated account is required.')
      const eventId = z.object({ eventId: z.uuid() }).parse(rawInput).eventId.toLowerCase()
      const isNote = name.endsWith('note') || name === 'list_notes'
      const kind = isNote ? 'note' : 'todo'
      const permissions: EventPermissions =
        name === 'list_notes'
          ? { note: ['read'] }
          : name === 'list_tasks'
            ? { todo: ['read'] }
            : isNote
              ? { note: ['send'] }
              : name === 'create_task'
                ? { todo: ['create'] }
                : { todo: ['update'] }
      await port.authorize(actor.userId, eventId, permissions)
      const data = await port.bootstrap(actor.userId)
      const resolved = resolveMcpEventScope(data, eventId)
      if (!resolved) throw new McpContentError('NOT_FOUND', 'Event not found.')
      const { scopeId, snapshot, eventPayload } = resolved
      if (name.startsWith('list_')) {
        const input =
          name === 'list_notes'
            ? MCP_PLANNING_TOOL_SCHEMAS.list_notes.parse(rawInput)
            : MCP_PLANNING_TOOL_SCHEMAS.list_tasks.parse(rawInput)
        const items = data.entities
          .flatMap((entity) => {
            if (entity.scopeID.toLowerCase() !== scopeId) return []
            const value = kind === 'note' ? decodeNote(entity) : decodeTask(entity)
            return value && value.eventId === eventId ? [value] : []
          })
          .sort((a, b) => a.id.localeCompare(b.id))
        return mcpPage(items, input.limit, input.cursor)
      }
      assertOpen(snapshot, eventPayload)
      if (name === 'create_note') {
        const input = MCP_PLANNING_TOOL_SCHEMAS.create_note.parse(rawInput)
        const entityId = mcpEntityId(actor.userId, name, input.idempotencyKey)
        const payload = {
          id: entityId,
          eventID: eventId,
          authorUserID: actor.userId,
          body: input.body,
          sentAt: Date.now() / 1000 - Date.UTC(2001, 0, 1) / 1000,
        }
        const result = await push({
          userId: actor.userId,
          toolName: name,
          idempotencyKey: input.idempotencyKey,
          eventId: scopeId,
          entityId,
          entityType: 'note',
          operation: 'create',
          payload,
          requestInput: { eventId, body: input.body },
        })
        return { id: entityId, eventId, body: input.body, version: result.serverVersion ?? 1 }
      }
      if (name === 'update_note') {
        const input = MCP_PLANNING_TOOL_SCHEMAS.update_note.parse(rawInput)
        const entity = scopeEntity(data, scopeId, eventId, 'note', input.noteId.toLowerCase())
        const current = entity && decodeNote(entity)
        if (!current || current.eventId !== eventId)
          throw new McpContentError('NOT_FOUND', 'Note not found.')
        if (decode(entity!.payload).authorUserID !== actor.userId)
          throw new McpContentError('WRITE_REJECTED', 'Only the author can edit this note.')
        const old = decode(entity!.payload)
        const payload = { ...old, id: current.id, eventID: eventId, body: input.body }
        const result = await push({
          userId: actor.userId,
          toolName: name,
          idempotencyKey: input.idempotencyKey,
          eventId: scopeId,
          entityId: current.id,
          entityType: 'note',
          operation: 'update',
          expectedVersion: input.expectedVersion,
          payload,
          requestInput: {
            eventId,
            noteId: current.id,
            expectedVersion: input.expectedVersion,
            body: input.body,
          },
        })
        return { ...current, body: input.body, version: result.serverVersion }
      }
      if (name === 'create_task') {
        const input = MCP_PLANNING_TOOL_SCHEMAS.create_task.parse(rawInput)
        const entityId = mcpEntityId(actor.userId, name, input.idempotencyKey)
        const payload = {
          id: entityId,
          eventID: eventId,
          title: input.title,
          dueDate: input.dueDate ?? null,
          websiteURL: input.websiteURL ?? null,
          assigneePersonID: null,
          isCompleted: false,
          createdAt: Date.now() / 1000 - Date.UTC(2001, 0, 1) / 1000,
        }
        const result = await push({
          userId: actor.userId,
          toolName: name,
          idempotencyKey: input.idempotencyKey,
          eventId: scopeId,
          entityId,
          entityType: 'todo',
          operation: 'create',
          payload,
          requestInput: {
            eventId,
            title: input.title,
            dueDate: input.dueDate ?? null,
            websiteURL: input.websiteURL ?? null,
          },
        })
        return {
          id: entityId,
          eventId,
          title: input.title,
          dueDate: input.dueDate ?? null,
          websiteURL: input.websiteURL ?? null,
          assigneePersonId: null,
          isCompleted: false,
          version: result.serverVersion ?? 1,
        }
      }
      if (name === 'update_task') {
        const input = MCP_PLANNING_TOOL_SCHEMAS.update_task.parse(rawInput)
        const entity = scopeEntity(data, scopeId, eventId, 'todo', input.taskId.toLowerCase())
        const current = entity && decodeTask(entity)
        if (!current || current.eventId !== eventId)
          throw new McpContentError('NOT_FOUND', 'Task not found.')
        const old = decode(entity!.payload)
        const changes = input.changes
        const payload = {
          ...old,
          id: current.id,
          eventID: eventId,
          ...(Object.hasOwn(changes, 'title') ? { title: changes.title } : {}),
          ...(Object.hasOwn(changes, 'dueDate') ? { dueDate: changes.dueDate ?? null } : {}),
          ...(Object.hasOwn(changes, 'websiteURL')
            ? { websiteURL: changes.websiteURL ?? null }
            : {}),
          ...(Object.hasOwn(changes, 'isCompleted') ? { isCompleted: changes.isCompleted } : {}),
        }
        const result = await push({
          userId: actor.userId,
          toolName: name,
          idempotencyKey: input.idempotencyKey,
          eventId: scopeId,
          entityId: current.id,
          entityType: 'todo',
          operation: 'update',
          expectedVersion: input.expectedVersion,
          payload,
          requestInput: {
            eventId,
            taskId: current.id,
            expectedVersion: input.expectedVersion,
            changes,
          },
        })
        return {
          ...current,
          ...changes,
          dueDate: Object.hasOwn(changes, 'dueDate') ? (changes.dueDate ?? null) : current.dueDate,
          websiteURL: Object.hasOwn(changes, 'websiteURL')
            ? (changes.websiteURL ?? null)
            : current.websiteURL,
          assigneePersonId: current.assigneePersonId,
          version: result.serverVersion,
        }
      }
      throw new McpContentError('INVALID_INPUT', 'Unknown planning tool.')
    },
  }
}
