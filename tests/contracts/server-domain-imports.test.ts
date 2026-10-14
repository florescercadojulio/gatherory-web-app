import { expect, test, vi } from 'vitest'

// A service with substituted ports must not evaluate production configuration,
// open a database adapter, or initialize Better Auth just by being imported.
vi.mock('@/env', () => {
  throw new Error('Domain imports must not load production configuration')
})
vi.mock('@/db', () => {
  throw new Error('Domain imports must not initialize the database')
})
vi.mock('@/lib/auth', () => {
  throw new Error('Domain imports must not initialize Better Auth')
})

test('live domain logic can be imported without production adapters or credentials', async () => {
  const modules = await Promise.all([
    import('@/server/auth/authorization'),
    import('@/server/events/authorization'),
    import('@/server/events/services/event.service.live'),
    import('@/server/events/services/event-sharing.service.live'),
    import('@/server/events/services/event-guest.service.live'),
    import('@/server/media/services/media.service.live'),
    import('@/server/moderation/services/moderation.service.live'),
    import('@/server/workspaces/services/workspace.service.live'),
    import('@/server/sync/services/native-insights.service.live'),
    import('@/server/auth/services/apple-token.service.live'),
  ])
  for (const module of modules) expect(Object.keys(module).length).toBeGreaterThan(0)
})
