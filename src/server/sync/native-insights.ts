import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";

import { DB, PgClientLive } from "@/db";
import { organization, user } from "@/db/schema/auth.schema";
import {
  event,
  eventParticipant,
  workspacePerson,
} from "@/db/schema/event.schema";
import {
  eventExpense,
  idea,
  workspacePlanningSettings,
} from "@/db/schema/planning.schema";
import { requireSessionMiddleware } from "@/lib/auth.middleware";
import { runServerEffect } from "@/server/effect";

export type NativeWorkspaceInsight = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  isAllDay: boolean;
  timeZone: string;
  location: string | null;
  status: string;
  participantCount: number;
  participants: Array<{
    id: string;
    name: string;
    image: string | null;
  }>;
  scheduledEventCount: number;
  openIdeaCount: number;
  approvedIdeaCount: number;
  budgetCap: number | null;
  trackedCost: number;
  updatedAt: string;
  upcomingEvents: Array<{
    id: string;
    title: string;
    startsAt: string;
    purpose: string;
    participantCount: number;
    participants: Array<{
      id: string;
      name: string;
      image: string | null;
    }>;
  }>;
};

/**
 * Kept under its original export name so the first-release route does not need
 * a UI migration. Data now comes exclusively from normalized product tables;
 * native snapshots are a replication/bootstrap concern.
 */
export const listNativeWorkspaceInsights = createServerFn({ method: "GET" })
  .middleware([requireSessionMiddleware])
  .handler(({ context }) =>
    runServerEffect(
      Effect.gen(function* () {
        const db = yield* DB;
        const mainEvents = yield* db
          .select({
            id: event.id,
            organizationId: event.organizationId,
            workspaceName: organization.name,
            title: event.title,
            startsAt: event.startsAt,
            endsAt: event.endsAt,
            isAllDay: event.isAllDay,
            timeZone: event.timeZone,
            locationName: event.locationName,
            locationAddress: event.locationAddress,
            status: event.status,
            updatedAt: event.updatedAt,
            budgetCap: workspacePlanningSettings.budgetCap,
          })
          .from(event)
          .innerJoin(organization, eq(organization.id, event.organizationId))
          .innerJoin(
            workspacePerson,
            and(
              eq(workspacePerson.organizationId, event.organizationId),
              eq(workspacePerson.userId, context.user.id),
            ),
          )
          .innerJoin(
            eventParticipant,
            and(
              eq(eventParticipant.eventId, event.id),
              eq(eventParticipant.personId, workspacePerson.id),
            ),
          )
          .leftJoin(
            workspacePlanningSettings,
            eq(workspacePlanningSettings.organizationId, event.organizationId),
          )
          .where(
            and(
              isNull(event.parentEventId),
              inArray(eventParticipant.role, ["host", "collaborator"]),
            ),
          )
          .orderBy(asc(event.startsAt), asc(event.createdAt));

        if (!mainEvents.length) {
          return { workspaces: [], unavailableSnapshotCount: 0 };
        }

        const organizationIds = mainEvents.map((item) => item.organizationId);
        const mainEventIds = mainEvents.map((item) => item.id);
        const children = yield* db
          .select({
            id: event.id,
            parentEventId: event.parentEventId,
            title: event.title,
            startsAt: event.startsAt,
            purpose: event.purpose,
            schedulingState: event.schedulingState,
            completionStatus: event.completionStatus,
          })
          .from(event)
          .where(inArray(event.parentEventId, mainEventIds))
          .orderBy(asc(event.startsAt), asc(event.createdAt));
        const participants = yield* db
          .select({
            eventId: eventParticipant.eventId,
            id: workspacePerson.id,
            name: workspacePerson.displayName,
            image: sql<
              string | null
            >`coalesce(${user.image}, ${workspacePerson.avatarUrl})`,
          })
          .from(eventParticipant)
          .innerJoin(
            workspacePerson,
            eq(workspacePerson.id, eventParticipant.personId),
          )
          .leftJoin(user, eq(user.id, workspacePerson.userId))
          .where(
            inArray(eventParticipant.eventId, [
              ...mainEventIds,
              ...children.map((child) => child.id),
            ]),
          );
        const ideas = yield* db
          .select({ eventId: idea.eventId, status: idea.status })
          .from(idea)
          .where(inArray(idea.organizationId, organizationIds));
        const expenses = yield* db
          .select({
            eventId: eventExpense.eventId,
            amount: eventExpense.amount,
          })
          .from(eventExpense)
          .where(inArray(eventExpense.organizationId, organizationIds));

        const childrenByParent = Map.groupBy(
          children,
          (child) => child.parentEventId,
        );
        const participantsByEvent = Map.groupBy(
          participants,
          (participant) => participant.eventId,
        );
        const rootByEvent = new Map<string, string>();
        for (const mainEvent of mainEvents) {
          rootByEvent.set(mainEvent.id, mainEvent.id);
        }
        for (const child of children) {
          if (child.parentEventId)
            rootByEvent.set(child.id, child.parentEventId);
        }
        const ideasByRoot = Map.groupBy(
          ideas,
          (item) => rootByEvent.get(item.eventId) ?? item.eventId,
        );
        const expensesByRoot = Map.groupBy(
          expenses,
          (item) => rootByEvent.get(item.eventId) ?? item.eventId,
        );
        const now = Date.now();

        const workspaces: NativeWorkspaceInsight[] = mainEvents.map(
          (mainEvent) => {
            const childEvents = childrenByParent.get(mainEvent.id) ?? [];
            const workspaceIdeas = ideasByRoot.get(mainEvent.id) ?? [];
            const workspaceExpenses = expensesByRoot.get(mainEvent.id) ?? [];
            const upcomingEvents = childEvents
              .filter(
                (child) =>
                  child.schedulingState === "scheduled" &&
                  child.completionStatus !== "complete" &&
                  child.startsAt != null &&
                  child.startsAt.getTime() >= now,
              )
              .slice(0, 4)
              .map((child) => ({
                id: child.id,
                title: child.title,
                startsAt: child.startsAt!.toISOString(),
                purpose: child.purpose ?? "part_of_event",
                participantCount:
                  participantsByEvent.get(child.id)?.length ?? 0,
                participants: (participantsByEvent.get(child.id) ?? [])
                  .slice(0, 4)
                  .map(({ eventId: _eventId, ...participant }) => participant),
              }));

            const mainEventParticipants =
              participantsByEvent.get(mainEvent.id) ?? [];

            return {
              id: mainEvent.id,
              title: mainEvent.title,
              startsAt: (
                mainEvent.startsAt ?? mainEvent.updatedAt
              ).toISOString(),
              endsAt: mainEvent.endsAt?.toISOString() ?? null,
              isAllDay: mainEvent.isAllDay,
              timeZone: mainEvent.timeZone,
              location:
                [mainEvent.locationName, mainEvent.locationAddress]
                  .map((value) => value?.trim())
                  .filter(Boolean)
                  .join(" · ") || null,
              status: mainEvent.status ?? "draft",
              participantCount: mainEventParticipants.length,
              participants: mainEventParticipants
                .slice(0, 5)
                .map(({ eventId: _eventId, ...participant }) => participant),
              scheduledEventCount: childEvents.filter(
                (child) => child.schedulingState === "scheduled",
              ).length,
              openIdeaCount: workspaceIdeas.filter(
                (item) => item.status === "new",
              ).length,
              approvedIdeaCount: workspaceIdeas.filter(
                (item) => item.status === "approved",
              ).length,
              budgetCap: optionalNumber(mainEvent.budgetCap),
              trackedCost: workspaceExpenses.reduce(
                (total, expense) =>
                  total + (optionalNumber(expense.amount) ?? 0),
                0,
              ),
              updatedAt: mainEvent.updatedAt.toISOString(),
              upcomingEvents,
            };
          },
        );

        return { workspaces, unavailableSnapshotCount: 0 };
      }).pipe(Effect.provide(PgClientLive)),
    ),
  );

function optionalNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
