import { expect, test } from 'vitest'
import {
  invitationContinuation,
  invitationPath,
  invitationURL,
  safeAuthContinuation,
} from '@/lib/event-invitation-links'
import {
  InviteEventParticipantInputSchema,
  ShareLinkInput,
} from '@/server/events/contracts/event.contracts'

const token = 'd41db411-7cfe-47de-99d8-c5916b8fd306'

test('public share links default to guests and cannot invite hosts', () => {
  expect(ShareLinkInput.parse({ eventId: token }).role).toBe('guest')
  expect(ShareLinkInput.safeParse({ eventId: token, role: 'host' }).success).toBe(false)
  expect(ShareLinkInput.parse({ eventId: token, role: 'collaborator' }).role).toBe('collaborator')
})

test('invite links follow the configured application host, not the old placeholder', () => {
  expect(invitationURL('https://app.gatherory.com/api/auth', token)).toBe(
    `https://app.gatherory.com/join/${token}`
  )
  expect(invitationURL('https://dev.gatherory.com', token)).toBe(
    `https://dev.gatherory.com/join/${token}`
  )
  expect(invitationURL('http://localhost:3000', token)).toBe(`http://localhost:3000/join/${token}`)
  expect(() => invitationURL('javascript:alert(1)', token)).toThrow()
  expect(() => invitationURL('https://secret@evil.example', token)).toThrow()
  expect(() => invitationPath('planning-circle')).toThrow()
})

test('auth continuation accepts only a valid local invitation path', () => {
  expect(invitationContinuation(`/join/${token}`)).toBe(`/join/${token}`)
  for (const path of [
    'https://evil.example',
    '//evil.example',
    `/join/${token}?redirect=evil`,
    '/join/review-wedding',
    undefined,
  ]) {
    expect(invitationContinuation(path)).toBe(null)
  }
  expect(safeAuthContinuation('/workspaces?tab=events')).toBe('/workspaces?tab=events')
  expect(safeAuthContinuation(`/join/${token}`)).toBe(`/join/${token}`)
  for (const value of [
    '//evil.example',
    '/\\evil.example',
    'https://evil.example',
    '/\n/evil.example',
  ]) {
    expect(safeAuthContinuation(value)).toBe(null)
  }
})

test('invitation input normalizes email and enforces role/permission constraints', () => {
  const input = {
    eventId: token,
    email: '  Guest@Example.com  ',
    role: 'guest',
    planningPermission: 'viewOnly',
  }
  expect(InviteEventParticipantInputSchema.parse(input).email).toBe('guest@example.com')
  expect(
    InviteEventParticipantInputSchema.safeParse({ ...input, planningPermission: 'manage' }).success
  ).toBe(false)
  expect(InviteEventParticipantInputSchema.safeParse({ ...input, role: 'host' }).success).toBe(
    false
  )
  expect(
    InviteEventParticipantInputSchema.safeParse({
      ...input,
      role: 'collaborator',
      planningPermission: 'manage',
    }).success
  ).toBe(true)
  expect(
    InviteEventParticipantInputSchema.safeParse({ ...input, email: 'not-an-email' }).success
  ).toBe(false)
})
