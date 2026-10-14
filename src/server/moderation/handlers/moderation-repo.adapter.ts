import { Effect } from 'effect'
import { MediaRepoLive } from '@/server/media/repos/media.repo.live'
import {
  hideImage as hideImageLive,
  reportImage as reportImageLive,
  hiddenImageIDs,
  listAbuseReports,
  reportImagePreviewAsset,
  requireModerator,
  reviewAbuseReport,
} from '../repos/moderation.repo.live'
import { reportImagePreviewWorkflow as reportImagePreviewLive } from '../workflows/moderation.workflows.live'

/** Compatibility adapters for the original moderation repository module. */
export {
  hiddenImageIDs,
  listAbuseReports,
  reportImagePreviewAsset,
  requireModerator,
  reviewAbuseReport,
}

/** Keep the original PgClient requirement while injecting the new media contract. */
export const hideImage = (...args: Parameters<typeof hideImageLive>) =>
  hideImageLive(...args).pipe(Effect.provide(MediaRepoLive))

/** Keep the original PgClient requirement while injecting the new media contract. */
export const reportImage = (...args: Parameters<typeof reportImageLive>) =>
  reportImageLive(...args).pipe(Effect.provide(MediaRepoLive))

/** Retain the legacy PgClient environment and ambient transaction through signing. */
export const reportImagePreview = (userId: string, reportId: string) =>
  reportImagePreviewLive(userId, reportId)
