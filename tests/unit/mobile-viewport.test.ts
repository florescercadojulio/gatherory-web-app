import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

test('mobile viewport lets Android resize dialogs above the keyboard without disabling zoom', () => {
  const root = readFileSync(new URL('../../src/routes/__root.tsx', import.meta.url), 'utf8')
  const viewport = root.match(/name: 'viewport',\s*content:\s*'([^']+)'/)?.[1]

  expect(viewport).toBeDefined()
  expect(viewport).toContain('width=device-width')
  expect(viewport).toContain('interactive-widget=resizes-content')
  expect(viewport).not.toMatch(/user-scalable=no|maximum-scale=1(?:,|$)/)
})
