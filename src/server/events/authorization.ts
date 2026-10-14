import { Effect } from 'effect'
import { ForbiddenError } from '@/lib/domain-errors'
import { planningPermissionFromDatabase, type EventPermissions } from '@/lib/permissions'
import { EventRepo } from './repos/event.repo.contract'
import { EventAuthorization } from './services/event-authorization.service'

/** Authorizes an authenticated participant, independently of workspace membership. */
export function ensureEventPermission(
  permissions: EventPermissions,
  input: { eventId: string; userId: string }
) {
  return Effect.gen(function* () {
    if (!Object.values(permissions).some((actions) => actions?.length)) {
      return yield* Effect.fail(
        new ForbiddenError({
          category: 'authorization',
          code: 'EVENT_PERMISSION_REQUIRED',
          userMessageKey: 'serverErrors.AUTHORIZATION',
        })
      )
    }
    const repo = yield* EventRepo
    const participant = yield* repo.getEventParticipant(input)
    if (!participant) {
      return yield* Effect.fail(
        new ForbiddenError({
          category: 'authorization',
          code: 'EVENT_PARTICIPANT_REQUIRED',
          userMessageKey: 'serverErrors.AUTHORIZATION',
        })
      )
    }
    const access = {
      role: participant.role,
      planningPermission: planningPermissionFromDatabase(participant.planningPermission),
    }
    const authorization = yield* EventAuthorization
    yield* authorization.require(access, permissions)
    return access
  })
}
