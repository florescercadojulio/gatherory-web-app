import { Context, type Effect } from 'effect'

export type DeleteAccountMediaObject = (input: { bucket: string; key: string }) => Promise<void>

/** The legacy Promise transaction stays whole behind this injectable boundary. */
export class AccountDeletionRepo extends Context.Service<
  AccountDeletionRepo,
  {
    readonly prepare: (
      userId: string,
      deleteObject: DeleteAccountMediaObject
    ) => Effect.Effect<void, unknown>
  }
>()('AccountDeletionRepo') {}
