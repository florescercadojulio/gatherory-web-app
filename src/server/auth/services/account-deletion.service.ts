import { Context, type Effect } from 'effect'

export class AccountDeletionService extends Context.Service<
  AccountDeletionService,
  { readonly prepare: (userId: string) => Effect.Effect<void, unknown> }
>()('AccountDeletionService') {}
