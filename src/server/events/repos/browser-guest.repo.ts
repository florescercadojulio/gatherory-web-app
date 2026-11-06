import { Context, Effect } from 'effect'
import type { PersistenceError } from '@/lib/domain-errors'
import type { BrowserGuestEvent } from '../contracts/browser-guest.contracts'
import type {
  joinDeviceGuestEvent,
  registerDeviceGuestProfile,
  respondToDeviceGuestEvent,
  verifyDeviceGuestProfile,
} from './device-guest.repo.persistence'
import type {
  getEventIdForShareLink,
  previewEventShareLink,
} from './event-share-link.repo.persistence'

type WithoutPg<T> = T extends (...args: infer Args) => Effect.Effect<infer A, infer E, unknown>
  ? (...args: Args) => Effect.Effect<A, E>
  : never

export type BrowserGuestRepoShape = {
  readonly register: WithoutPg<typeof registerDeviceGuestProfile>
  readonly verify: WithoutPg<typeof verifyDeviceGuestProfile>
  readonly join: WithoutPg<typeof joinDeviceGuestEvent>
  readonly respond: WithoutPg<typeof respondToDeviceGuestEvent>
  readonly getEvent: (
    guestProfileId: string,
    eventId: string
  ) => Effect.Effect<BrowserGuestEvent | null, PersistenceError>
  readonly preview: WithoutPg<typeof previewEventShareLink>
  readonly getShareLinkEventId: WithoutPg<typeof getEventIdForShareLink>
}

export class BrowserGuestRepo extends Context.Service<BrowserGuestRepo, BrowserGuestRepoShape>()(
  'BrowserGuestRepo'
) {}
