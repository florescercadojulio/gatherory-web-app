import assert from "node:assert/strict"
import { test } from "node:test"
import { invitationContinuation, invitationPath, invitationURL, safeAuthContinuation } from "../src/lib/event-invitation-links"
import { InviteEventParticipantInputSchema, ShareLinkInput } from "../src/server/events/contracts/event.contracts"

const token = "d41db411-7cfe-47de-99d8-c5916b8fd306"

test("public share links default to guests and cannot invite hosts", () => {
  assert.equal(ShareLinkInput.parse({ eventId: token }).role, "guest")
  assert.equal(ShareLinkInput.safeParse({ eventId: token, role: "host" }).success, false)
  assert.equal(ShareLinkInput.parse({ eventId: token, role: "collaborator" }).role, "collaborator")
})

test("invite links follow the configured application host, not the old placeholder", () => {
  assert.equal(invitationURL("https://app.gatherory.com/api/auth", token), `https://app.gatherory.com/join/${token}`)
  assert.equal(invitationURL("https://dev.gatherory.com", token), `https://dev.gatherory.com/join/${token}`)
  assert.equal(invitationURL("http://localhost:3000", token), `http://localhost:3000/join/${token}`)
  assert.throws(() => invitationURL("javascript:alert(1)", token))
  assert.throws(() => invitationURL("https://secret@evil.example", token))
  assert.throws(() => invitationPath("planning-circle"))
})

test("auth continuation accepts only a valid local invitation path", () => {
  assert.equal(invitationContinuation(`/join/${token}`), `/join/${token}`)
  for (const path of ["https://evil.example", "//evil.example", `/join/${token}?redirect=evil`, "/join/review-wedding", undefined]) {
    assert.equal(invitationContinuation(path), null)
  }
  assert.equal(safeAuthContinuation("/workspaces?tab=events"), "/workspaces?tab=events")
  assert.equal(safeAuthContinuation(`/join/${token}`), `/join/${token}`)
  for (const value of ["//evil.example", "/\\evil.example", "https://evil.example", "/\n/evil.example"]) {
    assert.equal(safeAuthContinuation(value), null)
  }
})

test("invitation input normalizes email and enforces role/permission constraints", () => {
  const input = { eventId: token, email: "  Guest@Example.com  ", role: "guest", planningPermission: "viewOnly" }
  assert.equal(InviteEventParticipantInputSchema.parse(input).email, "guest@example.com")
  assert.equal(InviteEventParticipantInputSchema.safeParse({ ...input, planningPermission: "manage" }).success, false)
  assert.equal(InviteEventParticipantInputSchema.safeParse({ ...input, role: "host" }).success, false)
  assert.equal(InviteEventParticipantInputSchema.safeParse({ ...input, role: "collaborator", planningPermission: "manage" }).success, true)
  assert.equal(InviteEventParticipantInputSchema.safeParse({ ...input, email: "not-an-email" }).success, false)
})
