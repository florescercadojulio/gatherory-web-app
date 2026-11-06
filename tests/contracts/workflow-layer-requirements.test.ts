import { expectTypeOf, test } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { expect } from 'vitest'
import type { Effect } from 'effect'
import type { PgClient } from '@effect/sql-pg/PgClient'

type Requirements<Module> = {
  [
    Key in keyof Module as Module[Key] extends (...args: never[]) => unknown ? Key : never
  ]: Module[Key] extends (...args: never[]) => infer Program ? Effect.Services<Program> : never
}

type DatabaseRequirements<Module> = { [Key in keyof Requirements<Module>]: PgClient }
type NoRequirements<Module> = { [Key in keyof Requirements<Module>]: never }

test('event reading leaves only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/events/workflows/event-reading.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<DatabaseRequirements<Workflows>>()
})

test('selected event updates retain the native transaction engine without a fictitious PgClient requirement', () => {
  type Workflows = typeof import('@/server/events/workflows/event-updates.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<NoRequirements<Workflows>>()
})

test('every production workflow binding is included in the requirement type checks', () => {
  const root = process.cwd()
  const source = readFileSync(
    join(root, 'tests/contracts/workflow-layer-requirements.test.ts'),
    'utf8'
  )
  const covered = new Set(
    [...source.matchAll(/typeof import\(['"](@\/server\/[^'"]+\.workflows\.live)['"]\)/g)].map(
      (match) => match[1].replace('@/', 'src/') + '.ts'
    )
  )
  function bindings(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory()
        ? bindings(path)
        : path.endsWith('.workflows.live.ts')
          ? [path]
          : []
    })
  }
  for (const file of bindings(join(root, 'src/server'))) {
    expect(covered.has(relative(root, file)), relative(root, file)).toBe(true)
  }
})

test('Blueprint library workflows leave only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/blueprints/workflows/blueprint-library.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<DatabaseRequirements<Workflows>>()
})

test('Blueprint personal workflows leave only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/blueprints/workflows/blueprint-personal.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<DatabaseRequirements<Workflows>>()
})

test('Blueprint installation and catalog workflows leave only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/blueprints/workflows/blueprint.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<DatabaseRequirements<Workflows>>()
})

test('Blueprint sharing workflows leave only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/blueprints/workflows/blueprint-sharing.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<DatabaseRequirements<Workflows>>()
})

test('Blueprint authoring workflows leave only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/blueprints/workflows/blueprint-authoring.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<DatabaseRequirements<Workflows>>()
})

test('Blueprint link management workflows leave only PgClient unresolved', () => {
  type Workflows =
    typeof import('@/server/blueprints/workflows/blueprint-link-management.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<DatabaseRequirements<Workflows>>()
})

test('Blueprint capture workflows leave only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/blueprints/workflows/blueprint-capture.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<DatabaseRequirements<Workflows>>()
})

test('Blueprint native creation workflows leave only PgClient unresolved', () => {
  type Workflows =
    typeof import('@/server/blueprints/workflows/blueprint-native-creation.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<DatabaseRequirements<Workflows>>()
})

test('Blueprint copy workflows leave only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/blueprints/workflows/blueprint-copy.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<DatabaseRequirements<Workflows>>()
})

test('Blueprint discovery workflows leave only PgClient unresolved', () => {
  type Workflows =
    typeof import('@/server/blueprints/workflows/blueprint-discovery-actions.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<DatabaseRequirements<Workflows>>()
})

test('waitlist workflows leave only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/waitlist/workflows/waitlist.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<DatabaseRequirements<Workflows>>()
})

test('browser guest invitation workflows leave only PgClient unresolved', () => {
  type Workflows =
    typeof import('@/server/events/workflows/browser-guest-invitation.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<DatabaseRequirements<Workflows>>()
})

test('signed-in invitation event workflow leaves only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/events/workflows/account-invited-event.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<DatabaseRequirements<Workflows>>()
})

test('MCP connection workflows leave only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/mcp/connection.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<DatabaseRequirements<Workflows>>()
})

test('MCP authorization workflows leave only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/mcp/authorization.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<DatabaseRequirements<Workflows>>()
})

test('Blueprint media workflows leave only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/blueprint-media/blueprint-media.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<DatabaseRequirements<Workflows>>()
})

test('announcement workflows leave only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/announcements/workflows/announcement.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<{ [Key in keyof Workflows]: PgClient }>()
})

test('notification workflows leave only caller-owned PgClient unresolved', () => {
  type Workflows = typeof import('@/server/notifications/workflows/notification.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<{ [Key in keyof Workflows]: PgClient }>()
})

test('auth/workflows/account-deletion.workflows.live.ts leaves no services unresolved', () => {
  type Workflows = typeof import('@/server/auth/workflows/account-deletion.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<{
    [Key in keyof Workflows]: never
  }>()
})

test('auth/workflows/apple-account-deletion.workflows.live.ts leaves only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/auth/workflows/apple-account-deletion.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<{
    [Key in keyof Workflows]: PgClient
  }>()
})

test('auth/workflows/apple-token.workflows.live.ts leaves only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/auth/workflows/apple-token.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<{
    [Key in keyof Workflows]: PgClient
  }>()
})

test('email/workflows/auth-email.workflows.live.ts leaves no services unresolved', () => {
  type Workflows = typeof import('@/server/email/workflows/auth-email.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<{
    [Key in keyof Workflows]: never
  }>()
})

test('events/workflows/event-guest.workflows.live.ts leaves only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/events/workflows/event-guest.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<{
    [Key in keyof Workflows]: PgClient
  }>()
})

test('events/workflows/event-invitation.workflows.live.ts leaves only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/events/workflows/event-invitation.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<{
    [Key in keyof Workflows]: PgClient
  }>()
})

test('events/workflows/event-sharing.workflows.live.ts leaves only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/events/workflows/event-sharing.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<{
    [Key in keyof Workflows]: PgClient
  }>()
})

test('events/workflows/event.workflows.live.ts leaves only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/events/workflows/event.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<{
    [Key in keyof Workflows]: PgClient
  }>()
})

test('media/workflows/media.workflows.live.ts leaves only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/media/workflows/media.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<{
    [Key in keyof Workflows]: PgClient
  }>()
})

test('moderation/workflows/moderation.workflows.live.ts leaves only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/moderation/workflows/moderation.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<{
    [Key in keyof Workflows]: PgClient
  }>()
})

test('moderation/workflows/moderator-access.workflows.live.ts leaves only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/moderation/workflows/moderator-access.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<{
    [Key in keyof Workflows]: PgClient
  }>()
})

test('sync/workflows/native-insights.workflows.live.ts leaves only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/sync/workflows/native-insights.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<{
    [Key in keyof Workflows]: PgClient
  }>()
})

test('sync push leaves PgClient for postcommit delivery while read bindings need no services', () => {
  type Workflows = typeof import('@/server/sync/workflows/native-sync.workflows.live')
  expectTypeOf<
    Effect.Services<ReturnType<Workflows['bootstrapNativeSync']>>
  >().toEqualTypeOf<never>()
  expectTypeOf<Effect.Services<ReturnType<Workflows['pullNativeSync']>>>().toEqualTypeOf<never>()
  expectTypeOf<Effect.Services<ReturnType<Workflows['pushNativeSync']>>>().toEqualTypeOf<PgClient>()
})

test('workspaces/workflows/workspace.workflows.live.ts leaves only PgClient unresolved', () => {
  type Workflows = typeof import('@/server/workspaces/workflows/workspace.workflows.live')
  expectTypeOf<Requirements<Workflows>>().toEqualTypeOf<{
    [Key in keyof Workflows]: PgClient
  }>()
})
