/**
 * Historical paths that expose concrete adapters under former port filenames.
 * These are explicit compatibility exceptions, and the architecture guard
 * requires them to remain export-only facades. New ports are never exempt.
 */
export const legacyServerPortFacades = [
  'blueprint-media/blueprint-cover.service.ts',
  'events/repos/event-departure.repo.ts',
  'events/repos/event-lifecycle.repo.ts',
  'events/repos/event-share-link.repo.ts',
  'events/repos/event.repo.ts',
  'events/repos/guest-invitation.repo.ts',
  'moderation/moderation.repo.ts',
  'moderation/user-block.repo.ts',
  'media/connectors/media-storage.con.ts',
  'media/repos/media.repo.ts',
] as const
