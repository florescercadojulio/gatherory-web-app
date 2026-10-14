import { Layer } from 'effect'
import { NativeInsightsRepoLive } from './repos/native-insights.repo.live'
import { NativeInsightsServiceLive } from './services/native-insights.service.live'

export const NativeInsightsServerLive = NativeInsightsServiceLive.pipe(
  Layer.provide(NativeInsightsRepoLive)
)
