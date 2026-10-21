import { Effect, Layer } from 'effect'
import { validateInput } from '@/server/validation'
import {
  AnnouncementEventSchema,
  SendAnnouncementSchema,
} from '../contracts/announcement.contracts'
import { AnnouncementRepository } from '../repos/announcement.repo.contract'
import { AnnouncementService } from './announcement.service'

export const AnnouncementServiceLive = Layer.effect(
  AnnouncementService,
  Effect.gen(function* () {
    const repo = yield* AnnouncementRepository
    return {
      list: (input) =>
        Effect.gen(function* () {
          const eventId = yield* validateInput(AnnouncementEventSchema, input.eventId)
          return yield* repo.list({ ...input, eventId })
        }),
      send: (input) =>
        Effect.gen(function* () {
          const eventId = yield* validateInput(AnnouncementEventSchema, input.eventId)
          const message = yield* validateInput(SendAnnouncementSchema, {
            requestId: input.requestId,
            message: input.message,
            audience: input.audience,
          })
          return yield* repo.send({ ...input, ...message, eventId })
        }),
    }
  })
)
