import {
  BlueprintMeasurementReadinessWindowError,
  validateBlueprintMeasurementReadinessWindow,
} from '../src/server/blueprints/services/blueprint-measurement-readiness'
import {
  blueprintMeasurementReadinessFixtureInput,
  buildBlueprintMeasurementReadinessFixtureReport,
} from '../tests/fixtures/blueprint-measurement-readiness'

class CliError extends Error {
  constructor(readonly code: string) {
    super(code)
  }
}

function parseArguments(args: string[]) {
  const values = new Map<string, string>()
  let databaseMode = false
  for (const arg of args) {
    if (arg === '--database') {
      if (databaseMode) throw new CliError('INVALID_ARGUMENTS')
      databaseMode = true
      continue
    }
    const match = /^(--cohort-start|--cohort-end|--as-of)=(.+)$/.exec(arg)
    if (!match || values.has(match[1]!)) throw new CliError('INVALID_ARGUMENTS')
    values.set(match[1]!, match[2]!)
  }
  return { databaseMode, values }
}

async function main() {
  try {
    const { databaseMode, values } = parseArguments(process.argv.slice(2))
    if (!databaseMode) {
      if (values.size === 0) {
        process.stdout.write(
          `${JSON.stringify(buildBlueprintMeasurementReadinessFixtureReport())}\n`
        )
        return
      }
      const fixture = blueprintMeasurementReadinessFixtureInput()
      if (
        values.get('--cohort-start') !== fixture.cohortStart ||
        values.get('--cohort-end') !== fixture.cohortEnd ||
        values.get('--as-of') !== fixture.asOf ||
        values.size !== 3
      )
        throw new CliError('FIXTURE_WINDOW_UNSUPPORTED')
      process.stdout.write(`${JSON.stringify(buildBlueprintMeasurementReadinessFixtureReport())}\n`)
      return
    }

    if (
      values.size !== 3 ||
      !values.has('--cohort-start') ||
      !values.has('--cohort-end') ||
      !values.has('--as-of')
    )
      throw new CliError('WINDOW_REQUIRED')
    const window = {
      cohortStart: values.get('--cohort-start')!,
      cohortEnd: values.get('--cohort-end')!,
      asOf: values.get('--as-of')!,
    }
    validateBlueprintMeasurementReadinessWindow({ ...window, readAt: new Date().toISOString() })

    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl?.trim()) throw new CliError('DATABASE_URL_REQUIRED')
    let parsed: URL
    try {
      parsed = new URL(databaseUrl)
    } catch {
      throw new CliError('DATABASE_URL_INVALID')
    }
    const hostname = parsed.hostname.replace(/^\[|\]$/g, '')
    if (
      !['postgres:', 'postgresql:'].includes(parsed.protocol) ||
      !['localhost', '127.0.0.1', '::1'].includes(hostname)
    )
      throw new CliError('DATABASE_LOOPBACK_REQUIRED')

    try {
      const { runBlueprintMeasurementReadinessDatabase } =
        await import('../src/server/blueprints/handlers/blueprint-measurement-readiness.adapter')
      const report = await runBlueprintMeasurementReadinessDatabase(window)
      process.stdout.write(`${JSON.stringify(report)}\n`)
    } catch {
      throw new CliError('DATABASE_READ_FAILED')
    }
  } catch (cause) {
    const code =
      cause instanceof CliError
        ? cause.code
        : cause instanceof BlueprintMeasurementReadinessWindowError
          ? cause.code
          : 'REPORT_FAILED'
    process.stderr.write(
      `${JSON.stringify({ error: code, message: 'Measurement readiness report failed; details withheld.' })}\n`
    )
    process.exitCode = 1
  }
}

await main()
