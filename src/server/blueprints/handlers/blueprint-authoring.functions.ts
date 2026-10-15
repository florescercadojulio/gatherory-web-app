import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { transportInput } from '@/lib/input-validation'
import { runServerEffect } from '@/server/effect'
import {
  BlueprintAuthoringPageInputSchema,
  BlueprintDraftIdSchema,
  BlueprintCreateDraftSchema,
  BlueprintSaveDraftSchema,
  BlueprintPublishDraftSchema,
  BlueprintPreviewDraftSchema,
} from '@/contracts/blueprint-authoring.contracts'
import { BlueprintStarterInputSchema } from '@/contracts/blueprint-authoring.contracts'
import * as workflows from '../workflows/blueprint-authoring.workflows.live'

export const getBlueprintAuthoringContext = createServerFn({ method: 'GET' })
  .middleware([requireSessionMiddleware])

  .handler(({ context }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    return runServerEffect(
      workflows.getBlueprintAuthoringContext(context.user.id).pipe(Effect.provide(PgClientLive)),
      { operation: 'blueprint.authoring.getBlueprintAuthoringContext' }
    )
  })

export const listBlueprintTemplates = createServerFn({ method: 'GET' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(BlueprintAuthoringPageInputSchema))
  .handler(({ context, data }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    return runServerEffect(
      workflows.listBlueprintTemplates(context.user.id, data).pipe(Effect.provide(PgClientLive)),
      { operation: 'blueprint.authoring.listBlueprintTemplates' }
    )
  })

export const getBlueprintDraft = createServerFn({ method: 'GET' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(BlueprintDraftIdSchema))
  .handler(({ context, data }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    return runServerEffect(
      workflows.getBlueprintDraft(context.user.id, data).pipe(Effect.provide(PgClientLive)),
      { operation: 'blueprint.authoring.getBlueprintDraft' }
    )
  })

export const getBlueprintStarter = createServerFn({ method: 'GET' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(BlueprintStarterInputSchema))
  .handler(({ context, data }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    return runServerEffect(
      workflows.getBlueprintStarter(context.user.id, data).pipe(Effect.provide(PgClientLive)),
      { operation: 'blueprint.authoring.getBlueprintStarter' }
    )
  })

export const createBlueprintDraft = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(BlueprintCreateDraftSchema))
  .handler(({ context, data }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    return runServerEffect(
      workflows.createBlueprintDraft(context.user.id, data).pipe(Effect.provide(PgClientLive)),
      { operation: 'blueprint.authoring.createBlueprintDraft' }
    )
  })

export const saveBlueprintDraft = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(BlueprintSaveDraftSchema))
  .handler(({ context, data }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    return runServerEffect(
      workflows.saveBlueprintDraft(context.user.id, data).pipe(Effect.provide(PgClientLive)),
      { operation: 'blueprint.authoring.saveBlueprintDraft' }
    )
  })

export const publishBlueprintDraft = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(BlueprintPublishDraftSchema))
  .handler(({ context, data }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    return runServerEffect(
      workflows.publishBlueprintDraft(context.user.id, data).pipe(Effect.provide(PgClientLive)),
      { operation: 'blueprint.authoring.publishBlueprintDraft' }
    )
  })

export const retireBlueprintTemplate = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(BlueprintDraftIdSchema))
  .handler(({ context, data }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    return runServerEffect(
      workflows.retireBlueprintTemplate(context.user.id, data).pipe(Effect.provide(PgClientLive)),
      { operation: 'blueprint.authoring.retireBlueprintTemplate' }
    )
  })

export const deleteBlueprintDraft = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(BlueprintDraftIdSchema))
  .handler(({ context, data }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    return runServerEffect(
      workflows.deleteBlueprintDraft(context.user.id, data).pipe(Effect.provide(PgClientLive)),
      { operation: 'blueprint.authoring.deleteBlueprintDraft' }
    )
  })

export const previewBlueprintDraft = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(BlueprintPreviewDraftSchema))
  .handler(({ context, data }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    return runServerEffect(
      workflows.previewBlueprintDraft(context.user.id, data).pipe(Effect.provide(PgClientLive)),
      { operation: 'blueprint.authoring.previewBlueprintDraft' }
    )
  })

export const createBlueprintAuthoringWorkspace = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])

  .handler(({ context }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    return runServerEffect(
      workflows.createBlueprintAuthoringWorkspace(context.user).pipe(Effect.provide(PgClientLive)),
      { operation: 'blueprint.authoring.createBlueprintAuthoringWorkspace' }
    )
  })
