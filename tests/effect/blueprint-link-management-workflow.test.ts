import { expect, it } from '@effect/vitest'
import { Effect, Layer } from 'effect'
import { vi } from 'vitest'
import type { BlueprintLinkManagementInput } from '@/contracts/blueprint-link-management.contracts'
import { BlueprintLinkManagementRepo } from '@/server/blueprints/repos/blueprint-link-management.repo'
import { manageBlueprintLinksWorkflow } from '@/server/blueprints/workflows/blueprint-link-management.workflow'

const eventId = '10000000-0000-4000-8000-000000000001'
const templateId = '20000000-0000-4000-8000-000000000001'
for (const input of [
  { action: 'templates' },
  { action: 'templates', eventId, actorId: 'spoof' },
  { action: 'templates', eventId, activeOrganizationId: 'other' },
  { action: 'create', eventId, templateId, revision: 0 },
  { action: 'create', eventId, templateId, revision: 1.5 },
  { action: 'listing', eventId, templateId, revision: -1 },
  { action: 'listing', eventId, templateId, revision: 1.5 },
  { action: 'listing', eventId, templateId, revision: '1' },
  { action: 'listing', eventId, templateId, revision: 1, creatorName: '   ' },
  { action: 'listing', eventId, templateId, revision: 1, creatorName: '🌿'.repeat(81) },
  { action: 'listing', eventId, templateId, revision: null, creatorName: 'Rae Host' },
  { action: 'revoke', eventId, templateId, linkId: 'invalid' },
  { action: 'publish', eventId, templateId },
]) {
  it.effect(`rejects malformed or broadened native scope ${JSON.stringify(input)}`, () => {
    const execute = vi.fn(() => Effect.succeed({ templates: [] }))
    return Effect.gen(function* () {
      yield* Effect.flip(manageBlueprintLinksWorkflow('actor', input))
      expect(execute).not.toHaveBeenCalled()
    }).pipe(Effect.provide(Layer.succeed(BlueprintLinkManagementRepo, { execute })))
  })
}

it.effect('trims an optional creator name when listing and keeps unlisting name-free', () => {
  const execute = vi.fn((_actorId: string, input: BlueprintLinkManagementInput) => {
    const listing = input.action === 'listing' ? input : null
    return Effect.succeed({
      listedRevision: listing?.revision ?? null,
      creatorName: listing?.creatorName ?? null,
    })
  })
  return Effect.gen(function* () {
    const listed = yield* manageBlueprintLinksWorkflow('actor', {
      action: 'listing',
      eventId,
      templateId,
      revision: 2,
      creatorName: '  Rae 🌿  ',
    }).pipe(Effect.provide(Layer.succeed(BlueprintLinkManagementRepo, { execute })))
    expect(listed).toEqual({ listedRevision: 2, creatorName: 'Rae 🌿' })
    expect(execute).toHaveBeenCalledWith('actor', {
      action: 'listing',
      eventId,
      templateId,
      revision: 2,
      creatorName: 'Rae 🌿',
    })
  })
})
