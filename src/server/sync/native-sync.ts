/** Compatibility exports for sync transport callers. Persistence lives in repos/. */
export {
  applyNativeMutations,
  listNativeWorkspaceSnapshots,
  pullNativeChanges,
} from './repos/native-sync-legacy.persistence'
export { pushRequestSchema, type NativePushResult } from './contracts/native-sync.contracts'
