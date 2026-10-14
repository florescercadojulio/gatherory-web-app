import { Context, Effect } from 'effect'
import type { ExternalServiceError } from '@/lib/domain-errors'
import type { ModerationRepoShape } from '../repos/moderation.repo'
import type { UserBlockRepoShape } from '../repos/user-block.repo'

type EffectResult<Method> = Method extends (
  ...args: infer _Args
) => Effect.Effect<infer Value, infer Error, infer Requirements>
  ? Effect.Effect<Value, Error, Requirements>
  : never

type ErrorOf<Method> = Method extends (
  ...args: infer _Args
) => Effect.Effect<unknown, infer Error, infer _Requirements>
  ? Error
  : never

export type ModerationServiceShape = Pick<
  ModerationRepoShape,
  | 'requireModerator'
  | 'hideImage'
  | 'hiddenImageIDs'
  | 'reportImage'
  | 'listAbuseReports'
  | 'reviewAbuseReport'
> &
  Pick<UserBlockRepoShape, 'listBlockedPeople' | 'blockPerson' | 'unblockPerson'> & {
    readonly reportImagePreview: (
      userId: string,
      reportId: string
    ) => Effect.Effect<
      { url: string },
      ErrorOf<ModerationRepoShape['reportImagePreviewAsset']> | ExternalServiceError
    >
  }

export class ModerationService extends Context.Service<ModerationService, ModerationServiceShape>()(
  'ModerationService'
) {}

export type ModerationOperationResult<Method> = EffectResult<Method>
