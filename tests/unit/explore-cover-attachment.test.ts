import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { expect, test } from 'vitest'

test('legacy attachment rejects seeded covers before touching public URLs or registries', () => {
  const files = [
    'src/server/blueprints/catalog/explore-cover-images.json',
    'src/server/blueprints/catalog/explore-cover-manifests.json',
    'src/server/blueprints/catalog/seed-image-assignments.json',
  ]
  const before = files.map((file) => readFileSync(file, 'utf8'))
  const result = spawnSync(
    process.execPath,
    [
      '--import',
      'tsx',
      'scripts/attach-public-explore-cover.ts',
      '--catalog-key',
      'wedding',
      '--manifest',
      '/does-not-exist.json',
    ],
    { encoding: 'utf8', timeout: 10_000 }
  )
  expect(result.error).toBeUndefined()
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('seed-image-assignments.json')
  expect(result.stderr).not.toContain('ENOENT')
  expect(files.map((file) => readFileSync(file, 'utf8'))).toEqual(before)
})
