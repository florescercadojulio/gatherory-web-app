import { Effect } from 'effect'
import { NativeSyncRepoLive } from '../repos/native-sync.repo.live'
import { bootstrapNativeSync as bootstrapProgram } from './native-sync-bootstrap.workflow'
import { pullNativeSync as pullProgram } from './native-sync-pull.workflow'
import { pushNativeSync as pushProgram } from './native-sync-push.workflow'

export const bootstrapNativeSync = (...args: Parameters<typeof bootstrapProgram>) =>
  bootstrapProgram(...args).pipe(Effect.provide(NativeSyncRepoLive))
export const pullNativeSync = (...args: Parameters<typeof pullProgram>) =>
  pullProgram(...args).pipe(Effect.provide(NativeSyncRepoLive))
export const pushNativeSync = (...args: Parameters<typeof pushProgram>) =>
  pushProgram(...args).pipe(Effect.provide(NativeSyncRepoLive))
