import { PgClient } from '@effect/sql-pg/PgClient'
import { and, asc, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { Effect, Layer } from 'effect'
import { DB } from '@/db'
import {
  event,
  eventParticipant,
  workspacePerson,
  user,
  eventTodo,
  eventNote,
  nativeSyncEntity,
  nativeWorkspaceSnapshot,
} from '@/db/schema'
import { PersistenceError } from '@/lib/domain-errors'
import { EVENT_READING_LIMIT } from '../contracts/event-reading.contracts'
import { retainedEventAccess } from './event-departure.persistence'
import { EventReadingRepo } from './event-reading.repo'

export const EventReadingRepoLive = Layer.effect(
  EventReadingRepo,
  Effect.gen(function* () {
    const pg = yield* PgClient
    return {
      read: (input) =>
        pg
          .withTransaction(
            Effect.gen(function* () {
              const db = yield* DB
              const parent = alias(event, 'reading_parent')
              const entity = alias(nativeSyncEntity, 'reading_event_entity')
              const [row] = yield* db
                .select({
                  id: event.id,
                  title: event.title,
                  description: event.description,
                  startsAt: event.startsAt,
                  endsAt: event.endsAt,
                  timeZone: event.timeZone,
                  isAllDay: event.isAllDay,
                  locationName: event.locationName,
                  parentId: event.parentEventId,
                  status: event.status,
                  planningStatus: event.planningStatus,
                  completionStatus: event.completionStatus,
                  parentStatus: parent.status,
                  attendance: eventParticipant.attendanceStatus,
                  snapshotVersion: nativeWorkspaceSnapshot.serverVersion,
                  entityVersion: entity.serverVersion,
                  entityDeleted: entity.isDeleted,
                })
                .from(event)
                .innerJoin(eventParticipant, eq(eventParticipant.eventId, event.id))
                .innerJoin(
                  workspacePerson,
                  and(
                    eq(workspacePerson.id, eventParticipant.personId),
                    eq(workspacePerson.organizationId, event.organizationId)
                  )
                )
                .leftJoin(parent, eq(parent.id, event.parentEventId))
                .leftJoin(
                  nativeWorkspaceSnapshot,
                  eq(
                    nativeWorkspaceSnapshot.scopeId,
                    sql`coalesce(${event.parentEventId}, ${event.id})`
                  )
                )
                .leftJoin(
                  entity,
                  and(
                    eq(entity.scopeId, sql`coalesce(${event.parentEventId}, ${event.id})`),
                    eq(entity.entityType, 'event'),
                    eq(entity.entityId, event.id)
                  )
                )
                .where(
                  and(
                    eq(event.id, input.eventId),
                    eq(workspacePerson.userId, input.userId),
                    inArray(eventParticipant.role, ['host', 'collaborator']),
                    retainedEventAccess(input.userId, event.id),
                    or(
                      isNull(nativeWorkspaceSnapshot.scopeId),
                      eq(nativeWorkspaceSnapshot.isDeleted, false)
                    )
                  )
                )
                .limit(1)
              if (!row) return null

              const people = yield* db
                .select({
                  id: workspacePerson.id,
                  name: sql<string>`coalesce(${user.name}, ${workspacePerson.displayName})`,
                  role: eventParticipant.role,
                  attendance: eventParticipant.attendanceStatus,
                })
                .from(eventParticipant)
                .innerJoin(workspacePerson, eq(workspacePerson.id, eventParticipant.personId))
                .leftJoin(user, eq(user.id, workspacePerson.userId))
                .where(eq(eventParticipant.eventId, input.eventId))
                .orderBy(asc(workspacePerson.displayName), asc(workspacePerson.id))
                .limit(EVENT_READING_LIMIT + 1)

              const schedule = row.parentId
                ? []
                : yield* db
                    .select({
                      id: event.id,
                      title: event.title,
                      startsAt: event.startsAt,
                      timeZone: event.timeZone,
                      purpose: event.purpose,
                      locationName: event.locationName,
                    })
                    .from(event)
                    .innerJoin(eventParticipant, eq(eventParticipant.eventId, event.id))
                    .innerJoin(
                      workspacePerson,
                      and(
                        eq(workspacePerson.id, eventParticipant.personId),
                        eq(workspacePerson.organizationId, event.organizationId)
                      )
                    )
                    .where(
                      and(
                        eq(event.parentEventId, input.eventId),
                        eq(workspacePerson.userId, input.userId),
                        inArray(eventParticipant.role, ['host', 'collaborator']),
                        retainedEventAccess(input.userId, event.id)
                      )
                    )
                    .orderBy(asc(event.startsAt), asc(event.id))
                    .limit(EVENT_READING_LIMIT + 1)

              const taskEntity = alias(nativeSyncEntity, 'reading_task_entity')
              const tasks = input.includeTasks
                ? yield* db
                    .select({
                      id: eventTodo.id,
                      title: eventTodo.title,
                      isCompleted: eventTodo.isCompleted,
                      version: sql<number>`coalesce(${taskEntity.serverVersion}, 0)`,
                    })
                    .from(eventTodo)
                    .leftJoin(
                      taskEntity,
                      and(
                        eq(taskEntity.scopeId, row.parentId ?? row.id),
                        eq(taskEntity.entityType, 'todo'),
                        eq(taskEntity.entityId, eventTodo.id),
                        eq(taskEntity.isDeleted, false)
                      )
                    )
                    .where(eq(eventTodo.eventId, input.eventId))
                    .orderBy(
                      asc(eventTodo.isCompleted),
                      asc(eventTodo.createdAt),
                      asc(eventTodo.id)
                    )
                    .limit(EVENT_READING_LIMIT + 1)
                : []

              const notes = input.includeNotes
                ? yield* db
                    .select({
                      id: eventNote.id,
                      text: eventNote.body,
                      createdAt: eventNote.sentAt,
                      authorName: user.name,
                    })
                    .from(eventNote)
                    .leftJoin(user, eq(user.id, eventNote.authorUserId))
                    .where(eq(eventNote.eventId, input.eventId))
                    .orderBy(desc(eventNote.sentAt), asc(eventNote.id))
                    .limit(EVENT_READING_LIMIT + 1)
                : []

              return {
                event: {
                  id: row.id,
                  title: row.title,
                  description: row.description,
                  startsAt: row.startsAt?.toISOString() ?? null,
                  endsAt: row.endsAt?.toISOString() ?? null,
                  isAllDay: row.isAllDay,
                  timeZone: row.timeZone,
                  locationName: row.locationName,
                  version: row.parentId ? (row.entityVersion ?? 0) : (row.snapshotVersion ?? 0),
                },
                attendance: { value: row.attendance, canRespond: false },
                people: people.slice(0, EVENT_READING_LIMIT),
                schedule: schedule.slice(0, EVENT_READING_LIMIT).map((item) => ({
                  ...item,
                  startsAt: item.startsAt?.toISOString() ?? null,
                })),
                tasks: tasks.slice(0, EVENT_READING_LIMIT),
                notes: notes.slice(0, EVENT_READING_LIMIT).map((item) => ({
                  ...item,
                  createdAt: item.createdAt.toISOString(),
                })),
                truncated: {
                  people: people.length > EVENT_READING_LIMIT,
                  schedule: schedule.length > EVENT_READING_LIMIT,
                  tasks: tasks.length > EVENT_READING_LIMIT,
                  notes: notes.length > EVENT_READING_LIMIT,
                },
                lifecycle: {
                  status: row.status,
                  planningStatus: row.planningStatus,
                  completionStatus: row.completionStatus,
                  parentStatus: row.parentStatus,
                  snapshotAvailable: row.snapshotVersion !== null,
                  eventVersionAvailable:
                    !row.parentId || (row.entityVersion !== null && !row.entityDeleted),
                },
              }
            })
          )
          .pipe(
            Effect.provideService(PgClient, pg),
            Effect.mapError(
              (cause) =>
                new PersistenceError({
                  category: 'system',
                  code: 'EVENT_READING_FAILED',
                  userMessageKey: 'serverErrors.SYSTEM',
                  cause,
                })
            )
          ),
    }
  })
)
