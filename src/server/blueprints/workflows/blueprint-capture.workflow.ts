import { Effect } from 'effect'
import {
  BlueprintCaptureSourceInputSchema,
  BlueprintCapturePreviewInputSchema,
  BlueprintCaptureSaveInputSchema,
} from '@/contracts/blueprint-capture.contracts'
import { ConflictError, InvalidInputError } from '@/lib/domain-errors'
import { validateInput } from '@/server/validation'
import { BlueprintCaptureRepo } from '../repos/blueprint-capture.repo'
import { BlueprintAuthoringRepo } from '../repos/blueprint-authoring.repo'
import {
  captureEventBlueprint,
  mergeCapturedBlueprint,
} from '../planning/capture-event-blueprint.server'

export const listBlueprintCaptureEventsWorkflow = (actorId: string) =>
  Effect.gen(function* () {
    return yield* (yield* BlueprintCaptureRepo).listEvents(actorId)
  })
export const getBlueprintCaptureSourceWorkflow = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    const request = yield* validateInput(BlueprintCaptureSourceInputSchema, input)
    return yield* (yield* BlueprintCaptureRepo).source(actorId, request.eventId)
  })
export const previewBlueprintCaptureWorkflow = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    const request = yield* validateInput(BlueprintCapturePreviewInputSchema, input)
    const result = yield* (yield* BlueprintCaptureRepo).source(actorId, request.eventId)
    if (request.expectedSourceHash !== result.sourceHash)
      return yield* Effect.fail(
        new ConflictError({
          category: 'conflict',
          code: 'BLUEPRINT_CAPTURE_SOURCE_CHANGED',
          userMessageKey: 'serverErrors.CONFLICT',
        })
      )
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
    if (!request.templateId)
      return { content, conflicts: [] as string[], sourceHash: result.sourceHash }
    const draft = yield* (yield* BlueprintAuthoringRepo).get(actorId, request.templateId)
    if (!draft.source || !('eventId' in draft.source) || draft.source.eventId !== request.eventId)
      return yield* Effect.fail(
        new InvalidInputError({
          category: 'validation',
          code: 'BLUEPRINT_CAPTURE_SOURCE_MISMATCH',
          userMessageKey: 'serverErrors.VALIDATION',
        })
      )
    const baseline = draft.source.capturedContent
    const merged = yield* Effect.try({
      try: () => mergeCapturedBlueprint(baseline, content, draft.content),
      catch: (cause) =>
        new InvalidInputError({
          category: 'validation',
          code: 'INVALID_BLUEPRINT_CAPTURE_MERGE',
          userMessageKey: 'serverErrors.VALIDATION',
          cause,
        }),
    })
    return { ...merged, sourceHash: result.sourceHash, expectedVersion: draft.draftVersion }
  })
export const saveBlueprintCaptureWorkflow = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    return yield* (yield* BlueprintCaptureRepo).save(
      actorId,
      yield* validateInput(BlueprintCaptureSaveInputSchema, input)
    )
  })
