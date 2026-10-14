import { Effect } from 'effect'

import MagicLinkEmail from '@/emails/magic-link'
import { EmailConnector } from '../connectors/email.connector'

export function sendMagicLinkEmailWorkflow(input: { to: string; magicLinkUrl: string }) {
  const text = [
    'Use this secure link to sign in to Gatherory:',
    input.magicLinkUrl,
    '',
    'This link expires in 10 minutes and can only be used once. If you did not request it, you can ignore this email.',
  ].join('\n')

  return Effect.gen(function* () {
    const email = yield* EmailConnector
    return yield* email.send({
      to: input.to,
      subject: 'Sign in to Gatherory',
      text,
      react: <MagicLinkEmail magicLinkUrl={input.magicLinkUrl} />,
    })
  })
}
