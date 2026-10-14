import { Effect } from 'effect'
import { ModerationService } from '../services/moderation.service'

export const reportImagePreviewWorkflow = (userId: string, reportId: string) =>
  Effect.gen(function* () {
    const moderation = yield* ModerationService
    return yield* moderation.reportImagePreview(userId, reportId)
  })
