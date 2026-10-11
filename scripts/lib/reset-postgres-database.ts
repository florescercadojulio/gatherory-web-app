import { resolve } from "node:path"

import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"

type ResetPostgresDatabaseOptions = {
  targetLabel: string
}

export async function resetPostgresDatabase(
  databaseUrl: string,
  { targetLabel }: ResetPostgresDatabaseOptions,
) {
  const pool = new Pool({ connectionString: databaseUrl })

  try {
    const client = await pool.connect()

    try {
      console.log(`Removing all data and migration history from ${targetLabel}...`)
      await client.query("BEGIN")
      await client.query("DROP SCHEMA IF EXISTS drizzle CASCADE")
      await client.query("DROP SCHEMA IF EXISTS public CASCADE")
      await client.query("CREATE SCHEMA public")
      await client.query("COMMIT")
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }

    console.log("Applying committed migrations...")
    const database = drizzle({ client: pool })
    await migrate(database, {
      migrationsFolder: resolve(process.cwd(), "drizzle"),
      migrationsSchema: "drizzle",
      migrationsTable: "__drizzle_migrations",
    })

    console.log(`${targetLabel} reset complete. No seed data was added.`)
  } finally {
    await pool.end()
  }
}
