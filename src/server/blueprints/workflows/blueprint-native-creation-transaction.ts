import { Context, type Effect } from 'effect'
import type { PgClient as PgClientEnvironment } from '@effect/sql-pg/PgClient'
import type { DomainError } from '@/lib/domain-errors'

/** Owns the single transaction used by native capture, publication, and listing. */
export class BlueprintNativeCreationTransaction extends Context.Service<
  BlueprintNativeCreationTransaction,
  {
    withTransaction: <A, E extends DomainError, R>(
      program: Effect.Effect<A, E, R>
    ) => Effect.Effect<A, DomainError, Exclude<R, PgClientEnvironment>>
  }
>()('BlueprintNativeCreationTransaction') {}
