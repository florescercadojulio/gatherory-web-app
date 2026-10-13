import { randomUUID } from "node:crypto"

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { env } from "../src/env"
import { createMediaUploadUrl } from "../src/server/media/connectors/media-storage.con"

type BucketTarget = {
  label: "private" | "public"
  name: string
}

const originArgument = process.argv.find((argument) =>
  argument.startsWith("--origin="),
)
const origin = originArgument?.slice("--origin=".length) ??
  "http://localhost:3003"

const client = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  requestChecksumCalculation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

const targets: BucketTarget[] = [
  { label: "private", name: env.CLOUDFLARE_R2_PRIVATE_BUCKET_NAME },
  { label: "public", name: env.CLOUDFLARE_R2_PUBLIC_BUCKET_NAME },
]

function summarize(error: unknown) {
  if (!(error instanceof Error)) return "Unknown error"
  const status = "$metadata" in error &&
      typeof error.$metadata === "object" &&
      error.$metadata !== null &&
      "httpStatusCode" in error.$metadata
    ? ` (HTTP ${String(error.$metadata.httpStatusCode)})`
    : ""
  const message = error.name === "Error" ? error.message : error.name
  return `${message}${status}`
}

async function checkCors(input: { bucket: string; key: string }) {
  const { bucket, uploadUrl, requiredHeaders } = await createMediaUploadUrl({
    key: input.key, contentType: "text/plain", mediaAssetId: randomUUID(), expiresInSeconds: 60,
  })
  if (bucket !== input.bucket) throw new Error("CORS bucket does not match the upload bucket")
  const requestedHeaders = Object.keys(requiredHeaders).map((header) => header.toLowerCase())
  const response = await fetch(uploadUrl, {
    method: "OPTIONS",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "PUT",
      "Access-Control-Request-Headers": requestedHeaders.join(","),
    },
  })
  const allowedOrigin = response.headers.get("access-control-allow-origin")
  const allowedMethods = response.headers.get("access-control-allow-methods") ?? ""
  const allowedHeaders = (response.headers.get("access-control-allow-headers") ?? "")
    .toLowerCase().split(",").map((header) => header.trim())

  if (
    !response.ok ||
    (allowedOrigin !== origin && allowedOrigin !== "*") ||
    !allowedMethods.toUpperCase().includes("PUT") ||
    !requestedHeaders.every((header) => allowedHeaders.includes("*") || allowedHeaders.includes(header))
  ) {
    throw new Error(`CORS does not allow PUT requests from ${origin}`)
  }
}

async function checkBucket(target: BucketTarget) {
  const key = `healthchecks/storage-${randomUUID()}.txt`
  const body = `Gatherory storage check ${new Date().toISOString()}`

  await client.send(new HeadBucketCommand({ Bucket: target.name }))
  if (target.label === "private") {
    await checkCors({ bucket: target.name, key })
  }

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: target.name,
        Key: key,
        Body: body,
        ContentType: "text/plain",
      }),
    )
    const result = await client.send(
      new GetObjectCommand({ Bucket: target.name, Key: key }),
    )
    const storedBody = await result.Body?.transformToString()
    if (storedBody !== body) throw new Error("Stored object did not round-trip")
  } finally {
    await client.send(
      new DeleteObjectCommand({ Bucket: target.name, Key: key }),
    ).catch(() => undefined)
  }
}

let failed = false
for (const target of targets) {
  try {
    await checkBucket(target)
    const checks = target.label === "private"
      ? "access, CORS, upload, read, and cleanup"
      : "access, upload, read, and cleanup"
    console.log(`${target.label}: ${checks} passed`)
  } catch (error) {
    failed = true
    console.error(`${target.label}: ${summarize(error)}`)
  }
}

if (failed) process.exitCode = 1
