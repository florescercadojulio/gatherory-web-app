import assert from "node:assert/strict"
import { test } from "node:test"
import { and, eq, inArray } from "drizzle-orm"

/** Requires the existing local dev server. Does not start or build a web app. */
test("native bearer HTTP flow joins, refreshes guest content, responds, and denies private sync", {
  skip: process.env.RUN_INVITATION_HTTP_TESTS !== "1", timeout: 30_000,
}, async () => {
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env.DATABASE_URL!).hostname))
  const base = process.env.INVITATION_TEST_BASE_URL ?? "http://127.0.0.1:3003"
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  const { db, pool } = await import("../src/db")
  const { user, session, organization, event, workspacePerson, eventParticipant, idea, mediaAsset, nativeWorkspaceSnapshot, nativeSyncScopeMember } = await import("../src/db/schema")
  const suffix = crypto.randomUUID()
  const ids = ["host", "guest", "collaborator"].map((role) => `http-invite-${role}-${suffix}`)
  const tokens = ids.map(() => crypto.randomUUID())
  const org = `http-invite-org-${suffix}`
  const otherOrg = `http-invite-other-org-${suffix}`
  const eventId = crypto.randomUUID()
  const otherRootEventId = crypto.randomUUID()
  const foreignEventId = crypto.randomUUID()
  async function request(path: string, actor?: number, method = "GET", body?: unknown) {
    const response = await fetch(`${base}${path}`, { method, headers: {
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
    assert.equal(collaborator.json.data.planningScopeId, eventId)
    assert.equal((await request("/api/sync/bootstrap", 2)).json.snapshots.length, 1)
    await assertPreparedMedia(2)
    assert.equal((await prepareMedia(2, otherRootEventId)).json.ok, false, "Collaboration in one organization grants no access to another")
    await request("/api/invitations", 0, "DELETE", { eventId })
    assert.equal((await request(`/api/invitations/preview?token=${planningToken}`)).status, 404)
    assert.equal((await request(`/api/invitations/preview?token=${planningToken}`, 2)).json.data.status, "accepted")
    assert.equal((await request("/api/invitations/accept", 2, "POST", { token: planningToken })).status, 200)
    await db.delete(eventParticipant).where(and(eq(eventParticipant.eventId, eventId), eq(eventParticipant.personId,
      (await db.select().from(workspacePerson).where(eq(workspacePerson.userId, ids[1])))[0].id)))
    assert.equal((await request("/api/events/invitations", 1)).json.data.events.length, 0)
  } finally {
    // Exact, uniquely named test fixtures only. Never reset or seed the database.
    await db.delete(organization).where(inArray(organization.id, [org, otherOrg]))
    await db.delete(user).where(inArray(user.id, ids))
    await pool.end()
  }
})
