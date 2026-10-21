import { Effect, Layer } from 'effect'
import { EventInvitationArtwork } from '../connectors/event-invitation-artwork.con'
import { EventGuestRepo, type EventGuestRepoShape } from '../repos/event-guest.repo'
import { EventGuestService } from './event-guest.service'

type InvitationProjections = Effect.Success<
  ReturnType<EventGuestRepoShape['listInvitationProjections']>
>

export const EventGuestServiceLive = Layer.effect(
  EventGuestService,
  Effect.gen(function* () {
    const repo = yield* EventGuestRepo
    const artwork = yield* EventInvitationArtwork

    const sign = (asset: { bucket: string; storageKey: string } | null | undefined) =>
      asset
        ? artwork
            .sign(asset)
            .pipe(
              Effect.catch(() =>
                Effect.logWarning('Invitation artwork could not be signed').pipe(Effect.as(null))
              )
            )
        : Effect.succeed(null)
    const signProjections = (projections: InvitationProjections) =>
      Effect.gen(function* () {
        const invitations = []
        for (const projection of projections) {
          const ideas = []
          for (const idea of projection.ideas) {
            const { imageAsset, ...details } = idea
            ideas.push({
              ...details,
              imageURL: yield* sign(imageAsset),
              imageId: imageAsset?.id ?? null,
            })
          }
          const moments = []
          for (const moment of projection.moments) {
            const { imageAsset, ...details } = moment
            moments.push({ ...details, imageURL: yield* sign(imageAsset) })
          }
          const { coverAsset, ...details } = projection
          invitations.push({
            ...details,
            coverURL: yield* sign(coverAsset),
            coverId: coverAsset?.id ?? null,
            ideas,
            moments,
          })
        }
        return invitations
      })

    return {
      listInvitations: (userId) =>
        Effect.gen(function* () {
          return yield* signProjections(yield* repo.listInvitationProjections(userId))
        }),
      listDeviceGuestInvitations: (profileId) =>
        Effect.gen(function* () {
          const invitations = yield* signProjections(
            yield* repo.listDeviceGuestInvitationProjections(profileId)
          )
          return invitations.map((invitation) => ({
            ...invitation,
            // Device guests do not need account identifiers to attend an event.
            people: invitation.people.map((person) => ({ ...person, userId: null })),
            ideas: invitation.ideas.map((idea) => ({ ...idea, submittedByUserId: null })),
            moments: invitation.moments.map((moment) => ({ ...moment, addedByUserId: null })),
          }))
        }),
      invitationCoverURL: (eventId, userId) =>
        repo.getInvitationCoverAsset(eventId, userId).pipe(Effect.flatMap(sign)),
      respondToEvent: repo.respondToEvent,
      leaveGuestEvent: repo.leaveGuestEvent,
    }
  })
)
