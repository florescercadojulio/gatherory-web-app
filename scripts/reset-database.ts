import { resolve } from "node:path"

import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured in .env.local.")
}

if (process.env.NODE_ENV === "production") {
  throw new Error("The database reset cannot run in production.")
}

const parsedUrl = new URL(databaseUrl)
const localHosts = new Set(["127.0.0.1", "localhost", "::1"])

if (!localHosts.has(parsedUrl.hostname)) {
  throw new Error(
    `Refusing to reset non-local database host ${parsedUrl.hostname}.`,
  )
}

const pool = new Pool({ connectionString: databaseUrl })

async function resetDatabase() {
  const client = await pool.connect()

  try {
    console.log("Removing application data and migration history...")
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

  console.log("Database reset complete. No seed data was added.")
}

resetDatabase()
  .catch((error) => {
    console.error("Database reset failed.", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
