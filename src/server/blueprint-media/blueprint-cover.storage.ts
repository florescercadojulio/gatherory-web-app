import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '@/env'
import { ExternalServiceError } from '@/lib/domain-errors'

const privateBucket = env.CLOUDFLARE_R2_PRIVATE_BUCKET_NAME
let storageClient: S3Client | undefined

function client() {
  storageClient ??= new S3Client({
    region: 'auto',
    endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    credentials: {
      accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  })
  return storageClient
}

export function blueprintCoverStorageError(cause: unknown) {
  return new ExternalServiceError({
    category: 'external',
    code: 'BLUEPRINT_COVER_STORAGE_FAILED',
    userMessageKey: 'serverErrors.MEDIA_OPERATION_FAILED',
    cause,
  })
}

export const BlueprintCoverStorage = {
  bucket: privateBucket,
  createUploadUrl: async (input: { key: string; mediaAssetId: string }) => {
    const requiredHeaders = {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'private, no-store',
      'x-amz-meta-mediaassetid': input.mediaAssetId,
    }
    const uploadUrl = await getSignedUrl(
      client(),
      new PutObjectCommand({
        Bucket: privateBucket,
        Key: input.key,
        ContentType: 'image/jpeg',
        CacheControl: requiredHeaders['Cache-Control'],
        Metadata: { mediaassetid: input.mediaAssetId },
      }),
      {
        expiresIn: 15 * 60,
        unhoistableHeaders: new Set(['x-amz-meta-mediaassetid']),
        signableHeaders: new Set(['content-type', 'cache-control']),
      }
    )
    return { uploadUrl, requiredHeaders, expiresInSeconds: 15 * 60 }
  },
  inspect: async (input: { key: string }) => {
    const result = await client().send(
      new HeadObjectCommand({ Bucket: privateBucket, Key: input.key })
    )
    return {
      byteSize: result.ContentLength ?? null,
      contentType: result.ContentType ?? null,
      checksum: result.ETag?.replaceAll('"', '') ?? null,
      mediaAssetId: result.Metadata?.mediaassetid ?? null,
    }
  },
  readBytes: async (input: { key: string; maxBytes?: number }) => {
    const result = await client().send(
      new GetObjectCommand({ Bucket: privateBucket, Key: input.key })
    )
    if (!result.Body) throw new Error('The cover object had no body.')
    const body = result.Body as AsyncIterable<Uint8Array> & { destroy?: () => void }
    const maxBytes = input.maxBytes ?? 20 * 1024 * 1024
    const chunks: Buffer[] = []
    let byteSize = 0
    for await (const chunk of body) {
      const buffer = Buffer.from(chunk)
      byteSize += buffer.byteLength
      if (byteSize > maxBytes) {
        body.destroy?.()
        throw new Error('The cover object exceeds the configured byte limit.')
      }
      chunks.push(buffer)
    }
    if (!byteSize) throw new Error('The cover object had no body.')
    return Buffer.concat(chunks, byteSize)
  },
  putBytes: async (input: { key: string; mediaAssetId: string; bytes: Buffer }) => {
    await client().send(
      new PutObjectCommand({
        Bucket: privateBucket,
        Key: input.key,
        Body: input.bytes,
        ContentType: 'image/jpeg',
        CacheControl: 'private, no-store',
        Metadata: { mediaassetid: input.mediaAssetId },
      })
    )
  },
  createReadUrl: async (input: { key: string }) =>
    getSignedUrl(client(), new GetObjectCommand({ Bucket: privateBucket, Key: input.key }), {
      expiresIn: 5 * 60,
    }),
  delete: async (input: { key: string }) => {
    await client().send(new DeleteObjectCommand({ Bucket: privateBucket, Key: input.key }))
  },
}
