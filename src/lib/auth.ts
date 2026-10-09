import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { betterAuth } from 'better-auth'
import { organization } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import { db } from '@/db'
import * as authSchema from '@/db/schema/auth.schema'
import { env } from '@/env'

const google =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      }
    : undefined

const apple =
  env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET
    ? {
        clientId: env.APPLE_CLIENT_ID,
        clientSecret: env.APPLE_CLIENT_SECRET,
      }
    : undefined

export const auth = betterAuth({
  appName: 'Gatherory',
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(google ? { google } : {}),
    ...(apple ? { apple } : {}),
  },
  advanced: {
    database: {
      joins: true,
    },
  },
  plugins: [
    organization({
      teams: {
        enabled: true,
        allowRemovingAllTeams: false,
      },
      schema: {
        organization: {
          additionalFields: {
            workspaceType: {
              type: 'string',
              required: true,
              defaultValue: 'personal',
              input: false,
            },
          },
        },
      },
      organizationHooks: {
        beforeCreateOrganization: async ({ organization: workspace }) => ({
          data: {
            ...workspace,
            slug: workspace.slug?.trim().toLowerCase(),
          },
        }),
        beforeCreateTeam: async ({ team }) => ({
          data: {
            ...team,
            name: team.name.trim(),
          },
        }),
      },
    }),
    tanstackStartCookies(),
  ],
})
