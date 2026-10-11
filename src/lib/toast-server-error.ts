import { toast } from "sonner"

import type { ClientError } from "@/server/result"

/** Displays the only server-failure details intentionally exposed to a user. */
export function toastServerError(error: ClientError) {
  toast.error(error.userMessage, {
    id: error.errorId,
    description: `Error ID: ${error.errorId}`,
  })
}

export function toastUnexpectedError(errorId: string) {
  toast.error("Something went wrong.", {
    id: errorId,
    description: `Error ID: ${errorId}`,
  })
}
