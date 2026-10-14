import assert from "node:assert/strict"
import { it as test } from "@effect/vitest"
import { Cause, Data, Effect, Exit } from "effect"

test("closed event lifecycle blocks new admissions without deleting history", { skip: process.env.RUN_EVENT_LIFECYCLE_DB_TESTS !== "1" }, async () => {
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env.DATABASE_URL!).hostname))
  const { PgClientLive } = await import("@/db")
  const { PgClient } = await import("@effect/sql-pg/PgClient")
  const { requireJoinableEvent } = await import("@/server/events/repos/event-lifecycle.repo")
  class Rollback extends Data.TaggedError("LifecycleVerificationRollback")<{}> {}
  const program = Effect.gen(function* () {
    const pg = yield* PgClient
    return yield* pg.withTransaction(Effect.gen(function* () {
      // Connection-local table shadows the canonical table. No live enum ALTER
      // is required, and the temporary fixtures/DDL are always rolled back.
      yield* pg.unsafe("create temporary table event (id uuid primary key, parent_event_id uuid, status text, planning_status text, completion_status text) on commit drop")
      const root = crypto.randomUUID(), child = crypto.randomUUID()
      yield* pg`insert into event (id, status) values (${root}, 'draft')`
      yield* pg`insert into event (id, parent_event_id, planning_status, completion_status) values (${child}, ${root}, 'approved', 'upcoming')`
      yield* requireJoinableEvent(root)
      yield* requireJoinableEvent(child)
      for (const status of ["cancelled", "finished"]) {
        yield* pg`update event set status = ${status} where id = ${root}`
        const result = yield* Effect.exit(requireJoinableEvent(child))
        assert.ok(Exit.isFailure(result) && result.cause.reasons.some(reason => Cause.isFailReason(reason) && (reason.error as { code?: string }).code === "EVENT_CLOSED"))
      }
      yield* pg`update event set status = 'draft' where id = ${root}`
      yield* pg`update event set planning_status = 'cancelled' where id = ${child}`
      assert.ok(Exit.isFailure(yield* Effect.exit(requireJoinableEvent(child))))
      yield* requireJoinableEvent(root)
      const [count] = yield* pg<{ count: number }>`select count(*)::integer as count from event`
      assert.equal(count.count, 2)
      return yield* Effect.fail(new Rollback())
    }))
  }).pipe(Effect.provide(PgClientLive))
  const result = await Effect.runPromiseExit(program)
  assert.ok(Exit.isFailure(result) && result.cause.reasons.some(reason => Cause.isFailReason(reason) && reason.error instanceof Rollback), Exit.isFailure(result) ? Cause.pretty(result.cause) : "Expected rollback")
})
