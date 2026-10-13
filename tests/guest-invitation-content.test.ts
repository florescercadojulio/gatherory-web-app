import assert from "node:assert/strict"
import { test } from "node:test"
import { guestIdeaContent } from "../src/lib/guest-invitation-content"

test("invitation configuration is explicitly allowlisted, including nested music fields", () => {
  const content = guestIdeaContent("music", { version: 1, secret: "PRIVATE", native: { music: { _0: {
    privateBudget: 1234, tracks: [{ providerID: "apple-music", catalogID: "123", title: "Song", artistName: "Artist", privateNotes: "PRIVATE" }],
  } } } })
  assert.equal(content.tracks.length, 1)
  assert.doesNotMatch(JSON.stringify(content), /PRIVATE|privateBudget|privateNotes/)
  assert.equal(guestIdeaContent("link", { native: { link: { _0: { url: "javascript:alert(1)" } } } }).linkURL, null)
  assert.deepEqual(guestIdeaContent("attire", { native: { attire: { _0: { style: "garden", restrictions: "No white", internalPrice: 999 } } } }).configuration,
    { attire: { _0: { style: "garden", restrictions: "No white" } } })
})
