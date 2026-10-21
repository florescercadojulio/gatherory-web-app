import { Effect } from 'effect'
import type { AnnouncementRepositoryShape } from '../repos/announcement.repo.contract'
import { AnnouncementService } from '../services/announcement.service'

export const listAnnouncementsWorkflow = (
  input: Parameters<AnnouncementRepositoryShape['list']>[0]
) => Effect.flatMap(AnnouncementService, (service) => service.list(input))
export const sendAnnouncementWorkflow = (
  input: Parameters<AnnouncementRepositoryShape['send']>[0]
) => Effect.flatMap(AnnouncementService, (service) => service.send(input))
