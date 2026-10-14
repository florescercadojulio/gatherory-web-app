import { Context, Effect } from 'effect'
import type {
  blockedAuthorPredicate,
  blockPerson,
  listBlockedPeople,
  requireUnblockedInvitation,
  unblockPerson,
} from './user-block.repo.live'

type RepoMethod<T> = T extends (
  ...args: infer Args
) => Effect.Effect<infer Value, infer Error, unknown>
  ? (...args: Args) => Effect.Effect<Value, Error>
  : never

export type UserBlockRepoShape = {
  readonly blockedAuthorPredicate: typeof blockedAuthorPredicate
  readonly listBlockedPeople: RepoMethod<typeof listBlockedPeople>
  readonly blockPerson: RepoMethod<typeof blockPerson>
  readonly unblockPerson: RepoMethod<typeof unblockPerson>
  readonly requireUnblockedInvitation: RepoMethod<typeof requireUnblockedInvitation>
}

export class UserBlockRepo extends Context.Service<UserBlockRepo, UserBlockRepoShape>()(
  'UserBlockRepo'
) {}
