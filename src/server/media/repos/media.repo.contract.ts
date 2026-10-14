import { Context, Effect } from 'effect'

import type * as Persistence from './media.repo.drizzle'

type EffectParts<T> =
  T extends Effect.Effect<infer A, infer E, infer _R> ? { value: A; error: E } : never
type PersistenceMethods = Pick<
  typeof Persistence,
  | 'getNativeMediaActorContext'
  | 'upsertPendingNativeMedia'
  | 'getNativeMediaAccessContext'
  | 'markNativeMediaReady'
  | 'getEventMediaActorContext'
  | 'createPendingEventMedia'
  | 'getEventMediaAccessContext'
  | 'markEventMediaReady'
  | 'markEventMediaFailed'
  | 'listReadyEventMedia'
  | 'canReadMedia'
>

export type MediaRepoShape = {
  readonly [K in keyof PersistenceMethods]: (
    ...args: Parameters<PersistenceMethods[K]>
  ) => Effect.Effect<
    EffectParts<ReturnType<PersistenceMethods[K]>>['value'],
    EffectParts<ReturnType<PersistenceMethods[K]>>['error']
  >
}

/** Pure injected API; legacy direct helpers live in media.repo.compat.ts. */
export class MediaRepo extends Context.Service<MediaRepo, MediaRepoShape>()('MediaRepo') {}
