import { Effect } from 'effect'
import type { reportStatuses } from '../contracts/moderation.contracts'
import { ModerationService } from '../services/moderation.service'

export const listAbuseReportsWorkflow = (userId: string, status: (typeof reportStatuses)[number]) =>
  Effect.gen(function* () {
    const moderation = yield* ModerationService
    return yield* moderation.listAbuseReports(userId, status)
  })
