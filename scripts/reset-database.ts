import { resetPostgresDatabase } from "./lib/reset-postgres-database"

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

const connectionString = databaseUrl

async function resetDatabase() {
  await resetPostgresDatabase(connectionString, {
    targetLabel: "Local database",
  })
}

resetDatabase()
  .catch((error) => {
    console.error("Database reset failed.", error)
    process.exitCode = 1
  })
