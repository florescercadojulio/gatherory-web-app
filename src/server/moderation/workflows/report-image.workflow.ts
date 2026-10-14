import { Effect } from 'effect'
import type { ReportImageInput } from '../contracts'
import type { z } from 'zod'
import { ModerationService } from '../services/moderation.service'

export const reportImageWorkflow = (userId: string, input: z.infer<typeof ReportImageInput>) =>
  Effect.gen(function* () {
    const moderation = yield* ModerationService
    return yield* moderation.reportImage(userId, input)
  })
