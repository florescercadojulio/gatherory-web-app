import { createHash } from 'node:crypto'

/** Object key order does not affect a receipt or a published revision. Array order does. */
export function blueprintHash(value: unknown): string {
  function normalize(item: unknown): unknown {
    if (Array.isArray(item)) return item.map(normalize)
    if (item && typeof item === 'object')
      return Object.fromEntries(
        Object.entries(item)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, child]) => [key, normalize(child)])
      )
    return item
  }
  return createHash('sha256')
    .update(JSON.stringify(normalize(value)))
    .digest('hex')
}

/** Preserve v1 request/review hashes when a newly optional list is empty. */
export function blueprintDraftContentHash(value: unknown): string {
  return blueprintHash(blueprintDraftContentForHash(value))
}

export function blueprintDraftContentForHash(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const content = value as Record<string, unknown>
  if (!Array.isArray(content.todos) || content.todos.length > 0) return value
  const { todos: _todos, ...legacyShape } = content
  return legacyShape
}

/** Empty capture task selection is equivalent to the pre-todos selection shape. */
export function legacyCompatibleCaptureSelection<T extends { todoIds?: string[] }>(
  selection: T
): Omit<T, 'todoIds'> | T {
  if (selection.todoIds?.length) return selection
  const { todoIds: _todoIds, ...legacyShape } = selection
  return legacyShape
}
