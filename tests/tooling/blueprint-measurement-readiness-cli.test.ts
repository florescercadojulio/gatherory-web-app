import { spawnSync } from 'node:child_process'
import { expect, test } from 'vitest'

const cli = new URL('../../scripts/report-blueprint-measurement-readiness.ts', import.meta.url)

function run(args: string[], env: Record<string, string | undefined> = {}) {
  return spawnSync(
    process.execPath,
    ['--import', import.meta.resolve('tsx'), cli.pathname, ...args],
    {
      cwd: new URL('../..', import.meta.url),
      encoding: 'utf8',
      timeout: 15_000,
      env: {
        ...process.env,
        DATABASE_URL: undefined,
        BETTER_AUTH_SECRET: 'fixture-secret-must-not-be-read-or-printed',
        ...env,
        TSX_TSCONFIG_PATH: new URL('../../tsconfig.json', import.meta.url).pathname,
      },
    }
  )
}

const fixtureWindow = [
  '--cohort-start=2026-01-01T00:00:00.000Z',
  '--cohort-end=2026-01-02T00:00:00.000Z',
  '--as-of=2026-01-10T00:00:00.000Z',
]

function matureDatabaseWindow() {
  const readAt = Date.now()
  const asOf = readAt - 60_000
  const end = asOf - 8 * 24 * 60 * 60 * 1000
  const start = end - 60_000
  return [
    `--cohort-start=${new Date(start).toISOString()}`,
    `--cohort-end=${new Date(end).toISOString()}`,
    `--as-of=${new Date(asOf).toISOString()}`,
  ]
}

test('default fixture mode succeeds without database or application secrets', () => {
  const result = run([])
  expect(result.status, result.stderr).toBe(0)
  expect(() => JSON.parse(result.stdout)).not.toThrow()
  expect(result.stdout).not.toContain('fixture-secret-must-not-be-read-or-printed')
  expect(result.stdout).not.toContain('actorId')
})

test('fixture mode accepts only its declared cohort and returns nonempty aggregate JSON', () => {
  const result = run(fixtureWindow)
  expect(result.status, result.stderr).toBe(0)
  const report = JSON.parse(result.stdout) as {
    reportVersion: string
    readinessForRankingWeights: boolean
    counts: { servedExposures: number }
  }
  expect(report.reportVersion).toBe('blueprint-measurement-readiness-v2')
  expect(report.readinessForRankingWeights).toBe(false)
  expect(report.counts.servedExposures).toBeGreaterThan(0)
})

test('database mode rejects remote URLs before importing the database graph', () => {
  const result = run(['--database', ...matureDatabaseWindow()], {
    DATABASE_URL: 'postgresql://user:secret@db.example.test:5432/gatherory',
  })
  expect(result.status).not.toBe(0)
  expect(`${result.stdout}${result.stderr}`).toContain('DATABASE_LOOPBACK_REQUIRED')
  expect(`${result.stdout}${result.stderr}`).not.toContain('secret')
  expect(`${result.stdout}${result.stderr}`).not.toContain('db.example.test')
})

test('database mode requires an explicit URL and complete validated cohort window', () => {
  const missingUrl = run(['--database', ...matureDatabaseWindow()])
  expect(missingUrl.status).not.toBe(0)
  expect(`${missingUrl.stdout}${missingUrl.stderr}`).toContain('DATABASE_URL_REQUIRED')
  expect(`${missingUrl.stdout}${missingUrl.stderr}`).not.toContain('fixture-secret')

  const incomplete = run(['--database'], { DATABASE_URL: 'postgresql://u:p@127.0.0.1/db' })
  expect(incomplete.status).not.toBe(0)
  expect(`${incomplete.stdout}${incomplete.stderr}`).toContain('WINDOW_REQUIRED')
})

test('database failures with loopback credentials return sanitized errors', () => {
  const result = run(['--database', ...matureDatabaseWindow()], {
    DATABASE_URL:
      'postgresql://secret-user:secret-password@127.0.0.1:1/gatherory?marker=secret-query',
  })
  expect(result.status).not.toBe(0)
  expect(result.stderr).toContain('DATABASE_READ_FAILED')
  for (const secret of ['secret-user', 'secret-password', 'secret-query', '127.0.0.1:1']) {
    expect(`${result.stdout}${result.stderr}`).not.toContain(secret)
  }
})
