import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'
import { buildBlueprintCatalog } from '@/server/blueprints/services/blueprint-discovery'

export type SearchFixture = {
  key: string
  name: string
  summary?: string
  childTitle?: string
  childTitles?: string[]
  ideaTitle?: string
  notes?: string
  target?: { kind: 'main' } | { kind: 'child'; key: string }
  category?: 'weddings' | 'events'
  tags?: string[]
}

/** Authored evaluation corpus. Development and challenge queries are kept separate. */
export const searchFixtures: SearchFixture[] = [
  {
    key: 'wedding-woodland',
    name: 'Woodland wedding',
    summary: 'A relaxed outdoor wedding celebration.',
    category: 'weddings',
    tags: ['wedding', 'outdoors'],
  },
  {
    key: 'wedding-garden',
    name: 'Garden wedding',
    childTitle: 'Outdoor ceremony',
    category: 'weddings',
  },
  {
    key: 'wedding-beach',
    name: 'Beach wedding',
    summary: 'A seaside ceremony and reception.',
    category: 'weddings',
  },
  {
    key: 'office-reception',
    name: 'Office reception',
    summary: 'A company reception after an awards ceremony.',
    category: 'events',
    tags: ['office'],
  },
  {
    key: 'award-ceremony',
    name: 'Awards ceremony',
    summary: 'Recognize colleagues at an annual ceremony.',
    category: 'events',
  },
  {
    key: 'camping',
    name: 'Weekend camping',
    summary: 'A simple trip with a tent and campfire.',
    category: 'events',
    tags: ['camping'],
  },
  {
    key: 'clamp-workshop',
    name: 'Workshop tools',
    summary: 'A clamp holds pieces in place.',
    category: 'events',
  },
  {
    key: 'party-planning',
    name: 'Birthday party',
    summary: 'Food and games for friends.',
    category: 'events',
    tags: ['party'],
  },
  {
    key: 'parts-inventory',
    name: 'Parts inventory',
    summary: 'Track spare parts for repairs.',
    category: 'events',
  },
  {
    key: 'cider-tasting',
    name: 'Autumn cider tasting',
    summary: 'Compare local cider makers.',
    category: 'events',
  },
  {
    key: 'picnic',
    name: 'Lakeside picnic',
    summary: 'Pack lunch for an outdoor afternoon.',
    category: 'events',
    tags: ['picnic', 'outdoors'],
  },
  {
    key: 'boda-jardin',
    name: 'Boda en el jardín',
    summary: 'Una celebración al aire libre.',
    category: 'weddings',
    tags: ['boda'],
  },
  {
    key: 'boda-aire-libre',
    name: 'Boda al aire libre',
    summary: 'Ceremonia de boda en un jardín con la familia.',
    category: 'weddings',
    tags: ['boda', 'jardín'],
  },
  {
    key: 'multi-event-weekend',
    name: 'Family gathering',
    childTitles: ['Wedding ceremony', 'Farewell brunch'],
    category: 'events',
  },
  {
    key: 'bridal-bouquet',
    name: 'Wedding planning',
    ideaTitle: 'Bridal bouquet',
    category: 'weddings',
  },
  {
    key: 'engagement',
    name: 'Engagement dinner',
    summary: 'Celebrate the couple with close friends.',
    category: 'events',
  },
  {
    key: 'office-award-wedding-note',
    name: 'Company gathering',
    ideaTitle: 'Annual reception',
    notes: 'A work event uses wedding and outdoor garden terms as an unrelated marketing example.',
    category: 'events',
  },
  {
    key: 'idea-only-wedding',
    name: 'A quiet weekend',
    ideaTitle: 'Wedding flowers',
    category: 'events',
  },
  {
    key: 'child-only-wedding',
    name: 'A family weekend',
    childTitle: 'Wedding rehearsal',
    category: 'events',
  },
  {
    key: 'orphan-target-template',
    name: 'Orphan target template',
    ideaTitle: 'Wedding venue',
    target: { kind: 'child', key: 'missing_child' },
    category: 'events',
  },
]

export type SearchCase = {
  id: string
  query: string
  relevant: string[]
  family: string
}

export const developmentCases: SearchCase[] = [
  {
    id: 'exact-title',
    query: 'Woodland wedding',
    relevant: ['wedding-woodland'],
    family: 'exact-title',
  },
  {
    id: 'phrase-in-title',
    query: 'garden wedding',
    relevant: ['wedding-garden', 'boda-jardin'],
    family: 'phrase',
  },
  {
    id: 'scattered-concepts',
    query: 'wedding outdoor',
    relevant: ['wedding-woodland', 'wedding-garden', 'wedding-beach', 'boda-jardin'],
    family: 'concepts',
  },
  {
    id: 'wedding-alias',
    query: 'weddings',
    relevant: ['wedding-woodland', 'wedding-garden', 'wedding-beach', 'boda-jardin'],
    family: 'alias',
  },
  {
    id: 'spanish-alias',
    query: 'bodas',
    relevant: ['wedding-woodland', 'wedding-garden', 'wedding-beach', 'boda-jardin'],
    family: 'alias',
  },
  {
    id: 'outdoor-related',
    query: 'outdoors',
    relevant: ['wedding-woodland', 'wedding-garden', 'wedding-beach', 'picnic', 'boda-jardin'],
    family: 'related',
  },
  {
    id: 'outdoors-wedding',
    query: 'outdoor wedding',
    relevant: ['wedding-woodland', 'wedding-garden', 'wedding-beach', 'boda-jardin'],
    family: 'concepts',
  },
  {
    id: 'office-reception-bounded',
    query: 'wedding reception',
    relevant: ['wedding-woodland', 'wedding-beach'],
    family: 'bounded-relation',
  },
  {
    id: 'real-word-reception',
    query: 'reception',
    relevant: [
      'wedding-woodland',
      'wedding-beach',
      'office-reception',
      'office-award-wedding-note',
    ],
    family: 'real-word',
  },
  {
    id: 'one-edit-typo',
    query: 'weddng',
    relevant: ['wedding-woodland', 'wedding-garden', 'wedding-beach', 'boda-jardin'],
    family: 'typo',
  },
  {
    id: 'transposition-typo',
    query: 'weedding',
    relevant: ['wedding-woodland', 'wedding-garden', 'wedding-beach', 'boda-jardin'],
    family: 'typo',
  },
  {
    id: 'multiword-typo-anchor',
    query: 'weddng garden',
    relevant: ['wedding-garden'],
    family: 'typo-anchor',
  },
  { id: 'short-query', query: 'wed', relevant: [], family: 'short-query' },
  { id: 'nonsense', query: 'xqzvplm', relevant: [], family: 'nonsense' },
  {
    id: 'diacritic',
    query: 'jardin',
    relevant: ['boda-jardin', 'wedding-garden'],
    family: 'diacritics',
  },
  {
    id: 'idea-title-boundary',
    query: 'wedding flowers',
    relevant: ['idea-only-wedding'],
    family: 'idea-only',
  },
  {
    id: 'title-versus-scattered',
    query: 'garden outdoors',
    relevant: ['wedding-garden', 'boda-aire-libre'],
    family: 'title-specialization',
  },
  {
    id: 'spanish-outdoor-phrase',
    query: 'boda al aire libre',
    relevant: ['boda-aire-libre'],
    family: 'spanish-related',
  },
  {
    id: 'bridal-content',
    query: 'bridal bouquet',
    relevant: ['bridal-bouquet'],
    family: 'bridal',
  },
  {
    id: 'multiple-event-child',
    query: 'wedding ceremony',
    relevant: ['multi-event-weekend', 'wedding-beach'],
    family: 'nested-event',
  },
  {
    id: 'metadata-fallback',
    query: 'weddings',
    relevant: [
      'wedding-woodland',
      'wedding-garden',
      'wedding-beach',
      'boda-jardin',
      'boda-aire-libre',
      'multi-event-weekend',
      'bridal-bouquet',
    ],
    family: 'metadata-fallback',
  },
  { id: 'camp-vs-clamp', query: 'camp', relevant: ['camping'], family: 'negative-fuzzy' },
  { id: 'party-vs-parts', query: 'party', relevant: ['party-planning'], family: 'negative-fuzzy' },
  { id: 'cider-unrelated', query: 'cider', relevant: ['cider-tasting'], family: 'real-word' },
  {
    id: 'office-reception-alone',
    query: 'office reception',
    relevant: ['office-reception'],
    family: 'negative-wedding-expansion',
  },
  {
    id: 'award-ceremony-alone',
    query: 'award ceremony',
    relevant: ['award-ceremony', 'office-reception'],
    family: 'negative-wedding-expansion',
  },
]

export const challengeCases: SearchCase[] = [
  {
    id: 'fresh-spelling',
    query: 'weddong',
    relevant: [
      'wedding-woodland',
      'wedding-garden',
      'wedding-beach',
      'child-only-wedding',
      'idea-only-wedding',
      'multi-event-weekend',
      'bridal-bouquet',
    ],
    family: 'substitution-typo',
  },
  {
    id: 'fresh-transposition',
    query: 'weddnig',
    relevant: [
      'wedding-woodland',
      'wedding-garden',
      'wedding-beach',
      'child-only-wedding',
      'idea-only-wedding',
      'multi-event-weekend',
      'bridal-bouquet',
    ],
    family: 'transposition-typo',
  },
  {
    id: 'fresh-deletion',
    query: 'weding',
    relevant: [
      'wedding-woodland',
      'wedding-garden',
      'wedding-beach',
      'child-only-wedding',
      'idea-only-wedding',
      'multi-event-weekend',
      'bridal-bouquet',
    ],
    family: 'deletion-typo',
  },
  {
    id: 'fresh-canonical-spanish-typo',
    query: 'bodaa',
    relevant: [
      'wedding-woodland',
      'wedding-garden',
      'wedding-beach',
      'boda-jardin',
      'boda-aire-libre',
      'child-only-wedding',
      'idea-only-wedding',
      'multi-event-weekend',
      'bridal-bouquet',
    ],
    family: 'fuzzy-canonical-alias',
  },
  {
    id: 'fresh-mixed-order',
    query: 'garden weddng',
    relevant: ['wedding-garden', 'boda-jardin'],
    family: 'typo-anchor',
  },
  {
    id: 'fresh-spanish-diacritic',
    query: 'bodá',
    relevant: [
      'boda-jardin',
      'boda-aire-libre',
      'wedding-woodland',
      'wedding-garden',
      'wedding-beach',
      'child-only-wedding',
      'idea-only-wedding',
      'multi-event-weekend',
      'bridal-bouquet',
    ],
    family: 'alias-diacritics',
  },
  {
    id: 'fresh-generic-ceremony',
    query: 'wedding ceremony',
    relevant: [
      'wedding-woodland',
      'wedding-garden',
      'wedding-beach',
      'boda-jardin',
      'boda-aire-libre',
      'multi-event-weekend',
      'child-only-wedding',
    ],
    family: 'bounded-relation',
  },
  {
    id: 'fresh-spanish-outdoor',
    query: 'bodas al aire libre',
    relevant: ['boda-aire-libre'],
    family: 'spanish-multiword',
  },
  {
    id: 'fresh-related-bridal',
    query: 'bride bouquet',
    relevant: ['bridal-bouquet'],
    family: 'related-bridal',
  },
  {
    id: 'fresh-specific-phrase',
    query: 'Garden wedding',
    relevant: ['wedding-garden'],
    family: 'exact-phrase',
  },
  {
    id: 'fresh-generic-office-reception',
    query: 'office reception',
    relevant: ['office-reception'],
    family: 'notes-spam-negative',
  },
  {
    id: 'fresh-query-order',
    query: 'outdoors wedding',
    relevant: [
      'wedding-woodland',
      'wedding-garden',
      'wedding-beach',
      'boda-jardin',
      'boda-aire-libre',
      'child-only-wedding',
      'idea-only-wedding',
      'multi-event-weekend',
      'bridal-bouquet',
    ],
    family: 'query-permutation',
  },
]

export function makeSearchFixture(fixture: SearchFixture) {
  const definition = structuredClone(weddingBlueprintV1.definition)
  const catalogKey = fixture.key.replaceAll('-', '_')
  definition.blueprint.id = catalogKey
  definition.blueprint.name = fixture.name
  definition.experienceDefaults.type = 'custom'
  const tree = definition.modules.find((module) => module.type === 'experience_tree')
  if (tree?.type === 'experience_tree') {
    tree.config.mainEventType = 'custom'
    const childTitles = fixture.childTitles ?? (fixture.childTitle ? [fixture.childTitle] : [])
    tree.config.children = childTitles.map((title, index) => ({
      key: `feature_${index + 1}`,
      title,
      purpose: 'part_of_event',
      category: 'other',
    }))
  }
  const ideas = definition.modules.find((module) => module.type === 'ideas')
  if (ideas?.type === 'ideas') {
    ideas.config.ideas = fixture.ideaTitle
      ? [
          {
            key: 'fixture_idea',
            title: fixture.ideaTitle,
            category: 'other',
            ...(fixture.notes ? { notes: fixture.notes } : {}),
            target: fixture.target ?? { kind: 'main' },
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
    contentHash: 'e'.repeat(64),
    definition,
    description: fixture.summary,
  }
}

export function buildSearchEvaluationCatalog() {
  // The public response schema rejects orphan child targets. This malformed
  // source stays outside the search corpus; it does not exercise authorization.
  const eligibleFixtures = searchFixtures.filter(({ key }) => key !== 'orphan-target-template')
  const catalog = buildBlueprintCatalog(eligibleFixtures.map(makeSearchFixture))
  for (const entry of catalog.entries) {
    const fixture = eligibleFixtures.find(
      ({ key }) => key.replaceAll('-', '_') === entry.catalogKey
    )
    if (!fixture) continue
    entry.discovery.categories = [
      fixture.category ?? (fixture.key.startsWith('wedding') ? 'weddings' : 'events'),
    ]
    entry.discovery.tags = fixture.tags ?? []
  }
  return catalog
}

export function buildOrphanTargetCatalog() {
  const fixture = searchFixtures.find(({ key }) => key === 'orphan-target-template')
  if (!fixture) throw new Error('Missing orphan target fixture')
  return buildBlueprintCatalog([makeSearchFixture(fixture)])
}
