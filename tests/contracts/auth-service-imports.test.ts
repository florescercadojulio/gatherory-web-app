import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

test('Apple account deletion service implementation imports without production configuration', () => {
  const source = readFileSync(
    'src/server/auth/services/apple-account-deletion.service.live.ts',
    'utf8'
  )
  expect(source).not.toMatch(
    /from ['"]@\/env['"]|better-auth\/crypto|Effect\.(?:tryPromise|promise)\s*\(/
  )
})
