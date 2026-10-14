import { Text } from 'react-email'

import { AuthEmailLayout } from '@/emails/_components/auth-email-layout'

export type PasswordResetEmailProps = {
  name: string
  resetUrl: string
}

export default function PasswordResetEmail({
  name = 'Alex',
  resetUrl = 'https://app.gatherory.example/auth/reset-password?token=preview',
}: PasswordResetEmailProps) {
  return (
    <AuthEmailLayout
      preview="Choose a new password for your Gatherory account."
      eyebrow="Account security"
      heading="Reset your password"
      actionLabel="Choose a new password"
      actionUrl={resetUrl}
      footer="This password reset link expires in 60 minutes. If you did not request it, you can safely ignore this email. Your password will not change."
    >
      <Text className="mb-[12px] mt-0 text-[16px] leading-[26px] text-[#263449]">Hi {name},</Text>
      <Text className="mb-[24px] mt-0 text-[16px] leading-[26px] text-[#263449]">
        We received a request to reset your Gatherory password. Use the secure link below to choose
        a new one.
      </Text>
    </AuthEmailLayout>
  )
}

PasswordResetEmail.PreviewProps = {
  name: 'Alex',
  resetUrl: 'https://app.gatherory.example/auth/reset-password?token=preview',
} satisfies PasswordResetEmailProps
