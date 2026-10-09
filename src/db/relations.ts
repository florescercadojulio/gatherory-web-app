import { defineRelationsPart } from "drizzle-orm"

import * as authSchema from "@/db/schema/auth.schema"
import * as eventSchema from "@/db/schema/event.schema"

export const databaseRelations = defineRelationsPart(
  { ...authSchema, ...eventSchema },
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
      organizationMemberships: r.many.member({
        from: r.user.id,
        to: r.member.userId,
      }),
      teamMemberships: r.many.teamMember({
        from: r.user.id,
        to: r.teamMember.userId,
      }),
      eventParticipants: r.many.eventParticipant({
        from: r.user.id,
        to: r.eventParticipant.userId,
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
      events: r.many.event({
        from: r.organization.id,
        to: r.event.organizationId,
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
      members: r.many.teamMember({
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
    },
    eventParticipant: {
      event: r.one.event({
        from: r.eventParticipant.eventId,
        to: r.event.id,
      }),
      user: r.one.user({
        from: r.eventParticipant.userId,
        to: r.user.id,
      }),
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
    },
  }),
)
