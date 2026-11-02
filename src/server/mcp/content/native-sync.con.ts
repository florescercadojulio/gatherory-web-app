import { Context, type Effect } from 'effect'
import type { EffectDrizzleQueryError } from 'drizzle-orm/effect-core'
import type { SqlError } from 'effect/sql/SqlError'
import type { EventPermissions } from '@/lib/permissions'
import type { DomainError } from '@/lib/domain-errors'
import type {
  NativeMutation,
  NativePushResult,
  NativeWorkspaceSnapshots,
} from '@/server/sync/contracts/native-sync.contracts'

export type McpContentNativeFailure = DomainError | EffectDrizzleQueryError | SqlError

export type McpContentNativePortShape = {
  bootstrap: (userId: string) => Effect.Effect<NativeWorkspaceSnapshots, McpContentNativeFailure>
  push: (input: {
    userId: string
    mutation: NativeMutation
    fingerprint: string
  }) => Effect.Effect<NativePushResult, McpContentNativeFailure>
  authorize: (
    userId: string,
    eventId: string,
    permissions: EventPermissions
  ) => Effect.Effect<void, McpContentNativeFailure>
  isRootEvent: (userId: string, eventId: string) => Effect.Effect<boolean, McpContentNativeFailure>
}

export class McpContentNativePort extends Context.Service<
  McpContentNativePort,
  McpContentNativePortShape
>()('McpContentNativePort') {}
