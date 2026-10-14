import { expect, it } from '@effect/vitest'
import { PgClient } from '@effect/sql-pg/PgClient'
import { Context, Effect, Layer } from 'effect'
import { beforeEach, vi } from 'vitest'
import { acceptEventInvitationTokenWorkflow } from '@/server/events/workflows/event-invitation.workflows.live'
import { inviteEventParticipantWorkflow } from '@/server/events/workflows/event.workflows.live'

const persistence = vi.hoisted(() => ({
  parent: vi.fn(),
  participant: vi.fn(),
  invite: vi.fn(),
  acceptEmail: vi.fn(),
  shareEventId: vi.fn(),
  acceptShare: vi.fn(),
}))

// Exercise the real repository adapters, service layers, and production bindings;
// replace only the persistence operations so these tests never open a database.
vi.mock('@/db', () => {
  throw new Error('Production workflow composition must not construct a database client')
})
vi.mock('@/server/events/repos/event.repo.persistence', () => ({
  getEventParentId: persistence.parent,
  getEventParticipant: persistence.participant,
  createEventInvitation: persistence.invite,
  acceptEventInvitation: persistence.acceptEmail,
}))
vi.mock('@/server/events/repos/event-share-link.repo.persistence', () => ({
  getEventIdForShareLink: persistence.shareEventId,
  acceptEventShareLink: persistence.acceptShare,
}))
vi.mock('@/server/events/repos/guest-invitation.repo.persistence', () => ({}))
vi.mock('@/server/events/repos/event-departure.repo', () => ({}))
vi.mock('@/server/events/connectors/event-invitation-artwork.con.live', async () => {
  const { Layer } = await import('effect')
  const { EventInvitationArtwork } =
    await import('@/server/events/connectors/event-invitation-artwork.con')
  return { EventInvitationArtworkLive: Layer.mock(EventInvitationArtwork, {}) }
})

class AmbientScope extends Context.Service<AmbientScope, string>()('test/AmbientScope') {}

// Identity-only client: the mocked persistence operations never execute SQL.
// Fail loudly if a future change tries to use a driver member in this unit test.
const testPg = new Proxy({} as PgClient, {
  get() {
    throw new Error('Unexpected SQL client access')
  },
})

beforeEach(() => vi.resetAllMocks())

for (const kind of ['shared', 'email'] as const) {
  it.effect(
    `${kind} acceptance composes services around one caller-owned PgClient and scope`,
    () => {
      let acquisitions = 0
      let releases = 0
      const operations: string[] = []
      const database = Layer.succeed(PgClient, testPg).pipe(
        Layer.tap(() =>
          Effect.acquireRelease(
            Effect.sync(() => {
              acquisitions += 1
            }),
            () =>
              Effect.sync(() => {
                releases += 1
              })
          )
        )
      )

      return Effect.gen(function* () {
        yield* Effect.gen(function* () {
          const callerPg = yield* PgClient
          const observe = <A>(operation: string, value: A) =>
            Effect.gen(function* () {
              expect(yield* PgClient).toBe(callerPg)
              expect(yield* AmbientScope).toBe('caller-transaction-scope')
              operations.push(operation)
              return value
            })
          persistence.shareEventId.mockImplementation(() =>
            observe('lookup', kind === 'shared' ? 'event-1' : null)
          )
          const accepted = { eventId: 'event-1', role: 'collaborator' as const }
          persistence.acceptShare.mockImplementation(() => observe('accept-share', accepted))
          persistence.acceptEmail.mockImplementation(() => observe('accept-email', accepted))
          persistence.parent.mockImplementation(() => observe('parent', { parentEventId: null }))

          const result = yield* acceptEventInvitationTokenWorkflow({
            userId: 'user-1',
            userEmail: 'guest@example.com',
            token: 'token-1',
          })
          expect(result).toMatchObject({ ...accepted, planningScopeId: 'event-1' })
          expect(operations).toEqual([
            'lookup',
            kind === 'shared' ? 'accept-share' : 'accept-email',
            'parent',
          ])
          expect(acquisitions).toBe(1)
          expect(releases).toBe(0)
          expect(persistence.parent).toHaveBeenCalledWith('event-1')
        }).pipe(
          Effect.provideService(AmbientScope, 'caller-transaction-scope'),
          Effect.provide(database)
        )
        expect(releases).toBe(1)
      })
    }
  )
}

it.effect('composed event workflows retain domain authorization before persistence writes', () => {
  persistence.participant.mockReturnValue(
    Effect.succeed({ role: 'guest', planningPermission: 'view_only' })
  )
  return Effect.gen(function* () {
    const result = yield* inviteEventParticipantWorkflow({
      userId: 'guest-1',
      invitation: {
        eventId: 'event-1',
        email: 'other@example.com',
        role: 'guest',
        planningPermission: 'viewOnly',
      },
    }).pipe(Effect.result)
    expect(result._tag).toBe('Failure')
    expect(persistence.participant).toHaveBeenCalledWith({ eventId: 'event-1', userId: 'guest-1' })
    expect(persistence.invite).not.toHaveBeenCalled()
  }).pipe(Effect.provide(Layer.succeed(PgClient, testPg)))
})
