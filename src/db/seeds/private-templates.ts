import { Effect } from 'effect'

import { PgClientLive } from '@/db'
import { cottageDraftContent } from '@/db/seeds/cottage-template'
import {
  createBlueprintDraft,
  publishBlueprintDraft,
} from '@/server/blueprints/workflows/blueprint-authoring.workflows.live'

const cottagePublishRequestId = 'c0000000-0000-4000-8000-000000000001'
const cottageDraftRequestId = 'c0000000-0000-4000-8000-000000000002'

/** Seeds an App Review-owned published cottage and a separate editable draft. */
export async function seedPrivateTemplates(actorId: string, organizationId: string) {
  const publishedSourceDraft = await Effect.runPromise(
    createBlueprintDraft(actorId, {
      requestId: cottagePublishRequestId,
      organizationId,
      content: cottageDraftContent,
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
        ...cottageDraftContent,
        name: 'Family Cottage Stay — Editing Draft',
        description:
          'Unpublished copy for rapidly testing private template editing and republishing.',
      },
    }).pipe(Effect.provide(PgClientLive))
  )

  return { publishedCottage, rapidTestDraft }
}
