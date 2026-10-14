import { Effect, Layer } from 'effect'
import { ModerationMediaConnector } from '../connectors/moderation-media.con'
import { ModerationRepo } from '../repos/moderation.repo'
import { UserBlockRepo } from '../repos/user-block.repo'
import { ModerationService } from './moderation.service'

export const ModerationServiceLive = Layer.effect(
  ModerationService,
  Effect.gen(function* () {
    const moderation = yield* ModerationRepo
    const userBlocks = yield* UserBlockRepo
    const media = yield* ModerationMediaConnector

    return {
      requireModerator: moderation.requireModerator,
      hideImage: moderation.hideImage,
      hiddenImageIDs: moderation.hiddenImageIDs,
      reportImage: moderation.reportImage,
      listAbuseReports: moderation.listAbuseReports,
      reviewAbuseReport: moderation.reviewAbuseReport,
      listBlockedPeople: userBlocks.listBlockedPeople,
      blockPerson: userBlocks.blockPerson,
      unblockPerson: userBlocks.unblockPerson,
      reportImagePreview: (userId: string, reportId: string) =>
        moderation.reportImagePreviewAsset(userId, reportId).pipe(
          Effect.flatMap((asset) =>
            media.createEvidenceReadUrl({ ...asset, expiresInSeconds: 60 })
          ),
          Effect.map((url) => ({ url }))
        ),
    }
  })
)
