import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'

import {
  MAX_IMAGE_BYTES,
  PrepareNativeMediaUploadInputSchema,
} from '@/server/media/contracts/media.contracts'

test('native media uploads require an idempotent asset id and enforce the R2 size limit', () => {
  const valid = PrepareNativeMediaUploadInputSchema.safeParse({
    scopeId: crypto.randomUUID(),
    mediaAssetId: crypto.randomUUID(),
    originalFilename: 'cover.heic',
    contentType: 'image/heic',
    byteSize: MAX_IMAGE_BYTES,
  })
  expect(valid.success).toBe(true)

  const oversized = PrepareNativeMediaUploadInputSchema.safeParse({
    scopeId: crypto.randomUUID(),
    mediaAssetId: crypto.randomUUID(),
    originalFilename: 'cover.heic',
    contentType: 'image/heic',
    byteSize: MAX_IMAGE_BYTES + 1,
  })
  expect(oversized.success).toBe(false)
})

test('native media canonicalizes Foundation UUIDs before R2 metadata is created', () => {
  const scopeId = 'A8EC5B55-A5F6-47C0-A334-FFB05EACAA6B'
  const mediaAssetId = 'D2380DE4-6658-40F9-9352-970BAFC6CB52'

  const parsed = PrepareNativeMediaUploadInputSchema.parse({
    scopeId,
    mediaAssetId,
    originalFilename: 'cover.heic',
    contentType: 'image/heic',
    byteSize: 1,
  })

  expect(parsed.scopeId).toBe(scopeId.toLowerCase())
  expect(parsed.mediaAssetId).toBe(mediaAssetId.toLowerCase())
})

test('native media routes authenticate and use the shared Effect boundary', () => {
  for (const route of ['prepare', 'finalize', 'url']) {
    const source = readFileSync(
      join(process.cwd(), `src/routes/api/media/native/${route}.ts`),
      'utf8'
    )
    expect(source).toMatch(/requestUser\(request\)/)
    expect(source).toMatch(/runServerResponse\(/)
    expect(source).toMatch(/provideMediaLayers\(/)
  }
  const authentication = readFileSync(join(process.cwd(), 'src/server/http-errors.ts'), 'utf8')
  expect(authentication).toMatch(/nativeSyncUser\(request\)/)
  expect(authentication).toMatch(/Effect\.fail\(\s*new ForbiddenError\(/)
  expect(authentication).toMatch(/code:\s*['"]UNAUTHORIZED['"],\s*httpStatus:\s*401\b/)
})

test('native materialization projects every image-bearing domain onto typed media joins', () => {
  const source = readFileSync(
    join(process.cwd(), 'src/server/sync/repos/native-materializer.persistence.ts'),
    'utf8'
  )
  expect(source).toMatch(/mainEventMediaAssetID/)
  expect(source).toMatch(/materializeEventCover/)
  expect(source).toMatch(/materializeIdeaCover/)
  expect(source).toMatch(/materializeRegistryCover/)
  expect(source).toMatch(/role:\s*['"]gallery['"]/)
})
