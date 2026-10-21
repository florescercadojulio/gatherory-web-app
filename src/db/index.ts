import { ConfigurationError } from '@/lib/domain-errors'
import { PgClient } from '@effect/sql-pg'
import * as PgDrizzle from 'drizzle-orm/effect-postgres'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as Effect from 'effect/Effect'
import * as Redacted from 'effect/Redacted'
import { Pool } from 'pg'

import { databaseRelations } from '@/db/relations'

// Database-only tools must not load local dotenv files or require credentials
// for auth, media, or notifications. The application validates those in env.ts;
// CLI entry points must supply their own environment before importing this module.
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl?.trim()) {
  throw new ConfigurationError({
    category: 'system',
    code: 'CONFIGURATION_INVALID',
    debugMessage: 'DATABASE_URL is required.',
  })
}

const globalDatabase = globalThis as typeof globalThis & {
  gatheroryPool?: Pool
}

export const pool =
  globalDatabase.gatheroryPool ??
  new Pool({
    connectionString: databaseUrl,
  })

if (process.env.NODE_ENV !== 'production') {
  globalDatabase.gatheroryPool = pool
}

export const db = drizzle({
  client: pool,
  relations: databaseRelations,
})

export type Database = typeof db

/** Effect PostgreSQL client used by application repositories and workflows. */
export const PgClientLive = PgClient.layer({
  url: Redacted.make(databaseUrl),
})

/**
 * Effect-native Drizzle service. Queries yielded from this service retain
 * typed Drizzle/SQL failures and participate in Effect transactions.
 */
export const DB = PgDrizzle.make({ relations: databaseRelations }).pipe(
  Effect.provide(PgDrizzle.DefaultServices)
)
