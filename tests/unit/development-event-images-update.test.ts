import { afterEach, describe, expect, test, vi } from 'vitest'

import { preflightDevelopmentEventImages } from '@/db/seeds/development-event-images-update'
import { developmentEventImages } from '@/db/seeds/development-event-images'

const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0xff, 0xd9])

describe('development event image updater preflight', () => {
  afterEach(() => vi.unstubAllEnvs())

  test('checks bundled JPEGs in dry-run without requiring R2 configuration', async () => {
    vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', '')
    vi.stubEnv('CLOUDFLARE_R2_ACCESS_KEY_ID', '')
    vi.stubEnv('CLOUDFLARE_R2_SECRET_ACCESS_KEY', '')
    vi.stubEnv('CLOUDFLARE_R2_PRIVATE_BUCKET_NAME', '')
    const readAsset = vi.fn(async () => validJpeg)

    await expect(
      preflightDevelopmentEventImages({
        databaseUrl: 'postgresql://localhost:5438/gatherory',
        readAsset,
      })
    ).resolves.toEqual({ images: 21, mode: 'dry-run' })
    expect(readAsset).toHaveBeenCalledTimes(developmentEventImages.length)
  })

  test('rejects database targets outside the local fixture databases', async () => {
    await expect(
      preflightDevelopmentEventImages({
        databaseUrl: 'postgresql://example.com/gatherory',
        readAsset: async () => validJpeg,
      })
    ).rejects.toThrow('allowlisted local gatherory database')
    await expect(
      preflightDevelopmentEventImages({
        databaseUrl: 'postgresql://localhost/gatherory_seed_images_test_74291',
        nodeEnv: 'development',
        readAsset: async () => validJpeg,
      })
    ).rejects.toThrow('allowlisted local gatherory database')
  })

  test('rejects missing private development configuration before apply', async () => {
    vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', '')
    vi.stubEnv('CLOUDFLARE_R2_ACCESS_KEY_ID', '')
    vi.stubEnv('CLOUDFLARE_R2_SECRET_ACCESS_KEY', '')
    await expect(
      preflightDevelopmentEventImages({
        databaseUrl: 'postgresql://localhost/gatherory',
        apply: true,
        privateBucket: 'gatherory-private-prod',
        readAsset: async () => validJpeg,
      })
    ).rejects.toThrow('private development bucket')
    await expect(
      preflightDevelopmentEventImages({
        databaseUrl: 'postgresql://localhost/gatherory',
        apply: true,
        privateBucket: 'gatherory-private-dev',
        readAsset: async () => validJpeg,
      })
    ).rejects.toThrow('R2 credentials')
  })

  test('rejects non-JPEG catalog bytes before any database or storage access', async () => {
    await expect(
      preflightDevelopmentEventImages({
        databaseUrl: 'postgresql://localhost/gatherory',
        assets: [developmentEventImages[0]],
        readAsset: async () => Buffer.from('not a jpeg'),
      })
    ).rejects.toThrow('supported JPEG')
  })
})
