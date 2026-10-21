import { Context } from 'effect'
import type { AnnouncementRepositoryShape } from '../repos/announcement.repo.contract'

export class AnnouncementService extends Context.Service<
  AnnouncementService,
  AnnouncementRepositoryShape
>()('AnnouncementService') {}
