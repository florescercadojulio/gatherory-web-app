import { spawnSync, type SpawnSyncReturns } from 'node:child_process'
import {
  closeSync,
  globSync,
  mkdtempSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const drizzleKit = path.join(workspaceRoot, 'node_modules/drizzle-kit/bin.cjs')
const oauthTables = [
  'jwks',
  'oauth_access_token',
  'oauth_client',
  'oauth_client_assertion',
  'oauth_client_resource',
  'oauth_consent',
  'oauth_refresh_token',
  'oauth_resource',
]

const runGeneration = (
  schema: string,
  outputDir: string,
  capturePath: string,
  cwd = workspaceRoot,
  outputFormat: 'json' | 'text' = 'json'
) => {
  // Capture the large schema on disk so CLI exit cannot truncate buffered stdout.
  const stdoutFd = openSync(capturePath, 'w')
  let result: SpawnSyncReturns<string>
  try {
    result = spawnSync(
      process.execPath,
      [
        drizzleKit,
        'generate',
        '--schema',
        schema,
        '--dialect',
        'postgresql',
        '--out',
        outputDir,
        '--explain',
        '--output',
        outputFormat,
      ],
      {
        cwd,
        encoding: 'utf8',
        env: { PATH: process.env.PATH, NODE_ENV: 'test' },
        timeout: 20_000,
        maxBuffer: 1024 * 1024,
        stdio: ['ignore', stdoutFd, 'pipe'],
      }
    )
  } finally {
    closeSync(stdoutFd)
  }
  return { ...result, stdout: readFileSync(capturePath, 'utf8') }
}

const parseJson = (output: string) => JSON.parse(output.trim())

describe('Drizzle schema generation', () => {
  it('generates configured OAuth tables once and rejects duplicate schema exports', async () => {
    const tempRoot = mkdtempSync(path.join(tmpdir(), 'gatherory-drizzle-generate-'))

    try {
      // Load the actual config from a clean cwd in a child process. A dummy URL
      // satisfies drizzle.config.ts; no developer environment is inherited or loaded.
      const configModule = pathToFileURL(path.join(workspaceRoot, 'drizzle.config.ts')).href
      const configLoader = path.join(workspaceRoot, 'node_modules/tsx/dist/loader.mjs')
      const configRead = spawnSync(
        process.execPath,
        [
          '--import',
          configLoader,
          '--input-type=module',
          '--eval',
          `const c = (await import(${JSON.stringify(configModule)})).default; process.stdout.write(JSON.stringify({ schema: c.schema, dialect: c.dialect }))`,
        ],
        {
          cwd: tempRoot,
          encoding: 'utf8',
          env: { DATABASE_URL: 'postgres://test:test@127.0.0.1:1/test', PATH: process.env.PATH },
          timeout: 10_000,
          maxBuffer: 1024 * 1024,
        }
      )
      expect(configRead.status, configRead.stderr || configRead.stdout).toBe(0)
      const { schema: configuredSchemaPattern, dialect } = JSON.parse(configRead.stdout)
      expect(configuredSchemaPattern).toBeTypeOf('string')
      expect(dialect).toBe('postgresql')
      const configuredSchemas = globSync(configuredSchemaPattern, { cwd: workspaceRoot }).sort()
      expect(configuredSchemas.length).toBeGreaterThan(0)

      const outputDir = path.join(tempRoot, 'output')
      mkdirSync(outputDir)

      const schemaResult = runGeneration(
        configuredSchemaPattern,
        outputDir,
        path.join(tempRoot, 'normal.json')
      )
      expect(schemaResult.status, schemaResult.stderr || schemaResult.stdout).toBe(0)
      expect(schemaResult.stdout.length).toBeGreaterThan(0)
      expect(`${schemaResult.stdout}\n${schemaResult.stderr}`).not.toMatch(
        /duplicate (?:table|column|index|constraint) name/i
      )
      const generated = parseJson(schemaResult.stdout)
      expect(generated.status).toBe('ok')
      expect(generated.statements).toBeInstanceOf(Array)
      const statements = generated.statements as { type: string; table?: { name?: string } }[]
      for (const table of oauthTables) {
        expect(
          statements.filter(
            (statement) => statement.type === 'create_table' && statement.table?.name === table
          )
        ).toHaveLength(1)
      }
      expect(statements.length).toBeGreaterThan(oauthTables.length)

      const duplicateFixture = path.join(tempRoot, 'old-auth-schema-reexport.schema.ts')
      const mcpSchemaFile = path.join(workspaceRoot, 'src/db/schema/mcp-oauth.schema.ts')
      // Drizzle resolves aliases from each input module's nearest tsconfig.
      writeFileSync(
        path.join(tempRoot, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: { paths: { '@/*': [path.join(workspaceRoot, 'src/*')] } },
        })
      )
      writeFileSync(duplicateFixture, `export * from ${JSON.stringify(mcpSchemaFile)}\n`)
      const duplicateSchemaPattern = `{${configuredSchemaPattern},${duplicateFixture}}`
      // Exercise the human-facing diagnostics from the reported failure too.
      // The real-project success path above validates the structured JSON output.
      const duplicateResult = runGeneration(
        duplicateSchemaPattern,
        path.join(tempRoot, 'duplicate-output'),
        path.join(tempRoot, 'duplicate.txt'),
        workspaceRoot,
        'text'
      )
      expect(duplicateResult.status).not.toBe(0)
      const duplicateOutput = `${duplicateResult.stdout}\n${duplicateResult.stderr}`
      expect(
        duplicateOutput,
        JSON.stringify({
          status: duplicateResult.status,
          error: duplicateResult.error,
          signal: duplicateResult.signal,
        })
      ).toMatch(/duplicate (?:table|column|index|constraint) name/i)
    } finally {
      rmSync(tempRoot, { recursive: true, force: true })
    }
  }, 30_000)
})
