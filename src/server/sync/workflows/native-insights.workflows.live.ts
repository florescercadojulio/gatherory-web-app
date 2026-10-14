import { Effect } from 'effect'
import { NativeInsightsServerLive } from '../native-insights.layers.live'
import { listNativeWorkspaceInsightsWorkflow as listProgram } from './native-workspace-insights.workflow'

export const listNativeWorkspaceInsightsWorkflow = (...args: Parameters<typeof listProgram>) =>
  listProgram(...args).pipe(Effect.provide(NativeInsightsServerLive))
