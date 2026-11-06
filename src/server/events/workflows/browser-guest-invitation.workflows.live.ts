import { Effect } from 'effect'
import { BrowserGuestDomainLive } from '../event-browser-guest.layers.live'
import {
  getBrowserGuestEventWorkflow as getBrowserGuestEventWorkflowProgram,
  getBrowserGuestInvitationStatusWorkflow as getBrowserGuestInvitationStatusWorkflowProgram,
  joinBrowserGuestInvitationWorkflow as joinBrowserGuestInvitationWorkflowProgram,
  respondAsBrowserGuestWorkflow as respondAsBrowserGuestWorkflowProgram,
} from './browser-guest-invitation.workflow'

/** Production bindings retain PgClient as the only unresolved requirement. */
export const joinBrowserGuestInvitationWorkflow = (
  ...args: Parameters<typeof joinBrowserGuestInvitationWorkflowProgram>
) => joinBrowserGuestInvitationWorkflowProgram(...args).pipe(Effect.provide(BrowserGuestDomainLive))

export const respondAsBrowserGuestWorkflow = (
  ...args: Parameters<typeof respondAsBrowserGuestWorkflowProgram>
) => respondAsBrowserGuestWorkflowProgram(...args).pipe(Effect.provide(BrowserGuestDomainLive))

export const getBrowserGuestEventWorkflow = (
  ...args: Parameters<typeof getBrowserGuestEventWorkflowProgram>
) => getBrowserGuestEventWorkflowProgram(...args).pipe(Effect.provide(BrowserGuestDomainLive))

export const getBrowserGuestInvitationStatusWorkflow = (
  ...args: Parameters<typeof getBrowserGuestInvitationStatusWorkflowProgram>
) =>
  getBrowserGuestInvitationStatusWorkflowProgram(...args).pipe(
    Effect.provide(BrowserGuestDomainLive)
  )
