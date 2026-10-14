import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { expect, it } from '@effect/vitest'
import { Effect } from 'effect'

import { PersistenceError, runServerEffect } from '@/server/effect'

it.effect('runServerEffect returns successful values through ServerResult', () =>
  Effect.promise(async () => {
    const result = await runServerEffect(Effect.succeed({ id: 'event-1' }))

    expect(result).toEqual({ ok: true, data: { id: 'event-1' } })
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

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.error.userMessage).toBe('The event could not be loaded. Try again.')
    expect(result.error.errorId).toMatch(/^[0-9a-f-]{36}$/i)
    expect(JSON.stringify(result)).not.toMatch(/private-driver-detail/)
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

  expect(files.length > 0).toBeTruthy()

  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    const displayPath = relative(process.cwd(), file)
    expect(source).toMatch(/createServerFn/)
    expect(source, `${displayPath} does not use runServerEffect`).toMatch(/runServerEffect\s*\(/)
    expect(
      source,
      `${displayPath} hand-builds an error transport instead of using runServerEffect`
    ).not.toMatch(/ok:\s*false\s*,\s*error:/)
  }
})

it('application repositories use Effect Drizzle instead of Promise wrappers', () => {
  const databaseSource = readFileSync(join(process.cwd(), 'src/db/index.ts'), 'utf8')
  expect(databaseSource).toMatch(/drizzle-orm\/effect-postgres/)
  expect(databaseSource).toMatch(/export const PgClientLive = PgClient\.layer/)
  expect(databaseSource).toMatch(/export const DB = PgDrizzle\.make/)

  const repositoryFiles = [
    'src/server/events/repos/event.repo.persistence.ts',
    'src/server/media/repos/media.repo.drizzle.ts',
  ]

  for (const displayPath of repositoryFiles) {
    const source = readFileSync(join(process.cwd(), displayPath), 'utf8')
    expect(source).toMatch(/const db = yield\* DB/)
    expect(source, `${displayPath} bypasses Effect Drizzle`).not.toMatch(
      /import\s+\{\s*db\s*\}\s+from\s+["']@\/db["']/
    )
    expect(
      source,
      `${displayPath} wraps Promise Drizzle instead of using Effect Drizzle`
    ).not.toMatch(/tryPersistence\s*\(/)
  }
})

it('database-backed transport composition provides the PostgreSQL Effect layer', () => {
  const handlerFiles = [
    'src/server/events/handlers/invite-event-participant.handler.ts',
    'src/server/media/handlers/prepare-event-media-upload.handler.ts',
    'src/server/sync/handlers/native-workspace-insights.handler.ts',
  ]

  for (const displayPath of handlerFiles) {
    const source = readFileSync(join(process.cwd(), displayPath), 'utf8')
    expect(source, `${displayPath} does not provide PgClientLive`).toMatch(
      /Effect\.provide\(PgClientLive\)/
    )
  }
})
