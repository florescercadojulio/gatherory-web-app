import { Effect, Layer } from 'effect'
import { expect, it } from '@effect/vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { NativeSyncRepo, type NativeSyncRepoShape } from '@/server/sync/repos/native-sync.repo'
import { NativeInsightsRepo } from '@/server/sync/repos/native-insights.repo.api'
import { NativeInsightsService } from '@/server/sync/services/native-insights.service'
import { NativeInsightsServiceLive } from '@/server/sync/services/native-insights.service.live'
import { bootstrapNativeSync } from '@/server/sync/workflows/native-sync-bootstrap.workflow'
import { pullNativeSync } from '@/server/sync/workflows/native-sync-pull.workflow'
import { pushNativeSync } from '@/server/sync/workflows/native-sync-push.workflow'

it.effect('injects NativeSyncRepo into bootstrap, push, and pull workflows', () => {
  const calls: string[] = []
  const repo: NativeSyncRepoShape = {
    applyMutations: ({ userId, mutations }) => {
      calls.push(`push:${userId}:${mutations.length}`)
      return Effect.succeed({
        results: mutations.map((mutation) => ({
          mutationID: mutation.id,
          disposition: 'applied',
          serverVersion: 1,
          failureCode: null,
        })),
      })
    },
    pullChanges: ({ userId, scopeId, after }) => {
      calls.push(`pull:${userId}:${scopeId}:${after}`)
      return Effect.succeed({ changes: [], nextCursor: String(after), hasMore: false })
    },
    listWorkspaceSnapshots: ({ userId }) => {
      calls.push(`bootstrap:${userId}`)
      return Effect.succeed({
        account: { hasCompletedOnboarding: true },
        snapshots: [],
        entities: [],
      })
    },
  }
  const repoLayer = Layer.succeed(NativeSyncRepo, repo)
  const mutation = {
    id: '00000000-0000-4000-8000-000000000001',
    scopeID: '00000000-0000-4000-8000-000000000002',
    payloadSchemaVersion: 1 as const,
    entityType: 'event' as const,
    entityID: '00000000-0000-4000-8000-000000000003',
    operation: 'update' as const,
    payload: '{}',
    createdAt: '2026-10-14T00:00:00Z',
    attemptCount: 0,
  }

  return Effect.gen(function* () {
    const [bootstrap, push, pull] = yield* Effect.all(
      [
        bootstrapNativeSync({ userId: 'user-1', supportsBlueprintGuides: true }),
        pushNativeSync({ userId: 'user-1', mutations: [mutation], supportsBlueprintGuides: true }),
        pullNativeSync({
          userId: 'user-1',
          scopeId: mutation.scopeID,
          after: 12,
          supportsBlueprintGuides: true,
        }),
      ],
      { concurrency: 'unbounded' }
    ).pipe(Effect.provide(repoLayer))

    expect(bootstrap.snapshots).toEqual([])
    expect(push.results[0]?.disposition).toBe('applied')
    if (!pull) throw new Error('Stubbed repository unexpectedly returned no page')
    expect(pull.nextCursor).toBe('12')
    expect(calls).toEqual([
      'bootstrap:user-1',
      'push:user-1:1',
      `pull:user-1:${mutation.scopeID}:12`,
    ])
  })
})

it.effect('composes the insights service from its repository service', () => {
  const calls: string[] = []
  const result = { workspaces: [], unavailableSnapshotCount: 0 }
  const repoLayer = Layer.succeed(NativeInsightsRepo, {
    listForUser: (userId: string) => {
      calls.push(userId)
      return Effect.succeed(result)
    },
  })
  const serviceLayer = NativeInsightsServiceLive.pipe(Layer.provide(repoLayer))

  return Effect.gen(function* () {
    const service = yield* NativeInsightsService
    const actual = yield* service.listForUser('user-2')

    expect(actual).toBe(result)
    expect(calls).toEqual(['user-2'])
  }).pipe(Effect.provide(serviceLayer))
})

it('keeps sync route and workflow modules on the transport and Effect boundaries', () => {
  const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')
  const routes = [
    'src/routes/api/sync/bootstrap.ts',
    'src/routes/api/sync/push.ts',
    'src/routes/api/sync/pull.ts',
  ]
  for (const path of routes) {
    const code = source(path)
    expect(code).toMatch(/runServerResponse\s*\(/)
    expect(code).not.toMatch(/tryServerOperation\s*\(/)
    expect(code).not.toMatch(/from ['"]@\/db(?:['"]|\/)/)
  }

  const workflows = [
    'src/server/sync/workflows/native-sync-bootstrap.workflow.ts',
    'src/server/sync/workflows/native-sync-push.workflow.ts',
    'src/server/sync/workflows/native-sync-pull.workflow.ts',
  ]
  for (const path of workflows) {
    const code = source(path)
    expect(code).not.toMatch(/Effect\.run/)
    expect(code).not.toMatch(/Effect\.tryPromise|tryServerOperation/)
    expect(code).not.toMatch(/\.live['"]|PgClientLive/)
  }

  const serviceLive = source('src/server/sync/services/native-insights.service.live.ts')
  expect(serviceLive).toMatch(/Layer\.effect\s*\(/)
  expect(serviceLive).toMatch(/yield\* NativeInsightsRepo/)
  for (const path of [
    'src/server/sync/contracts/native-sync.contracts.ts',
    'src/server/sync/contracts/native-insights.contract.ts',
  ]) {
    const code = source(path)
    expect(code).not.toMatch(/@\/db|process\.env/)
  }
})
