import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import { BlueprintDraftContentSchema } from '@/contracts/blueprint-authoring.contracts'
import { ConflictError, serverOperationError } from '@/lib/domain-errors'
import { BlueprintAuthoringRepo } from './blueprint-authoring.repo'
import { BlueprintCaptureRepo } from './blueprint-capture.repo'
import { BlueprintNativeCreationRepo } from './blueprint-native-creation.repo'
import { blueprintHash } from '../planning/blueprint-hash'

const conflict = (code: string) =>
  new ConflictError({ category: 'conflict', code, userMessageKey: 'serverErrors.CONFLICT' })

export const BlueprintNativeCreationRepoLive = Layer.effect(
  BlueprintNativeCreationRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const capture = yield* BlueprintCaptureRepo
    const authoring = yield* BlueprintAuthoringRepo
    const create: BlueprintNativeCreationRepo['Service']['create'] = (actorId, input) =>
      pg
        .withTransaction(
          Effect.gen(function* () {
            // Recheck the event grant on every attempt, including a lost-response replay.
            yield* capture.source(actorId, input.eventId)
            const draft = yield* capture.save(actorId, {
              eventId: input.eventId,
              selection: input.selection,
              expectedSourceHash: input.expectedSourceHash,
              name: input.name,
              organizationId: input.organizationId,
              requestId: input.requestId,
            })
            const capturedContent =
              draft.source && 'eventId' in draft.source && draft.source.eventId === input.eventId
                ? BlueprintDraftContentSchema.parse(draft.source.capturedContent)
                : undefined
            if (!capturedContent || blueprintHash(capturedContent) !== input.expectedReviewHash)
              return yield* Effect.fail(conflict('BLUEPRINT_NATIVE_REVIEW_CHANGED'))

            const nativeRequestHash = blueprintHash(input)
            const priorNativeHash =
              draft.source && 'eventId' in draft.source
                ? draft.source.nativeCreationRequestHash
                : undefined
            if (priorNativeHash && priorNativeHash !== nativeRequestHash)
              return yield* Effect.fail(conflict('BLUEPRINT_CREATE_REQUEST_CONFLICT'))
            // A legacy committed unlisted request cannot become public merely
            // by replaying its UUID with a new visibility flag.
            if (!priorNativeHash && draft.publishedRevision !== null && input.discoverable)
              return yield* Effect.fail(conflict('BLUEPRINT_CREATE_REQUEST_CONFLICT'))
            if (!priorNativeHash)
              yield* pg`UPDATE blueprint_template
                SET source = ${JSON.stringify({ ...draft.source, nativeCreationRequestHash: nativeRequestHash })}::jsonb
                WHERE id = ${draft.id}`

            // Native creation publishes only the immutable initial capture (draft version 1).
            // The authoring repo replays that publication before checking the current draft version.
            const published = yield* authoring.publish(actorId, {
              id: draft.id,
              expectedVersion: 1,
            })
            // Listing is access metadata; the published document stays immutable.
            // A replay never re-lists a publication that its owner withdrew.
            if (!priorNativeHash && input.discoverable)
              yield* pg`UPDATE blueprint_template SET listed_revision = ${published.publication.revision}
                WHERE id = ${published.id}`
            return {
              templateId: published.id,
              revision: published.publication.revision,
            }
          })
        )
        .pipe(
          Effect.provideService(PgClient, pg),
          Effect.mapError((cause) =>
            serverOperationError(cause, {
              category: 'system',
              code: 'BLUEPRINT_NATIVE_CREATION_FAILED',
              userMessageKey: 'serverErrors.SYSTEM',
            })
          )
        )
    return { create }
  })
)
