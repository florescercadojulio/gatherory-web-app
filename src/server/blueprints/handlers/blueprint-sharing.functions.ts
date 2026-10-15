import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import { requireSessionMiddleware } from '@/lib/auth.middleware'
import { transportInput } from '@/lib/input-validation'
import { runServerEffect } from '@/server/effect'
import {
  BlueprintShareCreateInputSchema,
  BlueprintShareListInputSchema,
  BlueprintShareRevokeInputSchema,
} from '@/contracts/blueprint-sharing.contracts'
import * as workflows from '../workflows/blueprint-sharing.workflows.live'

function privateResponse() {
  setResponseHeader('Cache-Control', 'private, no-store')
  setResponseHeader('Referrer-Policy', 'no-referrer')
  setResponseHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')
}
export const listBlueprintShareLinks = createServerFn({ method: 'GET' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(BlueprintShareListInputSchema))
  .handler(({ context, data }) => {
    privateResponse()
    return runServerEffect(
      workflows.listBlueprintShareLinks(context.user.id, data).pipe(Effect.provide(PgClientLive)),
      { operation: 'blueprint.sharing.list' }
    )
  })
export const createBlueprintShareLink = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(BlueprintShareCreateInputSchema))
  .handler(({ context, data }) => {
    privateResponse()
    return runServerEffect(
      workflows.createBlueprintShareLink(context.user.id, data).pipe(Effect.provide(PgClientLive)),
      { operation: 'blueprint.sharing.create' }
    )
  })
export const revokeBlueprintShareLink = createServerFn({ method: 'POST' })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(BlueprintShareRevokeInputSchema))
  .handler(({ context, data }) => {
    privateResponse()
    return runServerEffect(
      workflows.revokeBlueprintShareLink(context.user.id, data).pipe(Effect.provide(PgClientLive)),
      { operation: 'blueprint.sharing.revoke' }
    )
  })
// POST keeps the bearer token out of generated server-function query URLs.
export const resolveBlueprintShareLink = createServerFn({ method: 'POST' })
  .validator((data: { token: string }) => data)
  .handler(({ data }) => {
    privateResponse()
    return runServerEffect(
      workflows.resolveBlueprintShareLink(data).pipe(Effect.provide(PgClientLive)),
      { operation: 'blueprint.sharing.resolve' }
    )
  })
