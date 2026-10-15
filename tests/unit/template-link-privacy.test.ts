import { expect, test } from 'vitest'
import { redactTemplateLinkCredentials } from '@/lib/template-link-privacy'
import { BlueprintInstallInputSchema } from '@/contracts/blueprint-install.contracts'
import { BlueprintScheduleInputSchema } from '@/contracts/blueprint-schedule.contracts'
import { suggestBlueprintSchedule } from '@/server/blueprints/planning/suggest-blueprint-schedule.server'
import { weddingBlueprintV1 } from '@/server/blueprints/catalog/wedding.v1'

const token = 'abcdef12'.repeat(8)
test('telemetry removes credentials from URLs, referrers, text and nested request data without mutating input', () => {
  const input = {
    url: `https://app.example/templates/shared/${token}`,
    request: { shareToken: token },
    breadcrumbs: [{ message: `gatherory://template/${token}` }],
    count: 2,
  }
  const result = redactTemplateLinkCredentials(input)
  expect(JSON.stringify(result)).not.toContain(token)
  expect(result.count).toBe(2)
  expect(result.request.shareToken).toBe('[redacted]')
  expect(input.request.shareToken).toBe(token)
})

test('shared schedule accepts the credential but never reflects it in suggestions', () => {
  const input = {
    catalogKey: weddingBlueprintV1.catalogKey,
    revision: 1,
    contentHash: weddingBlueprintV1.contentHash,
    shareToken: token,
    mainEvent: { startsAt: '2027-06-15T19:00:00Z', timeZone: 'America/Detroit' },
  }
  expect(BlueprintScheduleInputSchema.safeParse(input).success).toBe(true)
  const response = suggestBlueprintSchedule(input, weddingBlueprintV1.definition)
  expect(response).not.toHaveProperty('shareToken')
  expect(BlueprintScheduleInputSchema.safeParse({ ...input, shareToken: 'short' }).success).toBe(
    false
  )
  const install = {
    ...input,
    requestId: crypto.randomUUID(),
    mainEvent: { ...input.mainEvent, name: 'Our copy' },
    selectedChildren: [],
    selectedIdeaKeys: [],
    capabilities: [],
  }
  expect(BlueprintInstallInputSchema.safeParse(install).success).toBe(true)
  expect(
    BlueprintInstallInputSchema.safeParse({ ...install, shareToken: 'A'.repeat(64) }).success
  ).toBe(false)
})
