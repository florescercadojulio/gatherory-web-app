import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

test("native materialization imports with database-only CI configuration", () => {
  const smokeTest = `
    const [database] = await Promise.all([
      import("./src/db/index.ts"),
      import("./src/server/sync/native-materializer.ts"),
    ]);
    await database.pool.end();
  `;
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "--eval", smokeTest],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        DATABASE_URL:
          "postgresql://user:password@example.invalid:5432/gatherory",
        NODE_ENV: "production",
      },
      timeout: 10_000,
    },
  );

  assert.equal(
    result.status,
    0,
    [result.stdout, result.stderr].filter(Boolean).join("\n"),
  );
});
