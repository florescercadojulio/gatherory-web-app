import { createHash, randomUUID } from 'node:crypto'
import { readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import sharp from 'sharp'
import { BlueprintPublicCoverURLSchema } from '../src/contracts/blueprint-discovery.contracts'
import { blueprintStarters } from '../src/server/blueprints/catalog/starters'
import { ExploreCoverManifestSchema } from '../src/server/blueprints/catalog/explore-cover-manifest'
import seedImageAssignments from '../src/server/blueprints/catalog/seed-image-assignments.json'

const registryPath = fileURLToPath(
  new URL('../src/server/blueprints/catalog/explore-cover-images.json', import.meta.url)
)
const manifestRegistryPath = fileURLToPath(
  new URL('../src/server/blueprints/catalog/explore-cover-manifests.json', import.meta.url)
)
const help = `Usage: pnpm blueprints:cover:attach -- --catalog-key <key> --manifest <file>

Verify published cover variants and attach their URL and import manifest to the local curated Explore registries.
This edits source only; it does not seed a database, deploy, or change an installed event.
Use --list to show the built-in catalog keys, or --help for this message.`

function args(): '--help' | '--list' | { catalogKey: string; manifest: string } {
  const input = process.argv.slice(2).filter((value, index) => index !== 0 || value !== '--')
  if (input.length === 1 && input[0] === '--help') return '--help'
  if (input.length === 1 && input[0] === '--list') return '--list'
  const values = new Map<string, string>()
  for (let index = 0; index < input.length; index += 2) {
    const flag = input[index]
    const value = input[index + 1]
    if (
      !['--catalog-key', '--manifest'].includes(flag) ||
      values.has(flag) ||
      !value ||
      value.startsWith('--')
    ) {
      throw new Error('Expected one --catalog-key and one --manifest argument.')
    }
    values.set(flag, value)
  }
  const catalogKey = values.get('--catalog-key')
  const manifest = values.get('--manifest')
  if (!catalogKey || !manifest) throw new Error('Both --catalog-key and --manifest are required.')
  if (!blueprintStarters.some((entry) => entry.catalogKey === catalogKey)) {
    throw new Error('Unknown curated catalog key. Use --list to choose an existing blueprint.')
  }
  if ([registryPath, manifestRegistryPath].includes(path.resolve(manifest)))
    throw new Error('Manifest and registry must be different files.')
  return { catalogKey, manifest }
}

async function main() {
  const options = args()
  if (options === '--help') return console.log(help)
  if (options === '--list')
    return console.log(blueprintStarters.map((entry) => entry.catalogKey).join('\n'))
  if (Object.hasOwn(seedImageAssignments, options.catalogKey)) {
    throw new Error(
      'This blueprint uses seed-image-assets.json and seed-image-assignments.json. Update its licensed asset and root assignment there, then run pnpm blueprints:images -- --verify-public. See docs/architecture/blueprint-seed-images.md. The legacy registry would not change this seeded cover.'
    )
  }
  const manifest = ExploreCoverManifestSchema.parse(
    JSON.parse(await readFile(options.manifest, 'utf8'))
  )
  const card = manifest.variants.find((variant) => variant.name === 'card')
  if (!card || new Set(manifest.variants.map((variant) => variant.name)).size !== 3) {
    throw new Error('Manifest must have exactly one thumbnail, card, and hero variant.')
  }
  const url = BlueprintPublicCoverURLSchema.parse(card.url)
  if (card.key !== new URL(url).pathname.slice(1))
    throw new Error('Card key does not match its public URL.')
  if (card.width > 960 || card.height > 960)
    throw new Error('Card dimensions exceed the uploader limit.')
  // Verify every asset used by event creation before publishing its registry entry.
  for (const variant of manifest.variants) {
    const response = await fetch(variant.url, {
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    })
    if (!response.ok || response.headers.get('content-type')?.split(';')[0] !== 'image/jpeg') {
      throw new Error(
        `Public ${variant.name} is not available as JPEG (HTTP ${response.status}). Upload it first.`
      )
    }
    if (!response.body) throw new Error(`Public ${variant.name} response has no body.`)
    const hash = createHash('sha256')
    const reader = response.body.getReader()
    let size = 0
    const chunks: Buffer[] = []
    try {
      while (true) {
        const chunk = await reader.read()
        if (chunk.done) break
        size += chunk.value.byteLength
        if (size > 20 * 1024 * 1024)
          throw new Error(`Public ${variant.name} response exceeds the image size limit.`)
        hash.update(chunk.value)
        chunks.push(Buffer.from(chunk.value))
      }
    } finally {
      await reader.cancel().catch(() => undefined)
    }
    if (!size || hash.digest('hex') !== variant.checksum)
      throw new Error(`Public ${variant.name} bytes do not match the manifest.`)
    const metadata = await sharp(Buffer.concat(chunks, size), {
      failOn: 'error',
      limitInputPixels: 40_000_000,
      animated: false,
    }).metadata()
    if (
      metadata.format !== 'jpeg' ||
      metadata.width !== variant.width ||
      metadata.height !== variant.height
    ) {
      throw new Error(`Public ${variant.name} dimensions do not match the manifest.`)
    }
  }
  const registry = z
    .record(z.string(), BlueprintPublicCoverURLSchema)
    .parse(JSON.parse(await readFile(registryPath, 'utf8')))
  registry[options.catalogKey] = url
  const ordered = Object.fromEntries(
    Object.entries(registry).sort(([a], [b]) => a.localeCompare(b))
  )
  const manifests = z
    .record(z.string(), ExploreCoverManifestSchema)
    .parse(JSON.parse(await readFile(manifestRegistryPath, 'utf8')))
  manifests[options.catalogKey] = manifest
  const orderedManifests = Object.fromEntries(
    Object.entries(manifests).sort(([a], [b]) => a.localeCompare(b))
  )
  // Write each file atomically, with import metadata first. A mismatch between
  // the two registries fails closed in the importer; no incomplete cover is used.
  for (const [destination, value] of [
    [manifestRegistryPath, orderedManifests],
    [registryPath, ordered],
  ] as const) {
    const temporary = `${destination}.${randomUUID()}.tmp`
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' })
    await rename(temporary, destination)
  }
  console.log(`Attached public cover to ${options.catalogKey}: ${url}`)
  console.log(
    'Local cover registries updated. Deploy the server and install the updated iOS app for Explore and new-event cover carryover.'
  )
}

main().catch((error: unknown) => {
  console.error(
    error instanceof z.ZodError
      ? 'Invalid manifest, registry, or public cover URL.'
      : (error as Error).message
  )
  console.error(help)
  process.exitCode = 1
})
