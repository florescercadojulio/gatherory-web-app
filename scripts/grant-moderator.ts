import { eq } from "drizzle-orm"
import { Effect } from "effect"
import { z } from "zod"

const index = process.argv.indexOf("--email")
const parsed = z.email().safeParse(index < 0 ? undefined : process.argv[index + 1]?.trim().toLowerCase())
if (!parsed.success) {
  console.error("Usage: pnpm moderation:grant --email verified-account@example.com")
  process.exit(1)
}
const databaseURL = new URL(process.env.DATABASE_URL ?? "invalid:")
if (!["localhost", "127.0.0.1", "[::1]"].includes(databaseURL.hostname)) {
  console.error("This command only provisions local PostgreSQL. Remote grants require a separate operator review.")
  process.exit(1)
}

const { DB, PgClientLive } = await import("../src/db")
const { PgClient } = await import("@effect/sql-pg/PgClient")
const { user, moderationStaff } = await import("../src/db/schema")
const { ConflictError, EntityNotFoundError, ForbiddenError, runServerEffect } = await import("../src/server/effect")
const program = Effect.gen(function* () {
  const pg = yield* PgClient
  return yield* pg.withTransaction(Effect.gen(function* () {
    const db = yield* DB
    const [account] = yield* db.select({ id: user.id, verified: user.emailVerified }).from(user)
      .where(eq(user.email, parsed.data)).limit(1).for("share")
    if (!account) return yield* Effect.fail(new EntityNotFoundError({ category: "not_found", code: "MODERATOR_ACCOUNT_NOT_FOUND", userMessage: "Register this account first. No permission was granted." }))
    if (!account.verified) return yield* Effect.fail(new ForbiddenError({ category: "authorization", code: "MODERATOR_EMAIL_UNVERIFIED", userMessage: "Verify this account's email first. No permission was granted." }))
    const [schema] = yield* pg<{ name: string | null }>`select to_regclass('public.moderation_staff')::text as name`
    if (!schema.name) return yield* Effect.fail(new ConflictError({ category: "conflict", code: "MODERATION_SCHEMA_REQUIRED", userMessage: "Apply the moderation migrations with pnpm db:migrate first. No permission was granted." }))
    yield* db.insert(moderationStaff).values({ userId: account.id }).onConflictDoUpdate({ target: moderationStaff.userId, set: { revokedAt: null, grantedAt: new Date() } })
    return { granted: true }
  }))
}).pipe(Effect.provide(PgClientLive))
const result = await runServerEffect(program)
if (result.ok) console.log("Local moderation permission granted. Organization and event access are unchanged.")
else { console.error(result.error.userMessage); process.exitCode = 1 }
