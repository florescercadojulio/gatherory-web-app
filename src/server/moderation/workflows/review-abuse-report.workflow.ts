import { Effect } from 'effect'
import type { ReviewReportInput } from '../contracts'
import type { z } from 'zod'
import { ModerationService } from '../services/moderation.service'

export const reviewAbuseReportWorkflow = (
  userId: string,
  input: z.infer<typeof ReviewReportInput>
) =>
  Effect.gen(function* () {
    const moderation = yield* ModerationService
    return yield* moderation.reviewAbuseReport(userId, input)
  })
