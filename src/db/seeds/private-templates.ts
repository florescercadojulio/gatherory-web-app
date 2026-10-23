import { Effect } from 'effect'

import { PgClientLive } from '@/db'
import { cottageDraftContent } from '@/db/seeds/cottage-template'
import {
  draftDefinition,
  type BlueprintDraftContent,
} from '@/contracts/blueprint-authoring.contracts'
import { blueprintHash } from '@/server/blueprints/planning/blueprint-hash'
import assignments from '@/server/blueprints/catalog/seed-image-assignments.json'
import assets from '@/server/blueprints/catalog/seed-image-assets.json'
import {
  assertSeedImageCoverage,
  resolveSeedImageTargets,
  SeedImageAssetsSchema,
  SeedImageAssignmentsSchema,
} from '@/server/blueprints/catalog/seed-image-registry'
import { materializeTrustedSeedImagesLive } from '@/server/blueprint-media/blueprint-cover.service'
import {
  createBlueprintDraft,
  publishBlueprintDraft,
} from '@/server/blueprints/workflows/blueprint-authoring.workflows.live'

const cottagePublishRequestId = 'c0000000-0000-4000-8000-000000000001'
const cottageDraftRequestId = 'c0000000-0000-4000-8000-000000000002'

function privateCottageSeedImageSource() {
  const definition = draftDefinition(cottageDraftContent, 'seed_private_cottage', 1)
  const contentHash = blueprintHash(definition)
  const entry = {
    catalogKey: 'seed_private_cottage',
    revision: 1,
    contentHash,
    definition,
  }
  const parsedAssignments = SeedImageAssignmentsSchema.parse(assignments)
  const parsedAssets = SeedImageAssetsSchema.parse(assets)
  assertSeedImageCoverage([entry], parsedAssignments, parsedAssets, {
    allowUnmatchedAssignments: true,
  })
  const targets = resolveSeedImageTargets({
    entry,
    assignments: parsedAssignments,
    assets: parsedAssets,
  })
  if (!targets?.root) throw new Error('Private cottage seed is missing its root image.')
  return { definition, contentHash, entry, targets }
}

/** Validate private template coverage before development reset starts deleting rows. */
export function assertPrivateTemplateSeedImageCoverage() {
  privateCottageSeedImageSource()
}

/** Seeds an App Review-owned published cottage and a separate editable draft. */
export async function seedPrivateTemplates(actorId: string, organizationId: string) {
  const { contentHash, entry, targets } = privateCottageSeedImageSource()
  const rootTarget = targets.root!
  const sourceImageIds = await Effect.runPromise(
    materializeTrustedSeedImagesLive({
      actorUserId: actorId,
      requestId: 'c0000000-0000-4000-8000-000000000003',
      catalogKey: entry.catalogKey,
      revision: entry.revision,
      contentHash,
      images: [rootTarget, ...Object.values(targets.children), ...Object.values(targets.ideas)].map(
        ({ assetKey, manifest }) => ({ assetKey, manifest })
      ),
    })
  )
  const imageCoveredCottageContent: BlueprintDraftContent = {
    ...cottageDraftContent,
    coverAssetId: sourceImageIds[rootTarget.assetKey],
    children: cottageDraftContent.children.map((child) => ({
      ...child,
      coverAssetId: sourceImageIds[targets.children[child.key]!.assetKey],
    })),
    ideas: cottageDraftContent.ideas.map((idea) => ({
      ...idea,
      coverAssetId: sourceImageIds[targets.ideas[idea.key]!.assetKey],
    })),
  }
  const publishedSourceDraft = await Effect.runPromise(
    createBlueprintDraft(actorId, {
      requestId: cottagePublishRequestId,
      organizationId,
      content: imageCoveredCottageContent,
    }).pipe(Effect.provide(PgClientLive))
  )
  let publishedCottage = publishedSourceDraft
  if (publishedSourceDraft.publishedRevision === null) {
    if (publishedSourceDraft.draftVersion !== 1) {
      throw new Error(
        `Refusing to publish edited cottage draft ${publishedSourceDraft.id} at version ${publishedSourceDraft.draftVersion}; expected unpublished seed version 1.`
      )
    }
    publishedCottage = await Effect.runPromise(
      publishBlueprintDraft(actorId, {
        id: publishedSourceDraft.id,
        expectedVersion: 1,
      }).pipe(Effect.provide(PgClientLive))
    )
  }

  const rapidTestDraft = await Effect.runPromise(
    createBlueprintDraft(actorId, {
      requestId: cottageDraftRequestId,
      organizationId,
      content: {
        ...imageCoveredCottageContent,
        name: 'Family Cottage Stay — Editing Draft',
        description:
          'Unpublished copy for rapidly testing private template editing and republishing.',
      },
    }).pipe(Effect.provide(PgClientLive))
  )

  return { publishedCottage, rapidTestDraft }
}
