import { MCP_CONTENT_TOOLS, createMcpContentService, type McpContentPort } from './content/service'
import { MCP_CHILD_EVENT_TOOLS, createMcpChildEventsService } from './children/service'
import { MCP_PLANNING_TOOLS, createMcpPlanningService } from './planning/service'

export const MCP_EVENT_TOOLS = [
  ...MCP_CONTENT_TOOLS,
  ...MCP_CHILD_EVENT_TOOLS,
  ...MCP_PLANNING_TOOLS,
] as const

/** One transport-neutral registry is shared by live MCP and import regressions. */
export function createMcpEventTools(port: McpContentPort) {
  const content = createMcpContentService(port)
  const children = createMcpChildEventsService(port)
  const planning = createMcpPlanningService(port)
  return {
    call(name: string, input: unknown, actor: { userId: string }): Promise<unknown> {
      const contentTool = MCP_CONTENT_TOOLS.find((tool) => tool.name === name)
      if (contentTool) return content.call(contentTool.name, input, actor)
      const childTool = MCP_CHILD_EVENT_TOOLS.find((tool) => tool.name === name)
      if (childTool) return children.call(childTool.name, input, actor)
      const planningTool = MCP_PLANNING_TOOLS.find((tool) => tool.name === name)
      if (planningTool) return planning.call(planningTool.name, input, actor)
      throw new Error('Unknown MCP tool')
    },
  }
}
