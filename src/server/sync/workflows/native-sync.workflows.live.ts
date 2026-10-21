import { Effect } from 'effect'
import { NativeSyncRepoLive } from '../repos/native-sync.repo.live'
import { bootstrapNativeSync as bootstrapProgram } from './native-sync-bootstrap.workflow'
import { pullNativeSync as pullProgram } from './native-sync-pull.workflow'
import { pushNativeSync as pushProgram } from './native-sync-push.workflow'
import { NotificationDomainLive } from '@/server/notifications/notification.layers.live'
import { NotificationService } from '@/server/notifications/services/notification.service'
import { dispatchNotificationsOnce } from '@/server/notifications/workflows/notification.workflows'
import {
  nativePushNotificationScope,
  notifyAfterCommit,
} from '@/server/notifications/workflows/postcommit-notifications.workflow'

export const bootstrapNativeSync = (...args: Parameters<typeof bootstrapProgram>) =>
  bootstrapProgram(...args).pipe(Effect.provide(NativeSyncRepoLive))
export const pullNativeSync = (...args: Parameters<typeof pullProgram>) =>
  pullProgram(...args).pipe(Effect.provide(NativeSyncRepoLive))
export const pushNativeSync = (...args: Parameters<typeof pushProgram>) =>
  notifyAfterCommit(
    pushProgram(...args).pipe(Effect.provide(NativeSyncRepoLive)),
    nativePushNotificationScope,
    (scope) =>
      Effect.flatMap(NotificationService, (service) =>
        dispatchNotificationsOnce(service, scope)
      ).pipe(Effect.provide(NotificationDomainLive))
  )
