import { expect, it } from '@effect/vitest'
import { Cause, Data, Effect, Exit } from 'effect'

it.live(
  'closed event lifecycle blocks new admissions without deleting history',
  () =>
    Effect.gen(function* () {
      expect(
        ['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env.DATABASE_URL!).hostname)
      ).toBeTruthy()
      const { PgClientLive } = yield* Effect.promise(() => import('@/db'))
      const { PgClient } = yield* Effect.promise(() => import('@effect/sql-pg/PgClient'))
      const { requireJoinableEvent } = yield* Effect.promise(
        () => import('@/server/events/repos/event-lifecycle.repo')
      )
      class Rollback extends Data.TaggedError('LifecycleVerificationRollback')<{}> {}
      const program = Effect.gen(function* () {
        const pg = yield* PgClient
        return yield* pg.withTransaction(
          Effect.gen(function* () {
            // Connection-local table shadows the canonical table. No live enum ALTER
            // is required, and the temporary fixtures/DDL are always rolled back.
            yield* pg.unsafe(
              'create temporary table event (id uuid primary key, parent_event_id uuid, status text, planning_status text, completion_status text) on commit drop'
            )
            const root = crypto.randomUUID(),
              child = crypto.randomUUID()
            yield* pg`insert into event (id, status) values (${root}, 'draft')`
            yield* pg`insert into event (id, parent_event_id, planning_status, completion_status) values (${child}, ${root}, 'approved', 'upcoming')`
            yield* requireJoinableEvent(root)
            yield* requireJoinableEvent(child)
            for (const status of ['cancelled', 'finished']) {
              yield* pg`update event set status = ${status} where id = ${root}`
              const result = yield* Effect.exit(requireJoinableEvent(child))
              expect(
                Exit.isFailure(result) &&
                  result.cause.reasons.some(
                    (reason) =>
                      Cause.isFailReason(reason) &&
                      (reason.error as { code?: string }).code === 'EVENT_CLOSED'
                  )
              ).toBeTruthy()
            }
            yield* pg`update event set status = 'draft' where id = ${root}`
            yield* pg`update event set planning_status = 'cancelled' where id = ${child}`
            expect(Exit.isFailure(yield* Effect.exit(requireJoinableEvent(child)))).toBeTruthy()
            yield* requireJoinableEvent(root)
            const [count] = yield* pg<{
              count: number
            }>`select count(*)::integer as count from event`
            expect(count.count).toBe(2)
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
        Exit.isFailure(result) ? Cause.pretty(result.cause) : 'Expected rollback'
      ).toBeTruthy()
    }),
  { skip: process.env.RUN_EVENT_LIFECYCLE_DB_TESTS !== '1' }
)
