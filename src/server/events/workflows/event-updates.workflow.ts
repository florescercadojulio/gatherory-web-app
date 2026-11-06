import { Effect } from 'effect'
import { EventUpdatesRepo } from '../repos/event-updates.repo'
import type {
  CompleteTodoInput,
  CreateEventNoteInput,
  UpdateEventDetailsInput,
} from '../contracts/event-updates.contracts'

export const completeTodoWorkflow = (input: CompleteTodoInput & { userId: string }) =>
  Effect.gen(function* () {
    const repo = yield* EventUpdatesRepo
    return yield* repo.completeTodo(input)
  })

export const createEventNoteWorkflow = (input: CreateEventNoteInput & { userId: string }) =>
  Effect.gen(function* () {
    const repo = yield* EventUpdatesRepo
    return yield* repo.createNote(input)
  })

export const updateEventDetailsWorkflow = (input: UpdateEventDetailsInput & { userId: string }) =>
  Effect.gen(function* () {
    const repo = yield* EventUpdatesRepo
    return yield* repo.updateDetails(input)
  })
