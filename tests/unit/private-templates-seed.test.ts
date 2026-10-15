import { Effect } from 'effect'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createBlueprintDraft: vi.fn(),
  publishBlueprintDraft: vi.fn(),
}))

vi.mock('@/db', async () => {
  const { Layer } = await import('effect')
  return { PgClientLive: Layer.empty }
})
vi.mock('@/server/blueprints/workflows/blueprint-authoring.workflows.live', () => mocks)

import { seedPrivateTemplates } from '@/db/seeds/private-templates'

const publishedAndEditedDraft = {
  id: 'draft-cottage',
  organizationId: 'appreview-personal',
  catalogKey: 'private_cottage',
  draftVersion: 2,
  content: {
    name: 'My edited cottage title',
    description: 'User edits that must remain unpublished.',
    experienceType: 'custom',
    children: [],
    ideas: [],
    instructions: [],
  },
  publishedRevision: 1,
  publishedDraftVersion: 1,
  retired: false,
  source: null,
}

const rapidTestDraft = {
  ...publishedAndEditedDraft,
  id: 'draft-cottage-editing',
  catalogKey: 'private_cottage_editing',
  draftVersion: 1,
  publishedRevision: null,
  publishedDraftVersion: null,
}

const initialSeedDraft = {
  ...publishedAndEditedDraft,
  draftVersion: 1,
  publishedRevision: null,
  publishedDraftVersion: null,
}

describe('private template seed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('publishes only the initial untouched seed version', async () => {
    const published = {
      ...initialSeedDraft,
      publishedRevision: 1,
      publishedDraftVersion: 1,
    }
    mocks.createBlueprintDraft
      .mockReturnValueOnce(Effect.succeed(initialSeedDraft))
      .mockReturnValueOnce(Effect.succeed(rapidTestDraft))
    mocks.publishBlueprintDraft.mockReturnValueOnce(Effect.succeed(published))

    const result = await seedPrivateTemplates('appreview-user', 'appreview-personal')

    expect(mocks.publishBlueprintDraft).toHaveBeenCalledOnce()
    expect(mocks.publishBlueprintDraft).toHaveBeenCalledWith('appreview-user', {
      id: initialSeedDraft.id,
      expectedVersion: 1,
    })
    expect(result.publishedCottage).toEqual(published)
  })

  test('does not republish user edits when stable create replay returns the current draft', async () => {
    mocks.createBlueprintDraft
      .mockReturnValueOnce(Effect.succeed(publishedAndEditedDraft))
      .mockReturnValueOnce(Effect.succeed(rapidTestDraft))

    const result = await seedPrivateTemplates('appreview-user', 'appreview-personal')

    expect(mocks.createBlueprintDraft).toHaveBeenCalledTimes(2)
    expect(result.publishedCottage).toEqual(publishedAndEditedDraft)
    expect(result.publishedCottage.content.name).toBe('My edited cottage title')
    expect(mocks.publishBlueprintDraft).not.toHaveBeenCalled()
  })

  test('refuses to publish an edited draft that has never had a published revision', async () => {
    mocks.createBlueprintDraft.mockReturnValueOnce(
      Effect.succeed({ ...publishedAndEditedDraft, publishedRevision: null })
    )

    await expect(seedPrivateTemplates('appreview-user', 'appreview-personal')).rejects.toThrow(
      /expected unpublished seed version 1/
    )
    expect(mocks.publishBlueprintDraft).not.toHaveBeenCalled()
  })
})
