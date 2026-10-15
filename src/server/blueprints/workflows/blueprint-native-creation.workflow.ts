import { Effect } from 'effect'
import { BlueprintNativeCreationRequestSchema } from '@/contracts/blueprint-native-creation.contracts'
import { ConflictError, ForbiddenError, InvalidInputError } from '@/lib/domain-errors'
import { validateInput } from '@/server/validation'
import { BlueprintAuthoringRepo } from '../repos/blueprint-authoring.repo'
import { BlueprintCaptureRepo } from '../repos/blueprint-capture.repo'
import { BlueprintNativeCreationRepo } from '../repos/blueprint-native-creation.repo'
import { blueprintHash } from '../planning/blueprint-hash'
import { captureEventBlueprint } from '../planning/capture-event-blueprint.server'
import { createBlueprintAuthoringWorkspaceWorkflow } from './blueprint-authoring.workflow'
import { BetterAuthWorkspaceCon } from '@/server/workspaces/connectors/better-auth.con'

const sourceChanged = () =>
  new ConflictError({
    category: 'conflict',
    code: 'BLUEPRINT_CAPTURE_SOURCE_CHANGED',
    userMessageKey: 'serverErrors.CONFLICT',
  })

/** Consumer templates belong to the actor's personal authoring organization,
 * independently of the event's organization or the active session workspace.
 * Provisioning is explicit through Create & Share, never a source/review read.
 */
const personalTemplateOwner = (actor: { id: string; name: string }) =>
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
          reviewHash: blueprintHash(content),
          ...(request.discoverable ? { discoverable: true } : {}),
        }
      }
      case 'create': {
        // Source authority must precede any external personal-owner provisioning.
        yield* capture.source(actor.id, request.eventId)
        const organizationId = request.organizationId ?? (yield* personalTemplateOwner(actor))
        return yield* (yield* BlueprintNativeCreationRepo).create(actor.id, {
          ...request,
          organizationId,
        })
      }
      case 'workspace': {
        // The source grant is independent from ownership of a publishing destination.
        yield* capture.source(actor.id, request.eventId)
        return yield* createBlueprintAuthoringWorkspaceWorkflow(actor)
      }
    }
  })
