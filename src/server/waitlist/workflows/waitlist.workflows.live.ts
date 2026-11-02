import { Effect } from 'effect'
import { signupToWaitlist as signup } from '../services/waitlist.service'
import { WaitlistRepoLive } from '../repos/waitlist.repo.live'
import { listWaitlist as list, unsubscribeWaitlist as unsubscribe } from './waitlist.workflow'

export const signupToWaitlist = (...args: Parameters<typeof signup>) =>
  signup(...args).pipe(Effect.provide(WaitlistRepoLive))

export const listWaitlist = (...args: Parameters<typeof list>) =>
  list(...args).pipe(Effect.provide(WaitlistRepoLive))

export const unsubscribeWaitlist = (...args: Parameters<typeof unsubscribe>) =>
  unsubscribe(...args).pipe(Effect.provide(WaitlistRepoLive))
