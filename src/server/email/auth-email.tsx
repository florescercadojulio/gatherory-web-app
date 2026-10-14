import { waitUntil } from '@vercel/functions'
import { Effect } from 'effect'

import PasswordResetEmail from '@/emails/reset-password'
import EmailOtpEmail from '@/emails/email-otp'
import MagicLinkEmail from '@/emails/magic-link'
import VerifyEmail from '@/emails/verify-email'
import { EmailConnector } from '@/server/email/connectors/email.connector'
import { EmailConnectorLive } from '@/server/email/connectors/email.connector.live'

function recipientName(name: string | null | undefined) {
  const normalized = name?.trim()
  return normalized || 'there'
}

type EmailOtpType = 'sign-in' | 'email-verification' | 'forget-password' | 'change-email'

const otpCopy: Record<EmailOtpType, { purpose: string; subject: string }> = {
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

function schedule(program: Effect.Effect<unknown, unknown, EmailConnector>) {
  const delivery = Effect.runPromise(
    program.pipe(
      Effect.provide(EmailConnectorLive),
      Effect.tapError((error) =>
        Effect.logError('Authentication email delivery failed').pipe(
          Effect.annotateLogs({ error: String(error) })
        )
      ),
      Effect.catch(() => Effect.succeed(undefined))
    )
  )

  // Vercel keeps the request alive without making the auth response disclose
  // whether a recipient exists. In local development the promise still starts
  // immediately and reports failures through Effect logging.
  waitUntil(delivery)
}

export function scheduleVerificationEmail(input: {
  to: string
  name?: string | null
  verificationUrl: string
}) {
  const name = recipientName(input.name)
  const text = [
    `Hi ${name},`,
    '',
    'Verify your email address to finish setting up your Gatherory account:',
    input.verificationUrl,
    '',
    'This link expires in 60 minutes. If you did not create a Gatherory account, you can ignore this email.',
  ].join('\n')

  schedule(
    Effect.gen(function* () {
      const email = yield* EmailConnector
      return yield* email.send({
        to: input.to,
        subject: 'Verify your Gatherory email',
        text,
        react: <VerifyEmail name={name} verificationUrl={input.verificationUrl} />,
      })
    })
  )
}

export function schedulePasswordResetEmail(input: {
  to: string
  name?: string | null
  resetUrl: string
}) {
  const name = recipientName(input.name)
  const text = [
    `Hi ${name},`,
    '',
    'Use this link to choose a new password for your Gatherory account:',
    input.resetUrl,
    '',
    'This link expires in 60 minutes. If you did not request a password reset, you can ignore this email.',
  ].join('\n')

  schedule(
    Effect.gen(function* () {
      const email = yield* EmailConnector
      return yield* email.send({
        to: input.to,
        subject: 'Reset your Gatherory password',
        text,
        react: <PasswordResetEmail name={name} resetUrl={input.resetUrl} />,
      })
    })
  )
}

export function scheduleEmailOtp(input: { to: string; otp: string; type: EmailOtpType }) {
  const copy = otpCopy[input.type]
  const text = [
    `Use this code to ${copy.purpose} in Gatherory:`,
    '',
    input.otp,
    '',
    'This code expires in 10 minutes. You have three attempts to enter it. Never share it with anyone.',
  ].join('\n')

  schedule(
    Effect.gen(function* () {
      const email = yield* EmailConnector
      return yield* email.send({
        to: input.to,
        subject: copy.subject,
        text,
        react: <EmailOtpEmail code={input.otp} purpose={copy.purpose} />,
      })
    })
  )
}

export function scheduleMagicLinkEmail(input: { to: string; magicLinkUrl: string }) {
  const text = [
    'Use this secure link to sign in to Gatherory:',
    input.magicLinkUrl,
    '',
    'This link expires in 10 minutes and can only be used once. If you did not request it, you can ignore this email.',
  ].join('\n')

  schedule(
    Effect.gen(function* () {
      const email = yield* EmailConnector
      return yield* email.send({
        to: input.to,
        subject: 'Sign in to Gatherory',
        text,
        react: <MagicLinkEmail magicLinkUrl={input.magicLinkUrl} />,
      })
    })
  )
}
