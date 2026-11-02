import { expect, test, vi } from 'vitest'
import { Effect } from 'effect'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'
import { createMcpBlueprintSearchPromiseAdapter } from '@/server/mcp/blueprints.promise.adapter'

test('Blueprint search adapter executes the injected Effect catalog and preserves the Promise MCP shape', async () => {
  const catalog = vi.fn(() =>
    Effect.succeed({
      entries: [
        {
          ...weddingBlueprintV1,
          discovery: {
            categories: ['weddings'] as ['weddings'],
            tags: ['private metadata'],
            summary: 'Plan a wedding',
          },
          discoveryContext: undefined,
        },
      ],
      nextCursor: 'next',
      availableCategories: ['weddings'] as ['weddings'],
    })
  )
  const search = createMcpBlueprintSearchPromiseAdapter(catalog)
  const result = await search({ query: 'Wédding', limit: 4 }, { userId: 'verified-account' })

  expect(catalog).toHaveBeenCalledWith('verified-account', { q: 'wedding', limit: 4 })
  expect(result).toEqual({
    items: [{ catalogKey: 'wedding', revision: 1, name: 'Wedding', summary: 'Plan a wedding' }],
    nextCursor: 'next',
  })
  expect(JSON.stringify(result)).not.toContain('private metadata')
})

test('Blueprint search adapter preserves typed Effect failures as Promise rejections', async () => {
  const search = createMcpBlueprintSearchPromiseAdapter(() => Effect.fail(new Error('unavailable')))
  await expect(search({ query: 'wedding' }, { userId: 'account' })).rejects.toThrow('unavailable')
})
