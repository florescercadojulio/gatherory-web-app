import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { transportInput } from '@/lib/input-validation'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { runServerEffect } from '@/server/effect'
import { validateInput } from '@/server/validation'
import { ResolveWorkspaceSchema } from '../contracts/workspace.contracts'
import { resolveWorkspaceWorkflow } from '../workflows/workspace.workflows.live'

export const resolveWorkspace = createServerFn({ method: 'GET' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(ResolveWorkspaceSchema))
  .handler(({ data, context }) =>
    runServerEffect(
      validateInput(ResolveWorkspaceSchema, data)
        .pipe(
          Effect.flatMap((valid) =>
            resolveWorkspaceWorkflow({
              slug: valid.slug,
              user: context.user,
              headers: getRequestHeaders(),
              activeOrganizationId: context.session.activeOrganizationId,
            })
          )
        )
        .pipe(Effect.provide(PgClientLive))
    )
  )
