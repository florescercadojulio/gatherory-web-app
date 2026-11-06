import { Effect } from 'effect'
import { EventGuestDomainLive } from '../event-guest.layers.live'
import { getAccountInvitedEventWorkflow as getAccountInvitedEventWorkflowProgram } from './account-invited-event.workflow'

export const getAccountInvitedEventWorkflow = (
  ...args: Parameters<typeof getAccountInvitedEventWorkflowProgram>
) => getAccountInvitedEventWorkflowProgram(...args).pipe(Effect.provide(EventGuestDomainLive))
