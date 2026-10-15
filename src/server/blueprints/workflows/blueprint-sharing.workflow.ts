import { Effect } from 'effect'
import {
  BlueprintShareCreateInputSchema,
  BlueprintShareListInputSchema,
  BlueprintShareResolveInputSchema,
  BlueprintShareRevokeInputSchema,
} from '@/contracts/blueprint-sharing.contracts'
import { validateInput } from '@/server/validation'
import { EntityNotFoundError } from '@/lib/domain-errors'
import { BlueprintSharingRepo } from '../repos/blueprint-sharing.repo'
import { buildBlueprintCatalog } from '../services/blueprint-discovery'

export const listBlueprintShareLinksWorkflow = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    const request = yield* validateInput(BlueprintShareListInputSchema, input)
    return yield* (yield* BlueprintSharingRepo).list(actorId, request.templateId)
  })
export const createBlueprintShareLinkWorkflow = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    const request = yield* validateInput(BlueprintShareCreateInputSchema, input)
    return yield* (yield* BlueprintSharingRepo).create(actorId, request)
  })
export const revokeBlueprintShareLinkWorkflow = (actorId: string, input: unknown) =>
  Effect.gen(function* () {
    const request = yield* validateInput(BlueprintShareRevokeInputSchema, input)
    return yield* (yield* BlueprintSharingRepo).revoke(actorId, request)
  })
export const resolveBlueprintShareLinkWorkflow = (input: unknown) =>
  Effect.gen(function* () {
    // Invalid and unavailable links have the same public result, without echoing credentials.
    const parsed = BlueprintShareResolveInputSchema.safeParse(input)
    if (!parsed.success)
      return yield* Effect.fail(
        new EntityNotFoundError({
          category: 'not_found',
          code: 'BLUEPRINT_LINK_UNAVAILABLE',
          userMessageKey: 'serverErrors.NOT_FOUND',
        })
      )
    const revision = yield* (yield* BlueprintSharingRepo).resolve(parsed.data.token)
    return buildBlueprintCatalog([revision]).entries[0]
  })
