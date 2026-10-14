import { expect, test } from 'vitest'
import {
  HideImageInput,
  ReportImageInput,
  ReviewReportInput,
  isTrustedModerationMutation,
  nextReportStatus,
  reportStatuses,
} from '@/server/moderation/contracts'

test('report transitions preserve closed decisions and reject stale review actions', () => {
  expect(nextReportStatus('open', 'start_review')).toBe('in_review')
  expect(nextReportStatus('in_review', 'start_review')).toBe(null)
  for (const status of ['open', 'in_review'] as const) {
    expect(nextReportStatus(status, 'hide_image')).toBe('resolved')
    expect(nextReportStatus(status, 'dismiss')).toBe('dismissed')
  }
  for (const status of reportStatuses.slice(2))
    for (const action of ['start_review', 'hide_image', 'dismiss'] as const)
      expect(nextReportStatus(status, action)).toBe(null)
})

test('report contracts bound input and never accept caller-supplied identity or staff roles', () => {
  const mediaAssetId = crypto.randomUUID()
  expect(ReportImageInput.safeParse({ mediaAssetId, reason: 'privacy' }).success).toBeTruthy()
  expect(
    !ReportImageInput.safeParse({ mediaAssetId, reason: 'privacy', reporterUserId: 'victim' })
      .success
  ).toBeTruthy()
  expect(
    !ReportImageInput.safeParse({ mediaAssetId, reason: 'privacy', detail: 'x'.repeat(2001) })
      .success
  ).toBeTruthy()
  expect(!HideImageInput.safeParse({ mediaAssetId, userId: 'other' }).success).toBeTruthy()
  expect(
    !ReviewReportInput.safeParse({
      reportId: mediaAssetId,
      expectedStatus: 'open',
      action: 'hide_image',
      note: '',
    }).success
  ).toBeTruthy()
  expect(
    !ReviewReportInput.safeParse({
      reportId: mediaAssetId,
      expectedStatus: 'open',
      action: 'grant_admin',
      note: 'malicious',
    }).success
  ).toBeTruthy()
})

test('moderation cookie mutations reject CSRF and native mutations require authenticated bearer-shaped requests', () => {
  const make = (headers: Record<string, string>) =>
    new Request('https://app.gatherory.com/api/admin/reports', { method: 'PATCH', headers })
  const json = { 'Content-Type': 'application/json' }
  expect(
    isTrustedModerationMutation(
      make({ ...json, Origin: 'https://app.gatherory.com' }),
      'https://app.gatherory.com'
    )
  ).toBeTruthy()
  expect(
    !isTrustedModerationMutation(
      make({ ...json, Origin: 'https://evil.example' }),
      'https://app.gatherory.com'
    )
  ).toBeTruthy()
  expect(!isTrustedModerationMutation(make(json), 'https://app.gatherory.com')).toBeTruthy()
  expect(
    !isTrustedModerationMutation(make({ ...json, Origin: 'null' }), 'https://app.gatherory.com')
  ).toBeTruthy()
  expect(
    isTrustedModerationMutation(
      make({ ...json, Authorization: 'Bearer test-token' }),
      'https://app.gatherory.com'
    )
  ).toBeTruthy()
  expect(
    !isTrustedModerationMutation(
      make({ 'Content-Type': 'text/plain', Authorization: 'Bearer test-token' }),
      'https://app.gatherory.com'
    )
  ).toBeTruthy()
})
