import { Context } from 'effect'
import type { EventGuestRepoShape } from '../repos/event-guest.repo'

export class EventGuestService extends Context.Service<EventGuestService, EventGuestRepoShape>()(
  'EventGuestService'
) {}
