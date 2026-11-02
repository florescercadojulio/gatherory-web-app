import { and, eq, gt } from 'drizzle-orm'

import { db } from '@/db'
import * as authSchema from '@/db/schema/auth.schema'

type VerificationInput = {
  id: string
  identifier: string
  value: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export function createAndroidAppleVerification(record: VerificationInput) {
  return db.insert(authSchema.verification).values(record)
}

export function deleteAndroidAppleVerification(id: string) {
  return db.delete(authSchema.verification).where(eq(authSchema.verification.id, id))
}

export async function consumeAndroidAppleVerification(id: string) {
  const [record] = await db
    .delete(authSchema.verification)
    .where(eq(authSchema.verification.id, id))
    .returning({
      value: authSchema.verification.value,
      expiresAt: authSchema.verification.expiresAt,
    })
  return record
}

export async function findActiveAndroidAppleSession(sessionId: string, userId: string, now: Date) {
  const [active] = await db
    .select({
      token: authSchema.session.token,
      userId: authSchema.session.userId,
      user: {
        id: authSchema.user.id,
        name: authSchema.user.name,
        email: authSchema.user.email,
        emailVerified: authSchema.user.emailVerified,
        image: authSchema.user.image,
        hasCompletedOnboarding: authSchema.user.hasCompletedOnboarding,
        createdAt: authSchema.user.createdAt,
        updatedAt: authSchema.user.updatedAt,
      },
    })
    .from(authSchema.session)
    .innerJoin(authSchema.user, eq(authSchema.user.id, authSchema.session.userId))
    .where(
      and(
        eq(authSchema.session.id, sessionId),
        eq(authSchema.session.userId, userId),
        gt(authSchema.session.expiresAt, now)
      )
    )
    .limit(1)
  return active
}
