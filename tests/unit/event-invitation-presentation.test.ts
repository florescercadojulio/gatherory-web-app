import { expect, test } from 'vitest'
import en from '@/i18n/locales/en'
import es from '@/i18n/locales/es'
import {
  getInvitationDisplayState,
  getLocalInvitationPostStatus,
  getSignedOutInvitationCopy,
} from '@/lib/event-invitation-presentation'

test('invitation state distinguishes accepted and approval-pending loader states', () => {
  expect(getInvitationDisplayState('accepted', null)).toBe('accepted')
  expect(getInvitationDisplayState('awaiting_approval', null)).toBe('awaitingApproval')
  expect(getInvitationDisplayState('pending', null)).toBe('pending')
})

test('local POST results keep approval requests out of the accepted state', () => {
  const approvalStatus = getLocalInvitationPostStatus('awaiting_approval')
  expect(getInvitationDisplayState('pending', approvalStatus)).toBe('awaitingApproval')

  const acceptedStatus = getLocalInvitationPostStatus('accepted')
  expect(getInvitationDisplayState('pending', acceptedStatus)).toBe('accepted')
  expect(getLocalInvitationPostStatus(undefined)).toBe('accepted')
  expect(getLocalInvitationPostStatus('declined')).toBe('pending')
  expect(getLocalInvitationPostStatus('unexpected')).toBe('pending')
  expect(getInvitationDisplayState('accepted', approvalStatus)).toBe('awaitingApproval')
  expect(getInvitationDisplayState('awaiting_approval', acceptedStatus)).toBe('accepted')
  expect(getInvitationDisplayState('accepted', 'pending')).toBe('pending')
})

test('signed-out invitation copy matches guest, private, planning, and view-only access', () => {
  expect(getSignedOutInvitationCopy({ shared: false, role: 'guest' })).toMatchObject({
    descriptionKey: 'invitation.privateJoin',
    signInKey: 'invitation.signIn',
    createAccountKey: 'invitation.createAccount',
  })
  expect(getSignedOutInvitationCopy({ shared: true, role: 'guest' })).toMatchObject({
    descriptionKey: 'invitation.sharedGuestJoin',
    signInKey: 'invitation.signIn',
    createAccountKey: 'invitation.createAccount',
  })
  expect(
    getSignedOutInvitationCopy({ shared: true, role: 'collaborator', planningPermission: 'manage' })
  ).toMatchObject({
    descriptionKey: 'invitation.sharedCollaboratorJoin',
    signInKey: 'invitation.signInToPlan',
    createAccountKey: 'invitation.createAccountToPlan',
  })
  expect(
    getSignedOutInvitationCopy({
      shared: true,
      role: 'collaborator',
      planningPermission: 'view_only',
    })
  ).toMatchObject({
    descriptionKey: 'invitation.sharedCollaboratorViewOnlyJoin',
    signInKey: 'invitation.signInToViewPlans',
    createAccountKey: 'invitation.createAccountToViewPlans',
  })
  expect(
    getSignedOutInvitationCopy({
      shared: true,
      role: 'collaborator',
      planningPermission: 'view_only',
      requiresApproval: true,
    })
  ).toMatchObject({
    descriptionKey: 'invitation.sharedCollaboratorViewOnlyApprovalJoin',
    signInKey: 'invitation.signInToViewPlans',
    createAccountKey: 'invitation.createAccountToViewPlans',
  })
})

test('English and Spanish invitation catalogs have matching keys', () => {
  expect(Object.keys(es.invitation).sort()).toEqual(Object.keys(en.invitation).sort())
})
