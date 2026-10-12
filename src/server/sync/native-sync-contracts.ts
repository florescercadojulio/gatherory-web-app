import { z } from "zod"

// Foundation encodes UUID values in uppercase while Postgres and payload
// materialization use canonical lowercase UUID strings. Normalize at the HTTP
// boundary so IDs from the envelope and IDs embedded in its payload compare
// identically.
const nativeUUIDSchema = z.uuid().transform((value) => value.toLowerCase())

const mutationSchema = z.object({
  id: nativeUUIDSchema,
  scopeID: nativeUUIDSchema,
  payloadSchemaVersion: z.literal(1).default(1),
  entityType: z.enum([
    "workspace",
    "event",
    "idea",
    "participant",
    "event_participation",
    "attendance",
    "expense",
    "registry_item",
    "note",
    "moment",
  ]),
  entityID: nativeUUIDSchema,
  operation: z.enum(["create", "update", "delete"]),
  payload: z.string().max(3_000_000),
  baseVersion: z.number().int().nonnegative().nullable().optional(),
  createdAt: z.iso.datetime(),
  attemptCount: z.number().int().nonnegative(),
})

export const pushRequestSchema = z.object({
  mutations: z.array(mutationSchema).min(1).max(50),
})

export type NativeMutation = z.infer<typeof mutationSchema>
