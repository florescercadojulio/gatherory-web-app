import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { databaseRelations } from "@/db/relations";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const globalDatabase = globalThis as typeof globalThis & {
  gatheroryPool?: Pool;
};

export const pool =
  globalDatabase.gatheroryPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalDatabase.gatheroryPool = pool;
}

export const db = drizzle({
  client: pool,
  relations: databaseRelations,
});

export type Database = typeof db;
