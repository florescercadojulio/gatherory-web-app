import { expect, it } from '@effect/vitest'
import { Cause, Effect, Layer } from 'effect'
import { ForbiddenError } from '@/server/effect'
import { ModerationMediaConnector } from '@/server/moderation/connectors/moderation-media.con'
import { ModerationRepo } from '@/server/moderation/repos/moderation.repo'
import { UserBlockRepo } from '@/server/moderation/repos/user-block.repo'
import { ModerationServiceLive } from '@/server/moderation/services/moderation.service.live'
import {
  reportImagePreviewWorkflow,
  requireModeratorWorkflow,
} from '@/server/moderation/workflows/moderation.workflow'

it.effect('real moderation service preserves moderator authorization failures', () => {
  const failure = new ForbiddenError({
    category: 'authorization',
    code: 'MODERATOR_REQUIRED',
    userMessageKey: 'serverErrors.MODERATOR_REQUIRED',
  })
  const dependencies = Layer.mergeAll(
    Layer.mock(ModerationRepo, {
      requireModerator: (userId) =>
        Effect.gen(function* () {
          expect(userId).toBe('moderator-candidate')
          return yield* Effect.fail(failure)
        }),
    }),
    Layer.mock(UserBlockRepo, {
      blockedAuthorPredicate: () => {
        throw new Error('Unexpected blocked-author predicate use in test')
      },
    }),
    Layer.mock(ModerationMediaConnector, {})
  )
  const service = ModerationServiceLive.pipe(Layer.provide(dependencies))

  return Effect.gen(function* () {
    const exit = yield* Effect.exit(
      requireModeratorWorkflow('moderator-candidate').pipe(Effect.provide(service))
    )
    expect(exit._tag).toBe('Failure')
    if (exit._tag === 'Failure') {
      expect(
        exit.cause.reasons.some((reason) => Cause.isFailReason(reason) && reason.error === failure)
      ).toBeTruthy()
    }
  })
})

it.effect('real moderation service obtains a signed preview URL through its connector', () => {
  const dependencies = Layer.mergeAll(
    Layer.mock(ModerationRepo, {
      reportImagePreviewAsset: (actorUserId, reportId) =>
        Effect.sync(() => {
          expect(actorUserId).toBe('moderator-1')
          expect(reportId).toBe('report-2')
          return { bucket: 'private-evidence', key: 'evidence/image.webp' }
        }),
    }),
    Layer.mock(UserBlockRepo, {
      blockedAuthorPredicate: () => {
        throw new Error('Unexpected blocked-author predicate use in test')
      },
    }),
    Layer.mock(ModerationMediaConnector, {
      createEvidenceReadUrl: (input) =>
        Effect.sync(() => {
          expect(input).toEqual({
            bucket: 'private-evidence',
            key: 'evidence/image.webp',
            expiresInSeconds: 60,
          })
          return 'https://signed.example/evidence'
        }),
    })
  )
  const service = ModerationServiceLive.pipe(Layer.provide(dependencies))

  return reportImagePreviewWorkflow('moderator-1', 'report-2').pipe(
    Effect.provide(service),
    Effect.tap((result) =>
      Effect.sync(() => expect(result).toEqual({ url: 'https://signed.example/evidence' }))
    )
  )
})
