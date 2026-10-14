/** Compatibility barrel for legacy persistence callers. New domain code imports the contract or live layer directly. */
export * from './event.repo.contract'
export {
  acceptEventInvitation,
  createEventInvitation,
  createEventWithParticipants,
  getEventParticipant,
  getInvitationDetails,
  getInvitationPreviewDetails,
  getEventParentId,
  hasWorkspaceMembership,
  listVisibleMainEvents,
} from './event.repo.persistence'
