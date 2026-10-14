import { createAuthPlugin } from '@better-auth-ui/core'
import {
  emailOtpPlugin as coreEmailOtpPlugin,
  type EmailOtpPluginOptions,
} from '@better-auth-ui/core/plugins/email-otp'

import { EmailOtpButton } from '@/components/auth/email-otp/email-otp-button'
import { EmailOtp } from '@/components/auth/email-otp/email-otp'

export const emailOtpPlugin = createAuthPlugin(
  coreEmailOtpPlugin.id,
  (options: EmailOtpPluginOptions = {}) => {
    const plugin = coreEmailOtpPlugin(options)

    return {
      ...plugin,
      authButtons: plugin.signIn ? [EmailOtpButton] : [],
      views: {
        auth: {
          ...(plugin.signIn && { emailOtp: EmailOtp }),
        },
      },
      ...(plugin.signIn && {
        fallbackViews: { auth: { signIn: EmailOtp } },
      }),
    }
  }
)
