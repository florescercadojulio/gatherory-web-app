import { Effect, Layer } from "effect"
import { Resend } from "resend"

import { env } from "@/env"
import { ExternalServiceError } from "@/server/effect"
import { EmailConnector } from "./email.connector"

function deliveryError(code: string, cause?: unknown) {
  return new ExternalServiceError({
    category: "external",
    code,
    userMessageKey: "serverErrors.EMAIL_DELIVERY_FAILED",
    cause,
    debugMessage: cause instanceof Error ? cause.message : undefined,
  })
}

export const EmailConnectorLive = Layer.sync(EmailConnector, () => {
  const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

  return {
    send: (input) => {
      if (!resend || !env.EMAIL_FROM) {
        return Effect.fail(deliveryError("EMAIL_NOT_CONFIGURED"))
      }

      return Effect.tryPromise({
        try: async () => {
          const { data, error } = await resend.emails.send({
            from: env.EMAIL_FROM!,
            to: input.to,
            subject: input.subject,
            text: input.text,
            react: input.react,
            ...(env.EMAIL_REPLY_TO ? { replyTo: env.EMAIL_REPLY_TO } : {}),
          })

          if (error) throw deliveryError("EMAIL_DELIVERY_FAILED", error)
          if (!data) throw new ExternalServiceError({ category: "external", code: "EMAIL_RECEIPT_MISSING", userMessageKey: "serverErrors.EMAIL_DELIVERY_FAILED", debugMessage: "Resend returned no delivery receipt." })

          return { messageId: data.id }
        },
        catch: (cause) => cause instanceof ExternalServiceError ? cause : deliveryError("EMAIL_DELIVERY_FAILED", cause),
      })
    },
  }
})
