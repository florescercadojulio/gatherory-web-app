import { expect, it } from '@effect/vitest'
import { Cause, Data, Effect, Exit } from 'effect'
import { eq } from 'drizzle-orm'

const verification = Effect.gen(function* () {
  expect(
    ['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env.DATABASE_URL!).hostname),
    'Scoped media fixtures are limited to local Postgres'
  ).toBeTruthy()
  const { DB, PgClientLive } = yield* Effect.promise(() => import('@/db'))
  const { PgClient: PgClientTag } = yield* Effect.promise(() => import('@effect/sql-pg/PgClient'))
  const schema = yield* Effect.promise(() => import('@/db/schema'))
  const {
    event,
    eventDeparture,
    eventParticipant,
    eventMedia,
    idea,
    ideaMedia,
    mediaAsset,
    organization,
    registryItem,
    registryItemMedia,
    user,
    workspacePerson,
  } = schema
  const { getNativeMediaAccessContext, getNativeMediaActorContext } = yield* Effect.promise(
    () => import('@/server/media/repos/media.repo.compat')
  )
  class Rollback extends Data.TaggedError('ScopedNativeMediaRollback')<{}> {}

  const program = Effect.gen(function* () {
    const pg = yield* PgClientTag
    return yield* pg.withTransaction(
      Effect.gen(function* () {
        const db = yield* DB
        const suffix = crypto.randomUUID()
        const organizationId = `scoped-media-${suffix}`
        const planner = `scoped-media-planner-${suffix}`
        const viewer = `scoped-media-viewer-${suffix}`
        const guest = `scoped-media-guest-${suffix}`
        const rootHost = `scoped-media-root-${suffix}`
        const rootId = crypto.randomUUID()
        const childId = crypto.randomUUID()
        const siblingId = crypto.randomUUID()

        yield* db.insert(user).values(
          [planner, viewer, guest, rootHost].map((id) => ({
            id,
            name: 'Scoped media test',
            email: `${id}@example.test`,
            emailVerified: true,
          }))
        )
        yield* db.insert(organization).values({
          id: organizationId,
          name: 'Scoped media test',
          slug: organizationId,
          workspaceType: 'event',
          createdAt: new Date(),
        })
        yield* db.insert(event).values([
          {
            id: rootId,
            organizationId,
            title: 'Scoped media root',
            status: 'draft',
            startsAt: new Date(),
            timeZone: 'America/Detroit',
          },
          ...[childId, siblingId].map((id) => ({
            id,
            organizationId,
            parentEventId: rootId,
            title: 'Scoped media child',
            planningStatus: 'draft' as const,
            category: 'other' as const,
            purpose: 'planning_scouting' as const,
            startsAt: new Date(),
            timeZone: 'America/Detroit',
          })),
        ])

        const people = yield* db
          .insert(workspacePerson)
          .values(
            [planner, viewer, guest, rootHost].map((userId) => ({
              organizationId,
              userId,
              displayName: 'Scoped media test',
            }))
          )
          .returning()
        const person = Object.fromEntries(people.map((row) => [row.userId, row.id])) as Record<
          string,
          string
        >
        const participants = yield* db
          .insert(eventParticipant)
          .values([
            {
              eventId: rootId,
              personId: person[rootHost],
              role: 'host',
              planningPermission: 'manage',
            },
            {
              eventId: childId,
              personId: person[planner],
              role: 'collaborator',
              planningPermission: 'contribute',
            },
            {
              eventId: childId,
              personId: person[viewer],
              role: 'collaborator',
              planningPermission: 'view_only',
            },
            {
              eventId: childId,
              personId: person[guest],
              role: 'guest',
              planningPermission: 'view_only',
            },
          ])
          .returning()
        const plannerParticipation = participants.find((row) => row.personId === person[planner])!

        const assetIds = Object.fromEntries(
          ['own', 'pending', 'event', 'idea', 'registry', 'sibling', 'root'].map((kind) => [
            kind,
            crypto.randomUUID(),
          ])
        ) as Record<string, string>
        const assets = Object.entries(assetIds).map(([kind, id]) => ({
          id,
          organizationId,
          uploadedByUserId: kind === 'own' || kind === 'pending' ? planner : rootHost,
          kind: 'image' as const,
          status: kind === 'pending' ? ('pending' as const) : ('ready' as const),
          bucket: 'scoped-media-test',
          storageKey:
            kind === 'own' || kind === 'pending'
              ? `workspaces/${organizationId}/media/events/${childId}/${id}/original.png`
              : `workspaces/${organizationId}/media/${id}/original.png`,
          originalFilename: `${kind}.png`,
          contentType: 'image/png',
          byteSize: 128,
        }))
        yield* db.insert(mediaAsset).values(assets)
        yield* db.insert(eventMedia).values([
          {
            organizationId,
            eventId: childId,
            mediaAssetId: assetIds.event,
            role: 'gallery',
          },
          {
            organizationId,
            eventId: siblingId,
            mediaAssetId: assetIds.sibling,
            role: 'gallery',
          },
        ])
        const [ideaRow] = yield* db
          .insert(idea)
          .values({
            organizationId,
            eventId: childId,
            category: 'decor',
            title: 'Scoped idea',
            configuration: { version: 1 },
          })
          .returning()
        yield* db.insert(ideaMedia).values({
          organizationId,
          ideaId: ideaRow.id,
          mediaAssetId: assetIds.idea,
          role: 'gallery',
        })
        const [registryRow] = yield* db
          .insert(registryItem)
          .values({
            organizationId,
            eventId: childId,
            title: 'Scoped registry item',
            category: 'home',
          })
          .returning()
        yield* db.insert(registryItemMedia).values({
          organizationId,
          registryItemId: registryRow.id,
          mediaAssetId: assetIds.registry,
          role: 'gallery',
        })

        expect(
          yield* getNativeMediaActorContext({ scopeId: childId, userId: planner }),
          'An explicit child collaborator can prepare without organization membership'
        ).toEqual({ organizationId, parentEventId: rootId })
        expect(yield* getNativeMediaActorContext({ scopeId: childId, userId: guest })).toBe(null)
        expect(yield* getNativeMediaActorContext({ scopeId: childId, userId: viewer })).toBe(null)
        expect(yield* getNativeMediaActorContext({ scopeId: siblingId, userId: planner })).toBe(
          null
        )
        expect(
          (yield* getNativeMediaAccessContext({ mediaAssetId: assetIds.pending, userId: planner }))
            ?.planningPermission
        ).toBe('contribute')

        for (const kind of ['own', 'event', 'idea', 'registry']) {
          expect(
            yield* getNativeMediaAccessContext({ mediaAssetId: assetIds[kind], userId: planner }),
            `${kind} media attached to the exact child is readable`
          ).toBeTruthy()
        }
        expect(
          yield* getNativeMediaAccessContext({ mediaAssetId: assetIds.sibling, userId: planner }),
          'A sibling placement does not grant child access'
        ).toBe(null)
        expect(
          yield* getNativeMediaAccessContext({ mediaAssetId: assetIds.root, userId: planner }),
          'Root organization media does not grant child access'
        ).toBe(null)
        expect(
          yield* getNativeMediaAccessContext({ mediaAssetId: assetIds.event, userId: guest }),
          'Guests have no native media access'
        ).toBe(null)
        expect(
          yield* getNativeMediaAccessContext({ mediaAssetId: assetIds.event, userId: viewer }),
          'View only child planners can read media placed on their child'
        ).toBeTruthy()

        yield* db
          .update(eventParticipant)
          .set({ planningPermission: 'view_only' })
          .where(eq(eventParticipant.id, plannerParticipation.id))
        expect(yield* getNativeMediaActorContext({ scopeId: childId, userId: planner })).toBe(null)
        expect(
          (yield* getNativeMediaAccessContext({ mediaAssetId: assetIds.pending, userId: planner }))
            ?.planningPermission,
          'The pending upload context reflects a later permission downgrade'
        ).toBe('view_only')
        expect(
          yield* getNativeMediaAccessContext({ mediaAssetId: assetIds.event, userId: viewer }),
          'A view only child planner retains read access to ready placed media'
        ).toBeTruthy()

        // The root's existing workspace-wide native media access is preserved.
        expect(
          yield* getNativeMediaAccessContext({ mediaAssetId: assetIds.sibling, userId: rootHost })
        ).toBeTruthy()

        yield* db.insert(eventDeparture).values({ eventId: childId, userId: planner })
        expect(
          yield* getNativeMediaAccessContext({ mediaAssetId: assetIds.own, userId: planner }),
          'Leaving the child revokes access to the user-owned scoped upload'
        ).toBe(null)
        expect(yield* getNativeMediaActorContext({ scopeId: childId, userId: planner })).toBe(null)
        return yield* Effect.fail(new Rollback())
      })
    )
  }).pipe(Effect.provide(PgClientLive))

  const result = yield* Effect.exit(program)
  expect(
    Exit.isFailure(result) &&
      result.cause.reasons.some(
        (reason) => Cause.isFailReason(reason) && reason.error instanceof Rollback
      ),
    Exit.isFailure(result) ? Cause.pretty(result.cause) : 'All fixture writes must roll back'
  ).toBe(true)
})

it.live('scoped native media authorization isolates child events', () => verification, {
  skip: process.env.RUN_SCOPED_NATIVE_MEDIA_DB_TESTS !== '1',
})
