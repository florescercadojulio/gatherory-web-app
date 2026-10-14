import { Context, Effect } from 'effect'
import type {
  hiddenImageIDs,
  hideImage,
  listAbuseReports,
  reportImage,
  reportImagePreviewAsset,
  requireModerator,
  reviewAbuseReport,
} from './moderation.repo.live'

type RepoMethod<T> = T extends (
  ...args: infer Args
) => Effect.Effect<infer Value, infer Error, unknown>
  ? (...args: Args) => Effect.Effect<Value, Error>
  : never

export type ModerationRepoShape = {
  readonly requireModerator: RepoMethod<typeof requireModerator>
  readonly hideImage: RepoMethod<typeof hideImage>
  readonly hiddenImageIDs: RepoMethod<typeof hiddenImageIDs>
  readonly reportImage: RepoMethod<typeof reportImage>
  readonly listAbuseReports: RepoMethod<typeof listAbuseReports>
  readonly reviewAbuseReport: RepoMethod<typeof reviewAbuseReport>
  readonly reportImagePreviewAsset: RepoMethod<typeof reportImagePreviewAsset>
}

export class ModerationRepo extends Context.Service<ModerationRepo, ModerationRepoShape>()(
  'ModerationRepo'
) {}
