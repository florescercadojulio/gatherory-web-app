import assert from "node:assert/strict"
import { test } from "node:test"
import { Cause, Data, Effect, Exit } from "effect"
import { and, eq } from "drizzle-orm"

/** Run explicitly against local Postgres. All fixture writes roll back. */
test("real invitation queries rotate, accept, retry, project native identity, and isolate guests", {
  skip: process.env.RUN_INVITATION_DB_TESTS !== "1",
}, async () => {
  const url = new URL(process.env.DATABASE_URL!)
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname), "Only a local database is allowed")
  const { DB, PgClientLive } = await import("../src/db")
  const { PgClient } = await import("@effect/sql-pg/PgClient")
  const { user, organization } = await import("../src/db/schema/auth.schema")
  const { event, eventParticipant, eventInvitation, workspacePerson, eventShareLink } = await import("../src/db/schema/event.schema")
  const { nativeWorkspaceSnapshot, nativeSyncScopeMember, nativeSyncEntity, nativeSyncChange } = await import("../src/db/schema/sync.schema")
  const { createEventInvitation, acceptEventInvitation } = await import("../src/server/events/repos/event.repo")
  const { EventService } = await import("../src/server/events/services/event.service")
  const { EventServiceLive } = await import("../src/server/events/services/event.service.live")
  const { EventRepoLive } = await import("../src/server/events/repos/event.repo.live")
  const { EventAuthorizationLive } = await import("../src/server/events/services/event-authorization.service")
  const { createEventShareLink, acceptEventShareLink, revokeEventShareLink, previewEventShareLink } = await import("../src/server/events/repos/event-share-link.repo")
  const { guestEventInvitations, respondToEvent } = await import("../src/server/events/repos/guest-invitation.repo")
  const { idea } = await import("../src/db/schema/planning.schema")
  const { mediaAsset } = await import("../src/db/schema/media.schema")
  const { getNativeMediaAccessContext, getNativeMediaActorContext, upsertPendingNativeMedia } = await import("../src/server/media/repos/media.repo")
  class RollbackVerification extends Data.TaggedError("RollbackVerification")<{}> {}

  const verification = Effect.gen(function* () {
    const sql = yield* PgClient
    yield* sql.withTransaction(Effect.gen(function* () {
      const db = yield* DB
      const suffix = crypto.randomUUID()
      const ownerId = `invite-owner-${suffix}`
      const collaboratorId = `invite-collaborator-${suffix}`
      const guestId = `invite-guest-${suffix}`
      const organizationId = `invite-org-${suffix}`
      const eventId = crypto.randomUUID()
      const collaboratorEmail = `${collaboratorId}@example.com`
      const guestEmail = `${guestId}@example.com`
      const otherGuestId = `invite-other-guest-${suffix}`
      const sharedCollaboratorId = `invite-shared-collaborator-${suffix}`
      const unverifiedId = `invite-unverified-${suffix}`
      yield* db.insert(user).values([
        { id: ownerId, name: "Host", email: `${ownerId}@example.com`, emailVerified: true },
        { id: collaboratorId, name: "Collaborator", email: collaboratorEmail, emailVerified: true },
        { id: guestId, name: "Guest", email: guestEmail, emailVerified: true },
        { id: otherGuestId, name: "Another guest", email: `${otherGuestId}@example.com`, emailVerified: true },
        { id: sharedCollaboratorId, name: "Shared collaborator", email: `${sharedCollaboratorId}@example.com`, emailVerified: true },
        { id: unverifiedId, name: "Unverified", email: `${unverifiedId}@example.com`, emailVerified: false },
      ])
      yield* db.insert(organization).values({ id: organizationId, name: "Invitation verification", slug: organizationId, createdAt: new Date(), workspaceType: "event" })
      yield* db.insert(event).values({ id: eventId, organizationId, title: "Invitation verification", status: "draft", startsAt: new Date(), timeZone: "America/Detroit" })
      const [host] = yield* db.insert(workspacePerson).values({ organizationId, userId: ownerId, displayName: "Host", email: `${ownerId}@example.com` }).returning()
      yield* db.insert(eventParticipant).values({ eventId, personId: host.id, role: "host", planningPermission: "manage" })
      const archive = Buffer.from(JSON.stringify({ mainEventID: eventId, members: [], eventParticipations: [], mainEventParticipantIDs: [] })).toString("base64")
      yield* db.insert(nativeWorkspaceSnapshot).values({ scopeId: eventId, ownerUserId: ownerId, organizationId, payload: archive })

      assert.notEqual(eventId, organizationId)
      assert.deepEqual(
        yield* getNativeMediaActorContext({ scopeId: eventId, userId: ownerId }),
        { organizationId },
        "Native uploads send the event scope UUID, not the organization ID",
      )
      assert.equal(yield* getNativeMediaActorContext({ scopeId: eventId, userId: guestId }), null, "Unlinked accounts cannot upload")
      assert.equal(yield* getNativeMediaActorContext({ scopeId: crypto.randomUUID(), userId: ownerId }), null, "A host cannot use an unrelated scope")

      const retryId = crypto.randomUUID()
      const retry = {
        organizationId, uploadedByUserId: ownerId, bucket: "verification-private-dev",
        storageKey: `verification/${retryId}.png`,
        media: { scopeId: eventId, mediaAssetId: retryId, originalFilename: "verification.png", contentType: "image/png" as const, byteSize: 68 },
      }
      assert.equal((yield* upsertPendingNativeMedia(retry)).status, "pending")
      yield* db.update(mediaAsset).set({ status: "failed", checksum: "stale" }).where(eq(mediaAsset.id, retryId))
      for (const change of [
        { uploadedByUserId: guestId }, { organizationId: "different-workspace" },
        { bucket: "different-bucket" }, { storageKey: "different-key" },
      ]) {
        assert.ok(Exit.isFailure(yield* Effect.exit(upsertPendingNativeMedia({ ...retry, ...change }))), "Retries cannot change asset ownership or storage")
      }
      assert.equal((yield* db.select().from(mediaAsset).where(eq(mediaAsset.id, retryId)))[0].status, "failed")
      assert.equal((yield* upsertPendingNativeMedia(retry)).status, "pending", "The uploader can reopen a failed asset")
      assert.equal((yield* db.select().from(mediaAsset).where(eq(mediaAsset.id, retryId)))[0].checksum, null)
      for (const status of ["ready", "deleted", "uploaded", "processing"] as const) {
        yield* db.update(mediaAsset).set({ status }).where(eq(mediaAsset.id, retryId))
        assert.ok(Exit.isFailure(yield* Effect.exit(upsertPendingNativeMedia(retry))), `${status} assets must not be reopened`)
      }

      const create = (email: string, role: "guest" | "collaborator") => createEventInvitation({ actorUserId: ownerId, invitation: { eventId, email, role, planningPermission: role === "guest" ? "viewOnly" : "manage" } })
      const authorizedCreate = (actor: string) => Effect.gen(function* () {
        const service = yield* EventService
        return yield* service.inviteParticipant(actor, { eventId, email: collaboratorEmail, role: "collaborator", planningPermission: "manage" })
      }).pipe(Effect.provide(EventServiceLive), Effect.provide(EventRepoLive), Effect.provide(EventAuthorizationLive))
      const stranger = yield* Effect.exit(authorizedCreate(guestId))
      assert.ok(Exit.isFailure(stranger) && stranger.cause.reasons.some((reason) =>
        Cause.isFailReason(reason) && typeof reason.error === "object" && reason.error !== null &&
        "code" in reason.error && reason.error.code === "EVENT_PARTICIPANT_REQUIRED"))
      yield* authorizedCreate(ownerId)
      const first = yield* create(collaboratorEmail, "collaborator")
      const second = yield* create(collaboratorEmail, "collaborator")
      assert.notEqual(first.token, second.token)
      assert.equal(first.id, second.id)
      const [existingContact] = yield* db.select().from(workspacePerson).where(eq(workspacePerson.email, collaboratorEmail))
      yield* db.update(nativeWorkspaceSnapshot).set({ payload: Buffer.from(JSON.stringify({
        mainEventID: eventId.toUpperCase(), members: [{ id: existingContact.id.toUpperCase(), name: "Unlinked contact" }],
        eventParticipations: [], mainEventParticipantIDs: [existingContact.id.toUpperCase()],
      })).toString("base64") }).where(eq(nativeWorkspaceSnapshot.scopeId, eventId))
      const accept = (token: string, userId = collaboratorId, userEmail = collaboratorEmail) => acceptEventInvitation({ userId, userEmail, invitation: { token } })
      const oldToken = yield* Effect.exit(accept(first.token))
      assert.ok(Exit.isFailure(oldToken) && Cause.pretty(oldToken.cause).includes("EVENT_INVITATION_NOT_FOUND"))
      const mismatch = yield* Effect.exit(accept(second.token, guestId, guestEmail))
      assert.ok(Exit.isFailure(mismatch) && Cause.pretty(mismatch.cause).includes("EMAIL_MISMATCH"))
      const accepted = yield* accept(second.token)
      assert.equal(accepted.eventId, eventId)
      assert.equal(accepted.role, "collaborator")
      assert.deepEqual(yield* accept(second.token), accepted)
      const linked = yield* db.select().from(workspacePerson).where(eq(workspacePerson.userId, collaboratorId))
      assert.equal(linked.length, 1)
      const participation = yield* db.select().from(eventParticipant).where(and(eq(eventParticipant.eventId, eventId), eq(eventParticipant.personId, linked[0].id)))
      assert.equal(participation.length, 1)
      assert.deepEqual(yield* getNativeMediaActorContext({ scopeId: eventId, userId: collaboratorId }), { organizationId })
      yield* db.update(eventParticipant).set({ planningPermission: "contribute" }).where(eq(eventParticipant.id, participation[0].id))
      assert.deepEqual(yield* getNativeMediaActorContext({ scopeId: eventId, userId: collaboratorId }), { organizationId }, "Contributors can upload")
      yield* db.update(eventParticipant).set({ planningPermission: "view_only" }).where(eq(eventParticipant.id, participation[0].id))
      assert.equal(yield* getNativeMediaActorContext({ scopeId: eventId, userId: collaboratorId }), null, "Read-only collaborators cannot upload")
      yield* db.update(eventParticipant).set({ planningPermission: "manage" }).where(eq(eventParticipant.id, participation[0].id))
      const memberships = yield* db.select().from(nativeSyncScopeMember).where(eq(nativeSyncScopeMember.scopeId, eventId))
      assert.equal(memberships.find((item) => item.userId === collaboratorId)?.role, "editor")
      const entities = yield* db.select().from(nativeSyncEntity).where(eq(nativeSyncEntity.scopeId, eventId))
      const person = JSON.parse(Buffer.from(entities.find((item) => item.entityType === "participant")!.payload, "base64").toString())
      assert.equal(person.userID, collaboratorId)
      assert.equal(person.invitationStatus, "active")
      const [published] = yield* db.select().from(nativeWorkspaceSnapshot).where(eq(nativeWorkspaceSnapshot.scopeId, eventId))
      const publishedArchive = JSON.parse(Buffer.from(published.payload, "base64").toString())
      assert.equal(publishedArchive.members.length, 1, "Foundation uppercase UUIDs must not create duplicate people")
      assert.equal(publishedArchive.mainEventParticipantIDs.length, 1)
      const changes = yield* db.select().from(nativeSyncChange).where(eq(nativeSyncChange.scopeId, eventId))
      assert.deepEqual(changes.map((item) => item.entityType).sort(), ["event_participation", "participant", "workspace"])

      const guest = yield* create(guestEmail, "guest")
      yield* accept(guest.token, guestId, guestEmail)
      const guestMemberships = yield* db.select().from(nativeSyncScopeMember).where(eq(nativeSyncScopeMember.userId, guestId))
      assert.equal(guestMemberships.length, 0, "Guests cannot download private planning archives")
      const publishedId = crypto.randomUUID()
      yield* db.insert(idea).values([
        { id: publishedId, organizationId, eventId, category: "music", status: "approved", guestVisibility: "shown_to_guests", title: "Shared playlist",
          estimatedCost: "123.00", configuration: { version: 1, native: { music: { _0: { tracks: [], privateBudget: "PRIVATE" } } } } },
        { organizationId, eventId, category: "decor", status: "new", guestVisibility: "shown_to_guests", title: "PRIVATE unapproved", configuration: { version: 1 } },
        { organizationId, eventId, category: "decor", status: "approved", guestVisibility: "planning_only", title: "PRIVATE planning", configuration: { version: 1 } },
      ])
      const feed = yield* guestEventInvitations(guestId)
      assert.equal(feed.length, 1)
      assert.deepEqual(feed[0].ideas.map((item) => item.id), [publishedId])
      assert.doesNotMatch(JSON.stringify(feed), /PRIVATE|estimatedCost|budgetCap|email/)
      const privateMediaId = crypto.randomUUID()
      yield* db.insert(mediaAsset).values({ id: privateMediaId, organizationId, uploadedByUserId: ownerId, kind: "image", status: "ready",
        bucket: "test-only-no-object", storageKey: `test-only/${privateMediaId}.jpg`, originalFilename: "private.jpg", contentType: "image/jpeg", byteSize: 100 })
      assert.equal(yield* getNativeMediaAccessContext({ mediaAssetId: privateMediaId, userId: guestId }), null)
      assert.equal(yield* getNativeMediaActorContext({ scopeId: eventId, userId: guestId }), null)
      assert.ok(yield* getNativeMediaAccessContext({ mediaAssetId: privateMediaId, userId: collaboratorId }))
      yield* respondToEvent(guestId, eventId, "going")
      assert.equal((yield* guestEventInvitations(guestId))[0].attendance, "going")
      const [rsvpSnapshot] = yield* db.select().from(nativeWorkspaceSnapshot).where(eq(nativeWorkspaceSnapshot.scopeId, eventId))
      const rsvpArchive = JSON.parse(Buffer.from(rsvpSnapshot.payload, "base64").toString())
      assert.equal(rsvpArchive.eventParticipations.find((item: { memberID: string }) => item.memberID ===
        rsvpArchive.members.find((person: { userID: string }) => person.userID === guestId).id).attendance, "going")
      assert.ok(Exit.isFailure(yield* Effect.exit(respondToEvent(unverifiedId, eventId, "going"))))
      yield* db.update(event).set({ status: "finished" }).where(eq(event.id, eventId))
      assert.ok(Exit.isFailure(yield* Effect.exit(respondToEvent(guestId, eventId, "not_going"))))
      yield* db.update(event).set({ status: "draft" }).where(eq(event.id, eventId))
      const guestAttemptsInvite = yield* Effect.exit(authorizedCreate(guestId))
      assert.ok(Exit.isFailure(guestAttemptsInvite) && guestAttemptsInvite.cause.reasons.some((reason) =>
        Cause.isFailReason(reason) && typeof reason.error === "object" && reason.error !== null &&
        "code" in reason.error && reason.error.code === "EVENT_PERMISSION_REQUIRED"))

      const publicLink = yield* createEventShareLink(ownerId, { eventId, role: "guest" })
      assert.ok(Exit.isFailure(yield* Effect.exit(acceptEventShareLink(unverifiedId, publicLink.token))), "An unverified account cannot join")
      assert.equal((yield* createEventShareLink(ownerId, { eventId, role: "guest" })).token, publicLink.token, "Repeated shares reuse an active link")
      assert.equal((yield* previewEventShareLink(publicLink.token))?.title, "Invitation verification")
      const guestPublic = yield* acceptEventShareLink(guestId, publicLink.token)
      assert.equal(guestPublic.role, "guest")
      assert.deepEqual(yield* acceptEventShareLink(guestId, publicLink.token), guestPublic)
      assert.equal((yield* acceptEventShareLink(otherGuestId, publicLink.token)).role, "guest", "A different email can accept the same link")
      const preserved = yield* acceptEventShareLink(collaboratorId, publicLink.token)
      assert.equal(preserved.role, "collaborator", "A guest link does not downgrade existing members")
      assert.equal((yield* db.select().from(nativeSyncScopeMember).where(eq(nativeSyncScopeMember.userId, otherGuestId))).length, 0)
      assert.ok(Exit.isFailure(yield* Effect.exit(createEventShareLink(guestId, { eventId, role: "collaborator" }))))
      assert.ok(Exit.isFailure(yield* Effect.exit(revokeEventShareLink(guestId, eventId))))
      yield* revokeEventShareLink(ownerId, eventId)
      assert.equal(yield* previewEventShareLink(publicLink.token), null)
      assert.ok(Exit.isFailure(yield* Effect.exit(acceptEventShareLink(sharedCollaboratorId, publicLink.token))))
      const planningLink = yield* createEventShareLink(ownerId, { eventId, role: "collaborator" })
      assert.notEqual(planningLink.token, publicLink.token)
      assert.equal((yield* acceptEventShareLink(guestId, planningLink.token)).role, "guest", "A forwarded planning link cannot upgrade an existing guest")
      assert.equal((yield* acceptEventShareLink(sharedCollaboratorId, planningLink.token)).role, "collaborator")
      assert.equal((yield* db.select().from(nativeSyncScopeMember).where(eq(nativeSyncScopeMember.userId, sharedCollaboratorId)))[0]?.role, "editor")
      yield* db.update(eventShareLink).set({ expiresAt: new Date(0) }).where(eq(eventShareLink.eventId, eventId))
      assert.equal(yield* previewEventShareLink(planningLink.token), null)
      assert.equal((yield* acceptEventShareLink(otherGuestId, planningLink.token)).role, "guest", "Expiry stops new joins, not existing participation")
      assert.equal((yield* previewEventShareLink(planningLink.token, otherGuestId))?.status, "accepted")
      const renewed = yield* createEventShareLink(ownerId, { eventId, role: "guest" })
      yield* db.delete(eventParticipant).where(and(eq(eventParticipant.eventId, eventId), eq(eventParticipant.personId, host.id)))
      assert.equal(yield* previewEventShareLink(renewed.token), null, "An inviter who loses management access cannot keep admitting people")
      assert.ok(Exit.isFailure(yield* Effect.exit(acceptEventShareLink(unverifiedId, renewed.token))))
      const expired = yield* create(`${guestId}-expired@example.com`, "guest")
      yield* db.update(eventInvitation).set({ expiresAt: new Date(0) }).where(eq(eventInvitation.id, expired.id))
      const expiry = yield* Effect.exit(accept(expired.token, guestId, `${guestId}-expired@example.com`))
      assert.ok(Exit.isFailure(expiry) && Cause.pretty(expiry.cause).includes("EXPIRED"))
      yield* db.update(eventInvitation).set({ status: "revoked" }).where(eq(eventInvitation.id, expired.id))
      const revoked = yield* Effect.exit(accept(expired.token, guestId, `${guestId}-expired@example.com`))
      assert.ok(Exit.isFailure(revoked) && Cause.pretty(revoked.cause).includes("NOT_FOUND"))
      return yield* Effect.fail(new RollbackVerification())
    }))
  }).pipe(
    Effect.catchIf((error) => error instanceof RollbackVerification, () => Effect.void),
    Effect.provide(PgClientLive),
  )
  await Effect.runPromise(verification)
})
