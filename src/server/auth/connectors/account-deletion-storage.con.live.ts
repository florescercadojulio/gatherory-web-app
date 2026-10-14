import { Layer } from 'effect'
import { deleteMediaObject } from '@/server/media/connectors/media-storage.con'
import { AccountDeletionStorageCon } from './account-deletion-storage.con'

export const AccountDeletionStorageConLive = Layer.succeed(AccountDeletionStorageCon, {
  deleteObject: (input) => deleteMediaObject(input),
})
