import assert from "node:assert/strict"
import { test } from "vitest"
import { mapAppleProfile } from "@/server/auth/apple-profile"

test("Apple email omission recovers only the profile linked to the verified subject", async () => {
  const saved = { email: "person@privaterelay.appleid.com", emailVerified: true, name: "Person" }
  const result = await mapAppleProfile({ sub: "known-apple-subject" }, async (subject) => {
    assert.equal(subject, "known-apple-subject")
    return saved
  })
  assert.deepEqual(result, saved)
})

test("A present Apple email uses the provider's normal verification mapping", async () => {
  assert.deepEqual(await mapAppleProfile({ sub: "subject", email: "person@example.com" }, async () => {
    assert.fail("Must not replace a current Apple email with a cached one")
  }), {})
})

test("Missing-email deleted and unknown identities get a recovery error, never a placeholder", async () => {
  for (const sub of ["deleted-subject", "unknown-subject", ""]) {
    await assert.rejects(mapAppleProfile({ sub }, async () => undefined), (error: any) => {
      assert.equal(error.status, "BAD_REQUEST")
      assert.equal(error.body.code, "APPLE_EMAIL_REQUIRED")
      return true
    })
  }
})

test("A saved unverified email is never promoted to verified", async () => {
  const result = await mapAppleProfile({ sub: "subject" }, async () => ({
    email: "person@example.com", emailVerified: false, name: "Person",
  }))
  assert.equal(result.emailVerified, false)
})
