import { randomUUID } from "node:crypto"
import { createServerFn } from "@tanstack/react-start"

import { requireSessionMiddleware } from "@/lib/auth.middleware"
import type { ClientError } from "@/server/result"

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

function failure(userMessage: string): { ok: false; error: ClientError } {
  return {
    ok: false,
    error: { userMessage, errorId: randomUUID() },
  }
}

function mediaFailure(error: unknown) {
  console.error("Media operation failed", error)

  if (error instanceof Error) {
    if (error.message === "MEDIA_STORAGE_NOT_CONFIGURED") {
      return failure("Media storage is not configured yet.")
    }
    if (error.message === "MEDIA_FORBIDDEN") {
      return failure("You do not have permission to change this event's media.")
    }
    if (error.message === "MEDIA_UPLOAD_MISMATCH") {
      return failure("The uploaded image did not match the selected file.")
    }
    if (error.message === "MEDIA_INVALID_STATE") {
      return failure("This media upload can no longer be completed.")
    }
  }

  return failure("The media operation could not be completed. Try again.")
}

export const prepareEventMediaUpload = createServerFn({ method: "POST" })
  .middleware([requireSessionMiddleware])
  .validator(PrepareEventMediaUploadInputSchema)
  .handler(async ({ data, context }) => {
    try {
      return {
        ok: true,
        data: await prepareEventMediaUploadWorkflow({
          userId: context.user.id,
          media: data,
        }),
      } as const
    } catch (error) {
      return mediaFailure(error)
    }
  })

export const finalizeEventMediaUpload = createServerFn({ method: "POST" })
  .middleware([requireSessionMiddleware])
  .validator(FinalizeEventMediaUploadInputSchema)
  .handler(async ({ data, context }) => {
    try {
      return {
        ok: true,
        data: await finalizeEventMediaUploadWorkflow({
          userId: context.user.id,
          media: data,
        }),
      } as const
    } catch (error) {
      return mediaFailure(error)
    }
  })

export const getEventMediaUrl = createServerFn({ method: "GET" })
  .middleware([requireSessionMiddleware])
  .validator(GetEventMediaUrlInputSchema)
  .handler(async ({ data, context }) => {
    try {
      return {
        ok: true,
        data: await getEventMediaUrlWorkflow({
          userId: context.user.id,
          mediaAssetId: data.mediaAssetId,
        }),
      } as const
    } catch (error) {
      return mediaFailure(error)
    }
  })
