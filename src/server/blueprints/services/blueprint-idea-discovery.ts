import { createHash } from 'node:crypto'
import {
  BlueprintIdeaDiscoveryResponseSchema,
  type BlueprintIdeaDiscoveryRequest,
} from '@/contracts/blueprint-idea-discovery.contracts'
import type { BlueprintCatalogResponseSchema } from '@/contracts/blueprint-discovery.contracts'
import type { z } from 'zod'
import { BlueprintIdeasModuleSchema } from '@/contracts/blueprint-install.contracts'
import { compareSearchRank, rankBlueprintIdeaSearch } from './blueprint-discovery'

type Catalog = z.infer<typeof BlueprintCatalogResponseSchema>
type IdeaItem = z.infer<typeof BlueprintIdeaDiscoveryResponseSchema>['ideas'][number]

function queryDigest(q: string) {
  return createHash('sha256').update(q).digest('base64url').slice(0, 16)
}

function decodeCursor(
  cursor: string | undefined,
  q: string,
  snapshot: string,
  resultCount: number
): number {
  if (!cursor) return 0
  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString()) as {
      v?: number
      q?: string
      s?: string
      o?: number
    }
    if (
      value.v !== 1 ||
      value.q !== queryDigest(q) ||
      value.s !== snapshot ||
      !Number.isSafeInteger(value.o) ||
      value.o! < 0 ||
      value.o! >= resultCount
    )
      throw new Error()
    return value.o!
  } catch {
    throw new Error('BLUEPRINT_IDEA_CURSOR_INVALID')
  }
}

export function discoverBlueprintIdeas(catalog: Catalog, request: BlueprintIdeaDiscoveryRequest) {
  const items: IdeaItem[] = []
  for (const entry of catalog.entries) {
    const ideas = entry.definition.modules.flatMap((module) => {
      const parsed = BlueprintIdeasModuleSchema.safeParse(module)
      return parsed.success ? parsed.data.config.ideas : []
    })
    for (const rawIdea of ideas) {
      // Keep only the schema-owned cover reference, separate from portable configuration.
      const idea = {
        key: rawIdea.key,
        title: rawIdea.title,
        category: rawIdea.category,
        ...(rawIdea.notes !== undefined ? { notes: rawIdea.notes } : {}),
        target: rawIdea.target,
        configuration: rawIdea.configuration,
      }
      const parsedItem = {
        id: `${entry.catalogKey}:${entry.revision}:${idea.key}`,
        sourceBlueprintId: entry.catalogKey,
        sourceVersion: entry.revision,
        sourceTitle: entry.definition.blueprint.name,
        ...(entry.creator ? { creator: entry.creator } : {}),
        idea,
        ...(rawIdea.coverAssetId ? { coverAssetId: rawIdea.coverAssetId } : {}),
        ...(entry.discovery.coverImages?.ideas[idea.key]
          ? { coverImageURL: entry.discovery.coverImages.ideas[idea.key] }
          : {}),
      }
      items.push(BlueprintIdeaDiscoveryResponseSchema.shape.ideas.element.parse(parsedItem))
    }
  }
  const ranks = rankBlueprintIdeaSearch(
    request.q,
    items.map(({ idea }) => ({
      title: idea.title,
      ...(idea.notes !== undefined ? { notes: idea.notes } : {}),
    }))
  )
  const candidates = items.flatMap((item, index) =>
    ranks[index] === undefined ? [] : [{ item, rank: ranks[index]! }]
  )
  candidates.sort((a, b) => compareSearchRank(a.rank, b.rank) || a.item.id.localeCompare(b.item.id))
  const snapshot = createHash('sha256')
    .update(JSON.stringify(candidates.map(({ item }) => item.id)))
    .digest('base64url')
    .slice(0, 20)
  const offset = decodeCursor(request.cursor, request.q, snapshot, candidates.length)
  const page = candidates.slice(offset, offset + request.limit)
  const nextOffset = offset + page.length
  return BlueprintIdeaDiscoveryResponseSchema.parse({
    ideas: page.map(({ item }) => item),
    ...(nextOffset < candidates.length
      ? {
          nextCursor: Buffer.from(
            JSON.stringify({ v: 1, q: queryDigest(request.q), s: snapshot, o: nextOffset })
          ).toString('base64url'),
        }
      : {}),
  })
}
