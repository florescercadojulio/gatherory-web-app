import { and, eq, isNull } from "drizzle-orm";
import { Effect } from "effect";
import { DB } from "@/db";
import { event } from "@/db/schema/event.schema";
import { ConflictError, EntityNotFoundError } from "@/server/effect";

/** Membership permits reading history, not admitting new people to closed events. */
export function requireJoinableEvent(eventId: string) {
  return Effect.gen(function* () {
    const db = yield* DB;
    const [scope] = yield* db
      .select({ parent: event.parentEventId })
      .from(event)
      .where(eq(event.id, eventId))
      .limit(1);
    if (!scope)
      return yield* Effect.fail(
        new EntityNotFoundError({
          category: "not_found",
          code: "EVENT_NOT_FOUND",
          userMessageKey: "serverErrors.EVENT_NOT_FOUND",
        }),
      );
    // Root first, then child: match the native mutation lock order. Re-read
    // lifecycle after locking so cancellation cannot race a new admission.
    const [parent] = yield* db
      .select({ status: event.status })
      .from(event)
      .where(
        and(eq(event.id, scope.parent ?? eventId), isNull(event.parentEventId)),
      )
      .limit(1)
      .for("share");
    const [target] = yield* db
      .select({
        status: event.status,
        planningStatus: event.planningStatus,
        completion: event.completionStatus,
      })
      .from(event)
      .where(eq(event.id, eventId))
      .limit(1)
      .for("share");
    if (!target || !parent)
      return yield* Effect.fail(
        new EntityNotFoundError({
          category: "not_found",
          code: "EVENT_NOT_FOUND",
          userMessageKey: "serverErrors.EVENT_NOT_FOUND",
        }),
      );
    if (
      target.status === "cancelled" ||
      target.planningStatus === "cancelled" ||
      parent?.status === "cancelled" ||
      target.status === "finished" ||
      parent?.status === "finished" ||
      target.completion === "complete"
    ) {
      return yield* Effect.fail(
        new ConflictError({
          category: "conflict",
          code: "EVENT_CLOSED",
          userMessageKey: "serverErrors.EVENT_CLOSED",
        }),
      );
    }
  });
}
