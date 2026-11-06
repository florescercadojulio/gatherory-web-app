import { expect, test } from 'vitest'

test('Effect PostgreSQL Drizzle entrypoint imports with the installed Effect 4 API', async () => {
  const drizzleEffectPostgres = await import('drizzle-orm/effect-postgres')

  expect(typeof drizzleEffectPostgres.make).toBe('function')
  expect(typeof drizzleEffectPostgres.DefaultServices).toBe('object')
})
