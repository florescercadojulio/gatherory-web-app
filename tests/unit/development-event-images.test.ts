import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { developmentEventImages } from '@/db/seeds/development-event-images'

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url))

const expectedEntityTargets = [
  'workspace:10000000-0000-4000-8000-000000000001',
  'event:10000000-0000-4000-8000-000000000002',
  'event:10000000-0000-4000-8000-000000000003',
  'event:10000000-0000-4000-8000-000000000004',
  'event:10000000-0000-4000-8000-000000000005',
  'event:10000000-0000-4000-8000-000000000006',
  'event:10000000-0000-4000-8000-000000000007',
  ...Array.from(
    { length: 13 },
    (_, index) => `idea:20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`
  ),
  'registry_item:60000000-0000-4000-8000-000000000001',
]

function jpegDimensions(bytes: Buffer) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null

  const startOfFrameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ])

  for (let offset = 2; offset + 8 < bytes.length;) {
    if (bytes[offset] !== 0xff) return null
    while (bytes[offset] === 0xff) offset += 1
    const marker = bytes[offset]
    offset += 1

    // Standalone markers have no length field.
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7))
      continue

    const segmentLength = bytes.readUInt16BE(offset)
    if (segmentLength < 2 || offset + segmentLength > bytes.length) return null
    if (startOfFrameMarkers.has(marker)) {
      return {
        height: bytes.readUInt16BE(offset + 3),
        width: bytes.readUInt16BE(offset + 5),
      }
    }

    offset += segmentLength
  }

  return null
}

describe('development wedding event image catalog', () => {
  test('covers every stable fixture image target exactly once', () => {
    const actualTargets = developmentEventImages.map(
      ({ entityType, entityID }) => `${entityType}:${entityID}`
    )

    expect(developmentEventImages).toHaveLength(21)
    expect(actualTargets).toHaveLength(new Set(actualTargets).size)
    expect([...actualTargets].sort()).toEqual([...expectedEntityTargets].sort())
    expect(
      developmentEventImages.filter(({ entityType }) => entityType === 'workspace')
    ).toHaveLength(1)
    expect(developmentEventImages.filter(({ entityType }) => entityType === 'event')).toHaveLength(
      6
    )
    expect(developmentEventImages.filter(({ entityType }) => entityType === 'idea')).toHaveLength(
      13
    )
    expect(
      developmentEventImages.filter(({ entityType }) => entityType === 'registry_item')
    ).toHaveLength(1)
  })

  test('uses unique photo sources and checked-in, bounded JPEGs with attribution', () => {
    const photoIDs = developmentEventImages.map(({ photoID }) => photoID)
    const files = developmentEventImages.map(({ file }) => file)

    expect(photoIDs).toHaveLength(new Set(photoIDs).size)
    expect(files).toHaveLength(new Set(files).size)

    for (const image of developmentEventImages) {
      expect(image.photographer, image.key).toBeTruthy()
      expect(image.altText, image.key).toBeTruthy()
      expect(image.sourceURL, image.key).toMatch(/^https:\/\/unsplash\.com\/photos\//)

      const path = new URL(image.file, `file://${repositoryRoot}/`)
      const bytes = readFileSync(path)
      const dimensions = jpegDimensions(bytes)
      const size = statSync(path).size

      expect(dimensions, image.file).not.toBeNull()
      expect(dimensions!.width, image.file).toBeLessThanOrEqual(1024)
      expect(dimensions!.height, image.file).toBeLessThanOrEqual(1024)
      expect(size, image.file).toBeGreaterThan(10_000)
      expect(size, image.file).toBeLessThan(1_500_000)
    }
  })
})
