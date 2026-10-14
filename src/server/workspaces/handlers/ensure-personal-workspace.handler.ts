import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { PgClientLive } from '@/db'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { runServerEffect } from '@/server/effect'
import { ensurePersonalWorkspaceWorkflow } from '../workflows/workspace.workflows.live'

export const ensurePersonalWorkspace = createServerFn({ method: 'GET' })
  .middleware([requireSessionMiddleware])
  .handler(({ context }) =>
    runServerEffect(
      ensurePersonalWorkspaceWorkflow({
        user: context.user,
        headers: getRequestHeaders(),
        activeOrganizationId: context.session.activeOrganizationId,
      }).pipe(Effect.provide(PgClientLive))
    )
  )
