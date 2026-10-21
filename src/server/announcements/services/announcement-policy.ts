import type { AnnouncementAudience } from '../contracts/announcement.contracts'

export function announcementPolicy(input: {
  kind: 'user' | 'device_guest'
  role: 'host' | 'collaborator' | 'guest'
  permission: 'manage' | 'contribute' | 'view_only'
  active: boolean
}) {
  const readAudiences: AnnouncementAudience[] =
    input.role === 'host'
      ? ['all', 'planning', 'guests']
      : input.role === 'collaborator'
        ? ['all', 'planning']
        : ['all', 'guests']
  const allowedAudiences: AnnouncementAudience[] =
    input.kind !== 'user' || !input.active
      ? []
      : input.role === 'host' && input.permission === 'manage'
        ? ['all', 'planning', 'guests']
        : input.role === 'collaborator' &&
            (input.permission === 'manage' || input.permission === 'contribute')
          ? ['planning']
          : []
  return { role: input.role, readAudiences, allowedAudiences, canSend: allowedAudiences.length > 0 }
}

/** Hosts can moderate guest history, but guest-targeted alerts go only to guests. */
export function announcementNotificationAllowed(
  access: ReturnType<typeof announcementPolicy>,
  audience: AnnouncementAudience
) {
  return (
    access.readAudiences.includes(audience) && (audience !== 'guests' || access.role === 'guest')
  )
}
