import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/env";
import { databaseRelations } from "@/db/relations";

const globalDatabase = globalThis as typeof globalThis & {
  gatheroryPool?: Pool;
};

export const pool =
  globalDatabase.gatheroryPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (env.NODE_ENV !== "production") {
  globalDatabase.gatheroryPool = pool;
}

export const db = drizzle({
  client: pool,
  relations: databaseRelations,
});

export type Database = typeof db;
