export const invitationCopyKeys = {
  privateJoin: 'invitation.privateJoin',
  sharedJoin: 'invitation.sharedJoin',
  sharedCollaboratorJoin: 'invitation.sharedCollaboratorJoin',
  sharedCollaboratorApprovalJoin: 'invitation.sharedCollaboratorApprovalJoin',
  sharedCollaboratorViewOnlyJoin: 'invitation.sharedCollaboratorViewOnlyJoin',
  sharedCollaboratorViewOnlyApprovalJoin: 'invitation.sharedCollaboratorViewOnlyApprovalJoin',
  sharedGuestJoin: 'invitation.sharedGuestJoin',
  signIn: 'invitation.signIn',
  signInToPlan: 'invitation.signInToPlan',
  signInToViewPlans: 'invitation.signInToViewPlans',
  createAccount: 'invitation.createAccount',
  createAccountToPlan: 'invitation.createAccountToPlan',
  createAccountToViewPlans: 'invitation.createAccountToViewPlans',
} as const

type InvitationCopyKey = (typeof invitationCopyKeys)[keyof typeof invitationCopyKeys]

export function getSignedOutInvitationCopy(input: {
  shared: boolean
  role?: string
  planningPermission?: string
  requiresApproval?: boolean
}) {
  if (!input.shared) {
    return {
      descriptionKey: invitationCopyKeys.privateJoin,
      signInKey: invitationCopyKeys.signIn,
      createAccountKey: invitationCopyKeys.createAccount,
      interpolateRole: false,
    } as const
  }

  if (input.role === 'guest') {
    return {
      descriptionKey: invitationCopyKeys.sharedGuestJoin,
      signInKey: invitationCopyKeys.signIn,
      createAccountKey: invitationCopyKeys.createAccount,
      interpolateRole: false,
    } as const
  }

  if (input.role === 'collaborator') {
    if (input.planningPermission === 'view_only') {
      return {
        descriptionKey: input.requiresApproval
          ? invitationCopyKeys.sharedCollaboratorViewOnlyApprovalJoin
          : invitationCopyKeys.sharedCollaboratorViewOnlyJoin,
        signInKey: invitationCopyKeys.signInToViewPlans,
        createAccountKey: invitationCopyKeys.createAccountToViewPlans,
        interpolateRole: false,
      } as const
    }

    return {
      descriptionKey: input.requiresApproval
        ? invitationCopyKeys.sharedCollaboratorApprovalJoin
        : invitationCopyKeys.sharedCollaboratorJoin,
      signInKey: invitationCopyKeys.signInToPlan,
      createAccountKey: invitationCopyKeys.createAccountToPlan,
      interpolateRole: false,
    } as const
  }

  return {
    descriptionKey: invitationCopyKeys.sharedJoin,
    signInKey: invitationCopyKeys.signIn,
    createAccountKey: invitationCopyKeys.createAccount,
    interpolateRole: true,
  } as const
}

export type InvitationPresentationKey = InvitationCopyKey

export function getInvitationDisplayState(
  invitationStatus: string | null | undefined,
  localAcceptanceStatus: string | null | undefined
): 'accepted' | 'awaitingApproval' | 'pending' {
  const status = localAcceptanceStatus ?? invitationStatus
  if (status === 'accepted') return 'accepted'
  if (status === 'awaiting_approval') return 'awaitingApproval'
  return 'pending'
}

export function getLocalInvitationPostStatus(status: string | undefined) {
  if (status === undefined || status === 'accepted') return 'accepted'
  return status === 'awaiting_approval' ? 'awaiting_approval' : 'pending'
}
