import { Context, type Effect } from 'effect'
import type { DomainError } from '@/lib/domain-errors'
import type { BlueprintDraftContent } from '@/contracts/blueprint-authoring.contracts'

export type PersonalBlueprint = {
  id: string
  draftVersion: number
  publishedRevision: number | null
  listedRevision: number | null
  catalogEntry: {
    catalogKey: string
    revision: number
    contentHash: string
    definition: unknown
    description: string
  }
}

export class BlueprintPersonalRepo extends Context.Service<
  BlueprintPersonalRepo,
  {
    copy: (
      actorId: string,
      input: { requestId: string; content: BlueprintDraftContent }
    ) => Effect.Effect<PersonalBlueprint, DomainError>
    list: (actorId: string) => Effect.Effect<{ templates: PersonalBlueprint[] }, DomainError>
    save: (
      actorId: string,
      input: { id: string; expectedVersion: number; content: BlueprintDraftContent }
    ) => Effect.Effect<PersonalBlueprint, DomainError>
    publish: (
      actorId: string,
      input: { id: string; expectedVersion: number }
    ) => Effect.Effect<PersonalBlueprint, DomainError>
    delete: (actorId: string, id: string) => Effect.Effect<{ deleted: true }, DomainError>
  }
>()('BlueprintPersonalRepo') {}
