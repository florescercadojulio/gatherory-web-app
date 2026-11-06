import { Context, type Effect } from 'effect'
import type { ConflictError, DomainError } from '@/lib/domain-errors'
import type {
  CompleteTodoInput,
  CreateEventNoteInput,
  EventUpdateResult,
  UpdateEventDetailsInput,
} from '../contracts/event-updates.contracts'

export type EventUpdatesRepoShape = {
  readonly completeTodo: (
    input: CompleteTodoInput & { userId: string }
  ) => Effect.Effect<
    { eventId: string; todoId: string; isCompleted: boolean; version: number },
    DomainError
  >
  readonly createNote: (
    input: CreateEventNoteInput & { userId: string }
  ) => Effect.Effect<
    { eventId: string; noteId: string; version: number; duplicate: boolean },
    DomainError
  >
  readonly updateDetails: (
    input: UpdateEventDetailsInput & { userId: string }
  ) => Effect.Effect<EventUpdateResult, DomainError | ConflictError>
}

export class EventUpdatesRepo extends Context.Service<EventUpdatesRepo, EventUpdatesRepoShape>()(
  'EventUpdatesRepo'
) {}
