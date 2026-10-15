import { Context, type Effect } from 'effect'
import type { z } from 'zod'
import type { DomainError } from '@/lib/domain-errors'
import type { BlueprintDraft } from '@/contracts/blueprint-authoring.contracts'
import type {
  BlueprintCaptureSaveInputSchema,
  BlueprintEventCaptureSource,
} from '@/contracts/blueprint-capture.contracts'

export class BlueprintCaptureRepo extends Context.Service<
  BlueprintCaptureRepo,
  {
    listEvents: (
      actorId: string
    ) => Effect.Effect<{ events: { id: string; title: string }[] }, DomainError>
    source: (
      actorId: string,
      eventId: string
    ) => Effect.Effect<{ source: BlueprintEventCaptureSource; sourceHash: string }, DomainError>
    save: (
      actorId: string,
      input: z.infer<typeof BlueprintCaptureSaveInputSchema>
    ) => Effect.Effect<BlueprintDraft, DomainError>
  }
>()('BlueprintCaptureRepo') {}
