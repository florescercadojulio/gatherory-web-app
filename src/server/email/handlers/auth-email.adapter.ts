import { Effect } from 'effect'

import { runInBackground } from '@/lib/background-tasks'

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

  // Start immediately without making the auth response disclose whether a
  // recipient exists. The standalone Node server keeps pending I/O alive and
  // reports failures through Effect logging.
  runInBackground(delivery)
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
