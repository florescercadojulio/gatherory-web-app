import assert from "node:assert/strict"
import { test } from "vitest"
import { redactAccountPayload, type DeletionPayloadContext } from "@/server/auth/account-deletion-payload"

const context: DeletionPayloadContext = { userId: "departing", personIds: new Set(["person-a"]),
  mediaIds: new Set(["image-a"]), scopeId: "scope", successorPersonId: "person-b" }
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64")
const redact = (value: unknown) => JSON.parse(Buffer.from(redactAccountPayload(encode(value), context), "base64").toString())

test("deletion payload removes identity and participant references, promotes the successor, and preserves shared plans", () => {
  const result = redact({
    members: [{ id: "PERSON-A", userID: "departing", email: "private@example.com" },
      { id: "person-b", userID: "remaining", participantRole: "collaborator", planningPermission: "contribute" }],
    mainEventParticipantIDs: ["PERSON-A", "person-b"],
    eventParticipations: [{ memberID: "PERSON-A", eventID: "scope" }, { memberID: "person-b", eventID: "scope", role: "collaborator" }],
    timeline: [{ id: "child", participantIDs: ["PERSON-A", "person-b"], title: "Keep this event" }],
    ideas: [{ submittedByUserID: "departing", submittedBy: "Private name", title: "Keep this idea" }],
    notes: [{ authorUserID: "departing", body: "Keep this note" }],
    futureModule: { enabled: true },
  })
  assert.equal(result.members.length, 1)
  assert.equal(result.members[0].participantRole, "host")
  assert.deepEqual(result.mainEventParticipantIDs, ["person-b"])
  assert.equal(result.eventParticipations.length, 1)
  assert.equal(result.eventParticipations[0].role, "host")
  assert.deepEqual(result.timeline[0].participantIDs, ["person-b"])
  assert.deepEqual(result.ideas[0], { submittedBy: "", title: "Keep this idea" })
  assert.deepEqual(result.notes[0], { body: "Keep this note" })
  assert.deepEqual(result.futureModule, { enabled: true })
})

test("deleted media references and cached bytes are removed without affecting someone else's media", () => {
  const result = redact({ mainEventMediaAssetID: "IMAGE-A", mainEventImageData: "private-bytes",
    ideas: [{ mediaAssetID: "IMAGE-A", imageData: "private-bytes" }, { mediaAssetID: "image-b", imageData: "keep" }],
    eventMoments: [{ mediaAssetID: "image-a", imageData: "private-bytes", addedAt: 42 }] })
  assert.equal(result.mainEventMediaAssetID, undefined)
  assert.equal(result.mainEventImageData, undefined)
  assert.deepEqual(result.ideas, [{}, { mediaAssetID: "image-b", imageData: "keep" }])
  assert.deepEqual(result.eventMoments, [{ imageData: "", addedAt: 42 }])
})

test("unchanged payloads/tombstones keep their bytes and invalid JSON produces a tagged error", () => {
  const payload = encode({ title: "Keep", cost: 40 })
  assert.equal(redactAccountPayload(payload, context), payload)
  assert.equal(redactAccountPayload("", context), "")
  assert.throws(() => redactAccountPayload("invalid", context), { _tag: "PersistenceError", code: "ACCOUNT_DELETION_INVALID_SYNC_PAYLOAD" })
})
