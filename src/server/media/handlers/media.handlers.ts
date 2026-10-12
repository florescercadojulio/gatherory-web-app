import { createServerFn } from "@tanstack/react-start"
import { Effect } from "effect"

import { PgClientLive } from "@/db"
import { requireSessionMiddleware } from "@/lib/auth.middleware"
import {
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
  InvalidInputError,
  ServerOperationError,
  runServerEffect,
} from "@/server/effect"

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

export function mediaError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "MEDIA_STORAGE_NOT_CONFIGURED") {
      return new ExternalServiceError({
        category: "external",
        code: error.message,
        userMessage: "Media storage is not configured yet.",
        cause: error,
      })
    }
    if (error.message === "MEDIA_FORBIDDEN") {
      return new ForbiddenError({
        category: "authorization",
        code: error.message,
        userMessage: "You do not have permission to change this event's media.",
        cause: error,
      })
    }
    if (error.message === "MEDIA_UPLOAD_MISMATCH") {
      return new InvalidInputError({
        category: "validation",
        code: error.message,
        userMessage: "The uploaded image did not match the selected file.",
        cause: error,
      })
    }
    if (error.message === "MEDIA_INVALID_STATE") {
      return new ConflictError({
        category: "conflict",
        code: error.message,
        userMessage: "This media upload can no longer be completed.",
        cause: error,
      })
    }
  }

  return new ServerOperationError({
    category: "system",
    code: "MEDIA_OPERATION_FAILED",
    userMessage: "The media operation could not be completed. Try again.",
    cause: error,
  })
}

export const prepareEventMediaUpload = createServerFn({ method: "POST" })
  .middleware([requireSessionMiddleware])
  .validator(PrepareEventMediaUploadInputSchema)
  .handler(({ data, context }) =>
    runServerEffect(
      prepareEventMediaUploadWorkflow({
        userId: context.user.id,
        media: data,
      }).pipe(Effect.mapError(mediaError), Effect.provide(PgClientLive)),
    ),
  )

export const finalizeEventMediaUpload = createServerFn({ method: "POST" })
  .middleware([requireSessionMiddleware])
  .validator(FinalizeEventMediaUploadInputSchema)
  .handler(({ data, context }) =>
    runServerEffect(
      finalizeEventMediaUploadWorkflow({
        userId: context.user.id,
        media: data,
      }).pipe(Effect.mapError(mediaError), Effect.provide(PgClientLive)),
    ),
  )

export const getEventMediaUrl = createServerFn({ method: "GET" })
  .middleware([requireSessionMiddleware])
  .validator(GetEventMediaUrlInputSchema)
  .handler(({ data, context }) =>
    runServerEffect(
      getEventMediaUrlWorkflow({
        userId: context.user.id,
        mediaAssetId: data.mediaAssetId,
      }).pipe(Effect.mapError(mediaError), Effect.provide(PgClientLive)),
    ),
  )
