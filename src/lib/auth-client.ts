import { createAuthClient } from 'better-auth/react'
import {
  emailOTPClient,
  magicLinkClient,
  organizationClient,
} from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  plugins: [
    emailOTPClient(),
    magicLinkClient(),
    organizationClient({
      teams: { enabled: true },
      schema: {
        organization: {
          additionalFields: {
            workspaceType: {
              type: 'string',
              required: true,
              defaultValue: 'event',
              input: false,
            },
          },
        },
      },
    }),
  ],
})
