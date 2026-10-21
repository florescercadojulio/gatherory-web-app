import { runDevelopmentEventImageUpdate } from '../src/db/seeds/development-event-images-update'

async function main() {
  const args = process.argv.slice(2)
  if (args.some((arg) => arg !== '--apply') || args.filter((arg) => arg === '--apply').length > 1)
    throw new Error('Only an optional --apply argument is supported.')
  const databaseUrl = process.env.DATABASE_URL ?? ''
  const counts = await runDevelopmentEventImageUpdate({
    databaseUrl,
    nodeEnv: process.env.NODE_ENV,
    privateBucket: process.env.CLOUDFLARE_R2_PRIVATE_BUCKET_NAME,
    apply: args.includes('--apply'),
  })
  console.log(JSON.stringify(counts))
}

main().catch(() => {
  // Keep database URLs, file paths, R2 credentials and signed object details private.
  console.error(
    'Development event image update failed. Check the local fixture and private development storage.'
  )
  process.exitCode = 1
})
