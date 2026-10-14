import { and, eq, isNull, sql } from 'drizzle-orm'
import { DB } from '@/db'
import { hiddenMedia, userBlock } from '@/db/schema/moderation.schema'
import { mediaAsset } from '@/db/schema/media.schema'
import { Effect } from 'effect'

/** Include on every normal ready-media read, including guest projections. */
export function visibleMediaPredicate(userId?: string) {
  return and(
    eq(mediaAsset.status, 'ready'),
    isNull(mediaAsset.moderationHiddenAt),
    userId
      ? sql`not exists (select 1 from ${hiddenMedia} where ${hiddenMedia.userId} = ${userId} and ${hiddenMedia.mediaAssetId} = ${mediaAsset.id})`
      : undefined,
    userId
      ? sql`not exists (select 1 from ${userBlock} where ${userBlock.userId} = ${userId} and ${userBlock.blockedUserId} = ${mediaAsset.uploadedByUserId})`
      : undefined
  )
}

export function canReadMedia(userId: string, mediaAssetId: string) {
  return Effect.gen(function* () {
    const db = yield* DB
    const [asset] = yield* db
      .select({ id: mediaAsset.id })
      .from(mediaAsset)
      .where(and(eq(mediaAsset.id, mediaAssetId), visibleMediaPredicate(userId)))
      .limit(1)
    return !!asset
  })
}
