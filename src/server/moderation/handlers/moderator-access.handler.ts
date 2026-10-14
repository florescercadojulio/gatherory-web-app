import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { runServerEffect } from '@/server/effect'
import { moderatorAccessWorkflow } from '../workflows/moderator-access.workflows.live'

export const moderatorAccess = createServerFn({ method: 'GET' }).handler(() =>
  runServerEffect(moderatorAccessWorkflow().pipe(Effect.provide(PgClientLive)))
)
