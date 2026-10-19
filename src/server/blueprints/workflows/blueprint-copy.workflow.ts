import { Effect } from 'effect'
import { z } from 'zod'
import { BlueprintCopyRequestSchema } from '@/contracts/blueprint-copy.contracts'
import { validateInput } from '@/server/validation'
import { BlueprintPersonalRepo } from '../repos/blueprint-personal.repo'
import { personalTemplateOwner } from './blueprint-native-creation.workflow'

export const createBlueprintCopyWorkflow = (actor: { id: string; name: string }, input: unknown) =>
  Effect.gen(function* () {
    const validatedActor = yield* validateInput(
      z.object({ id: z.string().min(1).max(200), name: z.string().min(1).max(200) }).strict(),
      actor
    )
    const request = yield* validateInput(BlueprintCopyRequestSchema, input)
    yield* personalTemplateOwner(validatedActor)
    return yield* (yield* BlueprintPersonalRepo).copy(validatedActor.id, request)
  })
