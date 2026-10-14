import type { EffectDrizzleQueryError } from 'drizzle-orm/effect-core'
import { Context, Effect } from 'effect'
import type { SqlError } from 'effect/unstable/sql/SqlError'

import type {
  FinalizeEventMediaUploadInput,
  NativeMediaAssetInput,
  PrepareEventMediaUploadInput,
  PrepareNativeMediaUploadInput,
} from '../contracts/media.contracts'
import type { MediaError } from '../errors'
import type { EntityNotFoundError, ExternalServiceError } from '@/lib/domain-errors'

export type MediaUploadReceipt = {
  mediaAssetId: string
  uploadUrl: string
  method: 'PUT'
  requiredHeaders: Record<string, string>
  expiresAt: string
}

export type MediaReadReceipt = { mediaAssetId: string; url: string }
type MediaServiceFailure =
  MediaError | EntityNotFoundError | ExternalServiceError | EffectDrizzleQueryError | SqlError
type MediaServiceContext = never

export type MediaServiceShape = {
  readonly prepareEventUpload: (input: {
    userId: string
    media: PrepareEventMediaUploadInput
  }) => Effect.Effect<MediaUploadReceipt, MediaServiceFailure, MediaServiceContext>
  readonly finalizeEventUpload: (input: {
    userId: string
    media: FinalizeEventMediaUploadInput
  }) => Effect.Effect<MediaReadReceipt, MediaServiceFailure, MediaServiceContext>
  readonly getEventReadUrl: (input: {
    userId: string
    mediaAssetId: string
  }) => Effect.Effect<MediaReadReceipt, MediaServiceFailure, MediaServiceContext>
  readonly prepareNativeUpload: (input: {
    userId: string
    media: PrepareNativeMediaUploadInput
  }) => Effect.Effect<MediaUploadReceipt, MediaServiceFailure, MediaServiceContext>
  readonly finalizeNativeUpload: (input: {
    userId: string
    media: NativeMediaAssetInput
  }) => Effect.Effect<MediaReadReceipt, MediaServiceFailure, MediaServiceContext>
  readonly getNativeReadUrl: (input: {
    userId: string
    mediaAssetId: string
  }) => Effect.Effect<MediaReadReceipt, MediaServiceFailure, MediaServiceContext>
}

export class MediaService extends Context.Service<MediaService, MediaServiceShape>()(
  'MediaService'
) {}
