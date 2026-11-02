import { expect, test, vi } from 'vitest'
import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { legacyServerPortFacades } from '../helpers/server-architecture'

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
vi.mock('@aws-sdk/client-s3', () => {
  throw new Error('Domain imports must not load an object-storage SDK')
})
vi.mock('sharp', () => {
  throw new Error('Domain imports must not load the image-processing implementation')
})

test('live domain logic can be imported without production adapters or credentials', async () => {
  const modules = await Promise.all([
    import('@/server/notifications/workflows/postcommit-notifications.workflow'),
    import('@/server/announcements/services/announcement.service.live'),
    import('@/server/announcements/workflows/announcement.workflows'),
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
    import('@/server/auth/services/account-deletion.service.live'),
    import('@/server/auth/services/apple-account-deletion.service.live'),
    import('@/server/auth/workflows/prepare-account-deletion.workflow'),
    import('@/server/auth/workflows/revoke-apple-accounts-before-deletion.workflow'),
    import('@/server/workspaces/workflows/create-event-workspace.workflow'),
    import('@/server/moderation/workflows/moderator-access.workflow'),
    import('@/server/email/workflows/send-verification-email.workflow'),
    import('@/server/email/workflows/send-password-reset-email.workflow'),
    import('@/server/email/workflows/send-email-otp.workflow'),
    import('@/server/email/workflows/send-magic-link-email.workflow'),
  ])
  for (const module of modules) expect(Object.keys(module).length).toBeGreaterThan(0)
})

test('all domain contracts, ports, services and pure workflows import without production adapters', async () => {
  function files(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory() ? files(path) : /\.tsx?$/.test(path) ? [path] : []
    })
  }
  const serverRoot = join(process.cwd(), 'src/server')
  const legacyFacades = new Set<string>(legacyServerPortFacades)
  const pureModules = files(serverRoot).filter(
    (file) =>
      (file.includes('/contracts/') ||
        file.includes('/services/') ||
        (file.includes('/workflows/') && !file.endsWith('.live.ts')) ||
        /(?:\.con|\.service|\.repo(?:\.contract)?)\.ts$/.test(file)) &&
      !legacyFacades.has(relative(serverRoot, file))
  )
  expect(pureModules.length).toBeGreaterThan(100)
  for (const file of pureModules) {
    // The production mocks above make an indirect infrastructure import fail,
    // including dependencies added by a newly introduced domain.
    try {
      await import(file)
    } catch (cause) {
      throw new Error(`Pure domain module imports production infrastructure: ${file}`, { cause })
    }
  }
})
