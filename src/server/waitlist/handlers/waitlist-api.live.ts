import { Effect, Layer } from 'effect'
import { PgClientLive } from '@/db'
import { isDomainError, PersistenceError, tryServerOperation } from '@/server/effect'
import { sessionUser } from '@/server/auth/connectors/session-user.con.live'
import { waitlistConfig } from '../waitlist.config'
import { WaitlistRepoLive } from '../repos/waitlist.repo.live'
import { signupToWaitlist } from '../services/waitlist.service'
import { listWaitlist, unsubscribeWaitlist } from '../workflows/waitlist.workflow'
import { createWaitlistHandlers } from './waitlist-api.handler'

const storage = WaitlistRepoLive.pipe(Layer.provide(PgClientLive))
const safeStorageFailure = (error: unknown) =>
  isDomainError(error)
    ? error
    : new PersistenceError({
        category: 'system',
        code: 'WAITLIST_STORAGE_FAILED',
        userMessageKey: 'serverErrors.WAITLIST_UNAVAILABLE',
      })
export const waitlistHandlers = createWaitlistHandlers({
  config: waitlistConfig,
  actor: (request) =>
    tryServerOperation(
      {
        category: 'system',
        code: 'SESSION_LOOKUP_FAILED',
        userMessageKey: 'serverErrors.SESSION_LOOKUP_FAILED',
      },
      () => sessionUser(request.headers)
    ),
  signup: (...args) =>
    signupToWaitlist(...args).pipe(Effect.provide(storage), Effect.mapError(safeStorageFailure)),
  list: (...args) =>
    listWaitlist(...args).pipe(Effect.provide(storage), Effect.mapError(safeStorageFailure)),
  unsubscribe: (...args) =>
    unsubscribeWaitlist(...args).pipe(Effect.provide(storage), Effect.mapError(safeStorageFailure)),
})
