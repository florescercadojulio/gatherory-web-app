import { Effect, Layer } from 'effect'
import { AnnouncementRepositoryLive } from '../repos/announcement.repo.live'
import { AnnouncementServiceLive } from '../services/announcement.service.live'
import {
  listAnnouncementsWorkflow as list,
  sendAnnouncementWorkflow as send,
} from './announcement.workflows'
import { NotificationDomainLive } from '@/server/notifications/notification.layers.live'
import { NotificationService } from '@/server/notifications/services/notification.service'
import { dispatchNotificationsOnce } from '@/server/notifications/workflows/notification.workflows'
import {
  announcementNotificationScope,
  notifyAfterCommit,
} from '@/server/notifications/workflows/postcommit-notifications.workflow'

const AnnouncementDomainLive = AnnouncementServiceLive.pipe(
  Layer.provide(AnnouncementRepositoryLive)
)
export const listAnnouncementsWorkflow = (...args: Parameters<typeof list>) =>
  list(...args).pipe(Effect.provide(AnnouncementDomainLive))
export const sendAnnouncementWorkflow = (...args: Parameters<typeof send>) =>
  notifyAfterCommit(
    send(...args).pipe(Effect.provide(AnnouncementDomainLive)),
    announcementNotificationScope,
    (scope) =>
      Effect.flatMap(NotificationService, (service) =>
        dispatchNotificationsOnce(service, scope)
      ).pipe(Effect.provide(NotificationDomainLive))
  )
