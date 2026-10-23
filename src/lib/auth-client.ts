import { createAuthClient } from 'better-auth/react'
import { i18nClient } from '@better-auth/i18n/client'
import { emailOTPClient, magicLinkClient, organizationClient } from 'better-auth/client/plugins'

import { defaultOrganizationType } from '@/lib/organization-contract'
import { orgAccessControl, orgRoles } from '@/lib/org-permissions'

export const authClient = createAuthClient({
  plugins: [
    i18nClient(),
    emailOTPClient(),
    magicLinkClient(),
    organizationClient({
      ac: orgAccessControl,
      roles: orgRoles,
      dynamicAccessControl: { enabled: true },
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
