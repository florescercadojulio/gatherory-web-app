import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { it } from '@effect/vitest'
import { Effect } from 'effect'

import { PersistenceError, runServerEffect } from '@/server/effect'

it.effect('runServerEffect returns successful values through ServerResult', () =>
  Effect.promise(async () => {
    const result = await runServerEffect(Effect.succeed({ id: 'event-1' }))

    assert.deepEqual(result, { ok: true, data: { id: 'event-1' } })
  })
)

it.effect('runServerEffect exposes safe copy and an error ID, not infrastructure details', () =>
  Effect.promise(async () => {
    const result = await runServerEffect(
      Effect.fail(
        new PersistenceError({
          category: 'system',
          code: 'EVENT_QUERY_FAILED',
          userMessage: 'The event could not be loaded. Try again.',
          debugMessage: 'private-driver-detail',
        })
      )
    )

    assert.equal(result.ok, false)
    if (result.ok) return

    assert.equal(result.error.userMessage, 'The event could not be loaded. Try again.')
    assert.match(result.error.errorId, /^[0-9a-f-]{36}$/i)
    assert.doesNotMatch(JSON.stringify(result), /private-driver-detail/)
  })
)

it('every TanStack server-function module uses the shared Effect boundary', () => {
  const sourceFiles = (directory: string): string[] =>
    readdirSync(directory).flatMap((entry) => {
      const path = join(directory, entry)
      if (statSync(path).isDirectory()) return sourceFiles(path)
      return /\.(?:ts|tsx)$/.test(entry) ? [path] : []
    })

  const files = sourceFiles(join(process.cwd(), 'src')).filter((file) =>
    readFileSync(file, 'utf8').includes('createServerFn')
  )

  assert.ok(files.length > 0)

  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    const displayPath = relative(process.cwd(), file)
    assert.match(source, /createServerFn/)
    assert.match(source, /runServerEffect\s*\(/, `${displayPath} does not use runServerEffect`)
    assert.doesNotMatch(
      source,
      /ok:\s*false\s*,\s*error:/,
      `${displayPath} hand-builds an error transport instead of using runServerEffect`
    )
  }
})

it('application repositories use Effect Drizzle instead of Promise wrappers', () => {
  const databaseSource = readFileSync(join(process.cwd(), 'src/db/index.ts'), 'utf8')
  assert.match(databaseSource, /drizzle-orm\/effect-postgres/)
  assert.match(databaseSource, /export const PgClientLive = PgClient\.layer/)
  assert.match(databaseSource, /export const DB = PgDrizzle\.make/)

  const repositoryFiles = [
    'src/server/events/repos/event.repo.ts',
    'src/server/media/repos/media.repo.ts',
  ]

  for (const displayPath of repositoryFiles) {
    const source = readFileSync(join(process.cwd(), displayPath), 'utf8')
    assert.match(source, /const db = yield\* DB/)
    assert.doesNotMatch(
      source,
      /import\s+\{\s*db\s*\}\s+from\s+["']@\/db["']/,
      `${displayPath} bypasses Effect Drizzle`
    )
    assert.doesNotMatch(
      source,
      /tryPersistence\s*\(/,
      `${displayPath} wraps Promise Drizzle instead of using Effect Drizzle`
    )
  }
})

it('database-backed handlers provide the PostgreSQL Effect layer', () => {
  const handlerFiles = [
    'src/server/events/handlers/event.handlers.ts',
    'src/server/media/handlers/media.handlers.ts',
    'src/server/sync/native-insights.ts',
  ]

  for (const displayPath of handlerFiles) {
    const source = readFileSync(join(process.cwd(), displayPath), 'utf8')
    assert.match(
      source,
      /Effect\.provide\(PgClientLive\)/,
      `${displayPath} does not provide PgClientLive`
    )
  }
})
