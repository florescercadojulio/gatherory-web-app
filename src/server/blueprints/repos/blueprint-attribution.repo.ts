import { Context, Effect } from 'effect'
import type { DomainError } from '@/lib/domain-errors'

export class BlueprintAttributionRepo extends Context.Service<
  BlueprintAttributionRepo,
  { pruneExpired: (now: Date) => Effect.Effect<{ removed: number }, DomainError> }
>()('BlueprintAttributionRepo') {}

/** Remove expired private bindings; dependent qualified records expire with them. */
export const pruneExpiredBlueprintAttribution = (now = new Date()) =>
  Effect.gen(function* () {
    return yield* (yield* BlueprintAttributionRepo).pruneExpired(now)
  })
