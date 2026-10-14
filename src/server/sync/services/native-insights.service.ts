import { Context, type Effect } from 'effect'

import type { DomainError } from '@/lib/domain-errors'
import type { NativeWorkspaceInsightsResult } from '../contracts/native-insights.contract'

export type NativeInsightsServiceShape = {
  readonly listForUser: (
    userId: string
  ) => Effect.Effect<NativeWorkspaceInsightsResult, DomainError>
}

export class NativeInsightsService extends Context.Service<
  NativeInsightsService,
  NativeInsightsServiceShape
>()('NativeInsightsService') {}
