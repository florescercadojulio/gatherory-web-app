import { Effect } from 'effect'
import { EventSharingDomainLive } from '../event-sharing.layers.live'
import { acceptEventShareLinkWorkflow as acceptEventShareLinkWorkflowProgram } from './accept-event-share-link.workflow'
import { createEventShareLinkWorkflow as createEventShareLinkWorkflowProgram } from './create-event-share-link.workflow'
import { getShareLinkEventIdWorkflow as getShareLinkEventIdWorkflowProgram } from './get-share-link-event-id.workflow'
import { listEventJoinRequestsWorkflow as listEventJoinRequestsWorkflowProgram } from './list-event-join-requests.workflow'
import { previewEventShareLinkWorkflow as previewEventShareLinkWorkflowProgram } from './preview-event-share-link.workflow'
import { reviewEventJoinRequestWorkflow as reviewEventJoinRequestWorkflowProgram } from './review-event-join-request.workflow'
import { revokeEventShareLinkWorkflow as revokeEventShareLinkWorkflowProgram } from './revoke-event-share-link.workflow'

/** Production bindings. Use the individual workflow modules to substitute services in tests. */
export const acceptEventShareLinkWorkflow = (
  ...args: Parameters<typeof acceptEventShareLinkWorkflowProgram>
) => acceptEventShareLinkWorkflowProgram(...args).pipe(Effect.provide(EventSharingDomainLive))

export const createEventShareLinkWorkflow = (
  ...args: Parameters<typeof createEventShareLinkWorkflowProgram>
) => createEventShareLinkWorkflowProgram(...args).pipe(Effect.provide(EventSharingDomainLive))

export const getShareLinkEventIdWorkflow = (
  ...args: Parameters<typeof getShareLinkEventIdWorkflowProgram>
) => getShareLinkEventIdWorkflowProgram(...args).pipe(Effect.provide(EventSharingDomainLive))

export const listEventJoinRequestsWorkflow = (
  ...args: Parameters<typeof listEventJoinRequestsWorkflowProgram>
) => listEventJoinRequestsWorkflowProgram(...args).pipe(Effect.provide(EventSharingDomainLive))

export const previewEventShareLinkWorkflow = (
  ...args: Parameters<typeof previewEventShareLinkWorkflowProgram>
) => previewEventShareLinkWorkflowProgram(...args).pipe(Effect.provide(EventSharingDomainLive))

export const reviewEventJoinRequestWorkflow = (
  ...args: Parameters<typeof reviewEventJoinRequestWorkflowProgram>
) => reviewEventJoinRequestWorkflowProgram(...args).pipe(Effect.provide(EventSharingDomainLive))

export const revokeEventShareLinkWorkflow = (
  ...args: Parameters<typeof revokeEventShareLinkWorkflowProgram>
) => revokeEventShareLinkWorkflowProgram(...args).pipe(Effect.provide(EventSharingDomainLive))
