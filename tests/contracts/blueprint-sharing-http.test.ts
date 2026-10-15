import { beforeEach, expect, test, vi } from 'vitest'
import { Effect, Layer } from 'effect'
import { EntityNotFoundError } from '@/lib/domain-errors'
import { BlueprintSharingRepo } from '@/server/blueprints/repos/blueprint-sharing.repo'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'

const calls = vi.hoisted(() => ({ resolve: vi.fn() }))
vi.mock('@/db', () => ({ PgClientLive: Layer.empty }))
vi.mock('@/server/blueprints/repos/blueprint-sharing.repo.live', () => ({
  BlueprintSharingRepoLive: Layer.succeed(BlueprintSharingRepo, {
    resolve: calls.resolve,
    list: () => Effect.die('Unexpected list'),
    create: () => Effect.die('Unexpected create'),
    revoke: () => Effect.die('Unexpected revoke'),
  }),
}))
const { handleBlueprintShareRequest } =
  await import('@/server/blueprints/handlers/blueprint-sharing.handler')
const token = 'a'.repeat(64)
beforeEach(() => vi.clearAllMocks())

test('anonymous preview returns only published content and never source/ownership or credential metadata', async () => {
  calls.resolve.mockReturnValue(
    Effect.succeed({
      ...weddingBlueprintV1,
      id: crypto.randomUUID(),
      description: 'Reusable suggestions',
      source: { eventId: crypto.randomUUID(), privateNotes: 'private' },
      organizationId: 'private-owner',
      tokenHash: 'secret',
    })
  )
  const response = await handleBlueprintShareRequest(
    new Request(`https://app.example/api/blueprints/shared/${token}`),
    token
  )
  expect(response.status).toBe(200)
  const body = await response.json()
  expect(Object.keys(body).sort()).toEqual([
    'catalogKey',
    'contentHash',
    'definition',
    'discovery',
    'revision',
  ])
  expect(body.definition).toEqual(weddingBlueprintV1.definition)
  expect(body.discovery.summary).toBe('Reusable suggestions')
  expect(JSON.stringify(body)).not.toContain('private-owner')
  expect(response.headers.get('Cache-Control')).toContain('no-store')
  expect(response.headers.get('Referrer-Policy')).toBe('no-referrer')
  expect(response.headers.get('X-Robots-Tag')).toContain('noindex')
})

test('malformed and revoked links return the same unavailable code without disclosing content', async () => {
  calls.resolve.mockReturnValue(
    Effect.fail(
      new EntityNotFoundError({
        category: 'not_found',
        code: 'BLUEPRINT_LINK_UNAVAILABLE',
        userMessageKey: 'serverErrors.NOT_FOUND',
      })
    )
  )
  for (const candidate of ['bad', token]) {
    const response = await handleBlueprintShareRequest(
      new Request('https://app.example/api/blueprints/shared/hidden'),
      candidate
    )
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.error).toBe('BLUEPRINT_LINK_UNAVAILABLE')
    expect(body).not.toHaveProperty('definition')
    expect(JSON.stringify(body)).not.toContain(token)
  }
  expect(calls.resolve).toHaveBeenCalledTimes(1)
})
