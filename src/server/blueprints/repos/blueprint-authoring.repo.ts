import { Context, type Effect } from 'effect'
import type { z } from 'zod'
import type { DomainError } from '@/lib/domain-errors'
import type {
  BlueprintAuthoringContext,
  BlueprintAuthoringRow,
  BlueprintDraft,
  BlueprintPublishResult,
  BlueprintCreateDraftSchema,
  BlueprintSaveDraftSchema,
  BlueprintPublishDraftSchema,
  BlueprintAuthoringPageInputSchema,
} from '@/contracts/blueprint-authoring.contracts'

export class BlueprintAuthoringRepo extends Context.Service<
  BlueprintAuthoringRepo,
  {
    context: (actorId: string) => Effect.Effect<BlueprintAuthoringContext, DomainError>
    list: (
      actorId: string,
      input: z.infer<typeof BlueprintAuthoringPageInputSchema>
    ) => Effect.Effect<{ data: BlueprintAuthoringRow[]; hasNextPage: boolean }, DomainError>
    get: (actorId: string, id: string) => Effect.Effect<BlueprintDraft, DomainError>
    create: (
      actorId: string,
      input: z.infer<typeof BlueprintCreateDraftSchema>
    ) => Effect.Effect<BlueprintDraft, DomainError>
    save: (
      actorId: string,
      input: z.infer<typeof BlueprintSaveDraftSchema>
    ) => Effect.Effect<BlueprintDraft, DomainError>
    publish: (
      actorId: string,
      input: z.infer<typeof BlueprintPublishDraftSchema>
    ) => Effect.Effect<BlueprintPublishResult, DomainError>
    retire: (actorId: string, id: string) => Effect.Effect<BlueprintDraft, DomainError>
    delete: (actorId: string, id: string) => Effect.Effect<{ deleted: true }, DomainError>
  }
>()('BlueprintAuthoringRepo') {}
