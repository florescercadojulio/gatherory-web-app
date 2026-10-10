import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import { env } from "@/env"

export type MediaVisibility = "private" | "public"

type R2Configuration = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  privateBucket?: string
  publicBucket?: string
}

function r2Configuration(): R2Configuration {
  const configuration = {
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    privateBucket: env.CLOUDFLARE_R2_PRIVATE_BUCKET_NAME,
    publicBucket: env.CLOUDFLARE_R2_PUBLIC_BUCKET_NAME,
  }

  if (
    !configuration.accountId ||
    !configuration.accessKeyId ||
    !configuration.secretAccessKey
  ) {
    throw new Error("MEDIA_STORAGE_NOT_CONFIGURED")
  }

  return configuration as R2Configuration
}

let storageClient: S3Client | undefined

function client(configuration: R2Configuration) {
  storageClient ??= new S3Client({
    region: "auto",
    endpoint: `https://${configuration.accountId}.r2.cloudflarestorage.com`,
    requestChecksumCalculation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: configuration.accessKeyId,
      secretAccessKey: configuration.secretAccessKey,
    },
  })

  return storageClient
}

function bucketFor(
  configuration: R2Configuration,
  visibility: MediaVisibility,
) {
  const bucket = visibility === "public"
    ? configuration.publicBucket
    : configuration.privateBucket

  if (!bucket) throw new Error("MEDIA_STORAGE_NOT_CONFIGURED")
  return bucket
}

export function mediaBucket(visibility: MediaVisibility = "private") {
  return bucketFor(r2Configuration(), visibility)
}

export async function createMediaUploadUrl(input: {
  key: string
  contentType: string
  mediaAssetId: string
  visibility?: MediaVisibility
  expiresInSeconds?: number
}) {
  const configuration = r2Configuration()
  const visibility = input.visibility ?? "private"
  const bucket = bucketFor(configuration, visibility)
  const expiresInSeconds = input.expiresInSeconds ?? 15 * 60
  const uploadUrl = await getSignedUrl(
    client(configuration),
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      ContentType: input.contentType,
      CacheControl:
        visibility === "public"
          ? "public, max-age=31536000, immutable"
          : "private, no-store",
      Metadata: { mediaAssetId: input.mediaAssetId },
    }),
    { expiresIn: expiresInSeconds },
  )

  return { bucket, uploadUrl, expiresInSeconds }
}

export async function inspectMediaObject(input: {
  bucket: string
  key: string
}) {
  const configuration = r2Configuration()
  const result = await client(configuration).send(
    new HeadObjectCommand({ Bucket: input.bucket, Key: input.key }),
  )

  return {
    byteSize: result.ContentLength ?? null,
    contentType: result.ContentType ?? null,
    checksum: result.ETag?.replaceAll('"', "") ?? null,
    mediaAssetId: result.Metadata?.mediaassetid ?? null,
  }
}

export async function createMediaReadUrl(input: {
  bucket: string
  key: string
  expiresInSeconds?: number
}) {
  const configuration = r2Configuration()
  return getSignedUrl(
    client(configuration),
    new GetObjectCommand({ Bucket: input.bucket, Key: input.key }),
    { expiresIn: input.expiresInSeconds ?? 5 * 60 },
  )
}

export async function deleteMediaObject(input: {
  bucket: string
  key: string
}) {
  const configuration = r2Configuration()
  await client(configuration).send(
    new DeleteObjectCommand({ Bucket: input.bucket, Key: input.key }),
  )
}
