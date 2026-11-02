import { Context, type Effect } from 'effect'
import type { DomainError } from '@/lib/domain-errors'
import type { BlueprintMeasurementReadinessInput } from '../contracts/blueprint-measurement-readiness.contracts'

/** Read-only source rows for the isolated measurement diagnostic. */
export class BlueprintMeasurementReadinessRepo extends Context.Service<
  BlueprintMeasurementReadinessRepo,
  {
    read: (
      input: Pick<BlueprintMeasurementReadinessInput, 'cohortStart' | 'cohortEnd' | 'asOf'>
    ) => Effect.Effect<BlueprintMeasurementReadinessInput, DomainError>
  }
>()('BlueprintMeasurementReadinessRepo') {}
