/** Compatibility exports for the original guest invitation repository API. */
export { guestEventInvitations, invitationCoverURL } from '../handlers/event-guest.adapter'
export {
  getInvitationCoverAsset,
  listGuestEventInvitationProjections,
  respondToEvent,
} from './guest-invitation.repo.persistence'
