import { Text } from "react-email"

import { AuthEmailLayout } from "@/emails/_components/auth-email-layout"

export type VerifyEmailProps = {
  name: string
  verificationUrl: string
}

export default function VerifyEmail({
  name = "Alex",
  verificationUrl = "https://app.gatherory.example/api/auth/verify-email?token=preview",
}: VerifyEmailProps) {
  return (
    <AuthEmailLayout
      preview="Verify your email to finish setting up Gatherory."
      eyebrow="Confirm your account"
      heading="Verify your email"
      actionLabel="Verify email address"
      actionUrl={verificationUrl}
      footer="This verification link expires in 60 minutes. If you did not create a Gatherory account, you can safely ignore this email."
    >
      <Text className="mb-[12px] mt-0 text-[16px] leading-[26px] text-[#263449]">
        Hi {name},
      </Text>
      <Text className="mb-[24px] mt-0 text-[16px] leading-[26px] text-[#263449]">
        Confirm that this email belongs to you so you can start planning and
        collaborating in Gatherory.
      </Text>
    </AuthEmailLayout>
  )
}

VerifyEmail.PreviewProps = {
  name: "Alex",
  verificationUrl: "https://app.gatherory.example/api/auth/verify-email?token=preview",
} satisfies VerifyEmailProps

