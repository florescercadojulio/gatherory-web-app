import { and, asc, eq, inArray, ne, or } from "drizzle-orm"

import { db } from "@/db"
import { member, organization } from "@/db/schema/auth.schema"
import { mediaAsset } from "@/db/schema/media.schema"
import { deleteMediaObject } from "@/server/media/connectors/media-storage.con"

type WorkspaceDisposition =
  | { organizationId: string; kind: "delete" }
  | { memberId: string; organizationId: string; kind: "transfer" }

/**
 * Prepare Gatherory-owned data for Better Auth's hard user deletion.
 *
 * A private workspace is deleted with its final owner. A collaborative
 * workspace remains available: ownership moves to the oldest remaining member,
 * user-authored attribution is cleared by `ON DELETE SET NULL`, and media the
 * departing user uploaded is removed from both R2 and PostgreSQL.
 */
export async function prepareGatheroryAccountDeletion(userId: string) {
  const ownedMemberships = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(and(eq(member.userId, userId), eq(member.role, "owner")))

  const dispositions: WorkspaceDisposition[] = []

  for (const { organizationId } of ownedMemberships) {
    const remainingMembers = await db
      .select({
        id: member.id,
        role: member.role,
      })
      .from(member)
      .where(
        and(
          eq(member.organizationId, organizationId),
          ne(member.userId, userId),
        ),
      )
      .orderBy(asc(member.createdAt))

    if (remainingMembers.length === 0) {
      dispositions.push({ kind: "delete", organizationId })
      continue
    }

    if (!remainingMembers.some((candidate) => candidate.role === "owner")) {
      dispositions.push({
        kind: "transfer",
        organizationId,
        memberId: remainingMembers[0]!.id,
      })
    }
  }

  const organizationsToDelete = dispositions
    .filter(
      (disposition): disposition is Extract<WorkspaceDisposition, { kind: "delete" }> =>
        disposition.kind === "delete",
    )
    .map((disposition) => disposition.organizationId)

  const mediaPredicate = organizationsToDelete.length
    ? or(
        eq(mediaAsset.uploadedByUserId, userId),
        inArray(mediaAsset.organizationId, organizationsToDelete),
      )
    : eq(mediaAsset.uploadedByUserId, userId)

  const mediaToDelete = await db
    .select({ bucket: mediaAsset.bucket, storageKey: mediaAsset.storageKey })
    .from(mediaAsset)
    .where(mediaPredicate)

  // R2 deletes are idempotent. Finish them before the database transaction so
  // a storage failure leaves retryable metadata instead of orphaned objects.
  await Promise.all(
    mediaToDelete.map(({ bucket, storageKey }) =>
      deleteMediaObject({ bucket, key: storageKey }),
    ),
  )

  await db.transaction(async (transaction) => {
    for (const disposition of dispositions) {
      if (disposition.kind === "transfer") {
        await transaction
          .update(member)
          .set({ role: "owner" })
          .where(eq(member.id, disposition.memberId))
      }
    }

    await transaction
      .delete(mediaAsset)
      .where(eq(mediaAsset.uploadedByUserId, userId))

    if (organizationsToDelete.length) {
      await transaction
        .delete(organization)
        .where(inArray(organization.id, organizationsToDelete))
    }
  })
}
