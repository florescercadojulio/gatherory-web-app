import { Effect } from 'effect'
import { PgClientLive } from '../src/db'
import { seedBlueprintCatalog } from '../src/server/blueprints/repos/seed-blueprint-catalog'

// Uses only explicit DATABASE_URL, never loads .env or imports the dev seed/reset.
await Effect.runPromise(seedBlueprintCatalog.pipe(Effect.provide(PgClientLive))).then((result) =>
  console.log(`Blueprint catalog: ${result.inserted} revision inserted.`)
)
