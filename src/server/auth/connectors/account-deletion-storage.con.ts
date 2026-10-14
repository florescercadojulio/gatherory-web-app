import { Context } from 'effect'

export class AccountDeletionStorageCon extends Context.Service<
  AccountDeletionStorageCon,
  {
    readonly deleteObject: (input: { bucket: string; key: string }) => Promise<void>
  }
>()('AccountDeletionStorageCon') {}
