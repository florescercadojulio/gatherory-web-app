import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { Context, Effect, Layer } from 'effect'
import { expect, it, vi } from 'vitest'
import { cottageDraftContent } from '@/db/seeds/cottage-template'
import { draftDefinition } from '@/contracts/blueprint-authoring.contracts'
import { blueprintHash } from '@/server/blueprints/planning/blueprint-hash'
import assignmentRaw from '@/server/blueprints/catalog/seed-image-assignments.json'
import assetRaw from '@/server/blueprints/catalog/seed-image-assets.json'
import {
  resolveSeedImageTargets,
  SeedImageAssetsSchema,
  SeedImageAssignmentsSchema,
  seedImageTargetAssetKeys,
} from '@/server/blueprints/catalog/seed-image-registry'

const enabled = process.env.RUN_BLUEPRINT_DB_TESTS === '1'

async function localVariants(
  assetKey: string,
  asset: ReturnType<typeof SeedImageAssetsSchema.parse>[string]
) {
  const source = await readFile(path.resolve(process.cwd(), asset.file))
  const normalized = await sharp(source, { failOn: 'error', limitInputPixels: 40_000_000 })
    .rotate()
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer()
  const oriented = sharp(normalized, { failOn: 'error', limitInputPixels: 40_000_000 })
  const result = new Map<string, Buffer>()
  for (const variant of asset.manifest.variants) {
    const bytes = await oriented
      .clone()
      .resize({
        width: ({ thumbnail: 320, card: 960, hero: 1600 } as const)[variant.name],
        height: ({ thumbnail: 320, card: 960, hero: 1600 } as const)[variant.name],
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toBuffer()
    expect(createHash('sha256').update(bytes).digest('hex'), `${assetKey}/${variant.name}`).toBe(
      variant.checksum
    )
    const metadata = await sharp(bytes).metadata()
    expect({ format: metadata.format, width: metadata.width, height: metadata.height }).toEqual({
      format: 'jpeg',
      width: variant.width,
      height: variant.height,
    })
    result.set(variant.url, bytes)
  }
  return result
}

it.skipIf(!enabled)(
  'seeds the private cottage publication and editable draft with all eight local image targets idempotently',
  async () => {
    const databaseUrl = process.env.DATABASE_URL
    expect(databaseUrl, 'DATABASE_URL is required for the opt-in database test').toBeTruthy()
    expect(['localhost', '127.0.0.1', '[::1]']).toContain(new URL(databaseUrl!).hostname)

    const assignments = SeedImageAssignmentsSchema.parse(assignmentRaw)
    const assets = SeedImageAssetsSchema.parse(assetRaw)
    const definition = draftDefinition(cottageDraftContent, 'seed_private_cottage', 1)
    const contentHash = blueprintHash(definition)
    const targets = resolveSeedImageTargets({
      entry: {
        catalogKey: 'seed_private_cottage',
        revision: 1,
        contentHash,
      },
      assignments,
      assets,
    })
    expect(targets?.root).toBeDefined()
    expect(Object.keys(targets?.children ?? {})).toHaveLength(cottageDraftContent.children.length)
    expect(Object.keys(targets?.ideas ?? {})).toHaveLength(cottageDraftContent.ideas.length)
    const targetCount = 1 + cottageDraftContent.children.length + cottageDraftContent.ideas.length
    expect(targetCount).toBe(8)
    const assignedAssetKeys = seedImageTargetAssetKeys(targets!)
    const variantBytes = new Map<string, Buffer>()
    for (const assetKey of assignedAssetKeys) {
      for (const [url, bytes] of await localVariants(assetKey, assets[assetKey]!)) {
        variantBytes.set(url, bytes)
      }
    }

    const objects = new Map<string, Buffer>()
    const storage = {
      bucket: 'private-test-bucket',
      createUploadUrl: () => Effect.die('unused'),
      inspect: () => Effect.die('unused'),
      readBytes: ({ key }: { key: string }) => {
        const bytes = objects.get(key)
        return bytes ? Effect.succeed(bytes) : Effect.die(`missing test object ${key}`)
      },
      putBytes: ({ key, bytes }: { key: string; bytes: Buffer }) => {
        objects.set(key, bytes)
        return Effect.void
      },
      createReadUrl: () => Effect.die('unused'),
      delete: () => Effect.void,
    }
    class TestCoverStorage extends Context.Service<TestCoverStorage, typeof storage>()(
      'BlueprintCoverStorage'
    ) {}
    vi.doMock('@/server/blueprint-media/blueprint-cover.storage.live', () => ({
      BlueprintCoverStorage: TestCoverStorage,
      BlueprintCoverStorageLive: Layer.succeed(TestCoverStorage, storage),
    }))
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === 'string' || input instanceof URL ? String(input) : input.url
      const bytes = variantBytes.get(url)
      if (!bytes) throw new Error(`Unexpected seed image request: ${url}`)
      return new Response(new Uint8Array(bytes), { headers: { 'content-type': 'image/jpeg' } })
    })
    vi.stubGlobal('fetch', fetchMock)

    const database = await import('@/db')
    const schema = await import('@/db/schema')
    const blueprintSchema = await import('@/db/schema/blueprint.schema')
    const coverSchema = await import('@/db/schema/blueprint-media.schema')
    const { seedPrivateTemplates } = await import('@/db/seeds/private-templates')
    const { db } = database
    const suffix = crypto.randomUUID().replaceAll('-', '')
    const actorId = `private-cottage-seed-${suffix}`
    const organizationId = `private-cottage-workspace-${suffix}`

    try {
      await db.insert(schema.user).values({
        id: actorId,
        name: 'Private cottage seed fixture',
        email: `${actorId}@example.test`,
        emailVerified: true,
      })
      await db.insert(schema.organization).values({
        id: organizationId,
        name: 'Private cottage seed fixture',
        slug: organizationId,
        workspaceType: 'event',
        createdAt: new Date(),
      })
      await db.insert(schema.member).values({
        id: `private-cottage-member-${suffix}`,
        organizationId,
        userId: actorId,
        role: 'owner',
        createdAt: new Date(),
      })

      const first = await seedPrivateTemplates(actorId, organizationId)
      const publishedDraftId = first.publishedCottage.id
      const editableDraftId = first.rapidTestDraft.id
      expect(first.publishedCottage.publishedRevision).toBe(1)
      expect(first.rapidTestDraft.publishedRevision).toBeNull()
      expect(editableDraftId).not.toBe(publishedDraftId)
      const uniqueHeroChecksums = new Set(
        assignedAssetKeys.map(
          (assetKey) =>
            assets[assetKey]!.manifest.variants.find(({ name }) => name === 'hero')!.checksum
        )
      )
      expect(fetchMock).toHaveBeenCalledTimes(uniqueHeroChecksums.size * 3)

      const collectContentIDs = (content: {
        coverAssetId?: string | null
        children: Array<{ coverAssetId?: string | null }>
        ideas: Array<{ coverAssetId?: string | null }>
      }) => [
        content.coverAssetId,
        ...content.children.map((item) => item.coverAssetId),
        ...content.ideas.map((item) => item.coverAssetId),
      ]
      const draftRows = await db
        .select()
        .from(blueprintSchema.blueprintTemplate)
        .where(
          (await import('drizzle-orm')).eq(
            blueprintSchema.blueprintTemplate.organizationId,
            organizationId
          )
        )
      expect(draftRows).toHaveLength(2)
      const editableRow = draftRows.find((row) => row.id === editableDraftId)!
      const editableIDs = collectContentIDs(editableRow.content as never)
      expect(editableIDs).toHaveLength(targetCount)
      expect(editableIDs.every((id) => typeof id === 'string')).toBe(true)
      expect((editableRow.content as { ideas: unknown[] }).ideas).toHaveLength(4)

      const publishedRows = await db
        .select()
        .from(blueprintSchema.blueprintRevision)
        .where(
          (await import('drizzle-orm')).eq(
            blueprintSchema.blueprintRevision.templateId,
            publishedDraftId
          )
        )
      expect(publishedRows).toHaveLength(1)
      expect(publishedRows[0]!.catalogKey).toContain('private_')
      const publishedDefinition = publishedRows[0]!.document as {
        presentation?: { coverAssetId?: string | null }
        modules: Array<{
          type: string
          config: {
            children?: Array<{ coverAssetId?: string | null }>
            ideas?: Array<{ coverAssetId?: string | null }>
          }
        }>
      }
      const publishedTree = publishedDefinition.modules.find(
        (module) => module.type === 'experience_tree'
      )!
      const publishedIdeas = publishedDefinition.modules.find((module) => module.type === 'ideas')!
      const publishedIDs = [
        publishedDefinition.presentation?.coverAssetId,
        ...(publishedTree.config.children ?? []).map((item) => item.coverAssetId),
        ...(publishedIdeas.config.ideas ?? []).map((item) => item.coverAssetId),
      ]
      expect(publishedIDs).toHaveLength(targetCount)
      expect(publishedIDs.every((id) => typeof id === 'string')).toBe(true)
      expect(publishedIdeas.config.ideas).toHaveLength(4)
      const allIDs = [
        ...new Set(
          [...editableIDs, ...publishedIDs].filter((id): id is string => typeof id === 'string')
        ),
      ]
      const coverRows = await db
        .select()
        .from(coverSchema.blueprintCoverAsset)
        .where((await import('drizzle-orm')).inArray(coverSchema.blueprintCoverAsset.id, allIDs))
      expect(coverRows).toHaveLength(allIDs.length)
      expect(
        coverRows.every((cover) => cover.ownerUserId === actorId && cover.status === 'ready')
      ).toBe(true)
      const callsAfterFirstSeed = fetchMock.mock.calls.length
      const objectCountAfterFirstSeed = objects.size

      const second = await seedPrivateTemplates(actorId, organizationId)
      expect(second.publishedCottage.id).toBe(publishedDraftId)
      expect(second.rapidTestDraft.id).toBe(editableDraftId)
      expect(second.publishedCottage.publishedRevision).toBe(1)
      expect(
        await db
          .select()
          .from(blueprintSchema.blueprintRevision)
          .where(
            (await import('drizzle-orm')).eq(
              blueprintSchema.blueprintRevision.templateId,
              publishedDraftId
            )
          )
      ).toHaveLength(1)
      expect(fetchMock).toHaveBeenCalledTimes(callsAfterFirstSeed)
      expect(objects.size).toBe(objectCountAfterFirstSeed)
    } finally {
      const { eq } = await import('drizzle-orm')
      await db.delete(schema.organization).where(eq(schema.organization.id, organizationId))
      await db.delete(schema.user).where(eq(schema.user.id, actorId))
      vi.unstubAllGlobals()
      vi.doUnmock('@/server/blueprint-media/blueprint-cover.storage.live')
    }
  },
  60_000
)
