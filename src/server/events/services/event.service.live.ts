import { Effect, Layer } from 'effect'
import { planningPermissionFromDatabase } from '@/lib/permissions'
import { EntityNotFoundError, ForbiddenError } from '@/server/effect'

import { EventRepo } from '../repos/event.repo.contract'
import { EventAuthorization } from './event-authorization.service'
import { EventService } from './event.service'

export const EventServiceLive = Layer.effect(
  EventService,
  Effect.gen(function* () {
    const repo = yield* EventRepo
    const authorization = yield* EventAuthorization

    return {
      getInvitationDetails: (input) =>
        Effect.gen(function* () {
          const invitation = yield* repo.getInvitationDetails(input)
          if (!invitation || !['pending', 'accepted'].includes(invitation.status)) {
            return yield* Effect.fail(
              new EntityNotFoundError({
                category: 'not_found',
                code: 'INVITATION_UNAVAILABLE',
                userMessageKey: 'serverErrors.INVITATION_UNAVAILABLE',
              })
            )
          }
          return { ...invitation, expiresAt: invitation.expiresAt.toISOString() }
        }),

      previewEmailInvitation: (input) =>
        Effect.gen(function* () {
          const invitation = yield* repo.getInvitationPreviewDetails(input)
          if (
            !invitation ||
            !['pending', 'accepted'].includes(invitation.status) ||
            (invitation.status !== 'accepted' && invitation.expiresAt <= new Date())
          ) {
            return yield* Effect.fail(
              new EntityNotFoundError({
                category: 'not_found',
                code: 'INVITATION_UNAVAILABLE',
                userMessageKey: 'serverErrors.INVITATION_UNAVAILABLE',
              })
            )
          }
          return {
            ...invitation,
            expiresAt: invitation.expiresAt.toISOString(),
            startsAt: invitation.startsAt?.toISOString() ?? null,
          }
        }),

      getParentEventId: (eventId) => repo.getEventParentId(eventId),

      create: (actor, event) =>
        Effect.gen(function* () {
          if (event.parentEventId) {
            const participant = yield* repo.getEventParticipant({
              eventId: event.parentEventId,
              userId: actor.userId,
            })
            if (!participant) {
              return yield* Effect.fail(
                new ForbiddenError({
                  category: 'authorization',
                  code: 'PARENT_EVENT_PARTICIPANT_REQUIRED',
                  userMessageKey: 'serverErrors.PARENT_EVENT_PARTICIPANT_REQUIRED',
                })
              )
            }

            yield* authorization.require(
              {
                role: participant.role,
                planningPermission: planningPermissionFromDatabase(participant.planningPermission),
              },
              { event: ['create_child'] }
            )
          } else {
            const isMember = yield* repo.hasWorkspaceMembership(actor)
            if (!isMember) {
              return yield* Effect.fail(
                new ForbiddenError({
                  category: 'authorization',
                  code: 'WORKSPACE_MEMBERSHIP_REQUIRED',
                  userMessageKey: 'serverErrors.WORKSPACE_MEMBERSHIP_REQUIRED',
                })
              )
            }
          }

          return yield* repo.createEventWithParticipants({ ...actor, event })
        }),

      list: (actor) => repo.listVisibleMainEvents(actor),

      inviteParticipant: (userId, invitation) =>
        Effect.gen(function* () {
          const participant = yield* repo.getEventParticipant({
            eventId: invitation.eventId,
            userId,
          })
          if (!participant) {
            return yield* Effect.fail(
              new ForbiddenError({
                category: 'authorization',
                code: 'EVENT_PARTICIPANT_REQUIRED',
                userMessageKey: 'serverErrors.EVENT_PARTICIPANT_REQUIRED',
              })
            )
          }

          yield* authorization.require(
            {
              role: participant.role,
              planningPermission: planningPermissionFromDatabase(participant.planningPermission),
            },
            { event: ['manage_participants'] }
          )

          return yield* repo.createEventInvitation({
            actorUserId: userId,
            invitation,
          })
        }),

      acceptInvitation: (input) => repo.acceptEventInvitation(input),
    }
  })
)
