import { transportInput } from "@/lib/input-validation"
import { validateInput } from "@/server/validation"
import { createServerFn } from "@tanstack/react-start"
import { Effect } from "effect"

import { PgClientLive } from "@/db"
import { requireSessionMiddleware } from "@/lib/auth.middleware"
import { runServerEffect, serverOperationError } from "@/server/effect"

import {
  FinalizeEventMediaUploadInputSchema,
  GetEventMediaUrlInputSchema,
  PrepareEventMediaUploadInputSchema,
} from "../contracts/media.contracts"
import {
  finalizeEventMediaUploadWorkflow,
  getEventMediaUrlWorkflow,
  prepareEventMediaUploadWorkflow,
} from "../workflows/media.workflows"

/** Expected tagged failures preserve their identity at promise boundaries. */
export function mediaError(cause: unknown) {
  return serverOperationError(cause, { category: "system", code: "MEDIA_OPERATION_FAILED", userMessageKey: "serverErrors.MEDIA_OPERATION_FAILED" })
}

export const prepareEventMediaUpload = createServerFn({ method: "POST" })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(PrepareEventMediaUploadInputSchema))
  .handler(({ data, context }) =>
    runServerEffect(validateInput(PrepareEventMediaUploadInputSchema, data).pipe(Effect.flatMap((data) =>
      prepareEventMediaUploadWorkflow({
        userId: context.user.id,
        media: data,
      }).pipe(Effect.mapError(mediaError), Effect.provide(PgClientLive)),
    ))),
  )

export const finalizeEventMediaUpload = createServerFn({ method: "POST" })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(FinalizeEventMediaUploadInputSchema))
  .handler(({ data, context }) =>
    runServerEffect(validateInput(FinalizeEventMediaUploadInputSchema, data).pipe(Effect.flatMap((data) =>
      finalizeEventMediaUploadWorkflow({
        userId: context.user.id,
        media: data,
      }).pipe(Effect.mapError(mediaError), Effect.provide(PgClientLive)),
    ))),
  )

export const getEventMediaUrl = createServerFn({ method: "GET" })
  .middleware([requireSessionMiddleware])
  .validator(transportInput(GetEventMediaUrlInputSchema))
  .handler(({ data, context }) =>
    runServerEffect(validateInput(GetEventMediaUrlInputSchema, data).pipe(Effect.flatMap((data) =>
      getEventMediaUrlWorkflow({
        userId: context.user.id,
        mediaAssetId: data.mediaAssetId,
      }).pipe(Effect.mapError(mediaError), Effect.provide(PgClientLive)),
    ))),
  )
