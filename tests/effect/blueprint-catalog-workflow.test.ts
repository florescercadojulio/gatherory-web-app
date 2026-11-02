import { expect, it } from '@effect/vitest'
import { Context, Effect, Layer } from 'effect'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'
import { BlueprintRepo } from '@/server/blueprints/contracts/blueprint-runtime.contracts'
import { BlueprintDiscoveryActionsRepo } from '@/server/blueprints/repos/blueprint-discovery-actions.repo'
import { blueprintCatalogPageWorkflow } from '@/server/blueprints/workflows/blueprint-catalog.workflow'

const actorId = 'catalog-actor'
const catalogEntries = ['a', 'b', 'c'].map((catalogKey) => {
  const entry = structuredClone(weddingBlueprintV1)
  entry.catalogKey = catalogKey
  entry.definition.blueprint.id = catalogKey
  return entry
})

function layers() {
  const catalogRepo = {
    catalog: () => Effect.succeed(catalogEntries),
  } as unknown as Context.Service.Shape<typeof BlueprintRepo>
  const discoveryRepo = {
    getPreferenceStates: () => Effect.succeed({}),
    issueExposures: () => Effect.succeed([]),
  } as unknown as Context.Service.Shape<typeof BlueprintDiscoveryActionsRepo>
  return Layer.mergeAll(
    Layer.succeed(BlueprintRepo, catalogRepo),
    Layer.succeed(BlueprintDiscoveryActionsRepo, discoveryRepo)
  )
}

it.effect('catalog workflow maps malformed cursors to validation errors', () =>
  Effect.gen(function* () {
    const result = yield* Effect.flip(
      blueprintCatalogPageWorkflow(actorId, { limit: 1, q: '', cursor: 'invalid' }).pipe(
        Effect.provide(layers())
      )
    )
    expect(result).toMatchObject({ code: 'BLUEPRINT_CATALOG_CURSOR_INVALID' })
  })
)

it.effect('catalog workflow maps stale cursors to conflict errors', () =>
  Effect.gen(function* () {
    const layer = layers()
    const first = yield* blueprintCatalogPageWorkflow(actorId, { limit: 1, q: '' }).pipe(
      Effect.provide(layer)
    )
    expect(first.nextCursor).toBeDefined()
    const result = yield* Effect.flip(
      blueprintCatalogPageWorkflow('another-actor', {
        limit: 1,
        q: '',
        cursor: first.nextCursor!,
      }).pipe(Effect.provide(layer))
    )
    expect(result).toMatchObject({ code: 'BLUEPRINT_CATALOG_CURSOR_STALE' })
  })
)
