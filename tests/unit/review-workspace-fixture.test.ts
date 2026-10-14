import assert from "node:assert/strict"
import { test } from "vitest"

import {
  createReviewWorkspaceArchive,
  encodeNativeWorkspaceSnapshot,
  reviewWorkspaceIds,
} from "@/db/review-workspace-fixture"

const users = [
  { id: "alex-user", name: "Alex Morgan", email: "planner@gatherory.test" },
  { id: "jordan-user", name: "Jordan Lee", email: "jordan@gatherory.test" },
  { id: "maya-user", name: "Maya Chen", email: "coordinator@gatherory.test" },
  { id: "sam-user", name: "Sam Rivera", email: "guest@gatherory.test" },
  {
    id: "app-review-user",
    name: "Gatherory App Review",
    email: "appreview@gatherory.test",
  },
] as const

test("App Review fixture creates a populated iOS workspace snapshot", () => {
  const archive = createReviewWorkspaceArchive({ users })
  const decoded = JSON.parse(
    Buffer.from(encodeNativeWorkspaceSnapshot(archive), "base64").toString(
      "utf8",
    ),
  ) as typeof archive

  assert.equal(decoded.mainEventID, reviewWorkspaceIds.events.main)
  assert.equal(decoded.title, "Alex & Jordan's Wedding")
  assert.equal(decoded.members.at(-1)?.userID, users[4].id)
  assert.equal(decoded.members.at(-1)?.planningPermission, "manage")
  assert.ok(decoded.timeline.length >= 3)
  assert.deepEqual(
    new Set(decoded.ideas.map((idea) => idea.category)),
    new Set([
      "event",
      "registry",
      "link",
      "venue",
      "attire",
      "flowers",
      "food",
      "photography",
      "music",
      "decor",
      "invitations",
      "honeymoon",
      "other",
    ]),
  )
  assert.ok(
    decoded.ideas.every((idea) =>
      ["new", "maybe", "shortlisted", "chosen", "passed", "archived"].includes(
        idea.status,
      ),
    ),
    "fixture idea statuses must use iOS IdeaStatus raw values",
  )
  assert.ok(decoded.eventExpenses.length >= 1)
  assert.ok(decoded.registry.length >= 1)
  assert.equal(decoded.mainEventLocation.locationName, "Willow & Stone Estate")
  assert.equal(
    (
      decoded.ideas[1].configuration as {
        music: {
          _0: {
            tracks: Array<{
              providerID: string
              catalogID: string
              title: string
              artistName: string
              artworkURL: string
              duration: number
            }>
          }
        }
      }
    ).music._0.tracks[0]?.providerID,
    "apple-music",
  )
  const track = (
    decoded.ideas[1].configuration as {
      music: {
        _0: {
          tracks: Array<{
            providerID: string
            catalogID: string
            title: string
            artistName: string
            artworkURL: string
            duration: number
          }>
        }
      }
    }
  ).music._0.tracks[0]
  assert.equal(track?.catalogID, "i.4YBN1YWf2a62bq9")
  assert.equal(track?.title, "BABYDOLL (Speed)")
  assert.equal(track?.artistName, "Ari Abdul")
  assert.equal(track?.duration, 156.651)
  assert.match(track?.artworkURL ?? "", /^musicKit:\/\/artwork\/library\//)
})

test("App Review snapshot uses Foundation reference dates and valid UUIDs", () => {
  const archive = createReviewWorkspaceArchive({ users })

  assert.equal(typeof archive.mainEventStartsAt, "number")
  assert.ok(archive.mainEventStartsAt > 0)
  assert.equal("weddingDate" in archive, false)
  assert.match(
    archive.mainEventID,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  )
  for (const participation of archive.eventParticipations) {
    assert.match(
      participation.id,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
  }
})
