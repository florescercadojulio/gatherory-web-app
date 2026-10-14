import { Effect, Layer } from 'effect'

import { DB } from '@/db'
import { PersistenceError, isDomainError } from '@/lib/domain-errors'
import { queryNativeWorkspaceInsights } from './native-insights.repo'
import { NativeInsightsRepo } from './native-insights.repo.api'

export const NativeInsightsRepoLive = Layer.effect(
  NativeInsightsRepo,
  Effect.gen(function* () {
    const db = yield* DB
    return {
      listForUser: (userId: string) =>
        queryNativeWorkspaceInsights(db, userId).pipe(
          Effect.mapError((cause) =>
            isDomainError(cause)
              ? cause
              : new PersistenceError({
                  category: 'system',
                  code: 'NATIVE_WORKSPACE_INSIGHTS_FAILED',
                  userMessageKey: 'serverErrors.SYSTEM',
                  cause,
                })
          )
        ),
    }
  })
)
