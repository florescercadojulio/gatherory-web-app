import { Effect } from 'effect'

import EmailOtpEmail from '@/emails/email-otp'
import { EmailConnector } from '../connectors/email.connector'
import { otpCopy, type EmailOtpType } from '../contracts/auth-email.contract'

export function sendEmailOtpWorkflow(input: { to: string; otp: string; type: EmailOtpType }) {
  const copy = otpCopy[input.type]
  const text = [
    `Use this code to ${copy.purpose} in Gatherory:`,
    '',
    input.otp,
    '',
    'This code expires in 10 minutes. You have three attempts to enter it. Never share it with anyone.',
  ].join('\n')

  return Effect.gen(function* () {
    const email = yield* EmailConnector
    return yield* email.send({
      to: input.to,
      subject: copy.subject,
      text,
      react: <EmailOtpEmail code={input.otp} purpose={copy.purpose} />,
    })
  })
}
