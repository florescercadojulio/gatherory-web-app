import { Effect } from 'effect'
import { PgClientLive } from '@/db'
import {
  BlueprintNativeCreationRequestSchema,
  BlueprintNativeCreationResultResponseSchema,
  BlueprintNativeCreationReviewResponseSchema,
  BlueprintNativeCreationSourceResponseSchema,
  BlueprintNativeCreationWorkspaceResponseSchema,
} from '@/contracts/blueprint-native-creation.contracts'
import { runServerResponse } from '@/server/effect-utils'
import { requestJson, requestUser } from '@/server/http-errors'
import { validateInput } from '@/server/validation'
import { blueprintNativeCreation } from '../workflows/blueprint-native-creation.workflows.live'

export async function handleBlueprintNativeCreationRequest(request: Request) {
  const response = await runServerResponse(
    Effect.gen(function* () {
      const user = yield* requestUser(request)
      const input = yield* validateInput(
        BlueprintNativeCreationRequestSchema,
        yield* requestJson(request)
      )
      const result = yield* blueprintNativeCreation({ id: user.id, name: user.name }, input)
      switch (input.action) {
        case 'source':
          return BlueprintNativeCreationSourceResponseSchema.parse(result)
        case 'review':
          return BlueprintNativeCreationReviewResponseSchema.parse(result)
        case 'create':
          return BlueprintNativeCreationResultResponseSchema.parse(result)
        case 'workspace':
          return BlueprintNativeCreationWorkspaceResponseSchema.parse(result)
      }
    }).pipe(Effect.provide(PgClientLive)),
    {
      headers: request.headers,
      operation: 'blueprint.native-creation',
      successEnvelope: false,
      legacyErrorCode: true,
    }
  )
  response.headers.set('Cache-Control', 'no-store')
  response.headers.set('Referrer-Policy', 'no-referrer')
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  return response
}
