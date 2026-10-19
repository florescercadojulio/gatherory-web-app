import { Context, Effect } from 'effect'
import type { DomainError } from '@/lib/domain-errors'
import type { BlueprintLibraryInstallation } from '@/contracts/blueprint-library.contracts'

export class BlueprintLibraryRepo extends Context.Service<
  BlueprintLibraryRepo,
  {
    listUsed: (actorId: string) => Effect.Effect<BlueprintLibraryInstallation[], DomainError>
  }
>()('BlueprintLibraryRepo') {}
