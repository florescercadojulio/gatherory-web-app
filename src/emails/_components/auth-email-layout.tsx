import type { ReactNode } from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
  pixelBasedPreset,
} from 'react-email'

type AuthEmailLayoutProps = {
  preview: string
  eyebrow: string
  heading: string
  actionLabel?: string
  actionUrl?: string
  children: ReactNode
  footer: string
}

export function AuthEmailLayout({
  preview,
  eyebrow,
  heading,
  actionLabel,
  actionUrl,
  children,
  footer,
}: AuthEmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Body className="m-0 bg-[#f3f6fb] px-[16px] py-[40px] font-sans text-[#172033]">
          <Preview>{preview}</Preview>
          <Container className="mx-auto w-full max-w-[520px] rounded-[24px] border border-solid border-[#dce4f0] bg-white px-[40px] py-[40px]">
            <Text className="m-0 text-[13px] font-bold uppercase tracking-[1.6px] text-[#007aff]">
              Gatherory
            </Text>
            <Text className="mb-[12px] mt-[28px] text-[13px] font-semibold uppercase tracking-[1.2px] text-[#526176]">
              {eyebrow}
            </Text>
            <Heading className="m-0 text-[32px] font-semibold leading-[38px] tracking-[-0.8px] text-[#172033]">
              {heading}
            </Heading>

            <Section className="mt-[22px]">{children}</Section>

            {actionLabel && actionUrl ? (
              <>
                <Button
                  href={actionUrl}
                  className="box-border w-full rounded-[12px] bg-[#007aff] px-[20px] py-[14px] text-center text-[16px] font-semibold text-white"
                >
                  {actionLabel}
                </Button>

                <Text className="mb-0 mt-[24px] text-[13px] leading-[20px] text-[#526176]">
                  If the button does not work, copy and paste this link into your browser:
                </Text>
                <Link
                  href={actionUrl}
                  className="break-all text-[13px] leading-[20px] text-[#0066cc] underline"
                >
                  {actionUrl}
                </Link>
              </>
            ) : null}

            <Hr className="my-[28px] border-0 border-t border-solid border-[#dce4f0]" />
            <Text className="m-0 text-[12px] leading-[18px] text-[#66758a]">{footer}</Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
