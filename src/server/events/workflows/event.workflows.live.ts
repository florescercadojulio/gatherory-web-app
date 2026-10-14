import { Effect } from 'effect'
import { EventDomainLive } from '../event.layers.live'
import { acceptEventInvitationWorkflow as acceptEventInvitationWorkflowProgram } from './accept-event-invitation.workflow'
import { createEventWorkflow as createEventWorkflowProgram } from './create-event.workflow'
import { getEventInvitationWorkflow as getEventInvitationWorkflowProgram } from './get-event-invitation.workflow'
import { inviteEventParticipantWorkflow as inviteEventParticipantWorkflowProgram } from './invite-event-participant.workflow'
import { listEventsWorkflow as listEventsWorkflowProgram } from './list-events.workflow'

/** Production bindings. Use the individual workflow modules to substitute services in tests. */
export const acceptEventInvitationWorkflow = (
  ...args: Parameters<typeof acceptEventInvitationWorkflowProgram>
) => acceptEventInvitationWorkflowProgram(...args).pipe(Effect.provide(EventDomainLive))

export const createEventWorkflow = (...args: Parameters<typeof createEventWorkflowProgram>) =>
  createEventWorkflowProgram(...args).pipe(Effect.provide(EventDomainLive))

export const getEventInvitationWorkflow = (
  ...args: Parameters<typeof getEventInvitationWorkflowProgram>
) => getEventInvitationWorkflowProgram(...args).pipe(Effect.provide(EventDomainLive))

export const inviteEventParticipantWorkflow = (
  ...args: Parameters<typeof inviteEventParticipantWorkflowProgram>
) => inviteEventParticipantWorkflowProgram(...args).pipe(Effect.provide(EventDomainLive))

export const listEventsWorkflow = (...args: Parameters<typeof listEventsWorkflowProgram>) =>
  listEventsWorkflowProgram(...args).pipe(Effect.provide(EventDomainLive))
