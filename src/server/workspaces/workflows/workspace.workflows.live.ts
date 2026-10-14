import { Effect } from 'effect'

import { WorkspaceDomainLive, EventWorkspaceProvisioningLive } from '../workspaces.layers.live'
import { createEventWorkspaceWorkflow as programCreateEventWorkspace } from './create-event-workspace.workflow'
import { createWorkspaceWorkflow as programCreateWorkspace } from './create-workspace.workflow'
import { ensurePersonalWorkspaceWorkflow as programEnsurePersonalWorkspace } from './ensure-personal-workspace.workflow'
import { resolveWorkspaceWorkflow as programResolveWorkspace } from './resolve-workspace.workflow'

export const createWorkspaceWorkflow = (...args: Parameters<typeof programCreateWorkspace>) =>
  programCreateWorkspace(...args).pipe(Effect.provide(WorkspaceDomainLive))

export const ensurePersonalWorkspaceWorkflow = (
  ...args: Parameters<typeof programEnsurePersonalWorkspace>
) => programEnsurePersonalWorkspace(...args).pipe(Effect.provide(WorkspaceDomainLive))

export const resolveWorkspaceWorkflow = (...args: Parameters<typeof programResolveWorkspace>) =>
  programResolveWorkspace(...args).pipe(Effect.provide(WorkspaceDomainLive))

export const createEventWorkspaceWorkflow = (
  ...args: Parameters<typeof programCreateEventWorkspace>
) => programCreateEventWorkspace(...args).pipe(Effect.provide(EventWorkspaceProvisioningLive))
