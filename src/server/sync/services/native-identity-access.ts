import type { NativeMutation } from '../contracts/native-sync.contracts'

/** Contributors can update their own profile/RSVP, not grant planning access. */
export function nativeIdentityWriteAllowed(input: {
  mutation: NativeMutation
  actor: { personId: string; role: string; planningPermission: string }
  participation?: {
    id: string
    personId: string
    eventId: string
    role: string
    planningPermission: string
  }
}) {
  const { mutation, actor, participation } = input
  if (!['participant', 'event_participation'].includes(mutation.entityType)) return true
  if (
    actor.role === 'host' ||
    (actor.role === 'collaborator' && actor.planningPermission === 'manage')
  )
    return true
  if (mutation.operation === 'delete') return false
  if (mutation.entityType === 'participant') return mutation.entityID === actor.personId
  if (
    !participation ||
    participation.personId !== actor.personId ||
    participation.id !== mutation.entityID
  )
    return false
  try {
    const payload = JSON.parse(Buffer.from(mutation.payload, 'base64').toString('utf8'))
    return (
      payload.role === participation.role &&
      (payload.planningPermission === 'viewOnly' ? 'view_only' : payload.planningPermission) ===
        participation.planningPermission &&
      payload.memberID?.toLowerCase() === participation.personId &&
      payload.eventID?.toLowerCase() === participation.eventId &&
      payload.invitationStatus !== 'invited'
    )
  } catch {
    return false
  }
}
