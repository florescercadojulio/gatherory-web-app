import assert from "node:assert/strict"
import { test } from "node:test"

import { pushRequestSchema } from "../src/server/sync/native-sync-contracts"

test("native sync canonicalizes uppercase UUIDs sent by Foundation", () => {
  const workspaceID = "5CF54762-4A9A-49C3-B1E8-DF26D184AFBA"
  const result = pushRequestSchema.parse({
    mutations: [
      {
        id: "B2A7345B-C4D4-42B6-BA01-913C31597E35",
        scopeID: workspaceID,
        entityType: "workspace",
        entityID: workspaceID,
        operation: "create",
        payload: "e30=",
        createdAt: "2026-10-12T12:00:00Z",
        attemptCount: 0,
      },
    ],
  })

  const mutation = result.mutations[0]
  assert.equal(mutation.id, "b2a7345b-c4d4-42b6-ba01-913c31597e35")
  assert.equal(mutation.scopeID, "5cf54762-4a9a-49c3-b1e8-df26d184afba")
  assert.equal(mutation.entityID, "5cf54762-4a9a-49c3-b1e8-df26d184afba")
  assert.equal(mutation.payloadSchemaVersion, 1)
})

test("native sync rejects unsupported payload schema versions", () => {
  const workspaceID = "5CF54762-4A9A-49C3-B1E8-DF26D184AFBA"
  const result = pushRequestSchema.safeParse({
    mutations: [
      {
        id: "B2A7345B-C4D4-42B6-BA01-913C31597E35",
        scopeID: workspaceID,
        payloadSchemaVersion: 2,
        entityType: "workspace",
        entityID: workspaceID,
        operation: "create",
        payload: "e30=",
        createdAt: "2026-10-12T12:00:00Z",
        attemptCount: 0,
      },
    ],
  })

  assert.equal(result.success, false)
})
