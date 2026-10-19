import { expect, test } from 'vitest'
import { BlueprintLibraryInstallationSchema } from '@/contracts/blueprint-library.contracts'

const valid = {
  installationID: '00000000-0000-4000-8000-000000000001',
  scopeID: '00000000-0000-4000-8000-000000000002',
  catalogKey: 'wedding',
  revision: 1,
  templateName: '婚礼 👨‍👩‍👧‍👦',
  eventName: 'Celebration',
  installedAt: '2026-10-16T12:34:56.789Z',
}

test('uses Unicode code point limits and a strict history projection', () => {
  expect(BlueprintLibraryInstallationSchema.safeParse(valid).success).toBe(true)
  expect(
    BlueprintLibraryInstallationSchema.safeParse({ ...valid, templateName: '🎉'.repeat(161) })
      .success
  ).toBe(false)
  expect(
    BlueprintLibraryInstallationSchema.safeParse({ ...valid, eventName: 'e'.repeat(121) }).success
  ).toBe(false)
  expect(
    BlueprintLibraryInstallationSchema.safeParse({ ...valid, contentHash: 'private' }).success
  ).toBe(false)
})

test('caps RFC3339 timestamps at 29 characters, including fractional seconds', () => {
  const maxLength = '2026-10-16T12:34:56.12345678Z'
  const tooLong = '2026-10-16T12:34:56.123456789Z'

  expect(maxLength).toHaveLength(29)
  expect(
    BlueprintLibraryInstallationSchema.safeParse({ ...valid, installedAt: maxLength }).success
  ).toBe(true)
  expect(tooLong).toHaveLength(30)
  expect(
    BlueprintLibraryInstallationSchema.safeParse({ ...valid, installedAt: tooLong }).success
  ).toBe(false)
})
