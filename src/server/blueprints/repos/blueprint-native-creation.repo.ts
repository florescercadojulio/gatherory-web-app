import { Context, type Effect } from 'effect'
import type { z } from 'zod'
import type { DomainError } from '@/lib/domain-errors'
import type { BlueprintNativeCreationCreateRequestSchema } from '@/contracts/blueprint-native-creation.contracts'
import type { BlueprintNativeCreationResultResponse } from '@/contracts/blueprint-native-creation.contracts'

export class BlueprintNativeCreationRepo extends Context.Service<
  BlueprintNativeCreationRepo,
  {
    create: (
      actorId: string,
      input: z.infer<typeof BlueprintNativeCreationCreateRequestSchema> & { organizationId: string }
    ) => Effect.Effect<BlueprintNativeCreationResultResponse, DomainError>
  }
>()('BlueprintNativeCreationRepo') {}
