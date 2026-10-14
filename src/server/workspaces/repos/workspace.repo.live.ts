import { and, eq, inArray, isNull, sql } from 'drizzle-orm'
import { PgClient } from '@effect/sql-pg/PgClient'
import { Effect, Layer } from 'effect'
import { DB } from '@/db'
import { member, organization, teamMember, user } from '@/db/schema/auth.schema'
import { event, eventParticipant, workspacePerson } from '@/db/schema/event.schema'
import { workspacePlanningSettings } from '@/db/schema/planning.schema'
import { PersistenceError } from '@/server/effect'
import type { WorkspaceSummary } from '../contracts/workspace.contracts'
import { WorkspaceRepo, type WorkspaceRepoShape } from './workspace.repo'

export const WorkspaceRepoLive = Layer.effect(
  WorkspaceRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    const bindPg = <A, E>(effect: Effect.Effect<A, E, PgClient>) =>
      effect.pipe(Effect.provideService(PgClient, pg))

    return {
      listAccessible: ({ userId, memberWorkspaces }) =>
        bindPg(
          Effect.gen(function* () {
            const db = yield* DB
            const memberIds = memberWorkspaces.map((workspace) => workspace.id)
            const configuredMembers = memberIds.length
              ? yield* db
                  .selectDistinct({ id: organization.id })
                  .from(organization)
                  .innerJoin(
                    event,
                    and(eq(event.organizationId, organization.id), isNull(event.parentEventId))
                  )
                  .where(inArray(organization.id, memberIds))
              : []
            const participants = yield* db
              .selectDistinct({
                id: organization.id,
                name: organization.name,
                slug: organization.slug,
                type: organization.workspaceType,
              })
              .from(organization)
              .innerJoin(event, eq(event.organizationId, organization.id))
              .innerJoin(workspacePerson, eq(workspacePerson.organizationId, organization.id))
              .innerJoin(
                eventParticipant,
                and(
                  eq(eventParticipant.eventId, event.id),
                  eq(eventParticipant.personId, workspacePerson.id),
                  eq(workspacePerson.userId, userId)
                )
              )
            const rows = new Map<string, WorkspaceSummary>()
            for (const item of participants) rows.set(item.id, { ...item, access: 'participant' })
            const configured = new Set(configuredMembers.map((item) => item.id))
            for (const workspace of memberWorkspaces) {
              if (configured.has(workspace.id))
                rows.set(workspace.id, {
                  id: workspace.id,
                  name: workspace.name,
                  slug: workspace.slug,
                  type: workspace.workspaceType,
                  access: 'member',
                })
            }
            return [...rows.values()].toSorted((a, b) => a.name.localeCompare(b.name))
          })
        ),

      ensurePlanningSettings: (organizationId) =>
        bindPg(
          Effect.gen(function* () {
            const db = yield* DB
            yield* db
              .insert(workspacePlanningSettings)
              .values({ organizationId })
              .onConflictDoNothing({ target: workspacePlanningSettings.organizationId })
          })
        ),

      hasTeamMembership: (teamId, userId) =>
        bindPg(
          Effect.gen(function* () {
            const db = yield* DB
            const [membership] = yield* db
              .select({ id: teamMember.id })
              .from(teamMember)
              .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
              .limit(1)
            return Boolean(membership)
          })
        ),

      normalizeOrganizationType: (organizationId) =>
        bindPg(
          Effect.gen(function* () {
            const db = yield* DB
            yield* db
              .update(organization)
              .set({ workspaceType: 'event' })
              .where(eq(organization.id, organizationId))
          })
        ),

      findAvailableSlug: (name) =>
        bindPg(
          Effect.gen(function* () {
            const db = yield* DB
            const base =
              name
                .trim()
                .toLowerCase()
                .replaceAll(/[^a-z0-9]+/g, '-')
                .replaceAll(/^-|-$/g, '')
                .slice(0, 80) || 'workspace'
            const [existing] = yield* db
              .select({ id: organization.id })
              .from(organization)
              .where(eq(organization.slug, base))
              .limit(1)
            return existing ? `${base}-${crypto.randomUUID().slice(0, 8)}` : base
          })
        ),

      findReusableActiveWorkspace: ({ organizationId, userId }) =>
        bindPg(
          Effect.gen(function* () {
            const db = yield* DB
            const [active] = organizationId
              ? yield* db
                  .select({
                    id: organization.id,
                    name: organization.name,
                    slug: organization.slug,
                    workspaceType: organization.workspaceType,
                  })
                  .from(organization)
                  .innerJoin(
                    member,
                    and(eq(member.organizationId, organization.id), eq(member.userId, userId))
                  )
                  .where(eq(organization.id, organizationId))
                  .limit(1)
              : []
            if (!active || active.workspaceType !== 'event') return null
            const [mainEvent] = yield* db
              .select({ id: event.id })
              .from(event)
              .where(and(eq(event.organizationId, active.id), isNull(event.parentEventId)))
              .limit(1)
            return mainEvent ? null : active
          })
        ),

      rename: ({ organizationId, name }) =>
        bindPg(
          Effect.gen(function* () {
            const db = yield* DB
            yield* db.update(organization).set({ name }).where(eq(organization.id, organizationId))
          })
        ),

      createMainEvent: (input) =>
        bindPg(
          Effect.gen(function* () {
            const db = yield* DB
            yield* db.transaction((tx) =>
              Effect.gen(function* () {
                const [created] = yield* tx
                  .insert(event)
                  .values({
                    organizationId: input.organizationId,
                    parentEventId: null,
                    title: input.data.eventName,
                    status: 'draft',
                    purpose: null,
                    planningStatus: null,
                    category: null,
                    startsAt: new Date(input.data.startsAt),
                    endsAt: input.data.endsAt ? new Date(input.data.endsAt) : null,
                    isAllDay: input.data.isAllDay,
                    timeZone: input.data.timeZone,
                    locationName: input.data.locationName || null,
                    locationAddress: input.data.locationAddress || null,
                    budgetCap: input.data.budgetCap ?? null,
                    createdByUserId: input.userId,
                  })
                  .returning({ id: event.id })
                if (!created)
                  return yield* Effect.fail(
                    new PersistenceError({
                      category: 'system',
                      code: 'MAIN_EVENT_CREATE_FAILED',
                      userMessageKey: 'serverErrors.MAIN_EVENT_CREATE_FAILED',
                      debugMessage: 'The insert returned no main event.',
                    })
                  )
                const [person] = yield* tx
                  .insert(workspacePerson)
                  .values({
                    organizationId: input.organizationId,
                    userId: input.userId,
                    displayName: input.userName,
                    email: input.email.trim().toLowerCase(),
                    avatarUrl: input.image,
                  })
                  .onConflictDoUpdate({
                    target: [workspacePerson.organizationId, workspacePerson.userId],
                    targetWhere: sql`${workspacePerson.userId} is not null`,
                    set: {
                      displayName: input.userName,
                      email: input.email.trim().toLowerCase(),
                      avatarUrl: input.image,
                      updatedAt: new Date(),
                    },
                  })
                  .returning({ id: workspacePerson.id })
                if (!person)
                  return yield* Effect.fail(
                    new PersistenceError({
                      category: 'system',
                      code: 'WORKSPACE_PERSON_CREATE_FAILED',
                      userMessageKey: 'serverErrors.WORKSPACE_PERSON_CREATE_FAILED',
                      debugMessage: 'The insert returned no host person.',
                    })
                  )
                yield* tx.insert(eventParticipant).values({
                  eventId: created.id,
                  personId: person.id,
                  role: 'host',
                  planningPermission: 'manage',
                  attendanceStatus: 'going',
                })
                yield* tx
                  .insert(workspacePlanningSettings)
                  .values({
                    organizationId: input.organizationId,
                    budgetCap: input.data.budgetCap ?? null,
                  })
                  .onConflictDoUpdate({
                    target: workspacePlanningSettings.organizationId,
                    set: { budgetCap: input.data.budgetCap ?? null, updatedAt: new Date() },
                  })
                yield* tx
                  .update(user)
                  .set({ hasCompletedOnboarding: true })
                  .where(eq(user.id, input.userId))
              })
            )
          })
        ),

      rollbackWorkspaceCreation: ({ disposableWorkspaceId, previousName }) =>
        bindPg(
          Effect.gen(function* () {
            const db = yield* DB
            if (disposableWorkspaceId)
              yield* db.delete(organization).where(eq(organization.id, disposableWorkspaceId))
            else if (previousName)
              yield* db
                .update(organization)
                .set({ name: previousName.name })
                .where(eq(organization.id, previousName.id))
          })
        ),
    } satisfies WorkspaceRepoShape
  })
)
