import { Effect, Layer } from 'effect'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is required for measurement cleanup')
const host = new URL(url).hostname
if (!['localhost', '127.0.0.1', '[::1]'].includes(host)) {
  throw new Error(`Refusing measurement cleanup against non-local database host ${host}`)
}
if (!process.argv.includes('--apply')) {
  console.log('No changes made. Re-run with --apply to remove expired discovery telemetry.')
  process.exit(0)
}

const limitArgument = process.argv.find((argument) => argument.startsWith('--limit='))
const limit = limitArgument ? Number(limitArgument.slice('--limit='.length)) : 500
if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
  throw new Error('--limit must be an integer from 1 to 1000')
}

const [{ PgClientLive }, { BlueprintDiscoveryActionsRepo }, { BlueprintDiscoveryActionsRepoLive }] =
  await Promise.all([
    import('../src/db'),
    import('../src/server/blueprints/repos/blueprint-discovery-actions.repo'),
    import('../src/server/blueprints/repos/blueprint-discovery-actions.repo.live'),
  ])

const cleanup = Effect.gen(function* () {
  const repo = yield* BlueprintDiscoveryActionsRepo
  return yield* repo.cleanupExpiredMeasurement(limit)
}).pipe(Effect.provide(BlueprintDiscoveryActionsRepoLive.pipe(Layer.provide(PgClientLive))))

const result = await Effect.runPromise(cleanup)
console.log(`Removed ${result.deleted} expired Blueprint measurement records.`)
