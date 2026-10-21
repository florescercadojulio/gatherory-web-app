import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const databaseURL = 'postgresql://user:password@example.invalid:5432/gatherory'
const databaseModule = new URL('../../src/db/index.ts', import.meta.url).href
const materializerModule = new URL('../../src/server/sync/native-materializer.ts', import.meta.url)
  .href
const applicationEnvironment = new URL('../../src/env.ts', import.meta.url).href

function runImport(smokeTest: string, values: Record<string, string>) {
  const directory = mkdtempSync(join(tmpdir(), 'gatherory-database-environment-'))
  try {
    // Never let the developer's real .env files mask missing CI configuration.
    // A library import must not silently select a database from the working directory.
    for (const name of ['.env.local', '.env']) {
      writeFileSync(join(directory, name), 'DATABASE_URL=postgresql://dotenv.invalid/unexpected\n')
    }
    return spawnSync(
      process.execPath,
      ['--import', import.meta.resolve('tsx'), '--input-type=module', '--eval', smokeTest],
      {
        cwd: directory,
        encoding: 'utf8',
        env: {
          ...values,
          TSX_TSCONFIG_PATH: fileURLToPath(new URL('../../tsconfig.json', import.meta.url)),
        },
        timeout: 10_000,
      }
    )
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

test.each(['production', 'test'])(
  'native materialization imports with database-only %s configuration',
  (nodeEnv) => {
    const result = runImport(
      `
    import assert from 'node:assert/strict';
    const [database] = await Promise.all([
      import(${JSON.stringify(databaseModule)}),
      import(${JSON.stringify(materializerModule)}),
    ]);
    assert.equal(database.pool.options.connectionString, process.env.DATABASE_URL);
    await database.pool.end();
  `,
      {
        DATABASE_URL: databaseURL,
        NODE_ENV: nodeEnv,
        BETTER_AUTH_URL: 'invalid-unrelated-url',
        BETTER_AUTH_SECRET: 'invalid-unrelated-secret',
      }
    )
    expect(result.status, [result.stdout, result.stderr].filter(Boolean).join('\n')).toBe(0)
  }
)

test.each([undefined, '', '   '])(
  'database import rejects a missing or blank URL (%j) without loading dotenv',
  (value) => {
    const result = runImport(`await import(${JSON.stringify(databaseModule)});`, {
      NODE_ENV: 'production',
      ...(value === undefined ? {} : { DATABASE_URL: value }),
    })
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('DATABASE_URL is required.')
  }
)

test('application environment still validates required services in tests', () => {
  const result = runImport(`await import(${JSON.stringify(applicationEnvironment)});`, {
    NODE_ENV: 'test',
    DATABASE_URL: databaseURL,
  })
  expect(result.status).not.toBe(0)
  expect(result.stderr).toContain('BETTER_AUTH_SECRET')
  expect(result.stderr).toContain('CLOUDFLARE_ACCOUNT_ID')
})
