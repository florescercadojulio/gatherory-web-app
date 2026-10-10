import type { ReactNode } from "react"
import { Context, Effect } from "effect"

import type { ExternalServiceError } from "@/server/effect"

export type SendEmailInput = {
  readonly to: string
  readonly subject: string
  readonly text: string
  readonly react: ReactNode
}

export type SendEmailReceipt = {
  readonly messageId: string
}

export class EmailConnector extends Context.Service<
  EmailConnector,
  {
    readonly send: (
      input: SendEmailInput
    ) => Effect.Effect<SendEmailReceipt, ExternalServiceError>
  }
>()("EmailConnector") {}
