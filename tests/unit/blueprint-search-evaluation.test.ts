import { execFileSync } from 'node:child_process'
import { expect, test } from 'vitest'
import {
  buildOrphanTargetCatalog,
  buildSearchEvaluationCatalog,
  challengeCases,
  developmentCases,
} from '../fixtures/blueprint-search-evaluation'
import { pageBlueprintCatalog } from '@/server/blueprints/services/blueprint-discovery'

const catalog = buildSearchEvaluationCatalog()
function keys(query: string) {
  const result = pageBlueprintCatalog(catalog, { q: query, limit: 40 })
  if (!result.ok) throw new Error(result.reason)
  return result.page.entries.map(({ catalogKey }) => catalogKey)
}

test('the authored fixture catalog covers development and separate fresh challenge cases', () => {
  expect(developmentCases.length).toBeGreaterThan(20)
  expect(challengeCases.length).toBeGreaterThanOrEqual(8)
  expect(new Set([...developmentCases, ...challengeCases].map(({ id }) => id)).size).toBe(
    developmentCases.length + challengeCases.length
  )
})

test('title matches lead, bilingual wedding aliases work, and typo support stays bounded', () => {
  expect(keys('Woodland wedding')[0]).toBe('wedding_woodland')
  expect(keys('garden wedding')[0]).toBe('wedding_garden')
  expect(keys('bodas')).toContain('boda_jardin')
  expect(keys('weddings')).toContain('boda_aire_libre')
  expect(keys('weddng garden')).toContain('wedding_garden')
  expect(keys('outdoors wedding')).toEqual(keys('wedding outdoors'))
  expect(keys('camp')).toContain('camping')
  expect(keys('camp')).not.toContain('clamp_workshop')
  expect(keys('wed')).toEqual([])
  expect(keys('xqzvplm')).toEqual([])
})

test('generic event terms stay bounded and orphan-target ideas remain unsupported', () => {
  expect(keys('office reception')).toEqual(['office_reception'])
  expect(keys('award ceremony')).toEqual(['award_ceremony', 'office_reception'])
  const orphanCatalog = buildOrphanTargetCatalog()
  const orphanSearch = pageBlueprintCatalog(orphanCatalog, { q: 'wedding venue', limit: 40 })
  expect(orphanSearch.ok && orphanSearch.page.entries).toEqual([])
  expect(() => pageBlueprintCatalog(orphanCatalog, { q: '', limit: 40 })).toThrow()
})

test('fixture browse and nonempty-search paging are stable and the report is fresh', () => {
  const traverse = (limit: number, query = '') => {
    const result: string[] = []
    let cursor: string | undefined
    do {
      const page = pageBlueprintCatalog(catalog, {
        q: query,
        limit,
        ...(cursor ? { cursor } : {}),
      })
      if (!page.ok) throw new Error(page.reason)
      result.push(...page.page.entries.map(({ catalogKey }) => catalogKey))
      cursor = page.page.nextCursor
    } while (cursor)
    return result
  }
  expect(traverse(1)).toEqual(traverse(3))
  expect(new Set(traverse(2)).size).toBe(catalog.entries.length)
  expect(traverse(1, 'outdoors wedding')).toEqual(traverse(3, 'outdoors wedding'))
  expect(new Set(traverse(2, 'outdoors wedding')).size).toBe(traverse(2, 'outdoors wedding').length)
  execFileSync('pnpm', ['tsx', 'scripts/evaluate-blueprint-search.ts', '--check'], {
    stdio: 'pipe',
  })
})
