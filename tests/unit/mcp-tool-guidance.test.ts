import { expect, test } from 'vitest'
import { MCP_CONTENT_TOOLS } from '@/server/mcp/content/service'
import { CreateChildEventInputSchema } from '@/server/mcp/children/contracts'
import { MCP_CHILD_EVENT_TOOLS } from '@/server/mcp/children/service'
import { MCP_PLANNING_TOOLS } from '@/server/mcp/planning/service'
import { McpCreateNoteInputSchema, McpCreateTaskInputSchema } from '@/server/mcp/planning/contracts'
import { MCP_SERVER_INSTRUCTIONS } from '@/server/mcp/http'

function toolDescription(tools: readonly { name: string; description: string }[], name: string) {
  const tool = tools.find((candidate) => candidate.name === name)
  expect(tool, `expected ${name} tool metadata`).toBeDefined()
  return tool!.description
}

test('server guidance distinguishes selected scheduled items from alternatives and unknown details', () => {
  expect(MCP_SERVER_INSTRUCTIONS).toContain('selected scheduled items from alternatives')
  expect(MCP_SERVER_INSTRUCTIONS).toContain('do not infer missing dates, rooms, people')
  expect(MCP_SERVER_INSTRUCTIONS).toContain('registrations, or commitments')
  expect(MCP_SERVER_INSTRUCTIONS).toContain('source attribution')
  expect(toolDescription(MCP_CHILD_EVENT_TOOLS, 'create_child_event')).toContain(
    'purpose=eventExperience'
  )
  expect(toolDescription(MCP_CONTENT_TOOLS, 'create_idea')).toContain('unscheduled option')
})

test('note and task guidance states visibility, delivery, and assignment boundaries', () => {
  expect(toolDescription(MCP_PLANNING_TOOLS, 'create_note')).toContain(
    'does not send an announcement or notification'
  )
  expect(McpCreateNoteInputSchema.shape.body.description).toContain(
    'visible to people authorized for this event'
  )
  expect(toolDescription(MCP_PLANNING_TOOLS, 'create_task')).toContain('unassigned')
  expect(toolDescription(MCP_PLANNING_TOOLS, 'update_task')).toContain('assignment is not writable')
  expect(McpCreateTaskInputSchema.shape.title.description).toContain('planning task title')
})

test('tool field descriptions explain confirmed session times, IANA zone, and idempotent retry input', () => {
  expect(CreateChildEventInputSchema.shape.startsAt.description).toContain(
    'Confirmed ISO timestamp'
  )
  expect(CreateChildEventInputSchema.shape.timeZone.description).toContain('IANA time zone')
  expect(CreateChildEventInputSchema.shape.purpose.description).toContain(
    'selected scheduled session'
  )
  expect(McpCreateNoteInputSchema.shape.idempotencyKey.description).toContain(
    'retrying this exact write'
  )
})
