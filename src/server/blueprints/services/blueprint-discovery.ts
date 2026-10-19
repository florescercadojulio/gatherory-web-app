import type { BlueprintCatalogRevision } from '@/contracts/blueprint-install.contracts'
import type { BlueprintDiscovery } from '@/contracts/blueprint-discovery.contracts'
import { exploreCollections } from '../catalog/explore-collections'

/** Discovery copy is editable independently of the immutable installation source. */
export function blueprintDiscovery(entry: BlueprintCatalogRevision): BlueprintDiscovery {
  const collection = exploreCollections.find(({ key }) => key === entry.catalogKey)
  if (collection) return collection.discovery
  if (entry.catalogKey === 'birthday') {
    return {
      categories: ['birthdays'],
      tags: ['birthday', 'party', 'cake', 'games', 'celebration'],
      summary: 'Bring a birthday party together with food, activities, and time to celebrate.',
    }
  }
  if (entry.catalogKey === 'thanksgiving') {
    return {
      categories: ['holidays'],
      tags: ['thanksgiving', 'friendsgiving', 'holiday', 'dinner', 'potluck'],
      summary:
        'Plan a Thanksgiving gathering on your chosen date, with shared food and time together.',
    }
  }
  if (entry.catalogKey === 'wedding') {
    return {
      categories: ['weddings'],
      tags: ['wedding', 'ceremony', 'reception', 'celebration'],
      summary: 'Plan your wedding, from the first venue visit to the celebration.',
    }
  }
  // Every published starter has a browse destination, including future types.
  const categories: Record<string, BlueprintDiscovery['categories'][number]> = {
    wedding: 'weddings',
    birthday: 'birthdays',
    holiday: 'holidays',
  }
  return {
    categories: [categories[entry.definition.experienceDefaults.type] ?? 'events'],
    tags: [],
    summary: '',
  }
}

export function buildBlueprintCatalog(
  entries: (BlueprintCatalogRevision & { description?: string })[]
) {
  const latest = new Map<string, BlueprintCatalogRevision & { description?: string }>()
  for (const entry of entries) {
    if (entry.revision > (latest.get(entry.catalogKey)?.revision ?? 0)) {
      latest.set(entry.catalogKey, entry)
    }
  }
  return {
    entries: [...latest.values()]
      .sort((a, b) => a.catalogKey.localeCompare(b.catalogKey))
      .map(({ catalogKey, revision, contentHash, definition, description }) => ({
        catalogKey,
        revision,
        contentHash,
        definition,
        discovery: {
          ...blueprintDiscovery({ catalogKey, revision, contentHash, definition }),
          ...(description ? { summary: Array.from(description).slice(0, 500).join('') } : {}),
        },
      })),
  }
}
