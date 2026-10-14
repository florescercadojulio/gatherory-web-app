export type EmailOtpType = 'sign-in' | 'email-verification' | 'forget-password' | 'change-email'

export const otpCopy: Record<EmailOtpType, { purpose: string; subject: string }> = {
  'sign-in': {
    purpose: 'sign in',
    subject: 'Your Gatherory sign-in code',
  },
  'email-verification': {
    purpose: 'verify your email',
    subject: 'Verify your Gatherory email',
  },
  'forget-password': {
    purpose: 'reset your password',
    subject: 'Your Gatherory password reset code',
  },
  'change-email': {
    purpose: 'change your email',
    subject: 'Confirm your Gatherory email change',
  },
}

export function recipientName(name: string | null | undefined) {
  const normalized = name?.trim()
  return normalized || 'there'
}
