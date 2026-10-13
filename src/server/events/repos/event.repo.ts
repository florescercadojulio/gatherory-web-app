import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import type { PgClient } from "@effect/sql-pg/PgClient";
import { Context, Effect } from "effect";
import type { SqlError } from "effect/unstable/sql/SqlError";

import { DB } from "@/db";
import { member, organization, user } from "@/db/schema/auth.schema";
import {
  event,
  eventInvitation,
  eventParticipant,
  workspacePerson,
} from "@/db/schema/event.schema";
import {
  nativeSyncScopeMember,
  nativeWorkspaceSnapshot,
  nativeSyncEntity,
  nativeSyncChange,
} from "@/db/schema/sync.schema";

import type {
  AcceptEventInvitationInput,
  CreateEventInput,
  InviteEventParticipantInput,
} from "../contracts/event.contracts";
import { PersistenceError } from "@/server/effect";

const planningPermissionToDatabase = {
  manage: "manage",
  contribute: "contribute",
  viewOnly: "view_only",
} as const;

type InheritedParticipant = Pick<
  typeof eventParticipant.$inferSelect,
  "personId" | "role" | "planningPermission" | "attendanceStatus"
>;

type EventPersistenceError =
  EffectDrizzleQueryError | SqlError | PersistenceError;

function persistenceFailure(code: string) {
  return Effect.fail(
    new PersistenceError({
      category: "system",
      code,
      cause: new Error(code),
      debugMessage: code,
    }),
  );
}

export function hasWorkspaceMembership(input: {
  organizationId: string;
  userId: string;
}) {
  return Effect.gen(function* () {
    const db = yield* DB;
    const [membership] = yield* db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.organizationId, input.organizationId),
          eq(member.userId, input.userId),
        ),
      )
      .limit(1);

    return Boolean(membership);
  });
}

export function getEventParticipant(input: {
  eventId: string;
  userId: string;
}) {
  return Effect.gen(function* () {
    const db = yield* DB;
    const [participant] = yield* db
      .select({
        role: eventParticipant.role,
        planningPermission: eventParticipant.planningPermission,
      })
      .from(event)
      .innerJoin(eventParticipant, eq(eventParticipant.eventId, event.id))
      .innerJoin(
        workspacePerson,
        and(
          eq(workspacePerson.id, eventParticipant.personId),
          eq(workspacePerson.organizationId, event.organizationId),
        ),
      )
      .where(
        and(
          eq(event.id, input.eventId),
          eq(workspacePerson.userId, input.userId),
        ),
      )
      .limit(1);

    return participant;
  });
}

export function createEventWithParticipants(input: {
  organizationId: string;
  userId: string;
  event: CreateEventInput;
}) {
  return Effect.gen(function* () {
    const db = yield* DB;
    return yield* db.transaction((transaction) =>
      Effect.gen(function* () {
        let inheritedParticipants: InheritedParticipant[] = [];

        if (input.event.parentEventId) {
          const [parent] = yield* transaction
            .select({
              id: event.id,
              parentEventId: event.parentEventId,
              organizationId: event.organizationId,
            })
            .from(event)
            .where(
              and(
                eq(event.id, input.event.parentEventId),
                eq(event.organizationId, input.organizationId),
              ),
            )
            .limit(1);

          if (!parent)
            return yield* persistenceFailure("EVENT_PARENT_NOT_FOUND");
          if (parent.parentEventId)
            return yield* persistenceFailure("EVENT_DEPTH_EXCEEDED");

          inheritedParticipants = yield* transaction
            .select({
              personId: eventParticipant.personId,
              role: eventParticipant.role,
              planningPermission: eventParticipant.planningPermission,
              attendanceStatus: eventParticipant.attendanceStatus,
            })
            .from(eventParticipant)
            .where(eq(eventParticipant.eventId, parent.id));
        }

        const [createdEvent] = yield* transaction
          .insert(event)
          .values({
            organizationId: input.organizationId,
            parentEventId: input.event.parentEventId ?? null,
            title: input.event.title,
            description: input.event.description,
            imageUrl: input.event.imageUrl,
            status: input.event.parentEventId ? null : "draft",
            purpose: input.event.purpose ?? null,
            category: "category" in input.event ? input.event.category : null,
            planningStatus:
              "planningStatus" in input.event
                ? input.event.planningStatus
                : null,
            startsAt: input.event.startsAt
              ? new Date(input.event.startsAt)
              : undefined,
            endsAt: input.event.endsAt
              ? new Date(input.event.endsAt)
              : undefined,
            schedulingState: input.event.startsAt ? "scheduled" : "unscheduled",
            timeZone: input.event.timeZone,
            locationName: input.event.locationName,
            locationAddress: input.event.locationAddress,
            createdByUserId: input.userId,
          })
          .returning({
            id: event.id,
            title: event.title,
            status: event.status,
            parentEventId: event.parentEventId,
          });

        if (!createdEvent)
          return yield* persistenceFailure("EVENT_CREATE_FAILED");

        if (inheritedParticipants.length) {
          yield* transaction.insert(eventParticipant).values(
            inheritedParticipants.map((participant) => ({
              ...participant,
              eventId: createdEvent.id,
            })),
          );
        } else {
          const [account] = yield* transaction
            .select({ name: user.name, email: user.email, image: user.image })
            .from(user)
            .where(eq(user.id, input.userId))
            .limit(1);
          if (!account)
            return yield* persistenceFailure("EVENT_ACTOR_NOT_FOUND");

          const [person] = yield* transaction
            .insert(workspacePerson)
            .values({
              organizationId: input.organizationId,
              userId: input.userId,
              displayName: account.name,
              email: account.email.trim().toLowerCase(),
              avatarUrl: account.image,
            })
            .onConflictDoUpdate({
              target: [workspacePerson.organizationId, workspacePerson.userId],
              targetWhere: sql`${workspacePerson.userId} is not null`,
              set: {
                displayName: account.name,
                email: account.email.trim().toLowerCase(),
                avatarUrl: account.image,
                updatedAt: new Date(),
              },
            })
            .returning({ id: workspacePerson.id });
          if (!person)
            return yield* persistenceFailure("EVENT_PERSON_CREATE_FAILED");

          yield* transaction.insert(eventParticipant).values({
            eventId: createdEvent.id,
            personId: person.id,
            role: "host",
            planningPermission: "manage",
            attendanceStatus: "going",
          });
        }

        return createdEvent;
      }),
    );
  });
}

export function listVisibleMainEvents(input: {
  organizationId: string;
  userId: string;
}) {
  return Effect.gen(function* () {
    const db = yield* DB;
    const mainEvents = yield* db
      .select({
        id: event.id,
        workspaceName: organization.name,
        title: event.title,
        description: event.description,
        imageUrl: event.imageUrl,
        status: event.status,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        timeZone: event.timeZone,
        locationName: event.locationName,
      })
      .from(event)
      .innerJoin(organization, eq(organization.id, event.organizationId))
      .innerJoin(
        workspacePerson,
        eq(workspacePerson.organizationId, organization.id),
      )
      .innerJoin(
        eventParticipant,
        and(
          eq(eventParticipant.eventId, event.id),
          eq(eventParticipant.personId, workspacePerson.id),
          eq(workspacePerson.userId, input.userId),
        ),
      )
      .where(
        and(
          eq(event.organizationId, input.organizationId),
          isNull(event.parentEventId),
          inArray(eventParticipant.role, ["host", "collaborator"]),
        ),
      )
      .orderBy(asc(event.startsAt), asc(event.createdAt));

    if (!mainEvents.length) return [];

    const mainEventIds = mainEvents.map((item) => item.id);
    const childEvents = yield* db
      .select({
        id: event.id,
        parentEventId: event.parentEventId,
        title: event.title,
        purpose: event.purpose,
        status: event.planningStatus,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        timeZone: event.timeZone,
        locationName: event.locationName,
      })
      .from(event)
      .where(inArray(event.parentEventId, mainEventIds))
      .orderBy(asc(event.startsAt), asc(event.createdAt));

    const allEventIds = [
      ...mainEventIds,
      ...childEvents.map((item) => item.id),
    ];
    const participants = yield* db
      .select({
        eventId: eventParticipant.eventId,
        id: workspacePerson.id,
        userId: workspacePerson.userId,
        name: workspacePerson.displayName,
        image: sql<
          string | null
        >`coalesce(${user.image}, ${workspacePerson.avatarUrl})`,
        role: eventParticipant.role,
        planningPermission: eventParticipant.planningPermission,
        attendanceStatus: eventParticipant.attendanceStatus,
      })
      .from(eventParticipant)
      .innerJoin(
        workspacePerson,
        eq(workspacePerson.id, eventParticipant.personId),
      )
      .innerJoin(
        event,
        and(
          eq(event.id, eventParticipant.eventId),
          eq(event.organizationId, workspacePerson.organizationId),
        ),
      )
      .leftJoin(user, eq(user.id, workspacePerson.userId))
      .where(inArray(eventParticipant.eventId, allEventIds));
    const invitations = yield* db
      .select({ eventId: eventInvitation.eventId })
      .from(eventInvitation)
      .where(
        and(
          inArray(eventInvitation.eventId, allEventIds),
          eq(eventInvitation.status, "pending"),
        ),
      );

    const participantsByEvent = Map.groupBy(
      participants,
      (participant) => participant.eventId,
    );
    const invitationsByEvent = Map.groupBy(
      invitations,
      (invitation) => invitation.eventId,
    );
    const childrenByParent = Map.groupBy(
      childEvents,
      (child) => child.parentEventId,
    );

    return yield* Effect.forEach(mainEvents, (mainEvent) =>
      Effect.gen(function* () {
        if (!mainEvent.status)
          return yield* persistenceFailure("MAIN_EVENT_STATUS_MISSING");
        const status = mainEvent.status;
        const eventParticipants = (
          participantsByEvent.get(mainEvent.id) ?? []
        ).map(({ eventId: _eventId, ...participant }) => participant);
        const currentParticipant = eventParticipants.find(
          (participant) => participant.userId === input.userId,
        );
        if (!currentParticipant)
          return yield* persistenceFailure("EVENT_PARTICIPANT_NOT_FOUND");

        return {
          ...mainEvent,
          status,
          pendingInvitationCount:
            invitationsByEvent.get(mainEvent.id)?.length ?? 0,
          currentParticipant,
          participants: eventParticipants,
          childEvents: (childrenByParent.get(mainEvent.id) ?? []).flatMap(
            (child) => {
              if (!child.purpose || !child.status) return [];
              const status = child.status;
              const { parentEventId: _parentEventId, ...childEvent } = child;
              const childParticipants = participantsByEvent.get(child.id) ?? [];
              return [
                {
                  ...childEvent,
                  status,
                  purpose: child.purpose,
                  participantCount: childParticipants.length,
                  participants: childParticipants
                    .slice(0, 4)
                    .map(({ id, name, image }) => ({ id, name, image })),
                },
              ];
            },
          ),
        };
      }),
    );
  });
}

export function createEventInvitation(input: {
  actorUserId: string;
  invitation: InviteEventParticipantInput;
}) {
  return Effect.gen(function* () {
    const db = yield* DB;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const invitation = yield* db.transaction((transaction) =>
      Effect.gen(function* () {
        const [targetEvent] = yield* transaction
          .select({ organizationId: event.organizationId })
          .from(event)
          .where(eq(event.id, input.invitation.eventId))
          .limit(1);
        if (!targetEvent) return yield* persistenceFailure("EVENT_NOT_FOUND");

        const email = input.invitation.email.trim().toLowerCase();
        const [existingPerson] = yield* transaction
          .select({ id: workspacePerson.id })
          .from(workspacePerson)
          .where(
            and(
              eq(workspacePerson.organizationId, targetEvent.organizationId),
              eq(workspacePerson.email, email),
            ),
          )
          .limit(1);

        const person = existingPerson
          ? existingPerson
          : (yield* transaction
              .insert(workspacePerson)
              .values({
                organizationId: targetEvent.organizationId,
                displayName:
                  input.invitation.name || email.split("@")[0] || email,
                email,
              })
              .returning({ id: workspacePerson.id }))[0];
        if (!person)
          return yield* persistenceFailure("EVENT_INVITEE_CREATE_FAILED");

        const [createdInvitation] = yield* transaction
          .insert(eventInvitation)
          .values({
            eventId: input.invitation.eventId,
            personId: person.id,
            email,
            role: input.invitation.role,
            planningPermission:
              planningPermissionToDatabase[input.invitation.planningPermission],
            invitedByUserId: input.actorUserId,
            expiresAt,
          })
          .onConflictDoUpdate({
            target: [eventInvitation.eventId, eventInvitation.email],
            targetWhere: sql`${eventInvitation.status} = 'pending'`,
            set: {
              personId: person.id,
              // Reissuing an invitation revokes the previously shared token.
              token: crypto.randomUUID(),
              role: input.invitation.role,
              planningPermission:
                planningPermissionToDatabase[
                  input.invitation.planningPermission
                ],
              invitedByUserId: input.actorUserId,
              expiresAt,
              updatedAt: new Date(),
            },
          })
          .returning({
            id: eventInvitation.id,
            token: eventInvitation.token,
            email: eventInvitation.email,
            expiresAt: eventInvitation.expiresAt,
          });
        return createdInvitation;
      }),
    );

    if (!invitation)
      return yield* persistenceFailure("EVENT_INVITATION_CREATE_FAILED");
    return invitation;
  });
}

export function acceptEventInvitation(input: {
  userId: string;
  userEmail: string;
  invitation: AcceptEventInvitationInput;
}) {
  return Effect.gen(function* () {
    const db = yield* DB;
    return yield* db.transaction((transaction) =>
      Effect.gen(function* () {
        const [pendingInvitation] = yield* transaction
          .select({
            id: eventInvitation.id,
            eventId: eventInvitation.eventId,
            email: eventInvitation.email,
            personId: eventInvitation.personId,
            role: eventInvitation.role,
            planningPermission: eventInvitation.planningPermission,
            expiresAt: eventInvitation.expiresAt,
            organizationId: event.organizationId,
            status: eventInvitation.status,
            acceptedByUserId: eventInvitation.acceptedByUserId,
          })
          .from(eventInvitation)
          .innerJoin(event, eq(event.id, eventInvitation.eventId))
          .where(
            eq(eventInvitation.token, input.invitation.token),
          )
          .limit(1).for("update", { of: eventInvitation });

        if (!pendingInvitation)
          return yield* persistenceFailure("EVENT_INVITATION_NOT_FOUND");
        if (pendingInvitation.email !== input.userEmail.trim().toLowerCase())
          return yield* persistenceFailure("EVENT_INVITATION_EMAIL_MISMATCH");
        if (pendingInvitation.status === "accepted" && pendingInvitation.acceptedByUserId === input.userId) {
          const existing = yield* getEventParticipant({ eventId: pendingInvitation.eventId, userId: input.userId });
          if (!existing) return yield* persistenceFailure("EVENT_INVITATION_NOT_FOUND");
          return {
            eventId: pendingInvitation.eventId,
            ...existing,
          };
        }
        if (pendingInvitation.status !== "pending")
          return yield* persistenceFailure("EVENT_INVITATION_NOT_FOUND");
        if (pendingInvitation.expiresAt <= new Date())
          return yield* persistenceFailure("EVENT_INVITATION_EXPIRED");

        const [account] = yield* transaction
          .select({ name: user.name, email: user.email, image: user.image })
          .from(user)
          .where(eq(user.id, input.userId))
          .limit(1);
        if (!account)
          return yield* persistenceFailure("EVENT_INVITEE_ACCOUNT_NOT_FOUND");

        const [linkedPerson] = yield* transaction
          .select({ id: workspacePerson.id })
          .from(workspacePerson)
          .where(
            and(
              eq(
                workspacePerson.organizationId,
                pendingInvitation.organizationId,
              ),
              eq(workspacePerson.userId, input.userId),
            ),
          )
          .limit(1);

        let acceptedPersonId = linkedPerson?.id ?? pendingInvitation.personId;
        if (!linkedPerson) {
          const [updatedPerson] = yield* transaction
            .update(workspacePerson)
            .set({
              userId: input.userId,
              displayName: account.name,
              email: account.email.trim().toLowerCase(),
              avatarUrl: account.image,
              updatedAt: new Date(),
            })
            .where(eq(workspacePerson.id, pendingInvitation.personId))
            .returning({ id: workspacePerson.id });
          if (!updatedPerson)
            return yield* persistenceFailure("EVENT_INVITEE_LINK_FAILED");
          acceptedPersonId = updatedPerson.id;
        } else if (linkedPerson.id !== pendingInvitation.personId) {
          const oldParticipations = yield* transaction
            .select()
            .from(eventParticipant)
            .where(eq(eventParticipant.personId, pendingInvitation.personId));
          for (const oldParticipation of oldParticipations) {
            const [existingParticipation] = yield* transaction
              .select({ id: eventParticipant.id })
              .from(eventParticipant)
              .where(
                and(
                  eq(eventParticipant.eventId, oldParticipation.eventId),
                  eq(eventParticipant.personId, linkedPerson.id),
                ),
              )
              .limit(1);
            if (existingParticipation) {
              // Account-linked participation is authoritative; merging a contact
              // must not silently change an existing role or attendance.
              yield* transaction
                .delete(eventParticipant)
                .where(eq(eventParticipant.id, oldParticipation.id));
            } else {
              yield* transaction
                .update(eventParticipant)
                .set({ personId: linkedPerson.id, updatedAt: new Date() })
                .where(eq(eventParticipant.id, oldParticipation.id));
            }
          }
          yield* transaction
            .update(eventInvitation)
            .set({ personId: linkedPerson.id, updatedAt: new Date() })
            .where(eq(eventInvitation.personId, pendingInvitation.personId));
          yield* transaction
            .delete(workspacePerson)
            .where(eq(workspacePerson.id, pendingInvitation.personId));
        }

        const accepted = yield* transaction
          .update(eventInvitation)
          .set({
            status: "accepted",
            personId: acceptedPersonId,
            acceptedByUserId: input.userId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(eventInvitation.id, pendingInvitation.id),
              eq(eventInvitation.status, "pending"),
            ),
          )
          .returning({ id: eventInvitation.id });

        if (!accepted[0])
          return yield* persistenceFailure("EVENT_INVITATION_ALREADY_USED");

        yield* transaction
          .insert(eventParticipant)
          .values({
            eventId: pendingInvitation.eventId,
            personId: acceptedPersonId,
            role: pendingInvitation.role,
            planningPermission: pendingInvitation.planningPermission,
          })
          .onConflictDoNothing({
            target: [eventParticipant.eventId, eventParticipant.personId],
          });

        const [participation] = yield* transaction.select().from(eventParticipant)
          .where(and(eq(eventParticipant.eventId, pendingInvitation.eventId), eq(eventParticipant.personId, acceptedPersonId)))
          .limit(1);
        if (!participation) return yield* persistenceFailure("EVENT_PARTICIPATION_MISSING");

        // Native workspaces use the root event UUID as their sync scope today.
        // Only a planning role on the main event implies workspace-wide access.
        // Guests and child-event participants must stay event-scoped.
        const [acceptedEvent] = yield* transaction
          .select({ id: event.id, parentEventId: event.parentEventId })
          .from(event)
          .where(eq(event.id, pendingInvitation.eventId))
          .limit(1);
        const nativeScopeId =
          acceptedEvent &&
          acceptedEvent.parentEventId === null &&
          participation.role !== "guest"
            ? acceptedEvent.id
            : null;
        if (nativeScopeId) {
          const [nativeScope] = yield* transaction
            .select({ id: nativeWorkspaceSnapshot.scopeId })
            .from(nativeWorkspaceSnapshot)
            .where(eq(nativeWorkspaceSnapshot.scopeId, nativeScopeId))
            .limit(1);
          if (nativeScope) {
            yield* transaction
              .insert(nativeSyncScopeMember)
              .values({
                scopeId: nativeScope.id,
                userId: input.userId,
                role:
                  participation.planningPermission === "view_only"
                    ? "viewer"
                    : "editor",
              })
              .onConflictDoUpdate({
                target: [
                  nativeSyncScopeMember.scopeId,
                  nativeSyncScopeMember.userId,
                ],
                set: {
                  role:
                    sql`case when ${nativeSyncScopeMember.role} = 'owner' then 'owner'::native_sync_scope_role else ${participation.planningPermission === "view_only" ? "viewer" : "editor"}::native_sync_scope_role end`,
                  updatedAt: new Date(),
                },
              });
          }
        }

        // Account linking must also reach native replicas. Otherwise the new
        // collaborator can download the archive but has no identity in it.
        const rootId = acceptedEvent?.parentEventId ?? acceptedEvent?.id;
        if (rootId) {
          const [snapshot] = yield* transaction.select().from(nativeWorkspaceSnapshot)
            .where(eq(nativeWorkspaceSnapshot.scopeId, rootId)).limit(1).for("update");
          if (snapshot) {
            const permission = participation.planningPermission === "view_only" ? "viewOnly" : participation.planningPermission;
            const personPayload = {
              id: acceptedPersonId, userID: input.userId, name: account.name,
              email: account.email, profileImageURL: account.image,
              initials: account.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
              participantRole: participation.role, planningPermission: permission,
              attendance: "invited", invitationStatus: "active",
            };
            const foundationDate = (date: Date) => (date.getTime() - Date.UTC(2001, 0, 1)) / 1000;
            const participationPayload = {
              id: participation.id, eventID: participation.eventId, memberID: acceptedPersonId,
              role: participation.role, planningPermission: permission,
              attendance: ({ pending: "invited", going: "going", not_sure: "maybe", not_going: "declined" } as const)[participation.attendanceStatus],
              invitationStatus: "active", createdAt: foundationDate(participation.createdAt), updatedAt: foundationDate(new Date()),
            };
            const records = [
              { type: "participant", id: acceptedPersonId, value: personPayload },
              { type: "event_participation", id: participation.id, value: participationPayload },
            ];
            for (const record of records) {
              const payload = Buffer.from(JSON.stringify(record.value)).toString("base64");
              const [entity] = yield* transaction.insert(nativeSyncEntity).values({
                scopeId: rootId, entityType: record.type, entityId: record.id,
                ownerUserId: snapshot.ownerUserId, payload,
              }).onConflictDoUpdate({
                target: [nativeSyncEntity.scopeId, nativeSyncEntity.entityType, nativeSyncEntity.entityId],
                set: { payload, isDeleted: false, serverVersion: sql`${nativeSyncEntity.serverVersion} + 1`, updatedAt: new Date() },
              }).returning({ serverVersion: nativeSyncEntity.serverVersion });
              yield* transaction.insert(nativeSyncChange).values({
                scopeId: rootId, ownerUserId: snapshot.ownerUserId, entityType: record.type,
                entityId: record.id, operation: "upsert", payload, serverVersion: entity.serverVersion,
              });
            }
            const archive = JSON.parse(Buffer.from(snapshot.payload, "base64").toString("utf8"));
            const merge = (items: Array<{ id: string }> | undefined, value: { id: string }) =>
              [...(items ?? []).filter((item) => item.id.toLowerCase() !== value.id.toLowerCase()), value];
            archive.members = merge(archive.members, personPayload);
            archive.eventParticipations = merge(archive.eventParticipations, participationPayload);
            if (rootId === participation.eventId) {
              archive.mainEventParticipantIDs = [...new Set([...(archive.mainEventParticipantIDs ?? []), acceptedPersonId].map((id: string) => id.toLowerCase()))];
            }
            const payload = Buffer.from(JSON.stringify(archive)).toString("base64");
            const [updatedSnapshot] = yield* transaction.update(nativeWorkspaceSnapshot).set({
              payload, serverVersion: sql`${nativeWorkspaceSnapshot.serverVersion} + 1`, updatedAt: new Date(),
            }).where(eq(nativeWorkspaceSnapshot.scopeId, rootId)).returning({ serverVersion: nativeWorkspaceSnapshot.serverVersion });
            yield* transaction.insert(nativeSyncChange).values({
              scopeId: rootId, ownerUserId: snapshot.ownerUserId, entityType: "workspace", entityId: rootId,
              operation: "upsert", payload, serverVersion: updatedSnapshot.serverVersion,
            });
          }
        }

        return {
          eventId: pendingInvitation.eventId,
          role: participation.role,
          planningPermission: participation.planningPermission,
        };
      }),
    );
  });
}

type EffectSuccess<T> =
  T extends Effect.Effect<infer A, unknown, unknown> ? A : never;

type EventRepoResult<T> = Effect.Effect<
  EffectSuccess<T>,
  EventPersistenceError,
  PgClient
>;

export type EventRepoShape = {
  readonly hasWorkspaceMembership: (
    input: Parameters<typeof hasWorkspaceMembership>[0],
  ) => EventRepoResult<ReturnType<typeof hasWorkspaceMembership>>;
  readonly getEventParticipant: (
    input: Parameters<typeof getEventParticipant>[0],
  ) => EventRepoResult<ReturnType<typeof getEventParticipant>>;
  readonly createEventWithParticipants: (
    input: Parameters<typeof createEventWithParticipants>[0],
  ) => EventRepoResult<ReturnType<typeof createEventWithParticipants>>;
  readonly listVisibleMainEvents: (
    input: Parameters<typeof listVisibleMainEvents>[0],
  ) => EventRepoResult<ReturnType<typeof listVisibleMainEvents>>;
  readonly createEventInvitation: (
    input: Parameters<typeof createEventInvitation>[0],
  ) => EventRepoResult<ReturnType<typeof createEventInvitation>>;
  readonly acceptEventInvitation: (
    input: Parameters<typeof acceptEventInvitation>[0],
  ) => EventRepoResult<ReturnType<typeof acceptEventInvitation>>;
};

/** Persistence contract consumed by the Event service. */
export class EventRepo extends Context.Service<EventRepo, EventRepoShape>()(
  "EventRepo",
) {}

export type EventRepoError = EventPersistenceError;
