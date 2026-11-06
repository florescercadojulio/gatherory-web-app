# Schema export wiring — November 6, 2026

`pnpm db:generate` discovered the eight JWT/OAuth tables twice: directly from
`mcp-oauth.schema.ts` and through re-exports in `auth.schema.ts`. Both files match
the configured `src/db/schema/*.schema.ts` glob. The duplicate exports pointed
to the same table objects, producing repeated table, column, index, and
constraint diagnostics.

## Change

- Core auth definitions stay in `auth.schema.ts`; JWT/OAuth definitions stay in
  `mcp-oauth.schema.ts`, with their existing foreign keys and table definitions.
- The non-discovered `src/db/auth-schema.ts` composes the full runtime auth
  object for Better Auth, the relation graph, and development reset. The ordinary
  schema barrel exports both domains explicitly. The MCP authorization repository
  imports table declarations from their owning domain modules.
- The final relation graph includes the eight JWT/OAuth models so Better Auth's
  relations-v2 adapter has their query builders. Empty relation declarations do
  not invent associations or change foreign-key behavior.

The existing handler → Effect workflow → service → injected repository
boundaries, authentication/authorization rules, and transaction ownership are
preserved. No package, table definition, migration history, seed execution,
database migration, or deployment is part of this fix.

## Regression and verification

The generation regression uses the installed Drizzle CLI with temporary output,
dry-run generation, and synthetic configuration. It verifies nonempty schema
discovery and exactly one definition for each of the eight JWT/OAuth tables.
The actual config is read in an isolated child process. A temporary re-export
outside the repository reproduces the old layout and must fail with duplicate
diagnostics. Normal generation is checked through structured JSON; the negative
control also checks the human-facing warnings from the original report.
The runtime schema test checks plugin-required fields, shared table identities,
offline relational query compilation, and existing cascade/set-null behavior.

The real configured-history check was:

```sh
node_modules/.bin/drizzle-kit generate --config drizzle.config.ts --explain --output json
```

It ran with a synthetic `DATABASE_URL` and returned
`{"status":"no_changes","dialect":"postgresql"}` with no duplicate diagnostics.
The ordinary `pnpm db:generate --output json` script was also run with that
synthetic URL and returned the same `no_changes` result. No migration files were
written or database connections made. Existing staged
work was left staged; this fix was not staged or committed.

Focused runtime verification passed four files / 14 tests (OAuth model fields
and query graph, in-memory OAuth flow, normalized relationships, and isolated
database imports). The generation regression passed separately, including its
duplicate-export negative control. Final `pnpm test` passed the contract check
and 189 test files / 1,109 tests, with 48 opt-in files / 76 tests skipped.
`pnpm typecheck --pretty false`, scoped Prettier, and `git diff --check` passed.
The original 146-file staged diff was preserved. No live PostgreSQL/provider
integration or production build/deployment was run for this wiring change.
