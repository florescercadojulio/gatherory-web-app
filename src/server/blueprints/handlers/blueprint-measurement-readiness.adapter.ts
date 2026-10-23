import { Effect, Layer } from 'effect'
import type { BlueprintMeasurementReadinessInput } from '../contracts/blueprint-measurement-readiness.contracts'
import type { BlueprintMeasurementReadinessReport } from '../contracts/blueprint-measurement-readiness.contracts'

/** Explicit database bridge, imported only after the CLI has validated its opt-in. */
export const runBlueprintMeasurementReadinessDatabase = async (
  input: Pick<BlueprintMeasurementReadinessInput, 'cohortStart' | 'cohortEnd' | 'asOf'>
): Promise<BlueprintMeasurementReadinessReport> => {
  const [database, repoContract, repoLive, report] = await Promise.all([
    import('@/db'),
    import('../repos/blueprint-measurement-readiness.repo'),
    import('../repos/blueprint-measurement-readiness.repo.live'),
    import('../services/blueprint-measurement-readiness'),
  ])
  const effect = Effect.gen(function* () {
    const repo = yield* repoContract.BlueprintMeasurementReadinessRepo
    const rows = yield* repo.read(input)
    return report.buildBlueprintMeasurementReadinessReport(rows)
  }).pipe(
    Effect.provide(
      repoLive.BlueprintMeasurementReadinessRepoLive.pipe(Layer.provide(database.PgClientLive))
    )
  )
  try {
    return await Effect.runPromise(Effect.scoped(effect))
  } finally {
    await database.pool.end()
  }
}
