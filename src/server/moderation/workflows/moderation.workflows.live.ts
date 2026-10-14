import { Effect } from 'effect'
import { ModerationServerLive } from '../moderation.layers.live'
import { blockPersonWorkflow as blockPersonProgram } from './block-person.workflow'
import { hideImageWorkflow as hideImageProgram } from './hide-image.workflow'
import { listBlockedPeopleWorkflow as listBlockedPeopleProgram } from './list-blocked-people.workflow'
import { listAbuseReportsWorkflow as listAbuseReportsProgram } from './list-abuse-reports.workflow'
import { hiddenImageIDsWorkflow as hiddenImageIDsProgram } from './list-hidden-images.workflow'
import { reportImagePreviewWorkflow as reportImagePreviewProgram } from './report-image-preview.workflow'
import { reportImageWorkflow as reportImageProgram } from './report-image.workflow'
import { requireModeratorWorkflow as requireModeratorProgram } from './require-moderator.workflow'
import { reviewAbuseReportWorkflow as reviewAbuseReportProgram } from './review-abuse-report.workflow'
import { unblockPersonWorkflow as unblockPersonProgram } from './unblock-person.workflow'

export const blockPersonWorkflow = (...args: Parameters<typeof blockPersonProgram>) =>
  blockPersonProgram(...args).pipe(Effect.provide(ModerationServerLive))
export const hideImageWorkflow = (...args: Parameters<typeof hideImageProgram>) =>
  hideImageProgram(...args).pipe(Effect.provide(ModerationServerLive))
export const listBlockedPeopleWorkflow = (...args: Parameters<typeof listBlockedPeopleProgram>) =>
  listBlockedPeopleProgram(...args).pipe(Effect.provide(ModerationServerLive))
export const listAbuseReportsWorkflow = (...args: Parameters<typeof listAbuseReportsProgram>) =>
  listAbuseReportsProgram(...args).pipe(Effect.provide(ModerationServerLive))
export const hiddenImageIDsWorkflow = (...args: Parameters<typeof hiddenImageIDsProgram>) =>
  hiddenImageIDsProgram(...args).pipe(Effect.provide(ModerationServerLive))
export const reportImagePreviewWorkflow = (...args: Parameters<typeof reportImagePreviewProgram>) =>
  reportImagePreviewProgram(...args).pipe(Effect.provide(ModerationServerLive))
export const reportImageWorkflow = (...args: Parameters<typeof reportImageProgram>) =>
  reportImageProgram(...args).pipe(Effect.provide(ModerationServerLive))
export const requireModeratorWorkflow = (...args: Parameters<typeof requireModeratorProgram>) =>
  requireModeratorProgram(...args).pipe(Effect.provide(ModerationServerLive))
export const reviewAbuseReportWorkflow = (...args: Parameters<typeof reviewAbuseReportProgram>) =>
  reviewAbuseReportProgram(...args).pipe(Effect.provide(ModerationServerLive))
export const unblockPersonWorkflow = (...args: Parameters<typeof unblockPersonProgram>) =>
  unblockPersonProgram(...args).pipe(Effect.provide(ModerationServerLive))
