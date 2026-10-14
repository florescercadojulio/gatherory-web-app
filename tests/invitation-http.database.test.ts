import assert from "node:assert/strict"
import { test } from "node:test"
import { and, eq, inArray } from "drizzle-orm"
import { ideaResponseID } from "../src/server/sync/idea-response"

/** Requires the existing local dev server. Does not start or build a web app. */
test("native bearer HTTP flow joins, refreshes guest content, responds, and denies private sync", {
  skip: process.env.RUN_INVITATION_HTTP_TESTS !== "1", timeout: 60_000,
}, async () => {
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env.DATABASE_URL!).hostname))
  const base = process.env.INVITATION_TEST_BASE_URL ?? "http://127.0.0.1:3003"
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  const { db, pool } = await import("../src/db")
  const { ideaDecision } = await import("../src/db/schema")
  const { user, session, organization, event, workspacePerson, eventParticipant, idea, mediaAsset, eventMedia, nativeWorkspaceSnapshot, nativeSyncScopeMember, nativeSyncChange, nativeSyncMutationReceipt, eventNote } = await import("../src/db/schema")
  const suffix = crypto.randomUUID()
  const ids = ["host", "guest", "collaborator"].map((role) => `http-invite-${role}-${suffix}`)
  const tokens = ids.map(() => crypto.randomUUID())
  const org = `http-invite-org-${suffix}`
  const otherOrg = `http-invite-other-org-${suffix}`
  const eventId = crypto.randomUUID()
  const otherRootEventId = crypto.randomUUID()
  const foreignEventId = crypto.randomUUID()
  let uploadedCover: { bucket: string; key: string } | undefined
  const storage = await import("../src/server/media/connectors/media-storage.con")
  async function request(path: string, actor?: number, method = "GET", body?: unknown) {
    const response = await fetch(`${base}${path}`, { method, headers: {
      "X-Client-Source": "integration-test",
      "X-Request-ID": crypto.randomUUID(),
      ...(actor !== undefined ? { Authorization: `Bearer ${tokens[actor]}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    }, body: body ? JSON.stringify(body) : undefined })
    return { status: response.status, json: await response.json(), cache: response.headers.get("Cache-Control") }
  }
  try {
    await db.insert(user).values(ids.map((id) => ({ id, name: "Invitation HTTP verification", email: `${id}@example.com`, emailVerified: true })))
    await db.insert(session).values(ids.map((id, index) => ({ id: crypto.randomUUID(), token: tokens[index], userId: id,
      expiresAt: new Date(Date.now() + 3600_000), updatedAt: new Date() })))
    await db.insert(organization).values([
      { id: org, name: "HTTP verification", slug: org, workspaceType: "event", createdAt: new Date() },
      { id: otherOrg, name: "Other HTTP workspace", slug: otherOrg, workspaceType: "event", createdAt: new Date() },
    ])
    await db.insert(event).values([
      { id: eventId, organizationId: org, title: "Shared HTTP event", status: "draft", startsAt: new Date(), timeZone: "America/Detroit", budgetCap: "9000.00" },
      { id: foreignEventId, organizationId: org, parentEventId: eventId, title: "PRIVATE other event", planningStatus: "draft", category: "other", purpose: "planning_scouting", startsAt: new Date(), timeZone: "America/Detroit" },
      { id: otherRootEventId, organizationId: otherOrg, title: "Other root event", status: "draft", startsAt: new Date(), timeZone: "America/Detroit" },
    ])
    const [person] = await db.insert(workspacePerson).values({ organizationId: org, userId: ids[0], displayName: "Host" }).returning()
    await db.insert(eventParticipant).values({ eventId, personId: person.id, role: "host", planningPermission: "manage" })
    const [otherPerson] = await db.insert(workspacePerson).values({ organizationId: otherOrg, userId: ids[0], displayName: "Host in other workspace" }).returning()
    await db.insert(eventParticipant).values({ eventId: otherRootEventId, personId: otherPerson.id, role: "host", planningPermission: "manage" })
    await db.insert(nativeWorkspaceSnapshot).values({ scopeId: eventId, ownerUserId: ids[0], organizationId: org,
      payload: Buffer.from(JSON.stringify({ mainEventID: eventId, members: [], eventParticipations: [], mainEventParticipantIDs: [], privateBudget: "PRIVATE" })).toString("base64") })
    await db.insert(idea).values([
      { organizationId: org, eventId, title: "Published song", category: "music", status: "approved", guestVisibility: "shown_to_guests", configuration: { version: 1, native: { music: { _0: { tracks: [] } } } } },
      { organizationId: org, eventId, title: "PRIVATE idea", category: "decor", status: "approved", guestVisibility: "planning_only", configuration: { version: 1 } },
    ])
    // Exercise the real media workflow, not only its authorization helper.
    // Signing a URL creates no R2 object; pending metadata is fixture-scoped.
    const prepareMedia = (actor: number, scopeId = eventId) => request("/api/media/native/prepare", actor, "POST", {
      scopeId: scopeId.toUpperCase(), mediaAssetId: crypto.randomUUID().toUpperCase(),
      originalFilename: "scope-regression.jpg", contentType: "image/jpeg", byteSize: 100,
    })
    async function assertPreparedMedia(actor: number, scopeId = eventId, expectedOrg = org) {
      const prepared = await prepareMedia(actor, scopeId)
      assert.equal(prepared.status, 200, "The event scope UUID must resolve to its storage organization")
      assert.equal(prepared.json.ok, true)
      assert.equal(prepared.json.data.method, "PUT")
      assert.equal(prepared.json.data.requiredHeaders["Content-Type"], "image/jpeg")
      const [asset] = await db.select().from(mediaAsset).where(eq(mediaAsset.id, prepared.json.data.mediaAssetId))
      assert.equal(asset.organizationId, expectedOrg)
      assert.equal(asset.uploadedByUserId, ids[actor])
      assert.equal(asset.status, "pending")
      assert.equal(asset.storageKey, `workspaces/${expectedOrg}/media/${asset.id}/original.jpg`)
      assert.ok(new URL(prepared.json.data.uploadUrl).pathname.includes(asset.storageKey))
    }
    // A session's active web workspace must not reroute a mobile outbox item.
    await db.update(session).set({ activeOrganizationId: otherOrg }).where(eq(session.userId, ids[0]))
    assert.equal((await request("/api/auth/get-session", 0)).json.session.activeOrganizationId, otherOrg)
    await assertPreparedMedia(0, eventId, org)
    await db.update(session).set({ activeOrganizationId: org }).where(eq(session.userId, ids[0]))
    assert.equal((await request("/api/auth/get-session", 0)).json.session.activeOrganizationId, org)
    await assertPreparedMedia(0, otherRootEventId, otherOrg)
    assert.equal((await prepareMedia(0, foreignEventId)).json.ok, false, "A child event is not a native planning scope")
    assert.equal((await prepareMedia(2)).json.ok, false, "An uninvited account cannot upload")
    const generated = await request("/api/invitations", 0, "POST", { eventId, role: "guest" })
    assert.equal(generated.status, 200, JSON.stringify(generated.json))
    const token = new URL(generated.json.data.url).pathname.split("/").at(-1)
    const preview = await request(`/api/invitations/preview?token=${token}`)
    assert.equal(preview.status, 200)
    assert.equal(preview.json.data.title, "Shared HTTP event")
    assert.equal(preview.json.data.coverURL, null, "No upload means the client uses its default artwork")
    const coverId = crypto.randomUUID()
    // Real private R2 object: verify the bytes, not just that a URL was signed.
    const { env } = await import("../src/env")
    const coverBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64")
    const key = `test-only/invitation-http/${suffix}/${coverId}.png`
    const upload = await storage.createMediaUploadUrl({ key, contentType: "image/png", mediaAssetId: coverId })
    uploadedCover = { bucket: upload.bucket, key }
    const uploaded = await fetch(upload.uploadUrl, { method: "PUT", headers: upload.requiredHeaders, body: coverBytes })
    assert.equal(uploaded.status, 200, "Private cover upload must succeed")
    async function assertCoverReadable(url: string) {
      assert.equal(new URL(url).protocol, "https:")
      const image = await fetch(url)
      assert.equal(image.status, 200, "Invitation recipient can download the signed private image")
      assert.deepEqual(Buffer.from(await image.arrayBuffer()), coverBytes)
    }
    await db.insert(mediaAsset).values({ id: coverId, organizationId: org, uploadedByUserId: ids[0],
      kind: "image", status: "ready", bucket: env.CLOUDFLARE_R2_PRIVATE_BUCKET_NAME,
      storageKey: key, originalFilename: "cover.png", contentType: "image/png", byteSize: coverBytes.length })
    await db.insert(eventMedia).values({ organizationId: org, eventId, mediaAssetId: coverId, role: "cover" })
    const coveredPreview = await request(`/api/invitations/preview?token=${token}`)
    assert.ok(new URL(coveredPreview.json.data.coverURL).pathname.includes(coverId))
    await assertCoverReadable(coveredPreview.json.data.coverURL)
    assert.equal((await request("/api/sync/bootstrap", 1)).json.account.hasCompletedOnboarding, false)
    await assertCoverReadable((await request(`/api/invitations/preview?token=${token}`, 1)).json.data.coverURL)
    await db.update(mediaAsset).set({ moderationHiddenAt: new Date() }).where(eq(mediaAsset.id, coverId))
    assert.equal((await request(`/api/invitations/preview?token=${token}`)).json.data.coverURL, null)
    await db.update(mediaAsset).set({ moderationHiddenAt: null }).where(eq(mediaAsset.id, coverId))
    const accepted = await request("/api/invitations/accept", 1, "POST", { token })
    assert.equal(accepted.status, 200, JSON.stringify(accepted.json))
    assert.equal(accepted.json.data.role, "guest")
    assert.equal(accepted.json.data.planningScopeId, null)
    assert.equal((await prepareMedia(1)).json.ok, false, "A guest cannot upload through private planning media")
    assert.equal((await request("/api/invitations/accept", 1, "POST", { token })).status, 200)
    const feed = await request("/api/events/invitations", 1)
    assert.equal(feed.status, 200)
    assert.match(feed.cache!, /no-store/)
    assert.equal(feed.json.data.events.length, 1)
    await assertCoverReadable(feed.json.data.events[0].coverURL)
    assert.equal(feed.json.data.events[0].ideas.length, 1)
    assert.doesNotMatch(JSON.stringify(feed.json), /PRIVATE|budgetCap|estimatedCost|email/)
    assert.equal((await request("/api/events/invitations", 1, "POST", { eventId, attendance: "going" })).status, 200)
    assert.equal((await request("/api/events/invitations", 1)).json.data.events[0].attendance, "going")
    const hostView = await request("/api/events/invitations", 0)
    assert.equal(hostView.json.data.events[0].people.find((person: { id: string }) => person.id === feed.json.data.events[0].viewerPersonId).attendance, "going")
    const hostUpdates = await request(`/api/sync/pull?scopeID=${eventId}`, 0)
    assert.equal(hostUpdates.status, 200)
    assert.ok(hostUpdates.json.changes.some((change: { entityType: string; payload: string }) =>
      change.entityType === "event_participation" && JSON.parse(Buffer.from(change.payload, "base64").toString()).attendance === "going"))
    assert.equal((await request("/api/events/invitations", 1, "POST", { eventId: foreignEventId, attendance: "going" })).status, 403)
    // A stale seeded scope grant must not bypass the canonical guest role.
    await db.insert(nativeSyncScopeMember).values({ scopeId: eventId, userId: ids[1], role: "viewer" })
    assert.equal((await request("/api/sync/bootstrap", 1)).json.snapshots.length, 0)
    assert.equal((await request(`/api/sync/pull?scopeID=${eventId}`, 1)).status, 404)
    assert.equal((await request("/api/events/invitations")).status, 401)
    const planningLink = await request("/api/invitations", 0, "POST", { eventId, role: "collaborator" })
    const planningToken = new URL(planningLink.json.data.url).pathname.split("/").at(-1)
    const collaborator = await request("/api/invitations/accept", 2, "POST", { token: planningToken })
    assert.equal(collaborator.status, 200)
    assert.equal(collaborator.json.data.status, "awaiting_approval")
    assert.equal(collaborator.json.data.planningScopeId, null)
    assert.equal((await request("/api/sync/bootstrap", 2)).json.snapshots.length, 0)
    const pending = (await request(`/api/invitations?eventId=${eventId}`, 0)).json.data.requests
    assert.equal(pending.length, 1)
    assert.equal((await request("/api/invitations", 2, "PATCH", { eventId, requestId: pending[0].id, action: "approve" })).status, 403)
    assert.equal((await request("/api/invitations", 0, "PATCH", { eventId, requestId: pending[0].id, action: "approve" })).status, 200)
    assert.equal((await request("/api/invitations/accept", 2, "POST", { token: planningToken })).json.data.planningScopeId, eventId)
    assert.equal((await request("/api/sync/bootstrap", 2)).json.snapshots.length, 1)
    const joinedChanges = await request(`/api/sync/pull?scopeID=${eventId}`, 2)
    // Who's Coming refreshes this canonical feed, not an event-wide response.
    // Exercise each choice for both guest HTTP RSVP and native planner sync.
    const guestPersonId = feed.json.data.events[0].viewerPersonId
    const collaboratorPersonId = (await request("/api/events/invitations", 2)).json.data.events[0].viewerPersonId
    const participationChange = joinedChanges.json.changes.find((change: { entityType: string; payload: string }) =>
      change.entityType === "event_participation" && JSON.parse(Buffer.from(change.payload, "base64").toString()).memberID === collaboratorPersonId)
    assert.ok(participationChange)
    const participationPayload = JSON.parse(Buffer.from(participationChange.payload, "base64").toString())
    let participationVersion = participationChange.serverVersion
    for (const [wireAttendance, nativeAttendance] of [["not_sure", "maybe"], ["not_going", "declined"], ["going", "going"]]) {
      assert.equal((await request("/api/events/invitations", 1, "POST", { eventId, attendance: wireAttendance })).status, 200)
      const beforePlannerResponse = (await request("/api/events/invitations", 0)).json.data.events[0]
      assert.equal(beforePlannerResponse.people.find((p: { id: string }) => p.id === guestPersonId).attendance, wireAttendance)
      const updatedParticipation = { ...participationPayload, attendance: nativeAttendance, updatedAt: (Date.now() - Date.UTC(2001, 0, 1)) / 1000 }
      const response = await request("/api/sync/push", 2, "POST", { mutations: [{
        id: crypto.randomUUID(), scopeID: eventId, entityID: participationChange.entityID, entityType: "event_participation",
        operation: "update", payloadSchemaVersion: 1, payload: Buffer.from(JSON.stringify(updatedParticipation)).toString("base64"),
        baseVersion: participationVersion, createdAt: new Date().toISOString(), attemptCount: 0,
      }] })
      assert.equal(response.json.results[0].disposition, "applied", JSON.stringify(response.json))
      participationVersion = response.json.results[0].serverVersion
      for (const viewer of [0, 1, 2]) {
        const refreshed = (await request("/api/events/invitations", viewer)).json.data.events[0]
        assert.equal(refreshed.people.find((p: { id: string }) => p.id === collaboratorPersonId).attendance, wireAttendance)
        assert.equal(refreshed.people.find((p: { id: string }) => p.id === guestPersonId).attendance, wireAttendance)
        assert.equal(refreshed.people.find((p: { id: string }) => p.id === person.id).attendance,
          beforePlannerResponse.people.find((p: { id: string }) => p.id === person.id).attendance,
          "Responding must not change the host's RSVP")
      }
    }
    assert.ok(joinedChanges.json.changes.length > 0)
    assert.ok(joinedChanges.json.changes.every((change: { operation: string }) => ["create", "update", "delete"].includes(change.operation)),
      "Every join and RSVP change must use an operation iOS can decode")
    // Existing development rows must heal without another database reset.
    const [historical] = await db.insert(nativeSyncChange).values({ scopeId: eventId, ownerUserId: ids[0], entityType: "workspace", entityId: eventId,
      operation: "upsert", payload: "", serverVersion: 1 }).returning()
    const repaired = await request(`/api/sync/pull?scopeID=${eventId}`, 2)
    assert.equal(repaired.json.changes.find((change: { id: string }) => change.id === historical.id).operation, "update")
    await assertCoverReadable((await request("/api/events/invitations", 2)).json.data.events[0].coverURL)
    const nativeCover = await request(`/api/media/native/url?mediaAssetId=${coverId.toUpperCase()}`, 2)
    assert.equal(nativeCover.status, 200, "A collaborator can resolve native media without an active organization")
    await assertCoverReadable(nativeCover.json.data.url)
    // Canonical collaboration must survive a missing replication grant (for
    // example a role change), without admitting guests with stale grants.
    await db.delete(nativeSyncScopeMember).where(and(eq(nativeSyncScopeMember.scopeId, eventId), eq(nativeSyncScopeMember.userId, ids[2])))
    assert.equal((await request("/api/sync/bootstrap", 2)).json.snapshots.length, 1)
    assert.equal((await request(`/api/sync/pull?scopeID=${eventId}`, 2)).status, 200)
    // Final sign-out sync can overlap background delivery or another device.
    // Exercise real HTTP + Postgres, not a mocked sequential version check.
    const noteId = crypto.randomUUID()
    const mutation = (body: string, baseVersion: number | null = null) => ({
      id: crypto.randomUUID(), scopeID: eventId, entityID: noteId, entityType: "note",
      operation: "update", payloadSchemaVersion: 1,
      payload: Buffer.from(JSON.stringify({ id: noteId, eventID: eventId, authorUserID: "untrusted-author", body, sentAt: 813456000 })).toString("base64"),
      baseVersion, createdAt: new Date().toISOString(), attemptCount: 0,
    })
    const push = async (value: ReturnType<typeof mutation>, actor = 0) => {
      const result = await request("/api/sync/push", actor, "POST", { mutations: [value] })
      assert.equal(result.status, 200, JSON.stringify(result.json))
      return result.json.results[0]
    }
    const initial = mutation("One durable delivery")
    const retries = await Promise.all(Array.from({ length: 6 }, () => push(initial)))
    assert.equal(retries.filter((r) => r.disposition === "applied").length, 1)
    assert.equal(retries.filter((r) => r.disposition === "duplicate").length, 5)
    const storedNote = (await db.select().from(eventNote).where(eq(eventNote.id, noteId)))[0]
    assert.equal(storedNote.eventId, eventId)
    assert.equal(storedNote.authorUserId, ids[0])
    assert.equal(storedNote.body, "One durable delivery")
    const collaboratorNotes = await request(`/api/sync/pull?scopeID=${eventId}`, 2)
    assert.equal(collaboratorNotes.status, 200)
    const receivedNote = collaboratorNotes.json.changes.find((change: { entityID: string }) => change.entityID === noteId)
    assert.ok(receivedNote, "A collaborator can pull a newly sent note")
    assert.deepEqual(JSON.parse(Buffer.from(receivedNote.payload, "base64").toString()), {
      id: noteId, eventID: eventId, authorUserID: ids[0], body: "One durable delivery", sentAt: 813456000,
    })
    assert.equal((await request(`/api/sync/pull?scopeID=${eventId}`, 1)).status, 404,
      "Planning notes remain inaccessible to guests")
    assert.equal((await push(mutation("Guest cannot send"), 1)).disposition, "rejected")
    const edits = Array.from({ length: 6 }, (_, i) => mutation(`Concurrent edit ${i}`, 1))
    const races = await Promise.all(edits.map((edit, i) => push(edit, i % 2 === 0 ? 0 : 2)))
    assert.equal(races.filter((r) => r.disposition === "applied").length, 1)
    assert.equal(races.filter((r) => r.disposition === "conflict").length, 5)
    const losingIndex = races.findIndex((r) => r.disposition === "conflict")
    assert.equal((await push(edits[losingIndex], losingIndex % 2 === 0 ? 0 : 2)).disposition, "conflict",
      "Retrying a conflict must not acknowledge an unapplied edit")
    assert.equal((await push(initial, 2)).failureCode, "MUTATION_ID_OWNERSHIP_MISMATCH")
    const changes = await db.select().from(nativeSyncChange).where(and(eq(nativeSyncChange.scopeId, eventId), eq(nativeSyncChange.entityId, noteId)))
    assert.deepEqual(changes.map((row) => row.serverVersion).sort(), [1, 2])
    const winner = races.findIndex((r) => r.disposition === "applied")
    assert.equal((await db.select().from(eventNote).where(eq(eventNote.id, noteId)))[0].body, `Concurrent edit ${winner}`)
    const invalid = mutation("", 2)
    const rejected = await Promise.all([push(invalid), push(invalid)])
    assert.ok(rejected.every((r) => r.disposition === "rejected" && r.failureCode === "NOTE_BODY_MISSING"))
    assert.equal((await db.select().from(nativeSyncMutationReceipt).where(eq(nativeSyncMutationReceipt.mutationId, invalid.id))).length, 1)
    await assertPreparedMedia(2)
    // Personal input is independent of the shared approval and of other voters.
    const votingIdeaId = crypto.randomUUID()
    await db.insert(idea).values({ id: votingIdeaId, organizationId: org, eventId,
      title: "Team response test", category: "decor", status: "new", configuration: { version: 1 } })
    const vote = (actor: number, choice: string | null, baseVersion: number | null = null, ideaId = votingIdeaId) => ({
      id: crypto.randomUUID(), scopeID: eventId, entityID: ideaResponseID(ideaId, ids[actor]), entityType: "idea_response",
      operation: "update", payloadSchemaVersion: 1, baseVersion, createdAt: new Date().toISOString(), attemptCount: 0,
      payload: Buffer.from(JSON.stringify({ id: ideaResponseID(ideaId, ids[actor]), ideaID: ideaId, userID: ids[actor], choice })).toString("base64"),
    })
    const submitVote = async (actor: number, mutation: ReturnType<typeof vote>) => {
      const result = await request("/api/sync/push", actor, "POST", { mutations: [mutation] })
      assert.equal(result.status, 200, JSON.stringify(result.json))
      return result.json.results[0]
    }
    const hostVote = vote(0, "love")
    const simultaneous = await Promise.all([submitVote(0, hostVote), submitVote(2, vote(2, "pass"))])
    assert.ok(simultaneous.every(result => result.disposition === "applied"), JSON.stringify(simultaneous))
    assert.equal((await submitVote(0, hostVote)).disposition, "duplicate")
    assert.equal((await db.select().from(ideaDecision).where(eq(ideaDecision.ideaId, votingIdeaId))).length, 2)
    assert.equal((await db.select().from(idea).where(eq(idea.id, votingIdeaId)))[0].status, "new")
    assert.equal((await submitVote(2, vote(2, "maybe", 1))).disposition, "applied")
    assert.equal((await submitVote(0, vote(0, null, 1))).disposition, "applied")
    const remainingVotes = await db.select().from(ideaDecision).where(eq(ideaDecision.ideaId, votingIdeaId))
    assert.deepEqual(remainingVotes.map(row => [row.userId, row.choice]), [[ids[2], "maybe"]])
    const receivedVotes = (await request(`/api/sync/pull?scopeID=${eventId}`, 2)).json.changes
      .filter((change: { entityType: string }) => change.entityType === "idea_response")
    assert.equal(receivedVotes.length, 4, "Both accounts receive independent votes, changes, and retractions")
    assert.equal((await submitVote(0, vote(2, "love", 2))).failureCode, "IDEA_RESPONSE_OWNER_MISMATCH")
    assert.equal((await submitVote(1, vote(1, "love"))).disposition, "rejected")
    assert.equal((await submitVote(0, vote(0, "love", null, crypto.randomUUID()))).failureCode, "IDEA_RESPONSE_SCOPE_MISMATCH")
    await db.update(idea).set({ status: "approved" }).where(eq(idea.id, votingIdeaId))
    assert.equal((await submitVote(2, vote(2, "pass", 2))).failureCode, "IDEA_RESPONSE_CLOSED")
    assert.equal((await prepareMedia(2, otherRootEventId)).json.ok, false, "Collaboration in one organization grants no access to another")
    await request("/api/invitations", 0, "DELETE", { eventId })
    assert.equal((await request(`/api/invitations/preview?token=${planningToken}`)).status, 404)
    assert.equal((await request(`/api/invitations/preview?token=${planningToken}`, 2)).json.data.status, "accepted")
    assert.equal((await request("/api/invitations/accept", 2, "POST", { token: planningToken })).status, 200)
    await db.delete(eventParticipant).where(and(eq(eventParticipant.eventId, eventId), eq(eventParticipant.personId,
      (await db.select().from(workspacePerson).where(eq(workspacePerson.userId, ids[1])))[0].id)))
    assert.equal((await request("/api/events/invitations", 1)).json.data.events.length, 0)
    assert.equal((await request("/api/auth/sign-out", 0, "POST", {})).status, 200)
    assert.equal((await request("/api/sync/push", 0, "POST", { mutations: [initial] })).status, 401,
      "After sign-out, the old bearer must not deliver any more work")
  } finally {
    if (uploadedCover) await storage.deleteMediaObject(uploadedCover)
    // Exact, uniquely named test fixtures only. Never reset or seed the database.
    await db.delete(organization).where(inArray(organization.id, [org, otherOrg]))
    await db.delete(user).where(inArray(user.id, ids))
    await pool.end()
  }
})
