import { Effect, Layer } from 'effect'
import { EventAccessLive } from '../event.layers.live'
import { EventReadingRepoLive } from '../repos/event-reading.repo.live'
import { getEventReadingWorkflow as program } from './event-reading.workflow'

const EventReadingLive = Layer.mergeAll(EventAccessLive, EventReadingRepoLive)
export const getEventReadingWorkflow = (...args: Parameters<typeof program>) =>
  program(...args).pipe(Effect.provide(EventReadingLive))
