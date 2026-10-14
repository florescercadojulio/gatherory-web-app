import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { transportInput } from '@/lib/input-validation'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { runServerEffect } from '@/server/effect'
import { validateInput } from '@/server/validation'
import { FinalizeEventMediaUploadInputSchema } from '../contracts/media.contracts'
import { finalizeEventMediaUploadWorkflow } from '../workflows/media.workflows.live'
import { PgClientLive } from '@/db'
import { mediaError } from './media.handler-utils'

export const finalizeEventMediaUpload = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(FinalizeEventMediaUploadInputSchema))
  .handler(({ data, context }) =>
    runServerEffect(
      validateInput(FinalizeEventMediaUploadInputSchema, data).pipe(
        Effect.flatMap((media) =>
          finalizeEventMediaUploadWorkflow({ userId: context.user.id, media }).pipe(
            Effect.mapError(mediaError),
            Effect.provide(PgClientLive)
          )
        )
      )
    )
  )
