import { createHash } from 'node:crypto'
import type { db } from '@/db'
import { nativeNotificationOutbox } from '@/db/schema/notification.schema'
import type { EnqueueNativeNotificationInput } from '../contracts/notification.contracts'

type NotificationTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** Persist a generic, opaque notification record in the caller's mutation transaction. */
export async function enqueueNativeNotification(
  tx: NotificationTransaction,
  input: EnqueueNativeNotificationInput
) {
  const dedupeKey = createHash('sha256')
    .update(
      [
        input.mutationId,
        input.recipient.kind,
        input.recipient.id,
        input.notificationType,
        input.entityId,
      ].join(':')
    )
    .digest('hex')

  await tx
    .insert(nativeNotificationOutbox)
    .values({
      dedupeKey,
      mutationId: input.mutationId,
      eventId: input.eventId,
      entityId: input.entityId,
      sourceRevision: input.sourceRevision,
      recipientKind: input.recipient.kind,
      recipientId: input.recipient.id,
      type: input.notificationType,
    })
    .onConflictDoNothing({ target: nativeNotificationOutbox.dedupeKey })
}
