/** Compatibility exports; new code should depend on UserBlockRepo. */
export {
  blockedAuthorPredicate,
  blockPerson,
  listBlockedPeople,
  requireUnblockedInvitation,
  unblockPerson,
} from './repos/user-block.repo.live'
