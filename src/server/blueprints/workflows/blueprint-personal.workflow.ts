import { Effect } from 'effect'
import { z } from 'zod'
import { BlueprintDraftContentSchema } from '@/contracts/blueprint-authoring.contracts'
import { characterString, UUIDSchema } from '@/contracts/content-primitives'
import { validateInput } from '@/server/validation'
import { BlueprintPersonalRepo } from '../repos/blueprint-personal.repo'

const command = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }).strict(),
  z
    .object({
      action: z.literal('save'),
      id: UUIDSchema,
      expectedVersion: z.number().int().positive(),
      content: BlueprintDraftContentSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal('publish'),
      id: UUIDSchema,
      expectedVersion: z.number().int().positive(),
      creatorName: characterString(1, 80).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal('unlist'),
      id: UUIDSchema,
      expectedVersion: z.number().int().positive(),
      expectedListedRevision: z.number().int().positive(),
    })
    .strict(),
  z.object({ action: z.literal('delete'), id: UUIDSchema }).strict(),
])

export const managePersonalBlueprintsWorkflow = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    const request = yield* validateInput(command, input)
    const repo = yield* BlueprintPersonalRepo
    if (request.action === 'list') return yield* repo.list(actorId)
    if (request.action === 'save') return yield* repo.save(actorId, request)
    if (request.action === 'publish') return yield* repo.publish(actorId, request)
    if (request.action === 'unlist') return yield* repo.unlist(actorId, request)
    return yield* repo.delete(actorId, request.id)
  })
