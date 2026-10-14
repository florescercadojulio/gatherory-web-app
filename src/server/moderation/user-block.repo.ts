import { and, eq, exists, sql, type SQLWrapper } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { Effect } from 'effect'
import { DB } from '@/db'
import { userBlock, user, workspacePerson, eventParticipant } from '@/db/schema'
import { ForbiddenError, InvalidInputError } from '@/server/effect'

export function blockedAuthorPredicate(viewerUserId: string, author: SQLWrapper) {
  return sql`not exists (select 1 from ${userBlock} where ${userBlock.userId} = ${viewerUserId} and ${userBlock.blockedUserId} = ${author})`
}

export function listBlockedPeople(actorUserId: string) {
  return Effect.gen(function* () {
    const db = yield* DB
    const blockedUsers = yield* db
      .select({ userId: userBlock.blockedUserId, name: user.name })
      .from(userBlock)
      .innerJoin(user, eq(user.id, userBlock.blockedUserId))
      .where(eq(userBlock.userId, actorUserId))
    return { blockedUsers }
  })
}

export function blockPerson(actorUserId: string, targetUserId: string) {
  return Effect.gen(function* () {
    if (actorUserId === targetUserId)
      return yield* Effect.fail(
        new InvalidInputError({
          category: 'validation',
          code: 'BLOCK_SELF_FORBIDDEN',
          userMessageKey: 'serverErrors.BLOCK_SELF_FORBIDDEN',
        })
      )
    const db = yield* DB
    const mine = alias(eventParticipant, 'blocking_participant')
    const me = alias(workspacePerson, 'blocking_person')
    const [target] = yield* db
      .select({ id: workspacePerson.userId })
      .from(workspacePerson)
      .innerJoin(eventParticipant, eq(eventParticipant.personId, workspacePerson.id))
      .where(
        and(
          eq(workspacePerson.userId, targetUserId),
          exists(
            db
              .select({ id: mine.id })
              .from(mine)
              .innerJoin(me, eq(me.id, mine.personId))
              .where(and(eq(mine.eventId, eventParticipant.eventId), eq(me.userId, actorUserId)))
          )
        )
      )
      .limit(1)
    if (!target)
      return yield* Effect.fail(
        new ForbiddenError({
          category: 'authorization',
          code: 'BLOCK_TARGET_UNAVAILABLE',
          userMessageKey: 'serverErrors.BLOCK_TARGET_UNAVAILABLE',
        })
      )
    yield* db
      .insert(userBlock)
      .values({ userId: actorUserId, blockedUserId: targetUserId })
      .onConflictDoNothing()
    // No membership, roles, or anyone else's shared records are changed.
    return { blockedUserId: targetUserId }
  })
}

export function unblockPerson(actorUserId: string, targetUserId: string) {
  return Effect.gen(function* () {
    const db = yield* DB
    yield* db
      .delete(userBlock)
      .where(and(eq(userBlock.userId, actorUserId), eq(userBlock.blockedUserId, targetUserId)))
    return { blockedUserId: targetUserId }
  })
}

export function requireUnblockedInvitation(firstUserId: string, secondUserId: string | null) {
  return Effect.gen(function* () {
    if (!secondUserId) return
    const db = yield* DB
    const [blocked] = yield* db
      .select({ id: userBlock.userId })
      .from(userBlock)
      .where(
        sql`(${userBlock.userId} = ${firstUserId} and ${userBlock.blockedUserId} = ${secondUserId}) or (${userBlock.userId} = ${secondUserId} and ${userBlock.blockedUserId} = ${firstUserId})`
      )
      .limit(1)
    if (blocked)
      return yield* Effect.fail(
        new ForbiddenError({
          category: 'authorization',
          code: 'INVITATION_BLOCKED',
          userMessageKey: 'serverErrors.INVITATION_BLOCKED',
        })
      )
  })
}
