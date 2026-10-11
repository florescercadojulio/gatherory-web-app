import { resetPostgresDatabase } from "./lib/reset-postgres-database";

const requiredConfirmation = "RESET_GATHERORY_NEON";
const databaseUrl = process.env.NEON_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "NEON_DATABASE_URL is required. Pass the Neon connection string explicitly; this command does not read DATABASE_URL.",
  );
}

if (process.env.CONFIRM_NEON_RESET !== requiredConfirmation) {
  throw new Error(
    `Refusing to wipe Neon without explicit confirmation. Set CONFIRM_NEON_RESET=${requiredConfirmation}.`,
  );
}

let parsedUrl: URL;

try {
  parsedUrl = new URL(databaseUrl);
} catch {
  throw new Error("NEON_DATABASE_URL is not a valid URL.");
}

if (!new Set(["postgres:", "postgresql:"]).has(parsedUrl.protocol)) {
  throw new Error("NEON_DATABASE_URL must use the PostgreSQL protocol.");
}

if (!parsedUrl.hostname.endsWith(".neon.tech")) {
  throw new Error(
    `Refusing to reset non-Neon database host ${parsedUrl.hostname}.`,
  );
}

const databaseName = decodeURIComponent(parsedUrl.pathname.replace(/^\//, ""));

if (!databaseName) {
  throw new Error("NEON_DATABASE_URL must identify a database.");
}

const connectionString = databaseUrl;

async function resetNeonDatabase() {
  console.log(
    `Confirmed destructive reset for Neon database ${databaseName} at ${parsedUrl.hostname}.`,
  );
  await resetPostgresDatabase(connectionString, {
    targetLabel: `Neon database ${databaseName}`,
  });
}

resetNeonDatabase().catch((error) => {
  console.error("Neon database reset failed.", error);
  process.exitCode = 1;
});
