import { Context, Effect } from 'effect'
import type { DomainError } from '@/lib/domain-errors'
import type {
  BlueprintShareCreateInput,
  BlueprintShareRevokeInput,
  BlueprintShareLink,
} from '@/contracts/blueprint-sharing.contracts'
import type { CatalogRevision } from '../contracts/blueprint-runtime.contracts'

export class BlueprintSharingRepo extends Context.Service<
  BlueprintSharingRepo,
  {
    list: (actorId: string, templateId: string) => Effect.Effect<BlueprintShareLink[], DomainError>
    create: (
      actorId: string,
      input: BlueprintShareCreateInput
    ) => Effect.Effect<BlueprintShareLink & { token: string }, DomainError>
    revoke: (actorId: string, input: BlueprintShareRevokeInput) => Effect.Effect<void, DomainError>
    resolve: (token: string) => Effect.Effect<CatalogRevision, DomainError>
  }
>()('BlueprintSharingRepo') {}
