import { expect, it } from '@effect/vitest'
import { Effect, Layer } from 'effect'
import { ConflictError } from '@/lib/domain-errors'
import {
  EventUpdatesRepo,
  type EventUpdatesRepoShape,
} from '@/server/events/repos/event-updates.repo'
import {
  completeTodoWorkflow,
  createEventNoteWorkflow,
  updateEventDetailsWorkflow,
} from '@/server/events/workflows/event-updates.workflow'

const eventId = '753c2e6c-d6cc-495b-9649-df5ed968a98f'
const todoId = 'bb0e39a3-d3a1-40fb-87ed-3b9914de4368'
const key = 'b529b57c-cdd8-4f11-adcf-dc7853da951c'

function layer(overrides: Partial<EventUpdatesRepoShape> = {}) {
  const repo: EventUpdatesRepoShape = {
    completeTodo: () => Effect.succeed({ eventId, todoId, isCompleted: true, version: 9 }),
    createNote: () => Effect.succeed({ eventId, noteId: key, version: 1, duplicate: false }),
    updateDetails: () => Effect.succeed({ eventId, version: 3, changes: { title: 'Dinner' } }),
    ...overrides,
  }
  return Layer.succeed(EventUpdatesRepo, repo)
}

it.effect(
  'passes the actor, event scope, desired state, and expected task version to the repo',
  () => {
    let received: unknown
    return completeTodoWorkflow({
      userId: 'user-1',
      eventId,
      todoId,
      isCompleted: true,
      expectedVersion: 8,
    }).pipe(
      Effect.provide(
        layer({
          completeTodo: (input) => {
            received = input
            return Effect.succeed({ eventId, todoId, isCompleted: true, version: 9 })
          },
        })
      ),
      Effect.tap((result) =>
        Effect.sync(() => {
          expect(received).toEqual({
            userId: 'user-1',
            eventId,
            todoId,
            isCompleted: true,
            expectedVersion: 8,
          })
          expect(result).toEqual({ eventId, todoId, isCompleted: true, version: 9 })
        })
      )
    )
  }
)

it.effect('keeps the note idempotency key bound to its authored event note request', () => {
  let received: unknown
  return createEventNoteWorkflow({
    userId: 'user-2',
    eventId,
    idempotencyKey: key,
    body: 'Bring cups',
  }).pipe(
    Effect.provide(
      layer({
        createNote: (input) => {
          received = input
          return Effect.succeed({ eventId, noteId: key, version: 1, duplicate: true })
        },
      })
    ),
    Effect.tap((result) =>
      Effect.sync(() => {
        expect(received).toEqual({
          userId: 'user-2',
          eventId,
          idempotencyKey: key,
          body: 'Bring cups',
        })
        expect(result).toEqual({ eventId, noteId: key, version: 1, duplicate: true })
      })
    )
  )
})

it.effect(
  'preserves conflict failures for the UI to refresh and retry against current data',
  () => {
    const conflict = new ConflictError({
      category: 'conflict',
      code: 'SERVER_VERSION_CONFLICT',
      userMessageKey: 'serverErrors.CONFLICT',
    })
    return updateEventDetailsWorkflow({
      userId: 'manager-1',
      eventId,
      expectedVersion: 2,
      changes: { title: 'Dinner' },
    }).pipe(
      Effect.provide(
        layer({
          updateDetails: () => Effect.fail(conflict),
        })
      ),
      Effect.flip,
      Effect.tap((error) => Effect.sync(() => expect(error).toBe(conflict)))
    )
  }
)
