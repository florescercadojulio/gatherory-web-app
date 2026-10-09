export type ClientError = {
  userMessage: string
  errorId: string
}

export type ServerResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ClientError }

export type Page<T> = {
  data: T[]
  hasNextPage: boolean
}
