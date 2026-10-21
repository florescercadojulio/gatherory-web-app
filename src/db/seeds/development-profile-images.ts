/** Stock portraits for fictional development fixtures, never customer endorsements.
 * Source/prototype replacement notes: docs/development/development-seed.md. */
const portrait = (photo: string) =>
  `https://images.unsplash.com/photo-${photo}?w=240&h=240&fit=crop&crop=faces&auto=format`

export const developmentProfileImages = [
  {
    email: 'planner@gatherory.test',
    name: 'Alex Morgan',
    image: portrait('1500648767791-00dcc994a43e'),
  },
  {
    email: 'jordan@gatherory.test',
    name: 'Jordan Lee',
    image: portrait('1506794778202-cad84cf45f1d'),
  },
  {
    email: 'coordinator@gatherory.test',
    name: 'Maya Chen',
    image: portrait('1534528741775-53994a69daeb'),
  },
  {
    email: 'guest@gatherory.test',
    name: 'Sam Rivera',
    image: portrait('1507003211169-0a1dd7228f2d'),
  },
  {
    email: 'appreview@gatherory.test',
    name: 'Gatherory App Review',
    image: portrait('1472099645785-5658abf4ff4e'),
  },
  {
    email: 'reception-planner@gatherory.test',
    name: 'Taylor Brooks',
    image: portrait('1494790108377-be9c29b29330'),
  },
  {
    email: 'pending-collaborator@gatherory.test',
    name: 'Casey Patel',
    image: portrait('1517841905240-472988babdf9'),
  },
  {
    email: 'latest-collaborator@gatherory.test',
    name: 'Riley Kim',
    image: portrait('1531123897727-8f129e1688ce'),
  },
] as const

export const developmentGuestProfiles = [
  {
    id: '70000000-0000-4000-8000-000000000005',
    email: 'family@gatherory.test',
    name: 'Invited Family',
    image: portrait('1524504388940-b1c1722653e1'),
  },
  {
    id: '70000000-0000-4000-8000-000000000008',
    email: 'jamie@gatherory.test',
    name: 'Jamie Park',
    image: portrait('1508214751196-bcfd4ca60f91'),
  },
  {
    id: '70000000-0000-4000-8000-000000000009',
    email: 'drew@gatherory.test',
    name: 'Drew Ellis',
    image: portrait('1527980965255-d3b416303d12'),
  },
] as const

export function developmentProfileImage(email: string): string | null {
  return (
    developmentProfileImages.find((profile) => profile.email === email)?.image ??
    developmentGuestProfiles.find((profile) => profile.email === email)?.image ??
    null
  )
}

export function assertLocalDevelopmentProfileTarget(databaseUrl: string, nodeEnv?: string) {
  const target = new URL(databaseUrl)
  if (
    nodeEnv === 'production' ||
    !['postgres:', 'postgresql:'].includes(target.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) ||
    target.pathname !== '/gatherory'
  )
    throw new Error('Development portrait updates require the local gatherory database.')
}

/** Patch only stable fixture person IDs with the exact name and email. */
export function fillDevelopmentPortrait(
  person: Record<string, unknown>,
  accountProfiles: ReadonlyMap<string, { id: string; email: string; name: string; image: string }>,
  guestProfiles: ReadonlyMap<string, { id: string; email: string; name: string; image: string }>
) {
  const profile =
    typeof person.userID === 'string'
      ? accountProfiles.get(person.userID)
      : (person.userID === null || person.userID === undefined) && typeof person.id === 'string'
        ? guestProfiles.get(person.id)
        : undefined
  if (
    !profile ||
    person.id !== profile.id ||
    person.email !== profile.email ||
    person.name !== profile.name ||
    (typeof person.profileImageURL === 'string' && person.profileImageURL.trim())
  )
    return false
  person.profileImageURL = profile.image
  return true
}
