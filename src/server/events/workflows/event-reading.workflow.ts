import { Effect } from 'effect'
import { ForbiddenError } from '@/lib/domain-errors'
import { hasEventPermission } from '@/lib/permissions'
import { ensureEventPermission } from '../authorization'
import { EventReadingRepo } from '../repos/event-reading.repo'

export const getEventReadingWorkflow = (input: { userId: string; eventId: string }) =>
  Effect.gen(function* () {
    const access = yield* ensureEventPermission({ event: ['read'] }, input)
    if (access.role === 'guest')
      return yield* Effect.fail(
        new ForbiddenError({
          category: 'authorization',
          code: 'EVENT_PLANNING_REQUIRED',
          userMessageKey: 'serverErrors.EVENT_PERMISSION_REQUIRED',
        })
      )
    const repo = yield* EventReadingRepo
    const canReadTasks = hasEventPermission(access, { todo: ['read'] })
    const canReadNotes = hasEventPermission(access, { note: ['read'] })
    const projection = yield* repo.read({
      ...input,
      includeTasks: canReadTasks,
      includeNotes: canReadNotes,
    })
    if (!projection)
      return yield* Effect.fail(
        new ForbiddenError({
          category: 'authorization',
          code: 'EVENT_PARTICIPANT_REQUIRED',
          userMessageKey: 'serverErrors.EVENT_PERMISSION_REQUIRED',
        })
      )
    const { lifecycle, ...data } = projection
    const closed =
      ['cancelled', 'finished'].includes(lifecycle.status ?? '') ||
      ['cancelled', 'finished'].includes(lifecycle.parentStatus ?? '') ||
      ['cancelled', 'archived'].includes(lifecycle.planningStatus ?? '') ||
      lifecycle.completionStatus === 'complete'
    const canRespond = !closed && hasEventPermission(access, { attendance: ['respond'] })
    const canCompleteTasks =
      !closed && lifecycle.snapshotAvailable && hasEventPermission(access, { todo: ['update'] })
    const canCreateNotes =
      !closed && lifecycle.snapshotAvailable && hasEventPermission(access, { note: ['send'] })
    const canEditDetails =
      !closed &&
      lifecycle.snapshotAvailable &&
      lifecycle.eventVersionAvailable &&
      hasEventPermission(access, { event: ['update'] })
    return {
      ...data,
      attendance: { ...data.attendance, canRespond },
      permissions: {
        canReadTasks,
        canReadNotes,
        canReadPeople: true,
        canReadSchedule: true,
        canRespond,
        canCompleteTasks,
        canCreateNotes,
        canEditDetails,
      },
      isReadOnly: !canCompleteTasks && !canCreateNotes && !canEditDetails,
    }
  })
