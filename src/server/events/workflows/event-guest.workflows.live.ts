import { Effect } from 'effect'
import { EventGuestDomainLive } from '../event-guest.layers.live'
import { getInvitationCoverWorkflow as getInvitationCoverWorkflowProgram } from './get-invitation-cover.workflow'
import { leaveGuestEventWorkflow as leaveGuestEventWorkflowProgram } from './leave-guest-event.workflow'
import {
  listDeviceGuestEventInvitationsWorkflow as listDeviceGuestEventInvitationsWorkflowProgram,
  listGuestEventInvitationsWorkflow as listGuestEventInvitationsWorkflowProgram,
} from './list-guest-event-invitations.workflow'
import { respondToEventWorkflow as respondToEventWorkflowProgram } from './respond-to-event.workflow'

/** Production bindings. Use the individual workflow modules to substitute services in tests. */
export const getInvitationCoverWorkflow = (
  ...args: Parameters<typeof getInvitationCoverWorkflowProgram>
) => getInvitationCoverWorkflowProgram(...args).pipe(Effect.provide(EventGuestDomainLive))

export const leaveGuestEventWorkflow = (
  ...args: Parameters<typeof leaveGuestEventWorkflowProgram>
) => leaveGuestEventWorkflowProgram(...args).pipe(Effect.provide(EventGuestDomainLive))

export const listGuestEventInvitationsWorkflow = (
  ...args: Parameters<typeof listGuestEventInvitationsWorkflowProgram>
) => listGuestEventInvitationsWorkflowProgram(...args).pipe(Effect.provide(EventGuestDomainLive))

export const listDeviceGuestEventInvitationsWorkflow = (
  ...args: Parameters<typeof listDeviceGuestEventInvitationsWorkflowProgram>
) =>
  listDeviceGuestEventInvitationsWorkflowProgram(...args).pipe(Effect.provide(EventGuestDomainLive))

export const respondToEventWorkflow = (...args: Parameters<typeof respondToEventWorkflowProgram>) =>
  respondToEventWorkflowProgram(...args).pipe(Effect.provide(EventGuestDomainLive))
