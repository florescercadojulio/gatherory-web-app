import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import { serverOperationError } from '@/lib/domain-errors'
import { BlueprintNativeCreationRepo } from './blueprint-native-creation.repo'

export const BlueprintNativeCreationRepoLive = Layer.effect(
  BlueprintNativeCreationRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const bind = <A>(effect: Effect.Effect<A, import('effect/unstable/sql/SqlError').SqlError>) =>
      effect.pipe(
        Effect.provideService(PgClient, pg),
        Effect.mapError((cause) =>
          serverOperationError(cause, {
            category: 'system',
            code: 'BLUEPRINT_NATIVE_CREATION_FAILED',
            userMessageKey: 'serverErrors.SYSTEM',
          })
        )
      )

    return {
      recordRequestFingerprint: (templateId, fingerprint) =>
        bind(
          pg`UPDATE blueprint_template
            SET source = jsonb_set(
              coalesce(source, '{}'::jsonb),
              '{nativeCreationRequestHash}',
              to_jsonb(${fingerprint}::text),
              true
            )
            WHERE id = ${templateId}`.pipe(Effect.asVoid)
        ),
      listInitialRevision: (templateId, revision) =>
        bind(
          pg`UPDATE blueprint_template
            SET listed_revision = ${revision}
            WHERE id = ${templateId}`.pipe(Effect.asVoid)
        ),
    }
  })
)
