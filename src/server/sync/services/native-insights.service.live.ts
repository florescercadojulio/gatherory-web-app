import { Effect, Layer } from 'effect'

import { NativeInsightsRepo } from '../repos/native-insights.repo.api'
import { NativeInsightsService } from './native-insights.service'

export const NativeInsightsServiceLive = Layer.effect(
  NativeInsightsService,
  Effect.gen(function* () {
    const repo = yield* NativeInsightsRepo
    return { listForUser: repo.listForUser }
  })
)
