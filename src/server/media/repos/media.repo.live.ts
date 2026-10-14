import { Effect, Layer } from 'effect'
import { PgClient } from '@effect/sql-pg/PgClient'

import {
  createPendingEventMedia,
  canReadMedia,
  getEventMediaAccessContext,
  getEventMediaActorContext,
  getNativeMediaAccessContext,
  getNativeMediaActorContext,
  listReadyEventMedia,
  markEventMediaFailed,
  markEventMediaReady,
  markNativeMediaReady,
  upsertPendingNativeMedia,
} from './media.repo.drizzle'
import { MediaRepo } from './media.repo.contract'

export const MediaRepoLive = Layer.effect(
  MediaRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const withPg = <A, E>(operation: Effect.Effect<A, E, PgClient>) =>
      operation.pipe(Effect.provideService(PgClient, pg))

    return {
      getNativeMediaActorContext: (...args: Parameters<typeof getNativeMediaActorContext>) =>
        withPg(getNativeMediaActorContext(...args)),
      upsertPendingNativeMedia: (...args: Parameters<typeof upsertPendingNativeMedia>) =>
        withPg(upsertPendingNativeMedia(...args)),
      getNativeMediaAccessContext: (...args: Parameters<typeof getNativeMediaAccessContext>) =>
        withPg(getNativeMediaAccessContext(...args)),
      markNativeMediaReady: (...args: Parameters<typeof markNativeMediaReady>) =>
        withPg(markNativeMediaReady(...args)),
      getEventMediaActorContext: (...args: Parameters<typeof getEventMediaActorContext>) =>
        withPg(getEventMediaActorContext(...args)),
      createPendingEventMedia: (...args: Parameters<typeof createPendingEventMedia>) =>
        withPg(createPendingEventMedia(...args)),
      canReadMedia: (...args: Parameters<typeof canReadMedia>) => withPg(canReadMedia(...args)),
      getEventMediaAccessContext: (...args: Parameters<typeof getEventMediaAccessContext>) =>
        withPg(getEventMediaAccessContext(...args)),
      markEventMediaReady: (...args: Parameters<typeof markEventMediaReady>) =>
        withPg(markEventMediaReady(...args)),
      markEventMediaFailed: (...args: Parameters<typeof markEventMediaFailed>) =>
        withPg(markEventMediaFailed(...args)),
      listReadyEventMedia: (...args: Parameters<typeof listReadyEventMedia>) =>
        withPg(listReadyEventMedia(...args)),
    }
  })
)
