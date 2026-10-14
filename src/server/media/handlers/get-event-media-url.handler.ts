import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { transportInput } from '@/lib/input-validation'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { runServerEffect } from '@/server/effect'
import { validateInput } from '@/server/validation'
import { GetEventMediaUrlInputSchema } from '../contracts/media.contracts'
import { provideMediaLayers } from '../media.layers'
import { getEventMediaUrlWorkflow } from '../workflows/get-event-media-url.workflow'
import { mediaError } from './media.handler-utils'

export const getEventMediaUrl = createServerFn({ method: 'GET' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(GetEventMediaUrlInputSchema))
  .handler(({ data, context }) =>
    runServerEffect(
      validateInput(GetEventMediaUrlInputSchema, data).pipe(
        Effect.flatMap(({ mediaAssetId }) =>
          provideMediaLayers(
            getEventMediaUrlWorkflow({ userId: context.user.id, mediaAssetId }).pipe(
              Effect.mapError(mediaError)
            )
          )
        )
      )
    )
  )
