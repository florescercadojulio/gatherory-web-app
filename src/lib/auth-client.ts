import { createAuthClient } from 'better-auth/react'
import {
  emailOTPClient,
  magicLinkClient,
  organizationClient,
} from 'better-auth/client/plugins'

import { defaultOrganizationType } from '@/lib/organization-contract'

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
              defaultValue: defaultOrganizationType,
              input: false,
            },
          },
        },
      },
    }),
  ],
})
