import type { MessageParams, UserMessageKey } from "@/lib/domain-errors"

export type ClientError = {
  userMessage: string
  errorId: string
  traceId?: string
  code?: string
  messageKey?: UserMessageKey
  messageParams?: MessageParams
}

export type ServerResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ClientError }

export type Page<T> = {
  data: T[]
  hasNextPage: boolean
}
