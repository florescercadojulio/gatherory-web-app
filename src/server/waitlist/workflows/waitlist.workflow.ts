import { Effect } from 'effect'
import type { WaitlistActor, WaitlistPageInput } from '../contracts/waitlist.contracts'
import type { WaitlistConfig } from '../waitlist.config'
import { WaitlistRepo } from '../repos/waitlist.repo'
import { requireWaitlistAdmin } from '../services/waitlist.service'

export const listWaitlist = (
  actor: WaitlistActor,
  config: WaitlistConfig,
  input: WaitlistPageInput
) =>
  Effect.gen(function* () {
    yield* requireWaitlistAdmin(actor, config)
    return yield* (yield* WaitlistRepo).list(input)
  })

export const unsubscribeWaitlist = (actor: WaitlistActor, config: WaitlistConfig, id: string) =>
  Effect.gen(function* () {
    yield* requireWaitlistAdmin(actor, config)
    yield* (yield* WaitlistRepo).unsubscribe(id)
    return { updated: true as const }
  })
