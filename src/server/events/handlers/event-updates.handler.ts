import { transportInput } from '@/lib/input-validation'
import { eventAuthorizationMiddleware } from '@/lib/event-authorization.middleware'
import { getRequest } from '@tanstack/react-start/server'
import { runServerEffect } from '@/server/effect'
import { validateInput } from '@/server/validation'
import type { ServerResult } from '@/server/result'
import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { ForbiddenError } from '@/lib/domain-errors'
import { isSameOriginEventUpdateRequest } from './event-updates.request-guard'
import {
  CompleteTodoInputSchema,
  CreateEventNoteInputSchema,
  UpdateEventDetailsInputSchema,
  type EventUpdateResult,
} from '../contracts/event-updates.contracts'
import {
  completeTodoWorkflow,
  createEventNoteWorkflow,
  updateEventDetailsWorkflow,
} from '../workflows/event-updates.workflows.live'

function requireSameOriginMutation() {
  if (isSameOriginEventUpdateRequest(getRequest())) return Effect.succeed(undefined)
  return Effect.fail(
    new ForbiddenError({
      category: 'authorization',
      code: 'UNTRUSTED_EVENT_WRITE',
      userMessageKey: 'serverErrors.AUTHORIZATION',
    })
  )
}

export const completeEventTodo = createServerFn({ method: 'POST' })
  .middleware([eventAuthorizationMiddleware({ todo: ['update'] })])
  .validator(transportInput(CompleteTodoInputSchema))
  .handler(
    ({
      data,
      context,
    }): Promise<
      ServerResult<{
        eventId: string
        todoId: string
        isCompleted: boolean
        version: number
      }>
    > =>
      runServerEffect(
        Effect.gen(function* () {
          yield* requireSameOriginMutation()
          const input = yield* validateInput(CompleteTodoInputSchema, data)
          return yield* completeTodoWorkflow({ ...input, userId: context.user.id })
        })
      )
  )

export const createEventNote = createServerFn({ method: 'POST' })
  .middleware([eventAuthorizationMiddleware({ note: ['send'] })])
  .validator(transportInput(CreateEventNoteInputSchema))
  .handler(
    ({
      data,
      context,
    }): Promise<
      ServerResult<{
        eventId: string
        noteId: string
        version: number
        duplicate: boolean
      }>
    > =>
      runServerEffect(
        Effect.gen(function* () {
          yield* requireSameOriginMutation()
          const input = yield* validateInput(CreateEventNoteInputSchema, data)
          return yield* createEventNoteWorkflow({ ...input, userId: context.user.id })
        })
      )
  )

export const updateEventDetails = createServerFn({ method: 'POST' })
  .middleware([eventAuthorizationMiddleware({ event: ['update'] })])
  .validator(transportInput(UpdateEventDetailsInputSchema))
  .handler(({ data, context }): Promise<ServerResult<EventUpdateResult>> =>
    runServerEffect(
      Effect.gen(function* () {
        yield* requireSameOriginMutation()
        const input = yield* validateInput(UpdateEventDetailsInputSchema, data)
        return yield* updateEventDetailsWorkflow({ ...input, userId: context.user.id })
      })
    )
  )
