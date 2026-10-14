import { Context, Effect } from 'effect'

export type MediaVisibility = 'private' | 'public'

export type MediaStorageShape = {
  readonly createUploadUrl: (input: {
    key: string
    contentType: string
    mediaAssetId: string
    visibility?: MediaVisibility
    expiresInSeconds?: number
  }) => Effect.Effect<
    {
      bucket: string
      uploadUrl: string
      expiresInSeconds: number
      requiredHeaders: Record<string, string>
    },
    import('@/lib/domain-errors').ExternalServiceError
  >
  readonly inspectObject: (input: { bucket: string; key: string }) => Effect.Effect<
    {
      byteSize: number | null
      contentType: string | null
      checksum: string | null
      mediaAssetId: string | null
    },
    import('@/lib/domain-errors').ExternalServiceError
  >
  readonly createReadUrl: (input: {
    bucket: string
    key: string
    expiresInSeconds?: number
  }) => Effect.Effect<string, import('@/lib/domain-errors').ExternalServiceError>
  readonly deleteObject: (input: {
    bucket: string
    key: string
  }) => Effect.Effect<void, import('@/lib/domain-errors').ExternalServiceError>
}

export class MediaStorage extends Context.Service<MediaStorage, MediaStorageShape>()(
  'MediaStorage'
) {}
