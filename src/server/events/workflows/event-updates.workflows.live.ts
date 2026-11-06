import { Effect } from 'effect'
import { EventUpdatesRepoLive } from '../repos/event-updates.repo.live'
import {
  completeTodoWorkflow as completeProgram,
  createEventNoteWorkflow as createNoteProgram,
  updateEventDetailsWorkflow as updateDetailsProgram,
} from './event-updates.workflow'

export const completeTodoWorkflow = (...args: Parameters<typeof completeProgram>) =>
  completeProgram(...args).pipe(Effect.provide(EventUpdatesRepoLive))

export const createEventNoteWorkflow = (...args: Parameters<typeof createNoteProgram>) =>
  createNoteProgram(...args).pipe(Effect.provide(EventUpdatesRepoLive))

export const updateEventDetailsWorkflow = (...args: Parameters<typeof updateDetailsProgram>) =>
  updateDetailsProgram(...args).pipe(Effect.provide(EventUpdatesRepoLive))
