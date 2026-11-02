import { Context, type Effect } from 'effect'
import type { DomainError } from '@/lib/domain-errors'

export class BlueprintNativeCreationRepo extends Context.Service<
  BlueprintNativeCreationRepo,
  {
    recordRequestFingerprint: (
      templateId: string,
      fingerprint: string
    ) => Effect.Effect<void, DomainError>
    listInitialRevision: (templateId: string, revision: number) => Effect.Effect<void, DomainError>
  }
>()('BlueprintNativeCreationRepo') {}
