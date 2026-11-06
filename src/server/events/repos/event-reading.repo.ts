import { Context, type Effect } from 'effect'
import type { PersistenceError } from '@/lib/domain-errors'
import type { EventReadingData } from '../contracts/event-reading.contracts'

export type EventReadingProjection = Omit<EventReadingData, 'permissions' | 'isReadOnly'> & {
  lifecycle: {
    status: string | null
    planningStatus: string | null
    completionStatus: string
    parentStatus: string | null
    snapshotAvailable: boolean
    eventVersionAvailable: boolean
  }
}

export class EventReadingRepo extends Context.Service<
  EventReadingRepo,
  {
    read: (input: {
      userId: string
      eventId: string
      includeTasks: boolean
      includeNotes: boolean
    }) => Effect.Effect<EventReadingProjection | null, PersistenceError>
  }
>()('EventReadingRepo') {}
