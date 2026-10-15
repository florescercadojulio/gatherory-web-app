import { Context, type Effect } from 'effect'
import type { DomainError } from '@/lib/domain-errors'
import type {
  BlueprintLinkManagementInput,
  BlueprintLinkManagementResponse,
} from '@/contracts/blueprint-link-management.contracts'

export class BlueprintLinkManagementRepo extends Context.Service<
  BlueprintLinkManagementRepo,
  {
    execute: (
      actorId: string,
      input: BlueprintLinkManagementInput
    ) => Effect.Effect<BlueprintLinkManagementResponse, DomainError>
  }
>()('BlueprintLinkManagementRepo') {}
