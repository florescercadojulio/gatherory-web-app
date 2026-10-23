import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import {
  BlueprintDraftContentSchema,
  draftDefinition,
} from '@/contracts/blueprint-authoring.contracts'
import { blueprintHash } from '@/server/blueprints/planning/blueprint-hash'

type NativeBridgeCase = {
  label: string
  source: {
    catalogKey: string
    revision: number
    contentHash: string
    definition: unknown
  }
  content: unknown
}

const fixturePath = 'tests/fixtures/blueprint-native-copy-snapshots.v1.json'

function nativeBridgeCases(): NativeBridgeCase[] {
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as {
    formatVersion: number
    cases: NativeBridgeCase[]
  }
  expect(fixture.formatVersion).toBe(1)
  return fixture.cases
}

test('native copy snapshots round-trip through server draft definitions and source hashes', () => {
  const cases = nativeBridgeCases()
  const catalog = JSON.parse(
    readFileSync('contracts/examples/explore-catalog.v1.json', 'utf8')
  ) as {
    entries: Array<NativeBridgeCase['source']>
  }
  const curated = cases.filter((item) => item.label.startsWith('curated:'))
  const authored = cases.filter((item) => item.label.startsWith('authored:'))

  expect(curated).toHaveLength(catalog.entries.length)
  expect(authored.map((item) => item.label).sort()).toEqual([
    'authored:authored_capability_native_bridge',
    'authored:authored_single_native_bridge',
  ])

  const currentEntries = new Map(catalog.entries.map((entry) => [entry.catalogKey, entry]))
  for (const item of curated) {
    const current = currentEntries.get(item.source.catalogKey)
    expect(current, `${item.label} remains present in the shared public catalog`).toBeDefined()
    expect(item.source).toEqual(current)

    const content = BlueprintDraftContentSchema.parse(item.content)
    expect(
      blueprintHash(draftDefinition(content, item.source.catalogKey, item.source.revision))
    ).toBe(item.source.contentHash)
  }

  const single = BlueprintDraftContentSchema.parse(
    authored.find((item) => item.source.catalogKey === 'authored_single_native_bridge')?.content
  )
  const authoredSingle = authored.find(
    (item) => item.source.catalogKey === 'authored_single_native_bridge'
  )!
  const capability = BlueprintDraftContentSchema.parse(
    authored.find((item) => item.source.catalogKey === 'authored_capability_native_bridge')?.content
  )
  const authoredCapability = authored.find(
    (item) => item.source.catalogKey === 'authored_capability_native_bridge'
  )!
  for (const item of [
    { source: authoredSingle.source, content: single },
    { source: authoredCapability.source, content: capability },
  ]) {
    expect(
      blueprintHash(draftDefinition(item.content, item.source.catalogKey, item.source.revision))
    ).toBe(blueprintHash(item.source.definition))
    // These authored bridge entries are synthetic definitions. Their wire metadata
    // uses a sentinel digest so it cannot be mistaken for production hash evidence.
    expect(item.source.contentHash).toBe('0'.repeat(64))
  }
  expect(single.children).toHaveLength(0)
  expect(single.ideas.length).toBeGreaterThan(0)
  expect(single.instructions.length).toBeGreaterThan(0)
  expect(capability.children.length).toBeGreaterThan(0)
  expect(capability.ideas.length).toBeGreaterThan(0)
  expect(capability.instructions.length).toBeGreaterThan(0)
  expect(capability.todos.length).toBeGreaterThan(0)
  expect(capability.coverAssetId).toBeDefined()
  const installableCapability = BlueprintDraftContentSchema.parse({
    ...capability,
    coverAssetId: null,
    children: capability.children.map((child) => ({ ...child, coverAssetId: null })),
    ideas: capability.ideas.map((idea) => ({ ...idea, coverAssetId: null })),
  })
  expect(installableCapability.children).toHaveLength(capability.children.length)
  expect(installableCapability.todos).toEqual(capability.todos)
})
