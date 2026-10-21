import { expectTypeOf, test } from 'vitest'
import type { Effect } from 'effect'
import type { PgClient } from '@effect/sql-pg/PgClient'

type Requirements<Module> = {
  [Key in keyof Module]: Module[Key] extends (...args: never[]) => infer Program
    ? Effect.Services<Program>
    : never
}

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
