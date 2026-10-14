import { Effect, Layer } from 'effect'

import {
  createMediaReadUrl,
  createMediaUploadUrl,
  deleteMediaObject,
  inspectMediaObject,
  mediaStorageFailure,
} from './media-storage.con'
import { MediaStorage } from './media-storage.con.contract'

function liftStorage<A>(operation: () => Promise<A>) {
  return Effect.tryPromise({ try: operation, catch: mediaStorageFailure })
}

export const MediaStorageLive = Layer.succeed(MediaStorage, {
  createUploadUrl: (input) => liftStorage(() => createMediaUploadUrl(input)),
  inspectObject: (input) => liftStorage(() => inspectMediaObject(input)),
  createReadUrl: (input) => liftStorage(() => createMediaReadUrl(input)),
  deleteObject: (input) => liftStorage(() => deleteMediaObject(input)),
})
