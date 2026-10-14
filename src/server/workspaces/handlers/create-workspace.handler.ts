import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { transportInput } from '@/lib/input-validation'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { runServerEffect } from '@/server/effect'
import { validateInput } from '@/server/validation'
import { CreateWorkspaceSchema } from '../contracts/workspace.contracts'
import { BetterAuthWorkspaceConLive } from '../connectors/better-auth.con.live'
import { WorkspaceRepoLive } from '../repos/workspace.repo.live'
import { WorkspaceServiceLive } from '../services/workspace.service.live'
import { createWorkspaceWorkflow } from '../workflows/create-workspace.workflow'

export const createWorkspace = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(CreateWorkspaceSchema))
  .handler(({ data, context }) =>
    runServerEffect(
      validateInput(CreateWorkspaceSchema, data)
        .pipe(
          Effect.flatMap((valid) =>
            createWorkspaceWorkflow({
              data: valid,
              user: context.user,
              headers: getRequestHeaders(),
              activeOrganizationId: context.session.activeOrganizationId,
            })
          )
        )
        .pipe(
          Effect.provide(WorkspaceServiceLive),
          Effect.provide(WorkspaceRepoLive),
          Effect.provide(BetterAuthWorkspaceConLive),
          Effect.provide(PgClientLive)
        )
    )
  )
