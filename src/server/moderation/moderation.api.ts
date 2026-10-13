import { Effect } from "effect"
import { z } from "zod"
import { PgClientLive } from "@/db"
import { ConflictError, EntityNotFoundError, ForbiddenError, InvalidInputError, runServerEffect } from "@/server/effect"
import { nativeSyncUser, syncJSON } from "@/server/sync/native-sync-auth"
import { BlockPersonInput, HideImageInput, ReportImageInput, ReviewReportInput, isTrustedModerationMutation, reportStatuses } from "./contracts"
import { blockPerson, listBlockedPeople, unblockPerson } from "./user-block.repo"
import { hiddenImageIDs, hideImage, listAbuseReports, reportImage, reportImagePreview, reviewAbuseReport } from "./moderation.repo"

type Operation = "report" | "hide" | "hidden" | "list" | "review" | "preview" | "blocks" | "block" | "unblock"
export async function moderationResponse(request: Request, operation: Operation) {
  let failureStatus = 500
  const program = Effect.gen(function* () {
    const actor = yield* Effect.tryPromise(() => nativeSyncUser(request))
    if (!actor?.emailVerified) {
      failureStatus = actor ? 403 : 401
      return yield* Effect.fail(new ForbiddenError({ category: "authorization", code: "MODERATION_SESSION_REQUIRED", userMessage: "Sign in with a verified account to continue." }))
    }
    if (operation === "hidden") return yield* hiddenImageIDs(actor.id)
    if (operation === "blocks") return yield* listBlockedPeople(actor.id)
    if (operation === "list") {
      const input = z.enum(reportStatuses).safeParse(new URL(request.url).searchParams.get("status") ?? "open")
      if (!input.success) return yield* Effect.fail(new InvalidInputError({ category: "validation", code: "INVALID_REPORT_STATUS", userMessage: "Choose a valid report status." }))
      return yield* listAbuseReports(actor.id, input.data)
    }
    if (operation === "preview") {
      const input = z.uuid().safeParse(new URL(request.url).searchParams.get("reportId"))
      if (!input.success) return yield* Effect.fail(new InvalidInputError({ category: "validation", code: "INVALID_REPORT_ID", userMessage: "Choose a valid report." }))
      return yield* reportImagePreview(actor.id, input.data)
    }
    if (!isTrustedModerationMutation(request, process.env.BETTER_AUTH_URL)) return yield* Effect.fail(new ForbiddenError({ category: "authorization", code: "UNTRUSTED_MODERATION_REQUEST", userMessage: "Open Gatherory and try again." }))
    const body = yield* Effect.tryPromise({ try: () => request.json(), catch: () => new InvalidInputError({ category: "validation", code: "INVALID_REPORT_JSON", userMessage: "Send a valid report and try again." }) })
    if (operation === "block" || operation === "unblock") {
      const input = BlockPersonInput.safeParse(body)
      if (input.success) return yield* operation === "block" ? blockPerson(actor.id, input.data.blockedUserId) : unblockPerson(actor.id, input.data.blockedUserId)
    } else if (operation === "report") {
      const input = ReportImageInput.safeParse(body)
      if (input.success) return yield* reportImage(actor.id, input.data)
    } else if (operation === "hide") {
      const input = HideImageInput.safeParse(body)
      if (input.success) return yield* hideImage(actor.id, input.data.mediaAssetId)
    } else {
      const input = ReviewReportInput.safeParse(body)
      if (input.success) return yield* reviewAbuseReport(actor.id, input.data)
    }
    return yield* Effect.fail(new InvalidInputError({ category: "validation", code: "INVALID_REPORT_INPUT", userMessage: "Check the report details and try again." }))
  }).pipe(Effect.tapError(error => Effect.sync(() => {
    if (error instanceof ForbiddenError) failureStatus = failureStatus === 401 ? 401 : 403
    else if (error instanceof InvalidInputError) failureStatus = 400
    else if (error instanceof EntityNotFoundError) failureStatus = 404
    else if (error instanceof ConflictError) failureStatus = 409
  })), Effect.provide(PgClientLive))
  const result = await runServerEffect(program)
  return syncJSON(result, result.ok ? 200 : failureStatus)
}
