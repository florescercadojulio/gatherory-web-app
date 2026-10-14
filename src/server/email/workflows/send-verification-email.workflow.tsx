import { Effect } from 'effect'

import VerifyEmail from '@/emails/verify-email'
import { EmailConnector } from '../connectors/email.connector'
import { recipientName } from '../contracts/auth-email.contract'

export function sendVerificationEmailWorkflow(input: {
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

  return Effect.gen(function* () {
    const email = yield* EmailConnector
    return yield* email.send({
      to: input.to,
      subject: 'Verify your Gatherory email',
      text,
      react: <VerifyEmail name={name} verificationUrl={input.verificationUrl} />,
    })
  })
}
