import { expect, it } from '@effect/vitest'
import { Cause, Effect, Layer } from 'effect'
import { vi } from 'vitest'
import { PgClient } from '@effect/sql-pg/PgClient'
import { ExternalServiceError, ForbiddenError } from '@/lib/domain-errors'
import { ModerationMediaConnector } from '@/server/moderation/connectors/moderation-media.con'
import { ModerationRepo } from '@/server/moderation/repos/moderation.repo'
import { ModerationServiceLive } from '@/server/moderation/services/moderation.service.live'
import { UserBlockRepo } from '@/server/moderation/repos/user-block.repo'
import { reportImagePreview } from '@/server/moderation/moderation.repo'
import { reportImagePreviewWorkflow } from '@/server/moderation/workflows/report-image-preview.workflow'

vi.mock('@/server/moderation/repos/moderation.repo.live', () => ({
  hideImage: vi.fn(),
  hiddenImageIDs: vi.fn(),
  listAbuseReports: vi.fn(),
  reportImage: vi.fn(),
  reportImagePreviewAsset: vi.fn(),
  requireModerator: vi.fn(),
  reviewAbuseReport: vi.fn(),
}))

vi.mock('@/server/media/repos/media.repo.live', async () => {
  const { Layer } = await import('effect')
  const { MediaRepo } = await import('@/server/media/repos/media.repo.contract')
  return {
    MediaRepoLive: Layer.mock(MediaRepo, {}),
  }
})

vi.mock('@/server/moderation/moderation.layers.live', async () => {
  const { Effect, Layer } = await import('effect')
  const { ModerationService } = await import('@/server/moderation/services/moderation.service')
  return {
    ModerationServerLive: Layer.mock(ModerationService, {
      reportImagePreview: (userId, reportId) => Effect.succeed({ url: `${userId}/${reportId}` }),
    }),
  }
})

const unusedBlocks = {
  blockedAuthorPredicate: () => {
    throw new Error('Unexpected blocked-author predicate use in test')
  },
}

it.effect('moderator authorization completes before evidence signing begins', () => {
  let signCalls = 0
  const failure = new ForbiddenError({
    category: 'authorization',
    code: 'MODERATOR_REQUIRED',
    userMessageKey: 'serverErrors.MODERATOR_REQUIRED',
  })
  const dependencies = Layer.mergeAll(
    Layer.mock(ModerationRepo, {
      reportImagePreviewAsset: () => Effect.fail(failure),
    }),
    Layer.mock(UserBlockRepo, unusedBlocks),
    Layer.mock(ModerationMediaConnector, {
      createEvidenceReadUrl: () =>
        Effect.sync(() => {
          signCalls += 1
          return 'https://signed.example/evidence'
        }),
    })
  )

  return Effect.gen(function* () {
    const exit = yield* Effect.exit(
      reportImagePreviewWorkflow('not-a-moderator', 'report-1').pipe(
        Effect.provide(ModerationServiceLive.pipe(Layer.provide(dependencies)))
      )
    )
    expect(exit._tag).toBe('Failure')
    if (exit._tag === 'Failure') {
      expect(
        exit.cause.reasons.some((reason) => Cause.isFailReason(reason) && reason.error === failure)
      ).toBeTruthy()
    }
    expect(signCalls).toBe(0)
  })
})

it.effect('preview signing failures remain typed service failures', () => {
  const failure = new ExternalServiceError({
    category: 'external',
    code: 'MEDIA_OPERATION_FAILED',
    userMessageKey: 'serverErrors.MEDIA_OPERATION_FAILED',
  })
  const dependencies = Layer.mergeAll(
    Layer.mock(ModerationRepo, {
      reportImagePreviewAsset: () => Effect.succeed({ bucket: 'private', key: 'image.webp' }),
    }),
    Layer.mock(UserBlockRepo, unusedBlocks),
    Layer.mock(ModerationMediaConnector, {
      createEvidenceReadUrl: () => Effect.fail(failure),
    })
  )

  return Effect.gen(function* () {
    const exit = yield* Effect.exit(
      reportImagePreviewWorkflow('moderator', 'report-1').pipe(
        Effect.provide(ModerationServiceLive.pipe(Layer.provide(dependencies)))
      )
    )
    expect(exit._tag).toBe('Failure')
    if (exit._tag === 'Failure') {
      expect(
        exit.cause.reasons.some((reason) => Cause.isFailReason(reason) && reason.error === failure)
      ).toBeTruthy()
    }
  })
})

it.effect('legacy repository preview provides the moderation server layer', () => {
  return reportImagePreview('moderator-2', 'report-2').pipe(
    // The mocked production layer above never uses SQL. Keep the compatibility
    // function's PgClient requirement without constructing a real connection.
    Effect.provideService(PgClient, {} as never),
    Effect.tap((result) =>
      Effect.sync(() => expect(result).toEqual({ url: 'moderator-2/report-2' }))
    )
  )
})
