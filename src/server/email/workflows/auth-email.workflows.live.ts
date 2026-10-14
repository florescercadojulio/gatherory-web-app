import { Effect } from 'effect'
import { EmailConnectorLive } from '../connectors/email.connector.live'
import { sendEmailOtpWorkflow as emailOtp } from './send-email-otp.workflow'
import { sendMagicLinkEmailWorkflow as magicLink } from './send-magic-link-email.workflow'
import { sendPasswordResetEmailWorkflow as passwordReset } from './send-password-reset-email.workflow'
import { sendVerificationEmailWorkflow as verification } from './send-verification-email.workflow'

export const sendEmailOtpWorkflow = (...args: Parameters<typeof emailOtp>) =>
  emailOtp(...args).pipe(Effect.provide(EmailConnectorLive))

export const sendMagicLinkEmailWorkflow = (...args: Parameters<typeof magicLink>) =>
  magicLink(...args).pipe(Effect.provide(EmailConnectorLive))

export const sendPasswordResetEmailWorkflow = (...args: Parameters<typeof passwordReset>) =>
  passwordReset(...args).pipe(Effect.provide(EmailConnectorLive))

export const sendVerificationEmailWorkflow = (...args: Parameters<typeof verification>) =>
  verification(...args).pipe(Effect.provide(EmailConnectorLive))
