import { expect, test } from 'vitest'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'
import {
  buildBlueprintCatalog,
  oneEditApart,
  pageBlueprintCatalog,
} from '@/server/blueprints/services/blueprint-discovery'

type Fixture = {
  key: string
  name: string
  summary?: string
  childTitle?: string
  ideaTitle?: string
  notes?: string
  target?: { kind: 'main' } | { kind: 'child'; key: string }
}

function entry({
  key,
  name,
  summary,
  childTitle,
  ideaTitle,
  notes,
  target = { kind: 'main' },
}: Fixture) {
  const definition = structuredClone(weddingBlueprintV1.definition)
  const catalogKey = key.replaceAll('-', '_')
  definition.blueprint.id = catalogKey
  definition.blueprint.name = name
  definition.experienceDefaults.type = 'custom'
  const tree = definition.modules.find((module) => module.type === 'experience_tree')
  if (tree?.type === 'experience_tree') {
    tree.config.mainEventType = 'custom'
    tree.config.children = childTitle
      ? [
          {
            key: 'feature',
            title: childTitle,
            purpose: 'part_of_event',
            category: 'other',
          },
        ]
      : []
  }
  const ideaModule = definition.modules.find((module) => module.type === 'ideas')
  if (ideaModule?.type === 'ideas') {
    ideaModule.config.ideas = ideaTitle
      ? [
          {
            key: 'feature_idea',
            title: ideaTitle,
            category: 'other',
            ...(notes === undefined ? {} : { notes }),
            target,
            configuration: { version: 1 },
          },
        ]
      : []
  }
  const instructions = definition.modules.find((module) => module.type === 'instructions')
  if (instructions?.type === 'instructions') instructions.config.sections = []
  return {
    ...weddingBlueprintV1,
    catalogKey,
    contentHash: 'c'.repeat(64),
    definition,
    ...(summary === undefined ? {} : { description: summary }),
  }
}

function search(fixtures: Fixture[], q: string, limit = 40) {
  const catalog = buildBlueprintCatalog(fixtures.map((fixture) => entry(fixture)))
  return pageBlueprintCatalog(catalog, { q, limit })
}

function resultKeys(result: ReturnType<typeof search>): string[] {
  if (!result.ok) throw new Error(result.reason)
  return result.page.entries.map(({ catalogKey }) => catalogKey)
}

function keys(result: ReturnType<typeof search>): string[] {
  return resultKeys(result).map((catalogKey) => catalogKey.replaceAll('_', '-'))
}

test('search ranks direct title, nested title, description, then related content', () => {
  const result = search(
    [
      { key: 'related', name: 'A quiet stay', childTitle: 'Bonfire by the lake' },
      { key: 'description', name: 'A quiet stay', summary: 'Time together outdoors' },
      { key: 'nested', name: 'A quiet stay', childTitle: 'Outdoors picnic' },
      { key: 'direct', name: 'Outdoors together' },
    ],
    'outdoors'
  )
  expect(keys(result)).toEqual(['direct', 'nested', 'description', 'related'])
})

test('title scoring prefers an exact title, then a contiguous phrase, then scattered concepts', () => {
  expect(
    keys(
      search(
        [
          { key: 'scattered', name: 'Outdoor weekend plans for a wedding' },
          { key: 'phrase', name: 'Plan an outdoor wedding' },
          { key: 'exact', name: 'Outdoor wedding' },
        ],
        'outdoor wedding'
      )
    )
  ).toEqual(['exact', 'phrase', 'scattered'])
})

test('contiguous title phrases recognize concept aliases', () => {
  expect(
    keys(
      search(
        [
          { key: 'scattered', name: 'Outdoor plans for a wedding weekend' },
          { key: 'alias-phrase', name: 'Outdoor wedding weekend' },
        ],
        'outdoors wedding'
      )
    )
  ).toEqual(['alias-phrase', 'scattered'])
})

test('Blueprint name specificity stays ahead of exact nested titles', () => {
  expect(
    keys(
      search(
        [
          { key: 'nested-exact', name: 'A weekend plan', childTitle: 'Wedding' },
          { key: 'name-direct', name: 'Wedding Weekend' },
        ],
        'wedding'
      )
    )
  ).toEqual(['name-direct', 'nested-exact'])
})

test('typo matching is limited to one edit on longer missing terms and ignores metadata', () => {
  expect(
    keys(
      search(
        [
          { key: 'misspelled', name: 'A weekend plan', childTitle: 'Picnic by the lake' },
          { key: 'short', name: 'A wedding plan' },
        ],
        'picnci'
      )
    )
  ).toEqual(['misspelled'])
  expect(keys(search([{ key: 'short', name: 'A wedding plan' }], 'wed'))).toEqual([])
  const metadataOnly = buildBlueprintCatalog([entry({ key: 'tag-only', name: 'A plan' })])
  metadataOnly.entries[0]!.discovery.tags = ['picnic']
  expect(keys(pageBlueprintCatalog(metadataOnly, { q: 'picnci', limit: 40 }))).toEqual([])
})

test('one-edit distance handles insertion, deletion, substitution, transpose, and Unicode code points', () => {
  expect(oneEditApart('picnic', 'picnict')).toBe(true)
  expect(oneEditApart('picnic', 'picni')).toBe(true)
  expect(oneEditApart('picnic', 'pictic')).toBe(true)
  expect(oneEditApart('picnic', 'picnci')).toBe(true)
  expect(oneEditApart('mañana', 'mañan')).toBe(true)
  expect(oneEditApart('𐐀abcd', '𐐀abce')).toBe(true)
  expect(oneEditApart('picnic', 'pactik')).toBe(false)
})

test('typos resolve through bilingual aliases and outrank related-only evidence', () => {
  expect(keys(search([{ key: 'spanish', name: 'Boda íntima' }], 'weding'))).toEqual(['spanish'])
  expect(
    keys(
      search(
        [
          { key: 'related', name: 'A quiet plan', childTitle: 'Picnic gathering' },
          { key: 'corrected', name: 'Outdoor gathering' },
        ],
        'outdors'
      )
    )
  ).toEqual(['corrected', 'related'])
})

test('nearby plural aliases collapse to one canonical correction and metadata keys do not suppress it', () => {
  expect(
    keys(
      search(
        [
          { key: 'wedding', name: 'Wedding party' },
          { key: 'weddings', name: 'Weddings weekend' },
        ],
        'weddingz'
      )
    )
  ).toEqual(['wedding', 'weddings'])
  expect(
    keys(
      search([{ key: 'picnci', name: 'A quiet plan', childTitle: 'Picnic by the lake' }], 'picnci')
    )
  ).toEqual(['picnci'])
})

test('bride bouquet matches authored bridal bouquet content', () => {
  expect(
    keys(
      search(
        [{ key: 'bridal-bouquet', name: 'A wedding plan', ideaTitle: 'Bridal bouquet' }],
        'bride bouquet'
      )
    )
  ).toEqual(['bridal-bouquet'])
})

test('literal wedding text outranks related bridal bouquet titles', () => {
  expect(
    keys(
      search(
        [
          { key: 'bridal-bouquet', name: 'A celebration', ideaTitle: 'Bridal bouquet' },
          { key: 'literal-wedding', name: 'A celebration', summary: 'A wedding for close friends' },
        ],
        'wedding'
      )
    )
  ).toEqual(['literal-wedding', 'bridal-bouquet'])
})

test('metadata cannot manufacture a multi-concept phrase across sources', () => {
  const catalog = buildBlueprintCatalog([
    entry({ key: 'office_reception', name: 'A gathering', ideaTitle: 'Reception' }),
  ])
  expect(keys(pageBlueprintCatalog(catalog, { q: 'office reception', limit: 40 }))).toEqual([])
})

test('wedding related phrases help while generic ceremony words stay unrelated', () => {
  expect(
    keys(
      search(
        [
          { key: 'bridal', name: 'A celebration', childTitle: 'Bridal celebration' },
          { key: 'office', name: 'Quarterly team event', childTitle: 'Award ceremony' },
        ],
        'wedding'
      )
    )
  ).toEqual(['bridal'])
})

test('every separate query concept needs evidence in the same Blueprint', () => {
  const result = search(
    [
      { key: 'split', name: 'Outdoor plans', ideaTitle: 'Wedding details' },
      { key: 'partial', name: 'Outdoor plans' },
      { key: 'one', name: 'Outdoor wedding' },
    ],
    'outdoor wedding'
  )
  expect(keys(result)).toEqual(['one', 'split'])
})

test('all query concepts need authored evidence and query order does not affect ranking', () => {
  const catalog = buildBlueprintCatalog([
    entry({ key: 'nested-literal', name: 'A weekend', childTitle: 'Outdoor wedding' }),
    entry({ key: 'name-metadata', name: 'Outdoor weekend' }),
  ])
  catalog.entries.find(({ catalogKey }) => catalogKey === 'name_metadata')!.discovery.categories = [
    'weddings',
  ]
  expect(resultKeys(pageBlueprintCatalog(catalog, { q: 'outdoors wedding', limit: 40 }))).toEqual([
    'nested_literal',
  ])
  expect(resultKeys(pageBlueprintCatalog(catalog, { q: 'wedding outdoors', limit: 40 }))).toEqual([
    'nested_literal',
  ])
})

test('search matches published child titles, idea titles, and idea notes with whole words', () => {
  expect(
    keys(search([{ key: 'child', name: 'Plan', childTitle: 'Bonfire night' }], 'bonfire'))
  ).toEqual(['child'])
  expect(keys(search([{ key: 'idea', name: 'Plan', ideaTitle: 'Lake picnic' }], 'picnic'))).toEqual(
    ['idea']
  )
  expect(
    keys(
      search(
        [{ key: 'notes', name: 'Plan', ideaTitle: 'Food', notes: 'Plan a picnic nearby' }],
        'picnic'
      )
    )
  ).toEqual(['notes'])
  expect(keys(search([{ key: 'substring', name: 'Picnicology planning' }], 'picnic'))).toEqual([])
})

test('English and Spanish aliases fold case and accents while preserving token boundaries', () => {
  expect(keys(search([{ key: 'en', name: 'Outdoor celebration' }], 'OUTDOORS'))).toEqual(['en'])
  expect(keys(search([{ key: 'es', name: 'Reunión al aire libre' }], 'aire libre'))).toEqual(['es'])
  expect(keys(search([{ key: 'accent', name: 'Cumpleaños familiar' }], 'cumpleanos'))).toEqual([
    'accent',
  ])
  expect(keys(search([{ key: 'boundary', name: 'Wedding planner' }], 'ding'))).toEqual([])
})

test('metadata remains a low-ranked compatibility fallback', () => {
  const catalog = buildBlueprintCatalog([
    entry({ key: 'tag-only', name: 'A plan' }),
    entry({ key: 'content', name: 'Picnic by the lake' }),
  ])
  catalog.entries.find(({ catalogKey }) => catalogKey === 'tag_only')!.discovery.tags = ['picnic']
  expect(keys(pageBlueprintCatalog(catalog, { q: 'picnic', limit: 40 }))).toEqual([
    'content',
    'tag-only',
  ])
})

test('unsupported, malformed, and orphan child-target ideas do not enter the search projection', () => {
  const orphan = entry({
    key: 'orphan',
    name: 'Plan',
    ideaTitle: 'Bonfire notes',
    target: { kind: 'child', key: 'missing' },
  })
  const unsupported = entry({ key: 'unsupported', name: 'Plan' })
  unsupported.definition.modules.push({
    key: 'future_ideas',
    type: 'ideas',
    version: 3,
    required: false,
    config: { ideas: [{ title: 'Bonfire future' }] },
  } as never)
  const malformed = entry({ key: 'malformed', name: 'Plan' })
  malformed.definition.modules.push({
    key: 'bad_ideas',
    type: 'ideas',
    version: 2,
    required: false,
    config: { ideas: [{ title: 'Bonfire malformed' }] },
  } as never)
  const result = pageBlueprintCatalog(buildBlueprintCatalog([orphan, unsupported, malformed]), {
    q: 'bonfire',
    limit: 40,
  })
  expect(keys(result)).toEqual([])
})

test('idea child targets resolve against the same supported revision', () => {
  expect(
    keys(
      search(
        [
          {
            key: 'valid-child-idea',
            name: 'Plan',
            childTitle: 'Rehearsal',
            ideaTitle: 'Bonfire menu',
            target: { kind: 'child', key: 'feature' },
          },
        ],
        'bonfire'
      )
    )
  ).toEqual(['valid-child-idea'])
})

test('projection reads without mutating the published definition', () => {
  const source = entry({ key: 'immutable', name: 'Plan', childTitle: 'Picnic' })
  const before = structuredClone(source.definition)
  pageBlueprintCatalog(buildBlueprintCatalog([source]), { q: 'picnic', limit: 40 })
  expect(source.definition).toEqual(before)
})

test('cursor is stale if searchable content changes between pages and malformed cursors stay invalid', () => {
  const fixtures: Fixture[] = [
    { key: 'a', name: 'Outdoor one' },
    { key: 'b', name: 'Outdoor two' },
    { key: 'c', name: 'Outdoor three' },
  ]
  const firstCatalog = buildBlueprintCatalog(fixtures.map((fixture) => entry(fixture)))
  const first = pageBlueprintCatalog(firstCatalog, { q: 'outdoors', limit: 1 })
  expect(first.ok && first.page.nextCursor).toBeTruthy()
  if (!first.ok || !first.page.nextCursor) return

  const changedFixtures = fixtures.map((fixture) => ({ ...fixture }))
  changedFixtures[2]!.childTitle = 'Garden gathering'
  const changedCatalog = buildBlueprintCatalog(changedFixtures.map((fixture) => entry(fixture)))
  expect(
    pageBlueprintCatalog(changedCatalog, {
      q: 'outdoors',
      limit: 1,
      cursor: first.page.nextCursor,
    })
  ).toEqual({ ok: false, reason: 'stale_cursor' })
  expect(
    pageBlueprintCatalog(firstCatalog, {
      q: 'picnic',
      limit: 1,
      cursor: first.page.nextCursor,
    })
  ).toEqual({ ok: false, reason: 'stale_cursor' })
  expect(
    pageBlueprintCatalog(firstCatalog, {
      q: 'outdoors',
      limit: 2,
      cursor: first.page.nextCursor,
    })
  ).toEqual({ ok: false, reason: 'stale_cursor' })
  expect(
    pageBlueprintCatalog(firstCatalog, {
      q: 'outdoors',
      limit: 1,
      category: 'weddings',
      cursor: first.page.nextCursor,
    })
  ).toEqual({ ok: false, reason: 'stale_cursor' })
  expect(pageBlueprintCatalog(firstCatalog, { q: 'outdoors', limit: 1, cursor: 'bad!' })).toEqual({
    ok: false,
    reason: 'invalid_cursor',
  })
})

test('related expansion finds picnic content without adding another catalog result', () => {
  const result = search(
    [
      { key: 'picnic', name: 'A picnic by the lake' },
      { key: 'bonfire', name: 'A night with friends', childTitle: 'Bonfire' },
    ],
    'outdoors'
  )
  expect(keys(result)).toEqual(['bonfire', 'picnic'])
})

test('outdoors expansion covers English plurals and Spanish garden, camping, and bonfire terms', () => {
  expect(
    keys(
      search(
        [
          { key: 'bonfires', name: 'Bonfires by the lake' },
          { key: 'gardens', name: 'Quiet gardens' },
          { key: 'fogatas', name: 'Fogatas junto al lago' },
          { key: 'jardines', name: 'Jardines tranquilos' },
          { key: 'acampada', name: 'Acampada en familia' },
        ],
        'outdoors'
      )
    )
  ).toEqual(['acampada', 'bonfires', 'fogatas', 'gardens', 'jardines'])
  expect(keys(search([{ key: 'bonfire', name: 'Bonfires by the lake' }], 'picnic'))).toEqual([])
})

test('multiword Spanish aliases combine with other concepts and reject incomplete intent', () => {
  expect(
    keys(search([{ key: 'boda-outdoors', name: 'Boda al aire libre' }], 'al aire libre wedding'))
  ).toEqual(['boda-outdoors'])
  expect(
    keys(search([{ key: 'incomplete', name: 'Boda junto a una fogata' }], 'al aire libre birthday'))
  ).toEqual([])
})

test('empty browse retains catalog codepoint order and ranked ties page stably', () => {
  const browseCatalog = buildBlueprintCatalog(
    ['z', 'aa', 'a_z'].map((key) => entry({ key, name: key }))
  )
  const expectedBrowseOrder = ['a_z', 'aa', 'z']
  expect(browseCatalog.entries.map(({ catalogKey }) => catalogKey)).toEqual(expectedBrowseOrder)
  expect(resultKeys(pageBlueprintCatalog(browseCatalog, { q: '', limit: 40 }))).toEqual(
    expectedBrowseOrder
  )
  expect(resultKeys(pageBlueprintCatalog(browseCatalog, { q: '!!!', limit: 40 }))).toEqual([])

  const rankedCatalog = buildBlueprintCatalog(
    ['b', 'a', 'c'].map((key) => entry({ key, name: 'Outdoors together' }))
  )
  const first = pageBlueprintCatalog(rankedCatalog, { q: 'outdoors', limit: 1 })
  expect(resultKeys(first)).toEqual(['a'])
  if (!first.ok || !first.page.nextCursor) throw new Error('Expected a second search page')
  const second = pageBlueprintCatalog(rankedCatalog, {
    q: 'outdoors',
    limit: 1,
    cursor: first.page.nextCursor,
  })
  expect(resultKeys(second)).toEqual(['b'])
  if (!second.ok || !second.page.nextCursor) throw new Error('Expected a third search page')
  expect(
    resultKeys(
      pageBlueprintCatalog(rankedCatalog, {
        q: 'outdoors',
        limit: 1,
        cursor: second.page.nextCursor,
      })
    )
  ).toEqual(['c'])
})

test('related content search retains category scope and reports matching browse categories', () => {
  const catalog = buildBlueprintCatalog([
    entry({ key: 'wedding-plan', name: 'A celebration', childTitle: 'Garden gathering' }),
    entry({ key: 'trip-plan', name: 'A weekend', ideaTitle: 'Bonfire by the lake' }),
  ])
  catalog.entries.find(({ catalogKey }) => catalogKey === 'wedding_plan')!.discovery.categories = [
    'weddings',
  ]
  catalog.entries.find(({ catalogKey }) => catalogKey === 'trip_plan')!.discovery.categories = [
    'trips',
  ]

  const result = pageBlueprintCatalog(catalog, { q: 'outdoors', category: 'weddings', limit: 40 })
  expect(keys(result)).toEqual(['wedding-plan'])
  expect(result.ok && result.page.availableCategories).toEqual(['weddings', 'trips'])
})
