import { Effect } from 'effect'
import {
  BlueprintPreferenceListRequestSchema,
  BlueprintPreferenceMutationSchema,
} from '@/contracts/blueprint-preferences.contracts'
import {
  BlueprintMeasurementSettingsMutationSchema,
  BlueprintMeasurementSignalSchema,
} from '@/contracts/blueprint-measurement.contracts'
import { PgClientLive } from '@/db'
import { runServerResponse } from '@/server/effect-utils'
import { requestJson, requestUser, validateInput } from '@/server/http-errors'
import { blueprintCatalog } from '../workflows/blueprint.workflows.live'
import {
  getBlueprintMeasurementSettings,
  listBlueprintPreferences,
  recordBlueprintDiscoverySignal,
  updateBlueprintMeasurementSettings,
  updateBlueprintPreference,
} from '../workflows/blueprint-discovery-actions.workflows.live'

export function handleBlueprintPreferences(request: Request) {
  return runServerResponse(
    Effect.gen(function* () {
      const actor = yield* requestUser(request)
      if (request.method === 'GET') {
        const params = new URL(request.url).searchParams
        const input = yield* validateInput(BlueprintPreferenceListRequestSchema, {
          ...(params.has('limit') ? { limit: params.get('limit') } : {}),
          ...(params.has('cursor') ? { cursor: params.get('cursor') } : {}),
        })
        const catalog = yield* blueprintCatalog(actor.id)
        return yield* listBlueprintPreferences(actor.id, input, catalog.entries)
      }
      const input = yield* validateInput(
        BlueprintPreferenceMutationSchema,
        yield* requestJson(request)
      )
      return yield* updateBlueprintPreference(actor.id, input)
    }).pipe(Effect.provide(PgClientLive)),
    { headers: request.headers, operation: 'blueprint.preferences', successEnvelope: false }
  )
}

export function handleBlueprintMeasurementSettings(request: Request) {
  return runServerResponse(
    Effect.gen(function* () {
      const actor = yield* requestUser(request)
      if (request.method === 'GET') return yield* getBlueprintMeasurementSettings(actor.id)
      const input = yield* validateInput(
        BlueprintMeasurementSettingsMutationSchema,
        yield* requestJson(request)
      )
      return yield* updateBlueprintMeasurementSettings(actor.id, input)
    }).pipe(Effect.provide(PgClientLive)),
    {
      headers: request.headers,
      operation: 'blueprint.measurement.settings',
      successEnvelope: false,
    }
  )
}

export function handleBlueprintDiscoverySignal(request: Request) {
  return runServerResponse(
    Effect.gen(function* () {
      const actor = yield* requestUser(request)
      const input = yield* validateInput(
        BlueprintMeasurementSignalSchema,
        yield* requestJson(request)
      )
      return yield* recordBlueprintDiscoverySignal(actor.id, input)
    }).pipe(Effect.provide(PgClientLive)),
    { headers: request.headers, operation: 'blueprint.measurement.signal', successEnvelope: false }
  )
}
