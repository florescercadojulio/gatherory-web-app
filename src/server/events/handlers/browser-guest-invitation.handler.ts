import { PgClientLive } from '@/db'
import { transportInput } from '@/lib/input-validation'
import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import {
  BrowserGuestEventInputSchema,
  BrowserGuestInvitationStatusInputSchema,
  JoinBrowserGuestInvitationInputSchema,
  PrepareBrowserGuestSessionInputSchema,
  RespondAsBrowserGuestInputSchema,
} from '../contracts/browser-guest.contracts'
import { ForbiddenError, runServerEffect, ServerOperationError } from '@/server/effect'
import { validateInput } from '@/server/validation'
import {
  endBrowserGuestSessionIdentity,
  isAllowedBrowserGuestPost,
  prepareBrowserGuestSessionIdentity,
  readBrowserGuestSessionIdentity,
} from './browser-guest-session.adapter'
import {
  getBrowserGuestEventWorkflow,
  getBrowserGuestInvitationStatusWorkflow,
  joinBrowserGuestInvitationWorkflow,
  respondAsBrowserGuestWorkflow,
} from '../workflows/browser-guest-invitation.workflows.live'

function rejectedPost() {
  return new ForbiddenError({
    category: 'authorization',
    code: 'BROWSER_GUEST_REQUEST_REJECTED',
    userMessageKey: 'serverErrors.AUTHORIZATION',
  })
}

function guestSessionRequired() {
  return new ForbiddenError({
    category: 'authorization',
    code: 'BROWSER_GUEST_SESSION_REQUIRED',
    userMessageKey: 'serverErrors.BROWSER_GUEST_SESSION_REQUIRED',
  })
}

export const getBrowserGuestInvitationStatus = createServerFn({ method: 'GET' })
  .validator(transportInput(BrowserGuestInvitationStatusInputSchema))
  .handler(async ({ data }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    const identity = await readBrowserGuestSessionIdentity()
    return runServerEffect(
      validateInput(BrowserGuestInvitationStatusInputSchema, data).pipe(
        Effect.flatMap((input) =>
          getBrowserGuestInvitationStatusWorkflow({
            ...input,
            identity: identity ?? undefined,
          }).pipe(Effect.provide(PgClientLive))
        )
      ),
      { operation: 'browser_guest.invitation.status' }
    )
  })

export const prepareBrowserGuestSession = createServerFn({ method: 'POST' })
  .validator(transportInput(PrepareBrowserGuestSessionInputSchema))
  .handler(async ({ data }) => {
    if (!isAllowedBrowserGuestPost()) return runServerEffect(Effect.fail(rejectedPost()))
    return runServerEffect(
      Effect.gen(function* () {
        yield* validateInput(PrepareBrowserGuestSessionInputSchema, data)
        yield* Effect.tryPromise({
          try: prepareBrowserGuestSessionIdentity,
          catch: () =>
            new ServerOperationError({
              category: 'system',
              code: 'BROWSER_GUEST_SESSION_FAILED',
              userMessageKey: 'serverErrors.SYSTEM',
            }),
        })
        return { prepared: true as const }
      }),
      { operation: 'browser_guest.session.prepare' }
    )
  })

export const joinBrowserGuestInvitation = createServerFn({ method: 'POST' })
  .validator(transportInput(JoinBrowserGuestInvitationInputSchema))
  .handler(async ({ data }) => {
    if (!isAllowedBrowserGuestPost()) return runServerEffect(Effect.fail(rejectedPost()))
    const identity = await readBrowserGuestSessionIdentity()
    if (!identity) return runServerEffect(Effect.fail(guestSessionRequired()))
    return runServerEffect(
      validateInput(JoinBrowserGuestInvitationInputSchema, data).pipe(
        Effect.flatMap((input) =>
          joinBrowserGuestInvitationWorkflow({ ...input, identity }).pipe(
            Effect.provide(PgClientLive)
          )
        )
      ),
      { operation: 'browser_guest.invitation.join' }
    )
  })

export const respondAsBrowserGuest = createServerFn({ method: 'POST' })
  .validator(transportInput(RespondAsBrowserGuestInputSchema))
  .handler(async ({ data }) => {
    if (!isAllowedBrowserGuestPost()) return runServerEffect(Effect.fail(rejectedPost()))
    const identity = await readBrowserGuestSessionIdentity()
    if (!identity) return runServerEffect(Effect.fail(guestSessionRequired()))
    return runServerEffect(
      validateInput(RespondAsBrowserGuestInputSchema, data).pipe(
        Effect.flatMap((input) =>
          respondAsBrowserGuestWorkflow({ ...input, identity }).pipe(Effect.provide(PgClientLive))
        )
      ),
      { operation: 'browser_guest.event.respond' }
    )
  })

export const getBrowserGuestEvent = createServerFn({ method: 'GET' })
  .validator(transportInput(BrowserGuestEventInputSchema))
  .handler(async ({ data }) => {
    setResponseHeader('Cache-Control', 'private, no-store')
    const identity = await readBrowserGuestSessionIdentity()
    return runServerEffect(
      validateInput(BrowserGuestEventInputSchema, data).pipe(
        Effect.flatMap((input) =>
          identity
            ? getBrowserGuestEventWorkflow({ ...input, identity }).pipe(
                Effect.provide(PgClientLive)
              )
            : Effect.succeed({ event: null })
        )
      ),
      { operation: 'browser_guest.event.read' }
    )
  })

export const endBrowserGuestSession = createServerFn({ method: 'POST' })
  .validator(transportInput(PrepareBrowserGuestSessionInputSchema))
  .handler(async ({ data }) => {
    if (!isAllowedBrowserGuestPost()) return runServerEffect(Effect.fail(rejectedPost()))
    return runServerEffect(
      validateInput(PrepareBrowserGuestSessionInputSchema, data).pipe(
        Effect.flatMap(() =>
          Effect.tryPromise({
            try: endBrowserGuestSessionIdentity,
            catch: () =>
              new ServerOperationError({
                category: 'system',
                code: 'BROWSER_GUEST_SESSION_END_FAILED',
                userMessageKey: 'serverErrors.SYSTEM',
              }),
          }).pipe(Effect.as({ ended: true as const }))
        )
      ),
      { operation: 'browser_guest.session.end' }
    )
  })
