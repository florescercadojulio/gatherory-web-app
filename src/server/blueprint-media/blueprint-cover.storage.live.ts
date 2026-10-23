import { Context, Effect, Layer } from 'effect'
import {
  BlueprintCoverStorage as storage,
  blueprintCoverStorageError,
} from './blueprint-cover.storage'

export type BlueprintCoverStorageShape = {
  readonly bucket: string
  readonly createUploadUrl: (input: { key: string; mediaAssetId: string }) => Effect.Effect<
    {
      uploadUrl: string
      requiredHeaders: Record<string, string>
      expiresInSeconds: number
    },
    unknown
  >
  readonly inspect: (input: { key: string }) => Effect.Effect<
    {
      byteSize: number | null
      contentType: string | null
      checksum: string | null
      mediaAssetId: string | null
    },
    unknown
  >
  readonly readBytes: (input: { key: string; maxBytes?: number }) => Effect.Effect<Buffer, unknown>
  readonly putBytes: (input: {
    key: string
    mediaAssetId: string
    bytes: Buffer
  }) => Effect.Effect<void, unknown>
  readonly createReadUrl: (input: { key: string }) => Effect.Effect<string, unknown>
  readonly delete: (input: { key: string }) => Effect.Effect<void, unknown>
}

export class BlueprintCoverStorage extends Context.Service<
  BlueprintCoverStorage,
  BlueprintCoverStorageShape
>()('BlueprintCoverStorage') {}

const lift = <A>(operation: () => Promise<A>) =>
  Effect.tryPromise({ try: operation, catch: blueprintCoverStorageError })

export const BlueprintCoverStorageLive = Layer.succeed(BlueprintCoverStorage, {
  bucket: storage.bucket,
  createUploadUrl: (input) => lift(() => storage.createUploadUrl(input)),
  inspect: (input) => lift(() => storage.inspect(input)),
  readBytes: (input) => lift(() => storage.readBytes(input)),
  putBytes: (input) => lift(() => storage.putBytes(input)),
  createReadUrl: (input) => lift(() => storage.createReadUrl(input)),
  delete: (input) => lift(() => storage.delete(input)),
})
