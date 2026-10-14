import { Effect } from 'effect'
import { ensureEventPermission as ensurePermission } from './authorization'
import { EventAccessLive } from './event.layers.live'

export const ensureEventPermission = (...args: Parameters<typeof ensurePermission>) =>
  ensurePermission(...args).pipe(Effect.provide(EventAccessLive))
