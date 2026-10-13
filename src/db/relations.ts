import { defineRelationsPart } from "drizzle-orm"

import * as authSchema from "@/db/schema/auth.schema"
import * as eventSchema from "@/db/schema/event.schema"
import * as mediaSchema from "@/db/schema/media.schema"
import * as moderationSchema from "@/db/schema/moderation.schema"
import * as planningSchema from "@/db/schema/planning.schema"
import * as syncSchema from "@/db/schema/sync.schema"

export const databaseRelations = defineRelationsPart(
  {
    ...authSchema,
    ...eventSchema,
    ...mediaSchema,
    ...moderationSchema,
    ...planningSchema,
    ...syncSchema,
  },
  (r) => ({
    user: {
      sessions: r.many.session({
        from: r.user.id,
        to: r.session.userId,
      }),
      accounts: r.many.account({
        from: r.user.id,
        to: r.account.userId,
      }),
      members: r.many.member({
        from: r.user.id,
        to: r.member.userId,
      }),
      teamMembers: r.many.teamMember({
        from: r.user.id,
        to: r.teamMember.userId,
      }),
      invitations: r.many.invitation({
        from: r.user.id,
        to: r.invitation.inviterId,
      }),
      workspacePeople: r.many.workspacePerson({
        from: r.user.id,
        to: r.workspacePerson.userId,
      }),
      uploadedMedia: r.many.mediaAsset({
        from: r.user.id,
        to: r.mediaAsset.uploadedByUserId,
      }),
      submittedIdeas: r.many.idea({
        from: r.user.id,
        to: r.idea.submittedByUserId,
      }),
      ideaDecisions: r.many.ideaDecision({
        from: r.user.id,
        to: r.ideaDecision.userId,
      }),
      registryCommitments: r.many.registryCommitment({
        from: r.user.id,
        to: r.registryCommitment.userId,
      }),
      nativeWorkspaceSnapshots: r.many.nativeWorkspaceSnapshot({
        from: r.user.id,
        to: r.nativeWorkspaceSnapshot.ownerUserId,
      }),
      nativeSyncScopeMemberships: r.many.nativeSyncScopeMember({
        from: r.user.id,
        to: r.nativeSyncScopeMember.userId,
      }),
    },
    session: {
      user: r.one.user({
        from: r.session.userId,
        to: r.user.id,
      }),
    },
    account: {
      user: r.one.user({
        from: r.account.userId,
        to: r.user.id,
      }),
    },
    organization: {
      members: r.many.member({
        from: r.organization.id,
        to: r.member.organizationId,
      }),
      teams: r.many.team({
        from: r.organization.id,
        to: r.team.organizationId,
      }),
      invitations: r.many.invitation({
        from: r.organization.id,
        to: r.invitation.organizationId,
      }),
      events: r.many.event({
        from: r.organization.id,
        to: r.event.organizationId,
      }),
      mediaAssets: r.many.mediaAsset({
        from: r.organization.id,
        to: r.mediaAsset.organizationId,
      }),
      planningSettings: r.one.workspacePlanningSettings({
        from: r.organization.id,
        to: r.workspacePlanningSettings.organizationId,
      }),
      ideas: r.many.idea({
        from: r.organization.id,
        to: r.idea.organizationId,
      }),
      people: r.many.workspacePerson({
        from: r.organization.id,
        to: r.workspacePerson.organizationId,
      }),
      nativeWorkspaceSnapshot: r.one.nativeWorkspaceSnapshot({
        from: r.organization.id,
        to: r.nativeWorkspaceSnapshot.organizationId,
      }),
    },
    member: {
      organization: r.one.organization({
        from: r.member.organizationId,
        to: r.organization.id,
      }),
      user: r.one.user({
        from: r.member.userId,
        to: r.user.id,
      }),
    },
    team: {
      organization: r.one.organization({
        from: r.team.organizationId,
        to: r.organization.id,
      }),
      teamMembers: r.many.teamMember({
        from: r.team.id,
        to: r.teamMember.teamId,
      }),
    },
    teamMember: {
      team: r.one.team({
        from: r.teamMember.teamId,
        to: r.team.id,
      }),
      user: r.one.user({
        from: r.teamMember.userId,
        to: r.user.id,
      }),
    },
    invitation: {
      organization: r.one.organization({
        from: r.invitation.organizationId,
        to: r.organization.id,
      }),
      user: r.one.user({
        from: r.invitation.inviterId,
        to: r.user.id,
      }),
    },
    event: {
      workspace: r.one.organization({
        from: r.event.organizationId,
        to: r.organization.id,
      }),
      parent: r.one.event({
        from: r.event.parentEventId,
        to: r.event.id,
        alias: "event_parent",
      }),
      children: r.many.event({
        from: r.event.id,
        to: r.event.parentEventId,
        alias: "event_children",
      }),
      participants: r.many.eventParticipant({
        from: r.event.id,
        to: r.eventParticipant.eventId,
      }),
      invitations: r.many.eventInvitation({
        from: r.event.id,
        to: r.eventInvitation.eventId,
      }),
      shareLink: r.one.eventShareLink({
        from: r.event.id,
        to: r.eventShareLink.eventId,
      }),
      media: r.many.eventMedia({
        from: r.event.id,
        to: r.eventMedia.eventId,
      }),
      ideas: r.many.idea({
        from: r.event.id,
        to: r.idea.eventId,
      }),
      expenses: r.many.eventExpense({
        from: r.event.id,
        to: r.eventExpense.eventId,
      }),
      notes: r.many.eventNote({
        from: r.event.id,
        to: r.eventNote.eventId,
      }),
      registryItems: r.many.registryItem({
        from: r.event.id,
        to: r.registryItem.eventId,
      }),
    },
    eventParticipant: {
      event: r.one.event({
        from: r.eventParticipant.eventId,
        to: r.event.id,
      }),
      person: r.one.workspacePerson({
        from: r.eventParticipant.personId,
        to: r.workspacePerson.id,
      }),
    },
    workspacePerson: {
      workspace: r.one.organization({
        from: r.workspacePerson.organizationId,
        to: r.organization.id,
      }),
      user: r.one.user({
        from: r.workspacePerson.userId,
        to: r.user.id,
      }),
      participations: r.many.eventParticipant({
        from: r.workspacePerson.id,
        to: r.eventParticipant.personId,
      }),
      invitations: r.many.eventInvitation({
        from: r.workspacePerson.id,
        to: r.eventInvitation.personId,
      }),
    },
    eventShareLink: {
      event: r.one.event({ from: r.eventShareLink.eventId, to: r.event.id }),
      creator: r.one.user({ from: r.eventShareLink.createdByUserId, to: r.user.id }),
    },
    eventInvitation: {
      event: r.one.event({
        from: r.eventInvitation.eventId,
        to: r.event.id,
      }),
      inviter: r.one.user({
        from: r.eventInvitation.invitedByUserId,
        to: r.user.id,
        alias: "event_invitation_inviter",
      }),
      acceptedBy: r.one.user({
        from: r.eventInvitation.acceptedByUserId,
        to: r.user.id,
        alias: "event_invitation_acceptor",
      }),
      person: r.one.workspacePerson({
        from: r.eventInvitation.personId,
        to: r.workspacePerson.id,
      }),
    },
    mediaAsset: {
      workspace: r.one.organization({
        from: r.mediaAsset.organizationId,
        to: r.organization.id,
      }),
      uploadedBy: r.one.user({
        from: r.mediaAsset.uploadedByUserId,
        to: r.user.id,
      }),
      eventPlacements: r.many.eventMedia({
        from: r.mediaAsset.id,
        to: r.eventMedia.mediaAssetId,
      }),
      ideaPlacements: r.many.ideaMedia({
        from: r.mediaAsset.id,
        to: r.ideaMedia.mediaAssetId,
      }),
      registryPlacements: r.many.registryItemMedia({
        from: r.mediaAsset.id,
        to: r.registryItemMedia.mediaAssetId,
      }),
    },
    eventMedia: {
      event: r.one.event({
        from: r.eventMedia.eventId,
        to: r.event.id,
      }),
      asset: r.one.mediaAsset({
        from: r.eventMedia.mediaAssetId,
        to: r.mediaAsset.id,
      }),
    },
    workspacePlanningSettings: {
      workspace: r.one.organization({
        from: r.workspacePlanningSettings.organizationId,
        to: r.organization.id,
      }),
    },
    idea: {
      workspace: r.one.organization({
        from: r.idea.organizationId,
        to: r.organization.id,
      }),
      event: r.one.event({
        from: r.idea.eventId,
        to: r.event.id,
      }),
      submittedBy: r.one.user({
        from: r.idea.submittedByUserId,
        to: r.user.id,
      }),
      decisions: r.many.ideaDecision({
        from: r.idea.id,
        to: r.ideaDecision.ideaId,
      }),
      musicTracks: r.many.ideaMusicTrack({
        from: r.idea.id,
        to: r.ideaMusicTrack.ideaId,
      }),
      media: r.many.ideaMedia({
        from: r.idea.id,
        to: r.ideaMedia.ideaId,
      }),
    },
    ideaDecision: {
      idea: r.one.idea({
        from: r.ideaDecision.ideaId,
        to: r.idea.id,
      }),
      user: r.one.user({
        from: r.ideaDecision.userId,
        to: r.user.id,
      }),
    },
    musicTrack: {
      ideas: r.many.ideaMusicTrack({
        from: r.musicTrack.id,
        to: r.ideaMusicTrack.musicTrackId,
      }),
    },
    ideaMusicTrack: {
      idea: r.one.idea({
        from: r.ideaMusicTrack.ideaId,
        to: r.idea.id,
      }),
      track: r.one.musicTrack({
        from: r.ideaMusicTrack.musicTrackId,
        to: r.musicTrack.id,
      }),
    },
    eventExpense: {
      event: r.one.event({
        from: r.eventExpense.eventId,
        to: r.event.id,
      }),
      sourceIdea: r.one.idea({
        from: r.eventExpense.sourceIdeaId,
        to: r.idea.id,
      }),
    },
    eventNote: {
      event: r.one.event({
        from: r.eventNote.eventId,
        to: r.event.id,
      }),
      author: r.one.user({
        from: r.eventNote.authorUserId,
        to: r.user.id,
      }),
    },
    registryItem: {
      event: r.one.event({
        from: r.registryItem.eventId,
        to: r.event.id,
      }),
      sourceIdea: r.one.idea({
        from: r.registryItem.sourceIdeaId,
        to: r.idea.id,
      }),
      commitments: r.many.registryCommitment({
        from: r.registryItem.id,
        to: r.registryCommitment.registryItemId,
      }),
      media: r.many.registryItemMedia({
        from: r.registryItem.id,
        to: r.registryItemMedia.registryItemId,
      }),
    },
    registryCommitment: {
      item: r.one.registryItem({
        from: r.registryCommitment.registryItemId,
        to: r.registryItem.id,
      }),
      user: r.one.user({
        from: r.registryCommitment.userId,
        to: r.user.id,
      }),
    },
    ideaMedia: {
      idea: r.one.idea({
        from: r.ideaMedia.ideaId,
        to: r.idea.id,
      }),
      asset: r.one.mediaAsset({
        from: r.ideaMedia.mediaAssetId,
        to: r.mediaAsset.id,
      }),
    },
    registryItemMedia: {
      item: r.one.registryItem({
        from: r.registryItemMedia.registryItemId,
        to: r.registryItem.id,
      }),
      asset: r.one.mediaAsset({
        from: r.registryItemMedia.mediaAssetId,
        to: r.mediaAsset.id,
      }),
    },
    nativeWorkspaceSnapshot: {
      owner: r.one.user({
        from: r.nativeWorkspaceSnapshot.ownerUserId,
        to: r.user.id,
      }),
      workspace: r.one.organization({
        from: r.nativeWorkspaceSnapshot.organizationId,
        to: r.organization.id,
      }),
      members: r.many.nativeSyncScopeMember({
        from: r.nativeWorkspaceSnapshot.scopeId,
        to: r.nativeSyncScopeMember.scopeId,
      }),
      entities: r.many.nativeSyncEntity({
        from: r.nativeWorkspaceSnapshot.scopeId,
        to: r.nativeSyncEntity.scopeId,
      }),
    },
    nativeSyncScopeMember: {
      workspace: r.one.nativeWorkspaceSnapshot({
        from: r.nativeSyncScopeMember.scopeId,
        to: r.nativeWorkspaceSnapshot.scopeId,
      }),
      user: r.one.user({
        from: r.nativeSyncScopeMember.userId,
        to: r.user.id,
      }),
    },
    nativeSyncEntity: {
      workspace: r.one.nativeWorkspaceSnapshot({
        from: r.nativeSyncEntity.scopeId,
        to: r.nativeWorkspaceSnapshot.scopeId,
      }),
    },
  }),
)
