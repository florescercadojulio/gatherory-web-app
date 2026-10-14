import { Effect, Layer } from 'effect'
import { EventDomainLive } from '../event.layers.live'
import { EventSharingDomainLive } from '../event-sharing.layers.live'
import { EventGuestDomainLive } from '../event-guest.layers.live'
import { acceptEventInvitationTokenWorkflow as acceptEventInvitationTokenWorkflowProgram } from './accept-event-invitation-token.workflow'
import { previewEventInvitationWorkflow as previewEventInvitationWorkflowProgram } from './preview-event-invitation.workflow'

const EventInvitationAcceptanceLive = Layer.mergeAll(EventDomainLive, EventSharingDomainLive)
const EventInvitationPreviewLive = Layer.mergeAll(
  EventInvitationAcceptanceLive,
  EventGuestDomainLive
)

/** Production bindings. Use the individual workflow modules to substitute services in tests. */
export const acceptEventInvitationTokenWorkflow = (
  ...args: Parameters<typeof acceptEventInvitationTokenWorkflowProgram>
) =>
  acceptEventInvitationTokenWorkflowProgram(...args).pipe(
    Effect.provide(EventInvitationAcceptanceLive)
  )

export const previewEventInvitationWorkflow = (
  ...args: Parameters<typeof previewEventInvitationWorkflowProgram>
) => previewEventInvitationWorkflowProgram(...args).pipe(Effect.provide(EventInvitationPreviewLive))
