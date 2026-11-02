import { Context, Effect } from 'effect'

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
  readonly readBytes: (input: {
    key: string
    maxBytes?: number
  }) => Effect.Effect<Uint8Array, unknown>
  readonly putBytes: (input: {
    key: string
    mediaAssetId: string
    bytes: Uint8Array
  }) => Effect.Effect<void, unknown>
  readonly createReadUrl: (input: { key: string }) => Effect.Effect<string, unknown>
  readonly delete: (input: { key: string }) => Effect.Effect<void, unknown>
}

/** Provider-neutral object storage port for Blueprint cover assets. */
export class BlueprintCoverStorage extends Context.Service<
  BlueprintCoverStorage,
  BlueprintCoverStorageShape
>()('BlueprintCoverStorage') {}
