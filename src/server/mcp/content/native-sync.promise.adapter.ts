import { Effect } from 'effect'
import { McpContentNativePort } from './native-sync.con'
import { McpContentNativePortLive } from './native-sync.con.live'
import type { McpContentPort } from './service'

function run<A, E>(program: Effect.Effect<A, E, McpContentNativePort>) {
  return Effect.runPromise(program.pipe(Effect.provide(McpContentNativePortLive)))
}

/** Bridge the Promise-based MCP protocol service to the composed Effect port. */
export const liveMcpContentPort: McpContentPort = {
  bootstrap: (userId) =>
    run(Effect.flatMap(McpContentNativePort, (port) => port.bootstrap(userId))),

  push: (input) => run(Effect.flatMap(McpContentNativePort, (port) => port.push(input))),

  authorize: (userId, eventId, permissions) =>
    run(
      Effect.flatMap(McpContentNativePort, (port) => port.authorize(userId, eventId, permissions))
    ),

  isRootEvent: (userId, eventId) =>
    run(Effect.flatMap(McpContentNativePort, (port) => port.isRootEvent(userId, eventId))),
}
