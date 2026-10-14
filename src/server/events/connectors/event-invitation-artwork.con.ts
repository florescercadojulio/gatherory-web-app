import { Context, type Effect } from 'effect'

export type InvitationArtwork = { readonly bucket: string; readonly storageKey: string }

export type EventInvitationArtworkShape = {
  readonly sign: (asset: InvitationArtwork) => Effect.Effect<string, unknown>
}

export class EventInvitationArtwork extends Context.Service<
  EventInvitationArtwork,
  EventInvitationArtworkShape
>()('EventInvitationArtwork') {}
