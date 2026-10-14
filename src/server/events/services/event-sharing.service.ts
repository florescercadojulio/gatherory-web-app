import { Context } from 'effect'
import type { EventSharingRepoShape } from '../repos/event-sharing.repo'

export type EventSharingServiceShape = EventSharingRepoShape

export class EventSharingService extends Context.Service<
  EventSharingService,
  EventSharingServiceShape
>()('EventSharingService') {}
