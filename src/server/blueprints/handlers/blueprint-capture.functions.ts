import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { transportInput } from '@/lib/input-validation'
import { runServerEffect } from '@/server/effect'
import {
  BlueprintCaptureSourceInputSchema,
  BlueprintCapturePreviewInputSchema,
  BlueprintCaptureSaveInputSchema,
} from '@/contracts/blueprint-capture.contracts'
import * as workflows from '../workflows/blueprint-capture.workflows.live'

export const listBlueprintCaptureEvents = createServerFn({ method: 'GET' })
  .middleware([requireSessionMiddleware])
  .handler(({ context }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    return runServerEffect(
      workflows.listBlueprintCaptureEvents(context.user.id).pipe(Effect.provide(PgClientLive)),
      { operation: 'blueprint.capture.list' }
    )
  })
export const getBlueprintCaptureSource = createServerFn({ method: 'GET' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(BlueprintCaptureSourceInputSchema))
  .handler(({ context, data }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    return runServerEffect(
      workflows.getBlueprintCaptureSource(context.user.id, data).pipe(Effect.provide(PgClientLive)),
      { operation: 'blueprint.capture.source' }
    )
  })
export const previewBlueprintCapture = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(BlueprintCapturePreviewInputSchema))
  .handler(({ context, data }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    return runServerEffect(
      workflows.previewBlueprintCapture(context.user.id, data).pipe(Effect.provide(PgClientLive)),
      { operation: 'blueprint.capture.preview' }
    )
  })
export const saveBlueprintCapture = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(BlueprintCaptureSaveInputSchema))
  .handler(({ context, data }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    return runServerEffect(
      workflows.saveBlueprintCapture(context.user.id, data).pipe(Effect.provide(PgClientLive)),
      { operation: 'blueprint.capture.save' }
    )
  })
