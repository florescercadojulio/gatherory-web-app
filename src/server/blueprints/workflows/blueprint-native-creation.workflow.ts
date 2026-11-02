import { Effect } from 'effect'
import { BlueprintNativeCreationRequestSchema } from '@/contracts/blueprint-native-creation.contracts'
import { BlueprintDraftContentSchema } from '@/contracts/blueprint-authoring.contracts'
import { ConflictError, ForbiddenError, InvalidInputError } from '@/lib/domain-errors'
import { validateInput } from '@/server/validation'
import { BlueprintAuthoringRepo } from '../repos/blueprint-authoring.repo'
import { BlueprintCaptureRepo } from '../repos/blueprint-capture.repo'
import { BlueprintNativeCreationRepo } from '../repos/blueprint-native-creation.repo'
import { BlueprintNativeCreationTransaction } from './blueprint-native-creation-transaction'
import {
  blueprintDraftContentHash,
  blueprintHash,
  legacyCompatibleCaptureSelection,
} from '../planning/blueprint-hash'
import { captureEventBlueprint } from '../planning/capture-event-blueprint.server'
import { createBlueprintAuthoringWorkspaceWorkflow } from './blueprint-authoring.workflow'
import { BetterAuthWorkspaceCon } from '@/server/workspaces/connectors/better-auth.con'
import { blueprintCoverCallbacksWorkflow } from './blueprint-cover-callbacks.workflow'

const conflict = (code: string) =>
  new ConflictError({
    category: 'conflict',
    code,
    userMessageKey: 'serverErrors.CONFLICT',
  })
const sourceChanged = () => conflict('BLUEPRINT_CAPTURE_SOURCE_CHANGED')

/** Consumer templates belong to the actor's personal authoring organization,
 * independently of the event's organization or the active session workspace.
 * Provisioning is explicit through Create & Share, never a source/review read.
 */
export const personalTemplateOwner = (actor: { id: string; name: string }) =>
  Effect.gen(function* () {
    const authoring = yield* BlueprintAuthoringRepo
    const current = yield* authoring.context(actor.id)
    const personal = current.workspaces.find((workspace) => workspace.personal)
    if (personal) return personal.id
    const auth = yield* BetterAuthWorkspaceCon
    yield* auth
      .createOrganization({
        userId: actor.id,
        name: `${Array.from(actor.name).slice(0, 140).join('')}'s Templates`,
        slug: `personal-${actor.id.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`,
      })
      .pipe(
        // Concurrent first creations may race on the deterministic slug.
        Effect.catch((cause) =>
          authoring
            .context(actor.id)
            .pipe(
              Effect.flatMap((context) =>
                context.workspaces.some((workspace) => workspace.personal)
                  ? Effect.void
                  : Effect.fail(cause)
              )
            )
        )
      )
    const refreshed = yield* authoring.context(actor.id)
    const owned = refreshed.workspaces.find((workspace) => workspace.personal)
    if (!owned)
      return yield* Effect.fail(
        new ForbiddenError({
          category: 'authorization',
          code: 'BLUEPRINT_AUTHORING_FORBIDDEN',
          userMessageKey: 'serverErrors.AUTHORIZATION',
        })
      )
    return owned.id
  })

export const blueprintNativeCreationWorkflow = (
  actor: { id: string; name: string },
  input: unknown
) =>
  Effect.gen(function* () {
    const request = yield* validateInput(BlueprintNativeCreationRequestSchema, input)
    const capture = yield* BlueprintCaptureRepo
    switch (request.action) {
      case 'source': {
        const result = yield* capture.source(actor.id, request.eventId)
        const context = yield* (yield* BlueprintAuthoringRepo).context(actor.id)
        return { ...result, workspaces: context.workspaces }
      }
      case 'review': {
        const result = yield* capture.source(actor.id, request.eventId)
        if (result.sourceHash !== request.expectedSourceHash)
          return yield* Effect.fail(sourceChanged())
        const content = yield* Effect.try({
          try: () => captureEventBlueprint(result.source, request.selection, request.name),
          catch: (cause) =>
            new InvalidInputError({
              category: 'validation',
              code: 'INVALID_BLUEPRINT_CAPTURE',
              userMessageKey: 'serverErrors.VALIDATION',
              cause,
            }),
        })
        return {
          content,
          sourceHash: result.sourceHash,
          reviewHash: blueprintDraftContentHash(content),
          ...(request.discoverable ? { discoverable: true } : {}),
        }
      }
      case 'create': {
        // Source authority must precede any external personal-owner provisioning.
        yield* capture.source(actor.id, request.eventId)
        const organizationId = request.organizationId ?? (yield* personalTemplateOwner(actor))
        const authoring = yield* BlueprintAuthoringRepo
        const nativeCreation = yield* BlueprintNativeCreationRepo
        const transaction = yield* BlueprintNativeCreationTransaction
        return yield* transaction.withTransaction(
          Effect.gen(function* () {
            // Recheck current source authority inside the transaction on every attempt,
            // including exact retries after a lost response.
            yield* capture.source(actor.id, request.eventId)
            const draft = yield* capture.save(actor.id, {
              eventId: request.eventId,
              selection: request.selection,
              expectedSourceHash: request.expectedSourceHash,
              name: request.name,
              organizationId,
              requestId: request.requestId,
            })
            const capturedContent =
              draft.source && 'eventId' in draft.source && draft.source.eventId === request.eventId
                ? BlueprintDraftContentSchema.parse(draft.source.capturedContent)
                : undefined
            if (
              !capturedContent ||
              blueprintDraftContentHash(capturedContent) !== request.expectedReviewHash
            )
              return yield* Effect.fail(conflict('BLUEPRINT_NATIVE_REVIEW_CHANGED'))

            const nativeRequestHash = blueprintHash({
              ...request,
              organizationId,
              selection: legacyCompatibleCaptureSelection(request.selection),
            })
            const priorNativeHash =
              draft.source && 'eventId' in draft.source
                ? draft.source.nativeCreationRequestHash
                : undefined
            if (priorNativeHash && priorNativeHash !== nativeRequestHash)
              return yield* Effect.fail(conflict('BLUEPRINT_CREATE_REQUEST_CONFLICT'))
            // A legacy committed unlisted request cannot become public merely
            // by replaying its UUID with a new visibility flag.
            if (!priorNativeHash && draft.publishedRevision !== null && request.discoverable)
              return yield* Effect.fail(conflict('BLUEPRINT_CREATE_REQUEST_CONFLICT'))
            if (!priorNativeHash)
              yield* nativeCreation.recordRequestFingerprint(draft.id, nativeRequestHash)

            // Native creation publishes only the immutable initial capture (draft version 1).
            // The authoring repo replays that publication before checking the current draft version.
            const coverCallbacks = yield* blueprintCoverCallbacksWorkflow()
            const published = yield* authoring.publish(
              actor.id,
              {
                id: draft.id,
                expectedVersion: 1,
              },
              coverCallbacks
            )
            // Listing is access metadata; the published document stays immutable.
            // A replay never re-lists a publication that its owner withdrew.
            if (!priorNativeHash && request.discoverable)
              yield* nativeCreation.listInitialRevision(
                published.id,
                published.publication.revision
              )
            return {
              templateId: published.id,
              revision: published.publication.revision,
            }
          })
        )
      }
      case 'workspace': {
        // The source grant is independent from ownership of a publishing destination.
        yield* capture.source(actor.id, request.eventId)
        return yield* createBlueprintAuthoringWorkspaceWorkflow(actor)
      }
    }
  })
