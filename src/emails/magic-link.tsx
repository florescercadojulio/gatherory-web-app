import { Text } from 'react-email'

import { AuthEmailLayout } from '@/emails/_components/auth-email-layout'

export type MagicLinkEmailProps = {
  magicLinkUrl: string
}

export default function MagicLinkEmail({
  magicLinkUrl = 'https://app.gatherory.com/api/auth/magic-link/verify?token=preview',
}: MagicLinkEmailProps) {
  return (
    <AuthEmailLayout
      preview="Your secure Gatherory sign-in link"
      eyebrow="Passwordless sign in"
      heading="Sign in to Gatherory"
      actionLabel="Sign in to Gatherory"
      actionUrl={magicLinkUrl}
      footer="This link expires in 10 minutes and can only be used once. If you did not request it, you can ignore this email."
    >
      <Text className="m-0 text-[16px] leading-[26px] text-[#526176]">
        Use the secure link below to sign in without entering your password.
      </Text>
    </AuthEmailLayout>
  )
}

MagicLinkEmail.PreviewProps = {
  magicLinkUrl: 'https://app.gatherory.com/api/auth/magic-link/verify?token=preview',
} satisfies MagicLinkEmailProps
