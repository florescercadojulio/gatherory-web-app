import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import type { CreateEventWorkspaceInput } from '../contracts/workspace.contracts'
import { createEventWorkspaceWorkflow } from '../workflows/workspace.workflows.live'

/** Promise boundary for trusted scripts. Not exposed as a server function. */
export function createEventWorkspace(input: CreateEventWorkspaceInput) {
  return Effect.runPromise(createEventWorkspaceWorkflow(input).pipe(Effect.provide(PgClientLive)))
}
