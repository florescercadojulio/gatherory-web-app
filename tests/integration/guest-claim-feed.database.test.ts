import { expect, it } from '@effect/vitest'
import { Data, Effect, Exit } from 'effect'

it.live(
  'claim retires the device projection while preserving the account attendance and retry receipt',
  () =>
    Effect.gen(function* () {
      const url = new URL(process.env.DATABASE_URL!)
      expect(['localhost', '127.0.0.1', '[::1]']).toContain(url.hostname)
      const { PgClient } = yield* Effect.promise(() => import('@effect/sql-pg/PgClient'))
      const { DB, PgClientLive } = yield* Effect.promise(() => import('@/db'))
      const { user, organization, event, workspacePerson, eventParticipant } =
        yield* Effect.promise(() => import('@/db/schema'))
      const guest = yield* Effect.promise(
        () => import('@/server/events/repos/device-guest.repo.persistence')
      )
      const sharing = yield* Effect.promise(
        () => import('@/server/events/repos/event-share-link.repo.persistence')
      )
      const feed = yield* Effect.promise(
        () => import('@/server/events/repos/guest-invitation.repo.persistence')
      )
      class RollbackFixture extends Data.TaggedError('RollbackFixture')<{}> {}
      yield* Effect.gen(function* () {
        const sql = yield* PgClient
        yield* sql.withTransaction(
          Effect.gen(function* () {
            const db = yield* DB
            const suffix = crypto.randomUUID()
            const hostID = `guest-feed-host-${suffix}`
            const accountID = `guest-feed-account-${suffix}`
            const organizationID = `guest-feed-org-${suffix}`
            const eventID = crypto.randomUUID()
            const guestID = crypto.randomUUID()
            const credential = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
              'base64url'
            )
            yield* db.insert(user).values(
              [hostID, accountID].map((id) => ({
                id,
                name: id,
                email: `${id}@example.test`,
                emailVerified: true,
              }))
            )
            yield* db.insert(organization).values({
              id: organizationID,
              slug: organizationID,
              name: 'Guest feed audit',
              createdAt: new Date(),
              workspaceType: 'event',
            })
            yield* db.insert(event).values({
              id: eventID,
              organizationId: organizationID,
              title: 'Guest feed audit',
              status: 'draft',
              startsAt: new Date(),
              timeZone: 'America/Detroit',
            })
            const [hostPerson] = yield* db
              .insert(workspacePerson)
              .values({ organizationId: organizationID, userId: hostID, displayName: 'Host' })
              .returning()
            yield* db.insert(eventParticipant).values({
              eventId: eventID,
              personId: hostPerson.id,
              role: 'host',
              planningPermission: 'manage',
            })
            yield* guest.registerDeviceGuestProfile({ id: guestID, name: 'Guest', credential })
            const link = yield* sharing.createEventShareLink(hostID, {
              eventId: eventID,
              role: 'guest',
            })
            yield* guest.joinDeviceGuestEvent({ guestId: guestID, credential, token: link.token })
            yield* guest.respondToDeviceGuestEvent({
              guestId: guestID,
              credential,
              eventId: eventID,
              attendance: 'going',
            })
            expect(yield* feed.listDeviceGuestEventInvitationProjections(guestID)).toHaveLength(1)
            const claimInput = {
              guestId: guestID,
              credential,
              userId: accountID,
              account: { name: 'Account', email: `${accountID}@example.test`, image: null },
            }
            const claimed = yield* guest.claimDeviceGuestProfile(claimInput)
            expect(claimed.claimedEventIds).toEqual([eventID])
            expect(
              Exit.isFailure(
                yield* Effect.exit(guest.verifyDeviceGuestProfile({ guestId: guestID, credential }))
              )
            ).toBe(true)
            // A feed request can pass proof verification just before a claim.
            // Projection reads must independently reject the retired guest identity.
            expect(yield* feed.listDeviceGuestEventInvitationProjections(guestID)).toEqual([])
            const accountFeed = yield* feed.listGuestEventInvitationProjections(accountID)
            expect(accountFeed).toHaveLength(1)
            expect(accountFeed[0]).toMatchObject({
              id: eventID,
              role: 'guest',
              attendance: 'going',
            })
            expect(yield* guest.claimDeviceGuestProfile(claimInput)).toEqual(claimed)
            expect(yield* feed.listDeviceGuestEventInvitationProjections(guestID)).toEqual([])
            return yield* Effect.fail(new RollbackFixture())
          })
        )
      }).pipe(
        Effect.catchTag('RollbackFixture', () => Effect.void),
        Effect.provide(PgClientLive)
      )
    }),
  { skip: process.env.RUN_DEVICE_GUEST_DB_TESTS !== '1' }
)
