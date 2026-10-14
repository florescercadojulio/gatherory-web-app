import { Effect, Layer } from 'effect'
import { expect, it } from '@effect/vitest'

import EmailOtpEmail from '@/emails/email-otp'
import MagicLinkEmail from '@/emails/magic-link'
import PasswordResetEmail from '@/emails/reset-password'
import VerifyEmail from '@/emails/verify-email'
import { ExternalServiceError } from '@/lib/domain-errors'
import { EmailConnector, type SendEmailInput } from '@/server/email/connectors/email.connector'
import { sendEmailOtpWorkflow } from '@/server/email/workflows/send-email-otp.workflow'
import { sendMagicLinkEmailWorkflow } from '@/server/email/workflows/send-magic-link-email.workflow'
import { sendPasswordResetEmailWorkflow } from '@/server/email/workflows/send-password-reset-email.workflow'
import { sendVerificationEmailWorkflow } from '@/server/email/workflows/send-verification-email.workflow'

it.effect('delivers the existing verification, reset, OTP, and magic-link payloads', () => {
  const sent: SendEmailInput[] = []
  const connector = Layer.succeed(EmailConnector, {
    send: (input) => {
      sent.push(input)
      return Effect.succeed({ messageId: `message-${sent.length}` })
    },
  })

  return Effect.gen(function* () {
    yield* sendVerificationEmailWorkflow({
      to: 'verify@example.com',
      name: '  Alex  ',
      verificationUrl: 'https://app.gatherory.example/verify?token=verify',
    })
    yield* sendPasswordResetEmailWorkflow({
      to: 'reset@example.com',
      name: null,
      resetUrl: 'https://app.gatherory.example/reset?token=reset',
    })
    yield* sendEmailOtpWorkflow({ to: 'otp@example.com', otp: '123456', type: 'forget-password' })
    yield* sendMagicLinkEmailWorkflow({
      to: 'magic@example.com',
      magicLinkUrl: 'https://app.gatherory.example/magic?token=magic',
    })

    expect(sent).toHaveLength(4)
    expect(sent[0]).toMatchObject({
      to: 'verify@example.com',
      subject: 'Verify your Gatherory email',
      react: {
        type: VerifyEmail,
        props: {
          name: 'Alex',
          verificationUrl: 'https://app.gatherory.example/verify?token=verify',
        },
      },
      text: [
        'Hi Alex,',
        '',
        'Verify your email address to finish setting up your Gatherory account:',
        'https://app.gatherory.example/verify?token=verify',
        '',
        'This link expires in 60 minutes. If you did not create a Gatherory account, you can ignore this email.',
      ].join('\n'),
    })
    expect(sent[1]).toMatchObject({
      to: 'reset@example.com',
      subject: 'Reset your Gatherory password',
      react: {
        type: PasswordResetEmail,
        props: { name: 'there', resetUrl: 'https://app.gatherory.example/reset?token=reset' },
      },
      text: [
        'Hi there,',
        '',
        'Use this link to choose a new password for your Gatherory account:',
        'https://app.gatherory.example/reset?token=reset',
        '',
        'This link expires in 60 minutes. If you did not request a password reset, you can ignore this email.',
      ].join('\n'),
    })
    expect(sent[2]).toMatchObject({
      to: 'otp@example.com',
      subject: 'Your Gatherory password reset code',
      react: { type: EmailOtpEmail, props: { code: '123456', purpose: 'reset your password' } },
      text: [
        'Use this code to reset your password in Gatherory:',
        '',
        '123456',
        '',
        'This code expires in 10 minutes. You have three attempts to enter it. Never share it with anyone.',
      ].join('\n'),
    })
    expect(sent[3]).toMatchObject({
      to: 'magic@example.com',
      subject: 'Sign in to Gatherory',
      react: {
        type: MagicLinkEmail,
        props: { magicLinkUrl: 'https://app.gatherory.example/magic?token=magic' },
      },
      text: [
        'Use this secure link to sign in to Gatherory:',
        'https://app.gatherory.example/magic?token=magic',
        '',
        'This link expires in 10 minutes and can only be used once. If you did not request it, you can ignore this email.',
      ].join('\n'),
    })
  }).pipe(Effect.provide(connector))
})

it.effect('propagates provider failures through the workflow', () => {
  const failure = new ExternalServiceError({
    category: 'external',
    code: 'EMAIL_DELIVERY_FAILED',
    userMessageKey: 'serverErrors.EMAIL_DELIVERY_FAILED',
  })
  const connector = Layer.succeed(EmailConnector, {
    send: () => Effect.fail(failure),
  })

  return Effect.gen(function* () {
    const outcome = yield* Effect.match(
      sendMagicLinkEmailWorkflow({
        to: 'magic@example.com',
        magicLinkUrl: 'https://app.gatherory.example/magic?token=magic',
      }),
      {
        onFailure: (error) => ({ ok: false as const, error }),
        onSuccess: () => ({ ok: true as const }),
      }
    )
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.error).toBe(failure)
  }).pipe(Effect.provide(connector))
})
