import { describe, expect, it } from 'vitest'
import manifest from '@/server/blueprints/catalog/cover-manifests/garden-wedding.json'
import { ExploreCoverManifestSchema } from '@/server/blueprints/catalog/explore-cover-manifest'

const edited = (change: (value: typeof manifest) => void) => {
  const value = structuredClone(manifest)
  change(value)
  return ExploreCoverManifestSchema.safeParse(value)
}

describe('curated Explore cover publication manifest', () => {
  it('accepts all three published variants and keeps provenance', () => {
    const parsed = ExploreCoverManifestSchema.parse(manifest)
    expect(parsed.label).toBe(manifest.label)
    expect(parsed.source).toEqual(manifest.source)
    expect(parsed.variants.map(({ name }) => name)).toEqual(['thumbnail', 'card', 'hero'])
  })

  it.each(['thumbnail', 'card', 'hero'])('requires the %s variant', (name) => {
    expect(
      edited((value) => {
        value.variants = value.variants.filter((variant) => variant.name !== name)
      }).success
    ).toBe(false)
  })

  it('rejects duplicate variants', () => {
    expect(
      edited((value) => {
        value.variants[0] = value.variants[1]!
      }).success
    ).toBe(false)
  })

  it.each([
    'https://example.com/explore/covers/a/' + 'a'.repeat(64) + '/hero.jpg',
    'http://cdn.gatherory.com/explore/covers/a/' + 'a'.repeat(64) + '/hero.jpg',
    manifest.variants[2]!.url + '?redirect=1',
    manifest.variants[2]!.url + '#fragment',
    manifest.variants[2]!.url.replace('https://', 'https://user:password@'),
  ])('rejects a noncanonical hero URL %s', (url) => {
    expect(
      edited((value) => {
        value.variants[2]!.url = url
      }).success
    ).toBe(false)
  })

  it('rejects variants from another immutable image', () => {
    expect(
      edited((value) => {
        value.variants[2]!.url = value.variants[2]!.url.replace(
          '/garden-wedding/',
          '/different-cover/'
        )
        value.variants[2]!.key = new URL(value.variants[2]!.url).pathname.slice(1)
      }).success
    ).toBe(false)
  })

  it('rejects URL/key mismatches', () => {
    expect(
      edited((value) => {
        value.variants[0]!.key = 'some-other-object.jpg'
      }).success
    ).toBe(false)
  })

  it.each([0, 1, 2])('enforces variant %s dimension bounds', (index) => {
    expect(
      edited((value) => {
        value.variants[index]!.height = 1601
      }).success
    ).toBe(false)
  })

  it('rejects invalid checksums', () => {
    expect(
      edited((value) => {
        value.variants[0]!.checksum = 'not-a-hash'
      }).success
    ).toBe(false)
  })

  it('rejects oversized source images', () => {
    expect(
      edited((value) => {
        value.source.width = 10000
        value.source.height = 10000
      }).success
    ).toBe(false)
  })

  it('rejects a private bucket manifest', () => {
    expect(
      edited((value) => {
        value.bucket = 'gatherory-private'
      }).success
    ).toBe(false)
  })
})
