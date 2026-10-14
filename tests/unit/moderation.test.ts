import assert from 'node:assert/strict'
import { test } from 'vitest'
import {
  HideImageInput,
  ReportImageInput,
  ReviewReportInput,
  isTrustedModerationMutation,
  nextReportStatus,
  reportStatuses,
} from '@/server/moderation/contracts'

test('report transitions preserve closed decisions and reject stale review actions', () => {
  assert.equal(nextReportStatus('open', 'start_review'), 'in_review')
  assert.equal(nextReportStatus('in_review', 'start_review'), null)
  for (const status of ['open', 'in_review'] as const) {
    assert.equal(nextReportStatus(status, 'hide_image'), 'resolved')
    assert.equal(nextReportStatus(status, 'dismiss'), 'dismissed')
  }
  for (const status of reportStatuses.slice(2))
    for (const action of ['start_review', 'hide_image', 'dismiss'] as const)
      assert.equal(nextReportStatus(status, action), null)
})

test('report contracts bound input and never accept caller-supplied identity or staff roles', () => {
  const mediaAssetId = crypto.randomUUID()
  assert.ok(ReportImageInput.safeParse({ mediaAssetId, reason: 'privacy' }).success)
  assert.ok(
    !ReportImageInput.safeParse({ mediaAssetId, reason: 'privacy', reporterUserId: 'victim' })
      .success
  )
  assert.ok(
    !ReportImageInput.safeParse({ mediaAssetId, reason: 'privacy', detail: 'x'.repeat(2001) })
      .success
  )
  assert.ok(!HideImageInput.safeParse({ mediaAssetId, userId: 'other' }).success)
  assert.ok(
    !ReviewReportInput.safeParse({
      reportId: mediaAssetId,
      expectedStatus: 'open',
      action: 'hide_image',
      note: '',
    }).success
  )
  assert.ok(
    !ReviewReportInput.safeParse({
      reportId: mediaAssetId,
      expectedStatus: 'open',
      action: 'grant_admin',
      note: 'malicious',
    }).success
  )
})

test('moderation cookie mutations reject CSRF and native mutations require authenticated bearer-shaped requests', () => {
  const make = (headers: Record<string, string>) =>
    new Request('https://app.gatherory.com/api/admin/reports', { method: 'PATCH', headers })
  const json = { 'Content-Type': 'application/json' }
  assert.ok(
    isTrustedModerationMutation(
      make({ ...json, Origin: 'https://app.gatherory.com' }),
      'https://app.gatherory.com'
    )
  )
  assert.ok(
    !isTrustedModerationMutation(
      make({ ...json, Origin: 'https://evil.example' }),
      'https://app.gatherory.com'
    )
  )
  assert.ok(!isTrustedModerationMutation(make(json), 'https://app.gatherory.com'))
  assert.ok(
    !isTrustedModerationMutation(make({ ...json, Origin: 'null' }), 'https://app.gatherory.com')
  )
  assert.ok(
    isTrustedModerationMutation(
      make({ ...json, Authorization: 'Bearer test-token' }),
      'https://app.gatherory.com'
    )
  )
  assert.ok(
    !isTrustedModerationMutation(
      make({ 'Content-Type': 'text/plain', Authorization: 'Bearer test-token' }),
      'https://app.gatherory.com'
    )
  )
})
