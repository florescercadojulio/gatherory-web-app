import { expect, it } from '@effect/vitest'
import { Context, Effect, Layer } from 'effect'
import { BlueprintDiscoveryActionsRepo } from '@/server/blueprints/repos/blueprint-discovery-actions.repo'
import { listBlueprintPreferences } from '@/server/blueprints/workflows/blueprint-discovery-actions.workflow'

it.effect('preference workflow keeps hidden labels private when the item is no longer public', () =>
  Effect.gen(function* () {
    const repo = {
      listPreferences: () =>
        Effect.succeed({
          items: [
            {
              catalogKey: 'withdrawn_private_key',
              revision: 3,
              contentHash: 'a'.repeat(64),
              liked: false,
              bookmarked: true,
              notInterested: false,
              likeRevision: null,
              likeContentHash: null,
              bookmarkRevision: 3,
              bookmarkContentHash: 'a'.repeat(64),
              notInterestedRevision: null,
              notInterestedContentHash: null,
            },
          ],
        }),
    } as unknown as Context.Service.Shape<typeof BlueprintDiscoveryActionsRepo>
    const result = yield* listBlueprintPreferences('actor', { limit: 50 }, []).pipe(
      Effect.provide(Layer.succeed(BlueprintDiscoveryActionsRepo, repo))
    )
    expect(result.items[0]).toMatchObject({
      catalogKey: 'withdrawn_private_key',
      bookmarkAvailability: 'unavailable',
      likeAvailability: 'unavailable',
      notInterestedAvailability: 'unavailable',
      bookmarked: true,
    })
    expect(result.items[0]).not.toHaveProperty('entry')
  })
)
