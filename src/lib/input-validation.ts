import type { z } from "zod"

/** Transport typing only; validate inside the shared Effect response boundary. */
export function transportInput<T extends z.ZodType>(_schema: T) {
  return (input: z.input<T>): z.input<T> => input
}

