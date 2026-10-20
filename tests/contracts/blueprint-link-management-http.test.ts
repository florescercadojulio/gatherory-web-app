import { beforeEach, expect, test, vi } from 'vitest'
import { Effect, Layer } from 'effect'
import { ForbiddenError } from '@/lib/domain-errors'
import { BlueprintLinkManagementRepo } from '@/server/blueprints/repos/blueprint-link-management.repo'
import { BlueprintLinkManagementResponseSchema } from '@/contracts/blueprint-link-management.contracts'

const calls = vi.hoisted(() => ({ execute: vi.fn(), user: vi.fn() }))
vi.mock('@/db', () => ({ PgClientLive: Layer.empty }))
vi.mock('@/server/sync/handlers/native-sync-auth.handler', () => ({ nativeSyncUser: calls.user }))
vi.mock('@/server/blueprints/repos/blueprint-link-management.repo.live', () => ({
  BlueprintLinkManagementRepoLive: Layer.succeed(BlueprintLinkManagementRepo, {
    execute: calls.execute,
  }),
}))
const { handleBlueprintLinkManagementRequest } =
  await import('@/server/blueprints/handlers/blueprint-link-management.handler')
const eventId = '10000000-0000-4000-8000-000000000001'
const templateId = '20000000-0000-4000-8000-000000000001'
const linkId = '30000000-0000-4000-8000-000000000001'
const link = { id: linkId, revision: 2, createdAt: '2026-10-15T12:00:00.000Z', revokedAt: null }
const request = (body: unknown) =>
  new Request('https://app.example/api/blueprints/sharing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test' },
    body: JSON.stringify(body),
  })
beforeEach(() => {
  vi.clearAllMocks()
  calls.user.mockResolvedValue({ id: 'authenticated-owner' })
})

test('anonymous native management is denied before reading private state or mutating links', async () => {
  calls.user.mockResolvedValue(null)
  for (const action of ['templates', 'list', 'create', 'listing', 'revoke']) {
    const response = await handleBlueprintLinkManagementRequest(request({ action, eventId }))
    expect(response.status).toBe(401)
    expect((await response.json()).error).toBe('UNAUTHORIZED')
    expect(response.headers.get('Cache-Control')).toContain('no-store')
  }
  expect(calls.execute).not.toHaveBeenCalled()
})

test.each([
  [
    { action: 'templates', eventId },
    {
      templates: [
        {
          id: templateId,
          title: 'Cottage',
          publishedRevision: 2,
          listedRevision: null,
          creatorName: null,
          activeShareLinkCount: 0,
          retired: false,
        },
      ],
    },
  ],
  [{ action: 'list', eventId, templateId }, { links: [link] }],
  [
    { action: 'create', eventId, templateId, revision: 2 },
    { link, token: 'a'.repeat(64) },
  ],
  [{ action: 'listing', eventId, templateId, revision: 2 }, { listedRevision: 2 }],
  [{ action: 'listing', eventId, templateId, revision: null }, { listedRevision: null }],
  [{ action: 'revoke', eventId, templateId, linkId }, { revoked: true }],
])('serializes native command %j with explicit source scope', async (input, output) => {
  calls.execute.mockReturnValue(Effect.succeed(output))
  const response = await handleBlueprintLinkManagementRequest(request(input))
  expect(response.status).toBe(200)
  expect(calls.execute).toHaveBeenCalledWith('authenticated-owner', input)
  const body = await response.json()
  expect(body).toEqual(output)
  expect(BlueprintLinkManagementResponseSchema.safeParse(body).success).toBe(true)
  expect(response.headers.get('Cache-Control')).toContain('no-store')
  expect(response.headers.get('Referrer-Policy')).toBe('no-referrer')
  expect(response.headers.get('X-Robots-Tag')).toContain('noindex')
})

test('authorization failure never masquerades as an empty list or a successful revoke', async () => {
  calls.execute.mockReturnValue(
    Effect.fail(
      new ForbiddenError({
        category: 'authorization',
        code: 'BLUEPRINT_SHARING_FORBIDDEN',
        userMessageKey: 'serverErrors.AUTHORIZATION',
      })
    )
  )
  const response = await handleBlueprintLinkManagementRequest(
    request({ action: 'revoke', eventId, templateId, linkId })
  )
  expect(response.status).toBe(403)
  const body = await response.json()
  expect(body.error).toBe('BLUEPRINT_SHARING_FORBIDDEN')
  expect(body).not.toHaveProperty('revoked')
  expect(body).not.toHaveProperty('links')
})

test('malformed JSON returns a validation failure without invoking the repository', async () => {
  const response = await handleBlueprintLinkManagementRequest(
    new Request('https://app.example/api/blueprints/sharing', {
      method: 'POST',
      body: '{broken',
    })
  )
  expect(response.status).toBe(400)
  expect((await response.json()).error).toBe('INVALID_JSON')
  expect(calls.execute).not.toHaveBeenCalled()
})
