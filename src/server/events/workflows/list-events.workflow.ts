import { Effect } from 'effect'
import { EventService } from '../services/event.service'

export const listEventsWorkflow = (input: { organizationId: string; userId: string }) =>
  Effect.gen(function* () {
    const events = yield* EventService
    const items = yield* events.list(input)
    return items.map((item) => ({
      ...item,
      startsAt: item.startsAt?.toISOString() ?? null,
      endsAt: item.endsAt?.toISOString() ?? null,
      childEvents: item.childEvents.map((child) => ({
        ...child,
        startsAt: child.startsAt?.toISOString() ?? null,
        endsAt: child.endsAt?.toISOString() ?? null,
      })),
    }))
  })
