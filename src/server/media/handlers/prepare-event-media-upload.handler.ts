import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { transportInput } from '@/lib/input-validation'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { runServerEffect } from '@/server/effect'
import { validateInput } from '@/server/validation'
import { PrepareEventMediaUploadInputSchema } from '../contracts/media.contracts'
import { provideMediaLayers } from '../media.layers'
import { prepareEventMediaUploadWorkflow } from '../workflows/prepare-event-media-upload.workflow'
import { mediaError } from './media.handler-utils'

export const prepareEventMediaUpload = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(PrepareEventMediaUploadInputSchema))
  .handler(({ data, context }) =>
    runServerEffect(
      validateInput(PrepareEventMediaUploadInputSchema, data).pipe(
        Effect.flatMap((media) =>
          provideMediaLayers(
            prepareEventMediaUploadWorkflow({ userId: context.user.id, media }).pipe(
              Effect.mapError(mediaError)
            )
          )
        )
      )
    )
  )
