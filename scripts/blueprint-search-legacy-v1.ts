/**
 * Frozen content-search-v1 comparator. Copied from blueprint-discovery.ts at
 * SHA256 1c606eeec95358e856f3cbd9c394608f2f725407a53331972b5e777017318e18
 * before the search-v2 implementation. Keep this independent of production
 * search code so future edits cannot silently move the baseline.
 */
import {
  BlueprintExperienceTreeModuleSchema,
  BlueprintIdeasModuleSchema,
} from '../src/contracts/blueprint-install.contracts'

type Source = { kind: string; text: string }
type Entry = {
  catalogKey: string
  discovery: { summary: string; categories: string[]; tags: string[] }
  definition: { blueprint: { name: string }; modules: unknown[] }
}

const aliases: Readonly<Record<string, readonly string[]>> = {
  outdoor: ['outdoors'],
  outdoors: ['outdoors'],
  'aire libre': ['outdoors'],
  'al aire libre': ['outdoors'],
  picnic: ['picnic'],
  picnics: ['picnic'],
  camping: ['camping'],
  camp: ['camping'],
  acampada: ['camping'],
  acampar: ['camping'],
  garden: ['garden'],
  gardens: ['garden'],
  jardin: ['garden'],
  jardines: ['garden'],
  bonfire: ['bonfire'],
  bonfires: ['bonfire'],
  fogata: ['bonfire'],
  fogatas: ['bonfire'],
  boda: ['wedding'],
  bodas: ['wedding'],
  wedding: ['wedding'],
  weddings: ['wedding'],
  cumpleaños: ['birthday'],
  cumpleanos: ['birthday'],
  birthday: ['birthday'],
  birthdays: ['birthday'],
}
const related: Readonly<Record<string, readonly string[]>> = {
  outdoors: ['picnic', 'camping', 'garden', 'bonfire'],
}
const categoryTerms: Record<string, string[]> = {
  weddings: ['Weddings', 'Bodas'],
  birthdays: ['Birthdays', 'Cumpleaños'],
  holidays: ['Holidays', 'Festividades'],
  engagements: ['Engagements', 'Compromisos'],
  showers: ['Showers & Welcomes', 'Fiestas de bienvenida'],
  bachelor_parties: ['Bachelor & Bachelorette', 'Despedidas de soltería'],
  anniversaries: ['Anniversaries', 'Aniversarios'],
  graduations: ['Graduations', 'Graduaciones'],
  reunions: ['Family Reunions', 'Reuniones familiares'],
  dinner_parties: ['Dinner Parties', 'Cenas con amigos'],
  picnics: ['Picnics & Outdoors', 'Pícnics y aire libre'],
  game_nights: ['Game Nights', 'Noches de juegos'],
  trips: ['Trips & Getaways', 'Viajes y escapadas'],
  cottage_stays: ['Cottage & Cabin Stays', 'Estancias en cabañas'],
  guest_stays: ['Guest Stays', 'Estancias de huéspedes'],
  retreats: ['Team Retreats', 'Retiros de equipo'],
  community: ['Community Gatherings', 'Encuentros comunitarios'],
  events: ['Other Events', 'Otros eventos'],
}

function words(value: string) {
  return (
    value
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) ?? []
  )
}
function phrase(source: string, target: string) {
  const a = words(source),
    b = words(target)
  return (
    b.length > 0 &&
    b.length <= a.length &&
    a.some((_, i) => b.every((word, offset) => a[i + offset] === word))
  )
}
function projection(entry: Entry): Source[] {
  const sources: Source[] = [
    { kind: 'blueprint-name', text: entry.definition.blueprint.name },
    { kind: 'blueprint-summary', text: entry.discovery.summary },
  ]
  const treeResult = entry.definition.modules
    .map((module) => BlueprintExperienceTreeModuleSchema.safeParse(module))
    .find((result) => result.success)
  const tree = treeResult?.success ? treeResult.data : undefined
  const childKeys = new Set<string>()
  for (const child of tree?.config.children ?? []) {
    childKeys.add(child.key)
    sources.push({ kind: 'child-title', text: child.title })
  }
  const ideasResult = entry.definition.modules
    .map((module) => BlueprintIdeasModuleSchema.safeParse(module))
    .find((result) => result.success)
  const ideas = ideasResult?.success ? ideasResult.data : undefined
  for (const idea of ideas?.config.ideas ?? []) {
    if (idea.target.kind === 'child' && !childKeys.has(idea.target.key)) continue
    sources.push({ kind: 'idea-title', text: idea.title })
    if (idea.notes) sources.push({ kind: 'idea-notes', text: idea.notes })
  }
  sources.push({ kind: 'metadata', text: entry.catalogKey })
  for (const category of entry.discovery.categories) {
    sources.push(
      { kind: 'metadata', text: category },
      ...(categoryTerms[category] ?? []).map((text) => ({ kind: 'metadata', text }))
    )
  }
  sources.push(...entry.discovery.tags.map((text) => ({ kind: 'metadata', text })))
  return sources
}
function concepts(query: string): string[][] {
  const queryWords = words(query)
  const keys = Object.keys(aliases).sort((a, b) => words(b).length - words(a).length)
  const result: string[][] = []
  for (let i = 0; i < queryWords.length;) {
    const alias = keys.find((key) =>
      words(key).every((word, offset) => queryWords[i + offset] === word)
    )
    if (alias) {
      result.push([...aliases[alias]!])
      i += words(alias).length
    } else {
      const word = queryWords[i++]!
      result.push(aliases[word] ? [...aliases[word]!] : [word])
    }
  }
  return result
}
function aliasesFor(values: string[]) {
  return Object.entries(aliases)
    .filter(([, canonical]) => canonical.some((value) => values.includes(value)))
    .map(([alias]) => alias)
}
function tier(source: Source, concept: string[]): number | undefined {
  const direct = [...new Set([...concept, ...aliasesFor(concept)])]
  if (direct.some((term) => phrase(source.text, term)))
    return source.kind === 'blueprint-name'
      ? 0
      : source.kind === 'child-title' || source.kind === 'idea-title'
        ? 1
        : source.kind === 'blueprint-summary' || source.kind === 'idea-notes'
          ? 2
          : 4
  const rel = concept.flatMap((term) => related[term] ?? [])
  if (
    source.kind !== 'metadata' &&
    [...new Set([...rel, ...aliasesFor(rel)])].some((term) => phrase(source.text, term))
  )
    return 3
  return undefined
}
function rank(entry: Entry, queryConcepts: string[][]): number[] | undefined {
  const evidence = queryConcepts.map((concept) => {
    const tiers = projection(entry)
      .map((source) => tier(source, concept))
      .filter((value): value is number => value !== undefined)
    return tiers.length ? Math.min(...tiers) : undefined
  })
  if (evidence.some((value) => value === undefined)) return undefined
  const sorted = (evidence as number[]).sort((a, b) => a - b)
  return [Math.max(...sorted), sorted.reduce((a, b) => a + b, 0), ...sorted]
}
function compare(a: number[], b: number[]) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0)
    if (d) return d
  }
  return 0
}

export function searchLegacyV1(entries: Entry[], query: string): string[] {
  const parsed = concepts(query)
  if (!parsed.length) return query.trim() ? [] : entries.map(({ catalogKey }) => catalogKey).sort()
  return entries
    .map((entry) => ({ entry, rank: rank(entry, parsed) }))
    .filter((item): item is { entry: Entry; rank: number[] } => item.rank !== undefined)
    .sort(
      (a, b) =>
        compare(a.rank, b.rank) ||
        (a.entry.catalogKey < b.entry.catalogKey
          ? -1
          : a.entry.catalogKey > b.entry.catalogKey
            ? 1
            : 0)
    )
    .map(({ entry }) => entry.catalogKey)
}
