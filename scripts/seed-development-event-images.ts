import {
  preflightDevelopmentEventImages,
  runDevelopmentEventImageUpdate,
} from '../src/db/seeds/development-event-images-update'
import {
  preflightDevelopmentSharedAlbum,
  runDevelopmentSharedAlbumUpdate,
} from '../src/db/seeds/development-shared-album-update'

async function main() {
  const args = process.argv.slice(2)
  if (args.some((arg) => arg !== '--apply') || args.filter((arg) => arg === '--apply').length > 1)
    throw new Error('Only an optional --apply argument is supported.')
  const databaseUrl = process.env.DATABASE_URL ?? ''
  const options = {
    databaseUrl,
    nodeEnv: process.env.NODE_ENV,
    privateBucket: process.env.CLOUDFLARE_R2_PRIVATE_BUCKET_NAME,
    apply: args.includes('--apply'),
  } as const
  await preflightDevelopmentEventImages(options)
  await preflightDevelopmentSharedAlbum(options)
  const covers = await runDevelopmentEventImageUpdate(options)
  const album = await runDevelopmentSharedAlbumUpdate(options)
  console.log(JSON.stringify({ covers, album }))
}

main().catch(() => {
  // Keep database URLs, file paths, R2 credentials and signed object details private.
  console.error(
    'Development event image update failed. Check the local fixture and private development storage.'
  )
  process.exitCode = 1
})
