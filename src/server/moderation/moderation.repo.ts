/** Compatibility exports; new code should depend on ModerationRepo. */
export {
  hideImage,
  hiddenImageIDs,
  listAbuseReports,
  reportImage,
  reportImagePreview,
  reportImagePreviewAsset,
  requireModerator,
  reviewAbuseReport,
} from './repos/moderation.repo.live'
