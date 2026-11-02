import { Effect } from 'effect'
import type { BlueprintCatalogPageInput } from '../services/blueprint-discovery'
import { ConflictError, InvalidInputError } from '@/lib/domain-errors'
import { BlueprintRepo } from '../contracts/blueprint-runtime.contracts'
import {
  enrichBlueprintCatalog,
  enrichBlueprintCatalogPage,
} from './blueprint-discovery-actions.workflow'

/** Catalog orchestration with repositories supplied by the caller. */
export const blueprintCatalogWorkflow = (actorId: string) =>
  Effect.gen(function* () {
    const entries = yield* (yield* BlueprintRepo).catalog(actorId)
    return yield* enrichBlueprintCatalog(actorId, entries)
  })

/** Catalog page orchestration with stable cursor error semantics. */
export const blueprintCatalogPageWorkflow = (
  actorId: string,
  request: BlueprintCatalogPageInput,
  options: { recommendationBaselineEnabled?: boolean; personalLikeRankingEnabled?: boolean } = {}
) =>
  Effect.gen(function* () {
    const entries = yield* (yield* BlueprintRepo).catalog(actorId)
    const result = yield* enrichBlueprintCatalogPage(actorId, entries, request, options)
    if (!result.ok) {
      return yield* Effect.fail(
        result.reason === 'invalid_cursor'
          ? new InvalidInputError({
              category: 'validation',
              code: 'BLUEPRINT_CATALOG_CURSOR_INVALID',
              userMessageKey: 'serverErrors.VALIDATION',
            })
          : new ConflictError({
              category: 'conflict',
              code: 'BLUEPRINT_CATALOG_CURSOR_STALE',
              userMessageKey: 'serverErrors.CONFLICT',
            })
      )
    }
    return result.page
  })
