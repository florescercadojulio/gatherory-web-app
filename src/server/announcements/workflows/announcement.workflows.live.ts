import { Effect, Layer } from 'effect'
import { AnnouncementRepositoryLive } from '../repos/announcement.repo.live'
import { AnnouncementServiceLive } from '../services/announcement.service.live'
import {
  listAnnouncementsWorkflow as list,
  sendAnnouncementWorkflow as send,
} from './announcement.workflows'

const AnnouncementDomainLive = AnnouncementServiceLive.pipe(
  Layer.provide(AnnouncementRepositoryLive)
)
export const listAnnouncementsWorkflow = (...args: Parameters<typeof list>) =>
  list(...args).pipe(Effect.provide(AnnouncementDomainLive))
export const sendAnnouncementWorkflow = (...args: Parameters<typeof send>) =>
  send(...args).pipe(Effect.provide(AnnouncementDomainLive))
