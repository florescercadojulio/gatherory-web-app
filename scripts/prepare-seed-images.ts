import { createHash } from 'node:crypto'
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdtemp, readFile, rm, mkdir } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { parse as parseDotenv } from 'dotenv'
import assetsRaw from '../src/server/blueprints/catalog/seed-image-assets.json'
import { SeedImageAssetsSchema } from '../src/server/blueprints/catalog/seed-image-registry'
import { ExploreCoverManifestSchema } from '../src/server/blueprints/catalog/explore-cover-manifest'

const execFile = promisify(execFileCallback)
const repoRoot = process.cwd()
const assets = SeedImageAssetsSchema.parse(assetsRaw)
const MAX_PUBLIC_VARIANT_BYTES = 20 * 1024 * 1024

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function parseArgs(args: string[]) {
  if (args[0] === '--') args = args.slice(1)
  let connectorDirectory: string | undefined
  let verifyPublic = false
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--verify-public') {
      if (verifyPublic) throw new Error('Duplicate --verify-public flag.')
      verifyPublic = true
    } else if (arg === '--connector-plan') {
      if (connectorDirectory) throw new Error('Duplicate --connector-plan flag.')
      const value = args[index + 1]
      if (!value || value.startsWith('--'))
        throw new Error('--connector-plan requires a directory.')
      connectorDirectory = path.resolve(value)
      index += 1
    } else if (arg === '--help') {
      return { help: true as const }
    } else {
      throw new Error(`Unexpected argument: ${arg}`)
    }
  }
  return { help: false as const, connectorDirectory, verifyPublic }
}

function usage() {
  return `Usage: pnpm blueprints:images [-- --connector-plan <directory>] [--verify-public]

Checks every checked-in seed image against its source SHA-256 and the existing
cover uploader's normalized manifest. By default this reads local files only.

Options:
  --connector-plan <directory>  Write one authenticated Cloudflare upload plan per unique image
  --verify-public                Fetch all ${Object.keys(assets).length * 3} public variants and verify JPEG type, dimensions, and SHA-256
  --help                         Show this help

Connector-plan mode reads only CLOUDFLARE_ACCOUNT_ID from .env.local when not already set.
Public verification is read-only and contacts only cdn.gatherory.com.`
}

async function checkSourceFiles() {
  const issues: string[] = []
  for (const [assetKey, asset] of Object.entries(assets)) {
    const sourcePath = path.resolve(repoRoot, asset.file)
    if (!sourcePath.startsWith(`${repoRoot}${path.sep}`)) {
      issues.push(`${assetKey}: source path escapes the repository`)
      continue
    }
    try {
      const bytes = await readFile(sourcePath)
      if (sha256(bytes) !== asset.fileChecksum)
        issues.push(`${assetKey}: raw source SHA-256 mismatch`)
    } catch {
      issues.push(`${assetKey}: source file is missing or unreadable (${asset.file})`)
    }
  }
  if (issues.length) throw new Error(issues.join('\n'))
}

async function runUploader(
  assetKey: string,
  asset: (typeof assets)[string],
  tempDirectory: string,
  planPath?: string
) {
  const manifestPath = path.join(tempDirectory, `${assetKey}.manifest.json`)
  const slug = asset.manifest.variants[0]!.key.split('/')[2]!
  const args = [
    'exec',
    'tsx',
    path.join(repoRoot, 'scripts/upload-public-explore-cover.ts'),
    '--file',
    path.resolve(repoRoot, asset.file),
    '--slug',
    slug,
    '--label',
    asset.manifest.label,
    '--output',
    manifestPath,
  ]
  if (planPath) args.push('--connector-plan', planPath)
  let accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  if (planPath && !accountId) {
    const dotenvContents = await readFile(path.join(repoRoot, '.env.local'), 'utf8').catch(() => '')
    accountId = parseDotenv(dotenvContents).CLOUDFLARE_ACCOUNT_ID
  }
  const env = {
    PATH: process.env.PATH ?? '',
    CLOUDFLARE_R2_PUBLIC_BUCKET_NAME: 'gatherory-public',
    VITE_PUBLIC_ASSET_URL: 'https://cdn.gatherory.com',
    ...(accountId ? { CLOUDFLARE_ACCOUNT_ID: accountId } : {}),
  }
  try {
    await execFile('pnpm', args, { cwd: repoRoot, env, maxBuffer: 1024 * 1024 })
  } catch (error) {
    const detail = (error as { stderr?: string }).stderr?.trim()
    throw new Error(`${assetKey}: existing cover preparation failed${detail ? `: ${detail}` : ''}`)
  }
  const regenerated = ExploreCoverManifestSchema.parse(
    JSON.parse(await readFile(manifestPath, 'utf8'))
  )
  if (JSON.stringify(regenerated) !== JSON.stringify(asset.manifest)) {
    throw new Error(
      `${assetKey}: normalized manifest or variant hashes differ from the checked-in manifest`
    )
  }
  if (planPath) {
    const plan = JSON.parse(await readFile(planPath, 'utf8')) as {
      bucket?: string
      variants?: Array<{
        name: string
        key: string
        url: string
        checksum: string
        bodyBase64: string
      }>
    }
    const expected = asset.manifest.variants.map(({ name, key, url, checksum }) => ({
      name,
      key,
      url,
      checksum,
    }))
    const actual = plan.variants?.map(({ name, key, url, checksum }) => ({
      name,
      key,
      url,
      checksum,
    }))
    if (plan.bucket !== 'gatherory-public' || JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`${assetKey}: connector plan does not exactly match the checked-in manifest`)
    }
    for (const variant of plan.variants ?? []) {
      if (
        !variant.bodyBase64 ||
        sha256(Buffer.from(variant.bodyBase64, 'base64')) !== variant.checksum
      ) {
        throw new Error(
          `${assetKey}: connector plan contains variant bytes with a mismatched checksum`
        )
      }
    }
  }
}

async function verifyPublic() {
  const variants = Object.entries(assets).flatMap(([assetKey, asset]) =>
    asset.manifest.variants.map((variant) => ({ assetKey, variant }))
  )
  let next = 0
  const errors: string[] = []
  const worker = async () => {
    while (true) {
      const index = next++
      if (index >= variants.length) return
      const { assetKey, variant } = variants[index]!
      try {
        const response = await fetch(variant.url, {
          redirect: 'error',
          signal: AbortSignal.timeout(30_000),
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        if (
          response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'image/jpeg'
        ) {
          throw new Error('content type is not image/jpeg')
        }
        if (!response.body) throw new Error('response has no body')
        const chunks: Buffer[] = []
        let length = 0
        for await (const chunk of response.body) {
          const bytes = Buffer.from(chunk)
          length += bytes.byteLength
          if (length > MAX_PUBLIC_VARIANT_BYTES) throw new Error('response exceeds 20 MiB')
          chunks.push(bytes)
        }
        const body = Buffer.concat(chunks)
        if (sha256(body) !== variant.checksum) throw new Error('SHA-256 does not match manifest')
        const metadata = await sharp(body, { failOn: 'error' }).metadata()
        if (
          metadata.format !== 'jpeg' ||
          metadata.width !== variant.width ||
          metadata.height !== variant.height
        ) {
          throw new Error('JPEG dimensions or format do not match manifest')
        }
      } catch (error) {
        errors.push(`${assetKey}/${variant.name}: ${(error as Error).message}`)
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
  if (errors.length) throw new Error(errors.join('\n'))
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    process.stdout.write(`${usage()}\n`)
    return
  }
  await checkSourceFiles()
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'gatherory-seed-images-'))
  try {
    if (options.connectorDirectory) {
      if (
        options.connectorDirectory === repoRoot ||
        options.connectorDirectory.startsWith(`${repoRoot}${path.sep}`)
      ) {
        throw new Error(
          '--connector-plan must point outside the repository; plans contain encoded image bytes.'
        )
      }
      await mkdir(options.connectorDirectory, { recursive: true })
    }
    for (const [assetKey, asset] of Object.entries(assets)) {
      const planPath = options.connectorDirectory
        ? path.join(options.connectorDirectory, `${assetKey}.json`)
        : undefined
      await runUploader(assetKey, asset, tempDirectory, planPath)
    }
  } finally {
    await rm(tempDirectory, { recursive: true, force: true })
  }
  if (options.verifyPublic) await verifyPublic()
  process.stdout.write(
    `Validated ${Object.keys(assets).length} source images and ${Object.keys(assets).length * 3} variants locally.`
  )
  if (options.connectorDirectory)
    process.stdout.write(` Connector plans: ${options.connectorDirectory}.`)
  if (options.verifyPublic) process.stdout.write(' Public delivery verified.')
  process.stdout.write('\n')
}

main().catch((error: unknown) => {
  process.stderr.write(`Seed image preparation failed: ${(error as Error).message}\n`)
  process.exitCode = 1
})
