import { Effect } from 'effect'

import PasswordResetEmail from '@/emails/reset-password'
import { EmailConnector } from '../connectors/email.connector'
import { recipientName } from '../contracts/auth-email.contract'

export function sendPasswordResetEmailWorkflow(input: {
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

  return Effect.gen(function* () {
    const email = yield* EmailConnector
    return yield* email.send({
      to: input.to,
      subject: 'Reset your Gatherory password',
      text,
      react: <PasswordResetEmail name={name} resetUrl={input.resetUrl} />,
    })
  })
}
