import { z } from 'zod'
import { characterString } from '@/contracts/content-primitives'

const requestKey = characterString(8, 128)
const pageFields = {
  limit: z.number().int().min(1).max(50).default(20),
  cursor: characterString(0, 128).optional(),
}
const id = z.uuid()

export const McpListNotesInputSchema = z.object({ eventId: id, ...pageFields }).strict()
export const McpCreateNoteInputSchema = z
  .object({
    idempotencyKey: requestKey.describe('Stable key reused only when retrying this exact write.'),
    eventId: id,
    body: characterString(1, 750).describe(
      'Planning content visible to people authorized for this event. This does not send an announcement or notification.'
    ),
  })
  .strict()
export const McpUpdateNoteInputSchema = z
  .object({
    idempotencyKey: requestKey.describe('Stable key reused only when retrying this exact write.'),
    eventId: id,
    noteId: id,
    expectedVersion: z.number().int().positive().describe('Latest version from list_notes.'),
    body: characterString(1, 750).describe(
      'Replacement planning content visible to people authorized for this event.'
    ),
  })
  .strict()

const todoTitle = characterString(1, 200)
const dueDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .optional()
  .refine((value) => {
    if (value == null) return true
    const date = new Date(`${value}T00:00:00.000Z`)
    return (
      !Number.isNaN(date.valueOf()) &&
      date.toISOString().slice(0, 10) === value &&
      Number(value.slice(0, 4)) > 0
    )
  }, 'Use a valid calendar date in YYYY-MM-DD format.')
const websiteURL = characterString(0, 2048)
  .nullable()
  .optional()
  .refine((value) => {
    if (value == null || value === '') return true
    try {
      const url = new URL(value)
      return (
        ['http:', 'https:'].includes(url.protocol) &&
        !!url.hostname &&
        !url.username &&
        !url.password &&
        !/[\\\s\p{Cc}\p{Cf}]/u.test(value)
      )
    } catch {
      return false
    }
  }, 'Use an explicit HTTP or HTTPS URL.')

export const McpListTasksInputSchema = z.object({ eventId: id, ...pageFields }).strict()
export const McpCreateTaskInputSchema = z
  .object({
    idempotencyKey: requestKey.describe('Stable key reused only when retrying this exact write.'),
    eventId: id,
    title: todoTitle.describe('A concrete planning task title.'),
    dueDate: dueDate.describe('Optional calendar date in YYYY-MM-DD form.'),
    websiteURL: websiteURL.describe('Optional HTTP or HTTPS reference link.'),
  })
  .strict()
export const McpUpdateTaskInputSchema = z
  .object({
    idempotencyKey: requestKey.describe('Stable key reused only when retrying this exact write.'),
    eventId: id,
    taskId: id,
    expectedVersion: z.number().int().positive().describe('Latest version from list_tasks.'),
    changes: z
      .object({
        title: todoTitle.optional().describe('A concrete planning task title.'),
        dueDate: dueDate.describe('Optional calendar date in YYYY-MM-DD form; null clears it.'),
        websiteURL: websiteURL.describe('Optional HTTP or HTTPS reference link; null clears it.'),
        isCompleted: z.boolean().optional().describe('Whether this planning task is complete.'),
      })
      .strict()
      .refine(
        (value) => Object.keys(value).length > 0,
        'Provide at least one task field to update.'
      ),
  })
  .strict()

export const MCP_PLANNING_TOOL_SCHEMAS = {
  list_notes: McpListNotesInputSchema,
  create_note: McpCreateNoteInputSchema,
  update_note: McpUpdateNoteInputSchema,
  list_tasks: McpListTasksInputSchema,
  create_task: McpCreateTaskInputSchema,
  update_task: McpUpdateTaskInputSchema,
} as const
export type McpPlanningToolName = keyof typeof MCP_PLANNING_TOOL_SCHEMAS
