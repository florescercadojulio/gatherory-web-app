import { waitUntil } from '@vercel/functions'
import { Effect } from 'effect'

import type { EmailOtpType } from '../contracts/auth-email.contract'
import {
  sendEmailOtpWorkflow,
  sendMagicLinkEmailWorkflow,
  sendPasswordResetEmailWorkflow,
  sendVerificationEmailWorkflow,
} from '../workflows/auth-email.workflows.live'

function schedule(program: Effect.Effect<unknown, unknown>) {
  const delivery = Effect.runPromise(
    program.pipe(
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
  schedule(sendVerificationEmailWorkflow(input))
}

export function schedulePasswordResetEmail(input: {
  to: string
  name?: string | null
  resetUrl: string
}) {
  schedule(sendPasswordResetEmailWorkflow(input))
}

export function scheduleEmailOtp(input: { to: string; otp: string; type: EmailOtpType }) {
  schedule(sendEmailOtpWorkflow(input))
}

export function scheduleMagicLinkEmail(input: { to: string; magicLinkUrl: string }) {
  schedule(sendMagicLinkEmailWorkflow(input))
}
