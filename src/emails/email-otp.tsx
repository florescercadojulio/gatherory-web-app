import { Section, Text } from "react-email"

import { AuthEmailLayout } from "@/emails/_components/auth-email-layout"

export type EmailOtpEmailProps = {
  code: string
  purpose: string
}

export default function EmailOtpEmail({
  code = "482913",
  purpose = "sign in",
}: EmailOtpEmailProps) {
  return (
    <AuthEmailLayout
      preview={`Your Gatherory code is ${code}`}
      eyebrow="One-time code"
      heading={`Use this code to ${purpose}`}
      footer="This code expires in 10 minutes. You have three attempts to enter it. If you did not request it, you can ignore this email."
    >
      <Text className="m-0 text-[16px] leading-[26px] text-[#526176]">
        Enter this six-digit code in Gatherory. Never share it with anyone.
      </Text>
      <Section className="my-[24px] rounded-[16px] border border-solid border-[#dce4f0] bg-[#f3f6fb] px-[24px] py-[20px] text-center">
        <Text className="m-0 text-[36px] font-bold leading-[44px] tracking-[8px] text-[#172033]">
          {code}
        </Text>
      </Section>
    </AuthEmailLayout>
  )
}

EmailOtpEmail.PreviewProps = {
  code: "482913",
  purpose: "sign in",
} satisfies EmailOtpEmailProps
