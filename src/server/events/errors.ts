import { Data } from "effect"
import type { DomainErrorShape, ErrorCategory, UserMessageKey } from "@/lib/domain-errors"

export class EventRepositoryError extends Data.TaggedError("EventRepositoryError")<DomainErrorShape> {}

const failures: Record<string, { category: ErrorCategory; userMessageKey: UserMessageKey }> = {
  EVENT_PARENT_NOT_FOUND: { category: "not_found", userMessageKey: "serverErrors.EVENT_PARENT_NOT_FOUND" },
  EVENT_NOT_FOUND: { category: "not_found", userMessageKey: "serverErrors.EVENT_NOT_FOUND" },
  EVENT_DEPTH_EXCEEDED: { category: "conflict", userMessageKey: "serverErrors.EVENT_DEPTH_EXCEEDED" },
  EVENT_INVITATION_NOT_FOUND: { category: "not_found", userMessageKey: "serverErrors.EVENT_INVITATION_INVALID" },
  EVENT_INVITATION_ALREADY_USED: { category: "not_found", userMessageKey: "serverErrors.EVENT_INVITATION_INVALID" },
  EVENT_INVITATION_EMAIL_MISMATCH: { category: "authorization", userMessageKey: "serverErrors.EVENT_INVITATION_EMAIL_MISMATCH" },
  EVENT_INVITATION_EXPIRED: { category: "conflict", userMessageKey: "serverErrors.EVENT_INVITATION_EXPIRED" },
}

export function eventRepositoryError(code: string) {
  return new EventRepositoryError({ ...(failures[code] ?? { category: "system" }), code, debugMessage: code })
}
