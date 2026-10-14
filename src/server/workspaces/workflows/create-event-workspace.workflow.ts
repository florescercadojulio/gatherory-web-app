import { Effect } from 'effect'
import { defaultOrganizationType } from '@/lib/organization-contract'
import type { CreateEventWorkspaceInput } from '../contracts/workspace.contracts'
import { BetterAuthWorkspaceCon } from '../connectors/better-auth.con'
import { WorkspaceRepo } from '../repos/workspace.repo'

/** Seed/server provisioning: no team, active-session, or main-event side effects. */
export function createEventWorkspaceWorkflow(input: CreateEventWorkspaceInput) {
  return Effect.gen(function* () {
    const auth = yield* BetterAuthWorkspaceCon
    const workspace = yield* auth.createOrganization(input)
    if (workspace.workspaceType === defaultOrganizationType) return workspace
    const repo = yield* WorkspaceRepo
    yield* repo.normalizeOrganizationType(workspace.id)
    return { ...workspace, workspaceType: defaultOrganizationType }
  })
}
