import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { waitUntil } from '@vercel/functions'
import { betterAuth } from 'better-auth'
import { emailOTP } from 'better-auth/plugins/email-otp'
import { magicLink } from 'better-auth/plugins/magic-link'
import { organization } from 'better-auth/plugins/organization'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import { db } from '@/db'
import * as authSchema from '@/db/schema/auth.schema'
import { env } from '@/env'
import {
  scheduleEmailOtp,
  scheduleMagicLinkEmail,
  schedulePasswordResetEmail,
  scheduleVerificationEmail,
} from '@/server/email/auth-email'

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
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      schedulePasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl: url,
      })
    },
  },
  emailVerification: {
    expiresIn: 60 * 60,
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      scheduleVerificationEmail({
        to: user.email,
        name: user.name,
        verificationUrl: url,
      })
    },
  },
  socialProviders: {
    ...(google ? { google } : {}),
    ...(apple ? { apple } : {}),
  },
  advanced: {
    backgroundTasks: {
      handler: waitUntil,
    },
    database: {
      joins: true,
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 10 * 60,
      allowedAttempts: 3,
      disableSignUp: true,
      storeOTP: 'hashed',
      resendStrategy: 'rotate',
      sendVerificationOTP: async ({ email, otp, type }) => {
        scheduleEmailOtp({ to: email, otp, type })
      },
    }),
    magicLink({
      expiresIn: 10 * 60,
      disableSignUp: true,
      storeToken: 'hashed',
      sendMagicLink: async ({ email, url }) => {
        scheduleMagicLinkEmail({ to: email, magicLinkUrl: url })
      },
    }),
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
