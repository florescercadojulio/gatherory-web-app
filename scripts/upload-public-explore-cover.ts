import { createHash } from 'node:crypto'
import { readFile, realpath, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import sharp from 'sharp'

const PROCESSING_VERSION = 'explore-cover-jpeg-v1'
const MAX_INPUT_BYTES = 20 * 1024 * 1024
const MAX_PIXELS = 40_000_000
const VARIANTS = [
  { name: 'thumbnail', width: 320 },
  { name: 'card', width: 960 },
  { name: 'hero', width: 1600 },
] as const

type PreparedVariant = {
  name: (typeof VARIANTS)[number]['name']
  width: number
  height: number
  checksum: string
  key: string
  body: Buffer
}

function usage(): string {
  return `Usage: pnpm blueprints:cover -- --file <image> --slug <slug> [options]

Prepare a curated Explore cover as metadata-stripped JPEG variants and write a manifest.
By default this is a dry run and does not contact R2.

Required:
  --file <path>       JPEG, PNG, WebP, AVIF, HEIF, or TIFF photo (max 20 MiB and 40 megapixels)
  --slug <slug>       Lowercase URL-safe identifier (letters, numbers, hyphens)

Options:
  --label <text>      Human-readable source label (defaults to source filename)
  --output <path>     Manifest path (defaults to ./explore-cover-<slug>.json)
  --upload            Upload immutable variants to the public R2 bucket and verify public delivery
  --connector-plan <path>  Write encoded variant bytes for the authenticated Cloudflare connector
  --help              Show this help (does not require environment configuration)

Environment for --upload: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID,
CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_PUBLIC_BUCKET_NAME, VITE_PUBLIC_ASSET_URL.
Environment for --connector-plan: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_PUBLIC_BUCKET_NAME,
VITE_PUBLIC_ASSET_URL. The plan contains base64 image bytes and should be stored in a temporary location.`
}

function parseArgs(args: string[]) {
  if (args[0] === '--') args = args.slice(1)
  const options: Record<string, string | boolean> = {}
  const valueFlags = new Set(['--file', '--slug', '--label', '--output', '--connector-plan'])
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index]
    if (flag === '--help') {
      if (args.length !== 1) throw new Error('--help cannot be combined with other options.')
      return { help: true as const }
    }
    if (flag === '--upload') {
      if ('upload' in options) throw new Error('Unexpected duplicate --upload flag.')
      options.upload = true
      continue
    }
    if (!valueFlags.has(flag)) throw new Error(`Unexpected option: ${flag}`)
    const optionName = flag.slice(2)
    if (optionName in options) throw new Error(`Unexpected duplicate ${flag} flag.`)
    const value = args[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value.`)
    options[optionName] = value
    index += 1
  }
  const file = options.file
  const slug = options.slug
  if (typeof file !== 'string' || typeof slug !== 'string') {
    throw new Error('Both --file and --slug are required.')
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(
      '--slug must contain lowercase letters and numbers separated by single hyphens.'
    )
  }
  return {
    help: false as const,
    file,
    slug,
    label: typeof options.label === 'string' ? options.label : path.basename(file),
    output: typeof options.output === 'string' ? options.output : `./explore-cover-${slug}.json`,
    upload: options.upload === true,
    connectorPlan:
      typeof options['connector-plan'] === 'string' ? options['connector-plan'] : undefined,
  }
}

function sha256(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function getConfig(upload: boolean, connectorPlan: boolean) {
  const bucket = process.env.CLOUDFLARE_R2_PUBLIC_BUCKET_NAME
  const privateBucket = process.env.CLOUDFLARE_R2_PRIVATE_BUCKET_NAME
  if (!bucket) throw new Error('CLOUDFLARE_R2_PUBLIC_BUCKET_NAME is required.')
  if (bucket !== 'gatherory-public') {
    throw new Error(
      'CLOUDFLARE_R2_PUBLIC_BUCKET_NAME must be gatherory-public for curated Explore covers.'
    )
  }
  if (privateBucket && bucket === privateBucket) {
    throw new Error(
      'The configured public bucket matches the private bucket; refusing to continue.'
    )
  }
  const base = process.env.VITE_PUBLIC_ASSET_URL
  if (!base) throw new Error('VITE_PUBLIC_ASSET_URL is required.')
  let parsed: URL
  try {
    parsed = new URL(base)
  } catch {
    throw new Error('VITE_PUBLIC_ASSET_URL must be a valid HTTPS URL.')
  }
  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname !== 'cdn.gatherory.com' ||
    parsed.port ||
    parsed.pathname !== '/' ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      'VITE_PUBLIC_ASSET_URL must be exactly https://cdn.gatherory.com with no path, port, credentials, query, or fragment.'
    )
  }
  const cleanBase = parsed.toString().replace(/\/$/, '')
  if (!upload && !connectorPlan) return { bucket, publicBase: cleanBase }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  if (!accountId)
    throw new Error('CLOUDFLARE_ACCOUNT_ID is required for upload or connector-plan mode.')
  if (connectorPlan && !upload) return { bucket, publicBase: cleanBase, accountId }
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 credentials are required for --upload.')
  }
  return {
    bucket,
    publicBase: cleanBase,
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      credentials: { accessKeyId, secretAccessKey },
    }),
  }
}

async function prepare(
  file: string,
  slug: string
): Promise<{
  sourceWidth: number
  sourceHeight: number
  sourceChecksum: string
  variants: PreparedVariant[]
}> {
  const sourcePath = path.resolve(file)
  const fileInfo = await stat(sourcePath)
  if (!fileInfo.isFile()) throw new Error('--file must point to a regular image file.')
  if (fileInfo.size > MAX_INPUT_BYTES) throw new Error('Source image exceeds the 20 MiB limit.')
  const input = await readFile(file)
  const image = sharp(input, { limitInputPixels: MAX_PIXELS, failOn: 'error' })
  const metadata = await image.metadata()
  if (!['jpeg', 'png', 'webp', 'avif', 'heif', 'tiff'].includes(metadata.format ?? '')) {
    throw new Error('Source must be a decoded JPEG, PNG, WebP, AVIF, HEIF, or TIFF photo.')
  }
  if ((metadata.pages ?? 1) > 1) throw new Error('Animated and multipage images are not supported.')
  if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_PIXELS) {
    throw new Error('Source image must decode to no more than 40 megapixels.')
  }
  const normalized = await image.clone().rotate().jpeg({ quality: 90, mozjpeg: true }).toBuffer()
  const sourceChecksum = sha256(normalized)
  const contentHash = sha256(`${PROCESSING_VERSION}\0${sourceChecksum}`)
  const oriented = sharp(normalized, { limitInputPixels: MAX_PIXELS, failOn: 'error' })
  const orientedMeta = await oriented.metadata()
  const variants: PreparedVariant[] = []
  for (const variant of VARIANTS) {
    const { data, info } = await oriented
      .clone()
      .resize({
        width: variant.width,
        height: variant.width,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toBuffer({ resolveWithObject: true })
    variants.push({
      name: variant.name,
      width: info.width,
      height: info.height,
      checksum: sha256(data),
      key: `explore/covers/${slug}/${contentHash}/${variant.name}.jpg`,
      body: data,
    })
  }
  return {
    sourceWidth: orientedMeta.width ?? metadata.width,
    sourceHeight: orientedMeta.height ?? metadata.height,
    sourceChecksum,
    variants,
  }
}

async function uploadOne(client: S3Client, bucket: string, variant: PreparedVariant) {
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: variant.key,
        Body: variant.body,
        ContentType: 'image/jpeg',
        CacheControl: 'public, max-age=31536000, immutable',
        Metadata: { sha256: variant.checksum },
        IfNoneMatch: '*',
      })
    )
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number }; name?: string }).$metadata
      ?.httpStatusCode
    const name = (error as { name?: string }).name
    if (status !== 412 && name !== 'PreconditionFailed') throw error
    const existing = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: variant.key }))
    if (
      existing.Metadata?.sha256 !== variant.checksum ||
      existing.ContentType?.toLowerCase() !== 'image/jpeg' ||
      existing.ContentLength !== variant.body.byteLength
    ) {
      throw new Error(
        `Existing object at ${variant.key} has different bytes; refusing to overwrite it.`
      )
    }
  }
}

async function verifyPublicVariant(publicBase: string, variant: PreparedVariant) {
  const response = await fetch(`${publicBase}/${variant.key}`, {
    signal: AbortSignal.timeout(30_000),
    redirect: 'error',
  })
  if (!response.ok)
    throw new Error(`Public delivery for ${variant.name} returned HTTP ${response.status}.`)
  if (response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'image/jpeg') {
    throw new Error(`Public delivery for ${variant.name} did not return image/jpeg content.`)
  }
  const declaredLength = response.headers.get('content-length')
  if (declaredLength && Number(declaredLength) !== variant.body.byteLength) {
    throw new Error(
      `Public delivery content length for ${variant.name} does not match the uploaded variant.`
    )
  }
  const chunks: Buffer[] = []
  let received = 0
  if (!response.body)
    throw new Error(`Public delivery returned an empty ${variant.name} response body.`)
  for await (const chunk of response.body) {
    const bytes = Buffer.from(chunk)
    received += bytes.byteLength
    if (received > variant.body.byteLength) {
      throw new Error(`Public delivery for ${variant.name} exceeded the expected variant size.`)
    }
    chunks.push(bytes)
  }
  const delivered = Buffer.concat(chunks)
  if (received !== variant.body.byteLength) {
    throw new Error(`Public delivery returned a truncated ${variant.name} variant.`)
  }
  if (sha256(delivered) !== variant.checksum) {
    throw new Error(
      `Public delivery returned bytes that do not match the ${variant.name} checksum.`
    )
  }
}

async function main() {
  let options: ReturnType<typeof parseArgs>
  try {
    options = parseArgs(process.argv.slice(2))
    if (options.help) {
      process.stdout.write(`${usage()}\n`)
      return
    }
  } catch (error) {
    process.stderr.write(`${(error as Error).message}\n\n${usage()}\n`)
    process.exitCode = 2
    return
  }

  if (options.help) return
  if (options.connectorPlan && options.upload) {
    throw new Error('--connector-plan cannot be combined with --upload.')
  }
  const sourcePath = await realpath(options.file)
  const outputPath = path.resolve(options.output)
  const connectorPlanPath = options.connectorPlan ? path.resolve(options.connectorPlan) : undefined
  const comparablePath = async (target: string) => {
    const exists = await stat(target).then(
      () => true,
      () => false
    )
    return exists ? realpath(target) : target
  }
  const comparableOutputPath = await comparablePath(outputPath)
  if (sourcePath === comparableOutputPath)
    throw new Error('--output must not overwrite the source image.')
  if (connectorPlanPath) {
    const comparablePlanPath = await comparablePath(connectorPlanPath)
    if (sourcePath === comparablePlanPath)
      throw new Error('--connector-plan must not overwrite the source image.')
    if (comparableOutputPath === comparablePlanPath)
      throw new Error('--connector-plan and --output must use different paths.')
  }
  const config = getConfig(options.upload, Boolean(options.connectorPlan))
  const prepared = await prepare(options.file, options.slug)
  const manifest = {
    schemaVersion: 1,
    label: options.label,
    source: {
      width: prepared.sourceWidth,
      height: prepared.sourceHeight,
      checksum: prepared.sourceChecksum,
    },
    bucket: config.bucket,
    processingVersion: PROCESSING_VERSION,
    variants: prepared.variants.map(({ name, width, height, checksum, key }) => ({
      name,
      width,
      height,
      checksum,
      bucket: config.bucket,
      key,
      url: `${config.publicBase}/${key}`,
    })),
  }

  const manifestPath = path.resolve(options.output)
  await writeFile(options.output, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  if (options.connectorPlan && 'accountId' in config) {
    const connectorPlan = {
      schemaVersion: 1,
      accountId: config.accountId,
      bucket: 'gatherory-public',
      variants: prepared.variants.map(({ name, checksum, key, body }) => ({
        name,
        key,
        url: `${config.publicBase}/${key}`,
        checksum,
        bodyBase64: body.toString('base64'),
      })),
    }
    await writeFile(options.connectorPlan, `${JSON.stringify(connectorPlan, null, 2)}\n`, 'utf8')
    process.stdout.write(
      `Prepared connector plan for ${prepared.variants.length} variants. Manifest: ${manifestPath}; plan: ${path.resolve(options.connectorPlan)}\n`
    )
    return
  }

  if (options.upload) {
    const client = config.client
    if (!client) throw new Error('R2 client was not configured for upload.')
    const uploaded: string[] = []
    try {
      for (const variant of prepared.variants) {
        await uploadOne(client, config.bucket, variant)
        uploaded.push(variant.key)
      }
      for (const variant of prepared.variants) {
        await verifyPublicVariant(config.publicBase, variant)
      }
    } catch (error) {
      process.stderr.write(`Upload or public verification failed: ${(error as Error).message}\n`)
      process.stderr.write(`Uploaded or confirmed object keys: ${uploaded.join(', ') || 'none'}\n`)
      process.stderr.write(`Prepared manifest saved at: ${manifestPath}\n`)
      process.exitCode = 1
      return
    }
  }

  process.stdout.write(
    `${options.upload ? 'Uploaded and verified' : 'Prepared (dry run)'} ${prepared.variants.length} variants. Manifest: ${manifestPath}\n`
  )
  if (!options.upload)
    process.stdout.write(
      'No network upload was performed. Pass --upload to write to the public bucket.\n'
    )
}

main().catch((error: unknown) => {
  process.stderr.write(`Explore cover preparation failed: ${(error as Error).message}\n`)
  process.exitCode = 1
})
