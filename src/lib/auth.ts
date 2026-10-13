import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { waitUntil } from '@vercel/functions'
import { betterAuth } from 'better-auth'
import { i18n, locales } from '@better-auth/i18n'
import { bearer } from 'better-auth/plugins/bearer'
import { emailOTP } from 'better-auth/plugins/email-otp'
import { magicLink } from 'better-auth/plugins/magic-link'
import { organization } from 'better-auth/plugins/organization'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { importPKCS8, SignJWT } from 'jose'

import { db } from '@/db'
import * as authSchema from '@/db/schema/auth.schema'
import { env } from '@/env'
import {
  defaultOrganizationType,
  prepareOrganizationForCreation,
} from '@/lib/organization-contract'
import {
  scheduleEmailOtp,
  scheduleMagicLinkEmail,
  schedulePasswordResetEmail,
  scheduleVerificationEmail,
} from '@/server/email/auth-email'
import { prepareGatheroryAccountDeletion } from '@/server/auth/account-deletion'

const google =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      }
    : undefined

const appleCredentialValues = [
  env.APPLE_CLIENT_ID,
  env.APPLE_TEAM_ID,
  env.APPLE_KEY_ID,
  env.APPLE_PRIVATE_KEY,
] as const

const hasAnyAppleCredential = appleCredentialValues.some(Boolean)
const hasAllAppleCredentials = appleCredentialValues.every(Boolean)

if (hasAnyAppleCredential && !hasAllAppleCredentials) {
  throw new Error(
    'Apple authentication requires APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY.',
  )
}

async function generateAppleClientSecret({
  clientId,
  teamId,
  keyId,
  privateKey,
}: {
  clientId: string
  teamId: string
  keyId: string
  privateKey: string
}) {
  const signingKey = await importPKCS8(
    privateKey.replace(/\\n/g, '\n').trim(),
    'ES256',
  )
  const now = Math.floor(Date.now() / 1000)

  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setSubject(clientId)
    .setAudience('https://appleid.apple.com')
    .setIssuedAt(now)
    .setExpirationTime(now + 180 * 24 * 60 * 60)
    .sign(signingKey)
}

const apple = hasAllAppleCredentials
  ? async () => {
      const clientId = env.APPLE_CLIENT_ID!

      return {
        clientId,
        clientSecret: await generateAppleClientSecret({
          clientId,
          teamId: env.APPLE_TEAM_ID!,
          keyId: env.APPLE_KEY_ID!,
          privateKey: env.APPLE_PRIVATE_KEY!,
        }),
        ...(env.APPLE_APP_BUNDLE_IDENTIFIER
          ? { appBundleIdentifier: env.APPLE_APP_BUNDLE_IDENTIFIER }
          : {}),
      }
    }
  : undefined

export const auth = betterAuth({
  appName: 'Gatherory',
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    new URL(env.BETTER_AUTH_URL).origin,
    'https://appleid.apple.com',
  ],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
    transaction: true,
  }),
  user: {
    additionalFields: {
      hasCompletedOnboarding: {
        type: 'boolean',
        required: true,
        defaultValue: false,
        input: false,
        returned: true,
      },
    },
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        await prepareGatheroryAccountDeletion(user.id)
      },
    },
  },
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
    i18n({
      defaultLocale: 'en',
      translations: {
        en: locales.en,
        es: locales.es,
      },
    }),
    bearer(),
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
              defaultValue: defaultOrganizationType,
              input: false,
            },
          },
        },
      },
      organizationHooks: {
        beforeCreateOrganization: async ({ organization: workspace }) => ({
          data: prepareOrganizationForCreation(workspace),
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
