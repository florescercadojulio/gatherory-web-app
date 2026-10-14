import { Effect } from 'effect'

import { NativeInsightsService } from '../services/native-insights.service'

export function listNativeWorkspaceInsightsWorkflow(userId: string) {
  return Effect.gen(function* () {
    const service = yield* NativeInsightsService
    return yield* service.listForUser(userId)
  })
}
