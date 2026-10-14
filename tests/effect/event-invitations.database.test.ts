import { expect, it } from '@effect/vitest'
import { Cause, Data, Effect, Exit } from 'effect'
import { and, eq } from 'drizzle-orm'

const verification = Effect.gen(function* () {
  const url = new URL(process.env.DATABASE_URL!)
  expect(
    ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname),
    'Only a local database is allowed'
  ).toBeTruthy()
  const { DB, PgClientLive } = yield* Effect.promise(() => import('@/db'))
  const { PgClient } = yield* Effect.promise(() => import('@effect/sql-pg/PgClient'))
  const { user, organization, member } = yield* Effect.promise(
    () => import('@/db/schema/auth.schema')
  )
  const { event, eventParticipant, eventInvitation, workspacePerson, eventShareLink } =
    yield* Effect.promise(() => import('@/db/schema/event.schema'))
  const { nativeWorkspaceSnapshot, nativeSyncScopeMember, nativeSyncEntity, nativeSyncChange } =
    yield* Effect.promise(() => import('@/db/schema/sync.schema'))
  const { createEventInvitation, acceptEventInvitation } = yield* Effect.promise(
    () => import('@/server/events/repos/event.repo')
  )
  const { EventService } = yield* Effect.promise(
    () => import('@/server/events/services/event.service')
  )
  const { EventServiceLive } = yield* Effect.promise(
    () => import('@/server/events/services/event.service.live')
  )
  const { EventRepoLive } = yield* Effect.promise(
    () => import('@/server/events/repos/event.repo.live')
  )
  const { EventAuthorizationLive } = yield* Effect.promise(
    () => import('@/server/events/services/event-authorization.service')
  )
  const {
    createEventShareLink,
    acceptEventShareLink,
    revokeEventShareLink,
    previewEventShareLink,
    listEventJoinRequests,
    reviewEventJoinRequest,
  } = yield* Effect.promise(() => import('@/server/events/repos/event-share-link.repo'))
  const { guestEventInvitations, respondToEvent } = yield* Effect.promise(
    () => import('@/server/events/repos/guest-invitation.repo')
  )
  const { idea, workspacePlanningSettings } = yield* Effect.promise(
    () => import('@/db/schema/planning.schema')
  )
  const { mediaAsset } = yield* Effect.promise(() => import('@/db/schema/media.schema'))
  const { getNativeMediaAccessContext, getNativeMediaActorContext, upsertPendingNativeMedia } =
    yield* Effect.promise(() => import('@/server/media/repos/media.repo'))
  class RollbackVerification extends Data.TaggedError('RollbackVerification')<{}> {}

  const program = Effect.gen(function* () {
    const sql = yield* PgClient
    yield* sql.withTransaction(
      Effect.gen(function* () {
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
          { id: ownerId, name: 'Host', email: `${ownerId}@example.com`, emailVerified: true },
          {
            id: collaboratorId,
            name: 'Collaborator',
            email: collaboratorEmail,
            emailVerified: true,
          },
          { id: guestId, name: 'Guest', email: guestEmail, emailVerified: true },
          {
            id: otherGuestId,
            name: 'Another guest',
            email: `${otherGuestId}@example.com`,
            emailVerified: true,
          },
          {
            id: sharedCollaboratorId,
            name: 'Shared collaborator',
            email: `${sharedCollaboratorId}@example.com`,
            emailVerified: true,
          },
          {
            id: unverifiedId,
            name: 'Unverified',
            email: `${unverifiedId}@example.com`,
            emailVerified: false,
          },
        ])
        yield* db.insert(organization).values({
          id: organizationId,
          name: 'Invitation verification',
          slug: organizationId,
          createdAt: new Date(),
          workspaceType: 'event',
        })
        yield* db.insert(event).values({
          id: eventId,
          organizationId,
          title: 'Invitation verification',
          status: 'draft',
          startsAt: new Date(),
          timeZone: 'America/Detroit',
        })
        const [host] = yield* db
          .insert(workspacePerson)
          .values({
            organizationId,
            userId: ownerId,
            displayName: 'Host',
            email: `${ownerId}@example.com`,
          })
          .returning()
        yield* db
          .insert(eventParticipant)
          .values({ eventId, personId: host.id, role: 'host', planningPermission: 'manage' })
        const archive = Buffer.from(
          JSON.stringify({
            mainEventID: eventId,
            members: [],
            eventParticipations: [],
            mainEventParticipantIDs: [],
          })
        ).toString('base64')
        yield* db
          .insert(nativeWorkspaceSnapshot)
          .values({ scopeId: eventId, ownerUserId: ownerId, organizationId, payload: archive })

        expect(eventId).not.toBe(organizationId)
        expect(
          yield* getNativeMediaActorContext({ scopeId: eventId, userId: ownerId }),
          'Native uploads send the event scope UUID, not the organization ID'
        ).toEqual({ organizationId })
        expect(
          yield* getNativeMediaActorContext({ scopeId: eventId, userId: guestId }),
          'Unlinked accounts cannot upload'
        ).toBe(null)
        expect(
          yield* getNativeMediaActorContext({ scopeId: crypto.randomUUID(), userId: ownerId }),
          'A host cannot use an unrelated scope'
        ).toBe(null)

        const retryId = crypto.randomUUID()
        const retry = {
          organizationId,
          uploadedByUserId: ownerId,
          bucket: 'verification-private-dev',
          storageKey: `verification/${retryId}.png`,
          media: {
            scopeId: eventId,
            mediaAssetId: retryId,
            originalFilename: 'verification.png',
            contentType: 'image/png' as const,
            byteSize: 68,
          },
        }
        expect((yield* upsertPendingNativeMedia(retry)).status).toBe('pending')
        yield* db
          .update(mediaAsset)
          .set({ status: 'failed', checksum: 'stale' })
          .where(eq(mediaAsset.id, retryId))
        for (const change of [
          { uploadedByUserId: guestId },
          { organizationId: 'different-workspace' },
          { bucket: 'different-bucket' },
          { storageKey: 'different-key' },
        ]) {
          expect(
            Exit.isFailure(yield* Effect.exit(upsertPendingNativeMedia({ ...retry, ...change }))),
            'Retries cannot change asset ownership or storage'
          ).toBeTruthy()
        }
        expect(
          (yield* db.select().from(mediaAsset).where(eq(mediaAsset.id, retryId)))[0].status
        ).toBe('failed')
        expect(
          (yield* upsertPendingNativeMedia(retry)).status,
          'The uploader can reopen a failed asset'
        ).toBe('pending')
        expect(
          (yield* db.select().from(mediaAsset).where(eq(mediaAsset.id, retryId)))[0].checksum
        ).toBe(null)
        for (const status of ['ready', 'deleted', 'uploaded', 'processing'] as const) {
          yield* db.update(mediaAsset).set({ status }).where(eq(mediaAsset.id, retryId))
          expect(
            Exit.isFailure(yield* Effect.exit(upsertPendingNativeMedia(retry))),
            `${status} assets must not be reopened`
          ).toBeTruthy()
        }

        const create = (email: string, role: 'guest' | 'collaborator') =>
          createEventInvitation({
            actorUserId: ownerId,
            invitation: {
              eventId,
              email,
              role,
              planningPermission: role === 'guest' ? 'viewOnly' : 'manage',
            },
          })
        const authorizedCreate = (actor: string) =>
          Effect.gen(function* () {
            const service = yield* EventService
            return yield* service.inviteParticipant(actor, {
              eventId,
              email: collaboratorEmail,
              role: 'collaborator',
              planningPermission: 'manage',
            })
          }).pipe(
            Effect.provide(EventServiceLive),
            Effect.provide(EventRepoLive),
            Effect.provide(EventAuthorizationLive)
          )
        const stranger = yield* Effect.exit(authorizedCreate(guestId))
        expect(
          Exit.isFailure(stranger) &&
            stranger.cause.reasons.some(
              (reason) =>
                Cause.isFailReason(reason) &&
                typeof reason.error === 'object' &&
                reason.error !== null &&
                'code' in reason.error &&
                reason.error.code === 'EVENT_PARTICIPANT_REQUIRED'
            )
        ).toBeTruthy()
        yield* authorizedCreate(ownerId)
        const first = yield* create(collaboratorEmail, 'collaborator')
        const second = yield* create(collaboratorEmail, 'collaborator')
        expect(first.token).not.toBe(second.token)
        expect(first.id).toBe(second.id)
        const [existingContact] = yield* db
          .select()
          .from(workspacePerson)
          .where(eq(workspacePerson.email, collaboratorEmail))
        yield* db
          .update(nativeWorkspaceSnapshot)
          .set({
            payload: Buffer.from(
              JSON.stringify({
                mainEventID: eventId.toUpperCase(),
                members: [{ id: existingContact.id.toUpperCase(), name: 'Unlinked contact' }],
                eventParticipations: [],
                mainEventParticipantIDs: [existingContact.id.toUpperCase()],
              })
            ).toString('base64'),
          })
          .where(eq(nativeWorkspaceSnapshot.scopeId, eventId))
        const accept = (token: string, userId = collaboratorId, userEmail = collaboratorEmail) =>
          acceptEventInvitation({ userId, userEmail, invitation: { token } })
        const oldToken = yield* Effect.exit(accept(first.token))
        expect(
          Exit.isFailure(oldToken) &&
            JSON.stringify(oldToken.cause).includes('EVENT_INVITATION_NOT_FOUND')
        ).toBeTruthy()
        const mismatch = yield* Effect.exit(accept(second.token, guestId, guestEmail))
        expect(
          Exit.isFailure(mismatch) && JSON.stringify(mismatch.cause).includes('EMAIL_MISMATCH')
        ).toBeTruthy()
        const accepted = yield* accept(second.token)
        expect(accepted.eventId).toBe(eventId)
        expect(accepted.role).toBe('collaborator')
        expect(yield* accept(second.token)).toEqual(accepted)
        const linked = yield* db
          .select()
          .from(workspacePerson)
          .where(eq(workspacePerson.userId, collaboratorId))
        expect(linked.length).toBe(1)
        const participation = yield* db
          .select()
          .from(eventParticipant)
          .where(
            and(eq(eventParticipant.eventId, eventId), eq(eventParticipant.personId, linked[0].id))
          )
        expect(participation.length).toBe(1)
        expect(
          yield* getNativeMediaActorContext({ scopeId: eventId, userId: collaboratorId })
        ).toEqual({ organizationId })
        yield* db
          .update(eventParticipant)
          .set({ planningPermission: 'contribute' })
          .where(eq(eventParticipant.id, participation[0].id))
        expect(
          yield* getNativeMediaActorContext({ scopeId: eventId, userId: collaboratorId }),
          'Contributors can upload'
        ).toEqual({ organizationId })
        yield* db
          .update(eventParticipant)
          .set({ planningPermission: 'view_only' })
          .where(eq(eventParticipant.id, participation[0].id))
        expect(
          yield* getNativeMediaActorContext({ scopeId: eventId, userId: collaboratorId }),
          'Read-only collaborators cannot upload'
        ).toBe(null)
        yield* db
          .update(eventParticipant)
          .set({ planningPermission: 'manage' })
          .where(eq(eventParticipant.id, participation[0].id))
        const memberships = yield* db
          .select()
          .from(nativeSyncScopeMember)
          .where(eq(nativeSyncScopeMember.scopeId, eventId))
        expect(memberships.find((item) => item.userId === collaboratorId)?.role).toBe('editor')
        const entities = yield* db
          .select()
          .from(nativeSyncEntity)
          .where(eq(nativeSyncEntity.scopeId, eventId))
        const person = JSON.parse(
          Buffer.from(
            entities.find((item) => item.entityType === 'participant')!.payload,
            'base64'
          ).toString()
        )
        expect(person.userID).toBe(collaboratorId)
        expect(person.invitationStatus).toBe('active')
        const [published] = yield* db
          .select()
          .from(nativeWorkspaceSnapshot)
          .where(eq(nativeWorkspaceSnapshot.scopeId, eventId))
        const publishedArchive = JSON.parse(Buffer.from(published.payload, 'base64').toString())
        expect(
          publishedArchive.members.length,
          'Foundation uppercase UUIDs must not create duplicate people'
        ).toBe(1)
        expect(publishedArchive.mainEventParticipantIDs.length).toBe(1)
        const changes = yield* db
          .select()
          .from(nativeSyncChange)
          .where(eq(nativeSyncChange.scopeId, eventId))
        expect(changes.map((item) => item.entityType).sort()).toEqual([
          'event_participation',
          'participant',
          'workspace',
        ])

        const guest = yield* create(guestEmail, 'guest')
        yield* accept(guest.token, guestId, guestEmail)
        const guestMemberships = yield* db
          .select()
          .from(nativeSyncScopeMember)
          .where(eq(nativeSyncScopeMember.userId, guestId))
        expect(guestMemberships.length, 'Guests cannot download private planning archives').toBe(0)
        const publishedId = crypto.randomUUID()
        yield* db.insert(idea).values([
          {
            id: publishedId,
            organizationId,
            eventId,
            category: 'music',
            status: 'approved',
            guestVisibility: 'shown_to_guests',
            title: 'Shared playlist',
            estimatedCost: '123.00',
            configuration: {
              version: 1,
              native: { music: { _0: { tracks: [], privateBudget: 'PRIVATE' } } },
            },
          },
          {
            organizationId,
            eventId,
            category: 'decor',
            status: 'new',
            guestVisibility: 'shown_to_guests',
            title: 'PRIVATE unapproved',
            configuration: { version: 1 },
          },
          {
            organizationId,
            eventId,
            category: 'decor',
            status: 'approved',
            guestVisibility: 'planning_only',
            title: 'PRIVATE planning',
            configuration: { version: 1 },
          },
        ])
        const feed = yield* guestEventInvitations(guestId)
        expect(feed.length).toBe(1)
        expect(feed[0].ideas.map((item) => item.id)).toEqual([publishedId])
        expect(JSON.stringify(feed)).not.toMatch(/PRIVATE|estimatedCost|budgetCap|email/)
        const privateMediaId = crypto.randomUUID()
        yield* db.insert(mediaAsset).values({
          id: privateMediaId,
          organizationId,
          uploadedByUserId: ownerId,
          kind: 'image',
          status: 'ready',
          bucket: 'test-only-no-object',
          storageKey: `test-only/${privateMediaId}.jpg`,
          originalFilename: 'private.jpg',
          contentType: 'image/jpeg',
          byteSize: 100,
        })
        expect(
          yield* getNativeMediaAccessContext({ mediaAssetId: privateMediaId, userId: guestId })
        ).toBe(null)
        expect(yield* getNativeMediaActorContext({ scopeId: eventId, userId: guestId })).toBe(null)
        expect(
          yield* getNativeMediaAccessContext({
            mediaAssetId: privateMediaId,
            userId: collaboratorId,
          })
        ).toBeTruthy()
        yield* respondToEvent(guestId, eventId, 'going')
        expect((yield* guestEventInvitations(guestId))[0].attendance).toBe('going')
        const [rsvpSnapshot] = yield* db
          .select()
          .from(nativeWorkspaceSnapshot)
          .where(eq(nativeWorkspaceSnapshot.scopeId, eventId))
        const rsvpArchive = JSON.parse(Buffer.from(rsvpSnapshot.payload, 'base64').toString())
        expect(
          rsvpArchive.eventParticipations.find(
            (item: { memberID: string }) =>
              item.memberID ===
              rsvpArchive.members.find((person: { userID: string }) => person.userID === guestId).id
          ).attendance
        ).toBe('going')
        expect(
          Exit.isFailure(yield* Effect.exit(respondToEvent(unverifiedId, eventId, 'going')))
        ).toBeTruthy()
        yield* db.update(event).set({ status: 'finished' }).where(eq(event.id, eventId))
        expect(
          Exit.isFailure(yield* Effect.exit(respondToEvent(guestId, eventId, 'not_going')))
        ).toBeTruthy()
        yield* db.update(event).set({ status: 'draft' }).where(eq(event.id, eventId))
        const guestAttemptsInvite = yield* Effect.exit(authorizedCreate(guestId))
        expect(
          Exit.isFailure(guestAttemptsInvite) &&
            guestAttemptsInvite.cause.reasons.some(
              (reason) =>
                Cause.isFailReason(reason) &&
                typeof reason.error === 'object' &&
                reason.error !== null &&
                'code' in reason.error &&
                reason.error.code === 'EVENT_PERMISSION_REQUIRED'
            )
        ).toBeTruthy()

        const publicLink = yield* createEventShareLink(ownerId, { eventId, role: 'guest' })
        expect(
          Exit.isFailure(yield* Effect.exit(acceptEventShareLink(unverifiedId, publicLink.token))),
          'An unverified account cannot join'
        ).toBeTruthy()
        expect(
          (yield* createEventShareLink(ownerId, { eventId, role: 'guest' })).token,
          'Repeated shares reuse an active link'
        ).toBe(publicLink.token)
        expect((yield* previewEventShareLink(publicLink.token))?.title).toBe(
          'Invitation verification'
        )
        const guestPublic = yield* acceptEventShareLink(guestId, publicLink.token)
        expect(guestPublic.role).toBe('guest')
        expect(yield* acceptEventShareLink(guestId, publicLink.token)).toEqual(guestPublic)
        expect(
          (yield* acceptEventShareLink(otherGuestId, publicLink.token)).role,
          'A different email can accept the same link'
        ).toBe('guest')
        const preserved = yield* acceptEventShareLink(collaboratorId, publicLink.token)
        expect(preserved.role, 'A guest link does not downgrade existing members').toBe(
          'collaborator'
        )
        expect(
          (yield* db
            .select()
            .from(nativeSyncScopeMember)
            .where(eq(nativeSyncScopeMember.userId, otherGuestId))).length
        ).toBe(0)
        expect(
          Exit.isFailure(
            yield* Effect.exit(createEventShareLink(guestId, { eventId, role: 'collaborator' }))
          )
        ).toBeTruthy()
        expect(
          Exit.isFailure(yield* Effect.exit(revokeEventShareLink(guestId, eventId)))
        ).toBeTruthy()
        yield* revokeEventShareLink(ownerId, eventId)
        expect(yield* previewEventShareLink(publicLink.token)).toBe(null)
        expect(
          Exit.isFailure(
            yield* Effect.exit(acceptEventShareLink(sharedCollaboratorId, publicLink.token))
          )
        ).toBeTruthy()
        const planningLink = yield* createEventShareLink(ownerId, { eventId, role: 'collaborator' })
        expect(planningLink.token).not.toBe(publicLink.token)
        expect(
          (yield* acceptEventShareLink(guestId, planningLink.token)).role,
          'A forwarded planning link cannot upgrade an existing guest'
        ).toBe('guest')
        expect((yield* acceptEventShareLink(sharedCollaboratorId, planningLink.token)).role).toBe(
          'collaborator'
        )
        expect(
          (yield* previewEventShareLink(planningLink.token, sharedCollaboratorId))?.status
        ).toBe('awaiting_approval')
        expect(
          (yield* db
            .select()
            .from(nativeSyncScopeMember)
            .where(eq(nativeSyncScopeMember.userId, sharedCollaboratorId))).length,
          'A request grants no planning scope'
        ).toBe(0)
        expect(
          (yield* db
            .select()
            .from(workspacePerson)
            .where(eq(workspacePerson.userId, sharedCollaboratorId))).length,
          'A request is not a participant'
        ).toBe(0)
        expect(
          (yield* db.select().from(member).where(eq(member.userId, sharedCollaboratorId))).length,
          'Pending requests grant no organization membership'
        ).toBe(0)
        yield* acceptEventShareLink(sharedCollaboratorId, planningLink.token)
        const { requests } = yield* listEventJoinRequests(ownerId, eventId)
        expect(requests.length, 'Retries do not duplicate requests').toBe(1)
        expect(requests[0].planningPermission).toBe('contribute')
        expect(
          Exit.isFailure(
            yield* Effect.exit(reviewEventJoinRequest(guestId, eventId, requests[0].id, 'approve'))
          )
        ).toBeTruthy()
        yield* reviewEventJoinRequest(ownerId, eventId, requests[0].id, 'approve')
        yield* reviewEventJoinRequest(ownerId, eventId, requests[0].id, 'approve')
        expect(
          (yield* previewEventShareLink(planningLink.token, sharedCollaboratorId))?.status
        ).toBe('accepted')
        const [approvedPerson] = yield* db
          .select()
          .from(workspacePerson)
          .where(eq(workspacePerson.userId, sharedCollaboratorId))
        const [approved] = yield* db
          .select()
          .from(eventParticipant)
          .where(eq(eventParticipant.personId, approvedPerson.id))
        expect(approved.role).toBe('collaborator')
        expect(
          (yield* db.select().from(member).where(eq(member.userId, sharedCollaboratorId)))[0]?.role
        ).toBe('member')
        expect(
          approved.planningPermission,
          'Approval honors configured access, never promotes to manage'
        ).toBe('contribute')
        expect(
          (yield* db
            .select()
            .from(nativeSyncScopeMember)
            .where(eq(nativeSyncScopeMember.userId, sharedCollaboratorId)))[0]?.role
        ).toBe('editor')
        expect(
          Exit.isFailure(yield* Effect.exit(listEventJoinRequests(sharedCollaboratorId, eventId))),
          'Contributors cannot manage requests'
        ).toBeTruthy()
        const deniedId = `denied-${suffix}`,
          readonlyId = `readonly-${suffix}`,
          instantId = `instant-${suffix}`
        yield* db.insert(user).values(
          [deniedId, readonlyId, instantId].map((id) => ({
            id,
            name: id,
            email: `${id}@example.com`,
            emailVerified: true,
          }))
        )
        yield* acceptEventShareLink(deniedId, planningLink.token)
        const deniedRequest = (yield* listEventJoinRequests(ownerId, eventId)).requests[0]
        yield* reviewEventJoinRequest(ownerId, eventId, deniedRequest.id, 'decline')
        expect((yield* previewEventShareLink(planningLink.token, deniedId))?.status).toBe(
          'declined'
        )
        expect(
          Exit.isFailure(yield* Effect.exit(acceptEventShareLink(deniedId, planningLink.token))),
          'Retry cannot bypass a decline'
        ).toBeTruthy()
        yield* acceptEventShareLink(readonlyId, planningLink.token)
        const readonlyRequest = (yield* listEventJoinRequests(ownerId, eventId)).requests[0]
        yield* db.update(event).set({ status: 'finished' }).where(eq(event.id, eventId))
        expect(
          Exit.isFailure(
            yield* Effect.exit(
              reviewEventJoinRequest(ownerId, eventId, readonlyRequest.id, 'approve')
            )
          ),
          'Completed events cannot approve joins'
        ).toBeTruthy()
        yield* db.update(event).set({ status: 'draft' }).where(eq(event.id, eventId))
        yield* revokeEventShareLink(ownerId, eventId)
        expect(
          Exit.isFailure(
            yield* Effect.exit(
              reviewEventJoinRequest(ownerId, eventId, readonlyRequest.id, 'approve')
            )
          ),
          'Revoked links cannot approve pending requests'
        ).toBeTruthy()
        const rotated = yield* createEventShareLink(ownerId, { eventId, role: 'collaborator' })
        expect(
          (yield* listEventJoinRequests(ownerId, eventId)).requests.length,
          'Rotated links hide stale requests'
        ).toBe(0)
        expect(
          Exit.isFailure(
            yield* Effect.exit(
              reviewEventJoinRequest(ownerId, eventId, readonlyRequest.id, 'approve')
            )
          ),
          'Old requests cannot approve a different link generation'
        ).toBeTruthy()
        yield* acceptEventShareLink(readonlyId, rotated.token)
        yield* db.insert(workspacePlanningSettings).values({
          organizationId,
          defaultCollaboratorPermission: 'view_only',
          requiresCollaboratorApproval: true,
        })
        yield* reviewEventJoinRequest(ownerId, eventId, readonlyRequest.id, 'approve')
        expect(
          (yield* db
            .select()
            .from(nativeSyncScopeMember)
            .where(eq(nativeSyncScopeMember.userId, readonlyId)))[0]?.role
        ).toBe('viewer')
        yield* db
          .update(workspacePlanningSettings)
          .set({ requiresCollaboratorApproval: false, defaultCollaboratorPermission: 'contribute' })
          .where(eq(workspacePlanningSettings.organizationId, organizationId))
        expect(
          (yield* acceptEventShareLink(instantId, rotated.token)).status,
          'Explicitly disabling approval permits immediate joins'
        ).toBe('accepted')
        const [instantPerson] = yield* db
          .select()
          .from(workspacePerson)
          .where(eq(workspacePerson.userId, instantId))
        expect(
          (yield* db
            .select()
            .from(eventParticipant)
            .where(eq(eventParticipant.personId, instantPerson.id)))[0].planningPermission
        ).toBe('contribute')
        yield* db
          .update(workspacePlanningSettings)
          .set({ collaboratorLinkEnabled: false })
          .where(eq(workspacePlanningSettings.organizationId, organizationId))
        expect(yield* previewEventShareLink(rotated.token)).toBe(null)
        expect(
          Exit.isFailure(
            yield* Effect.exit(createEventShareLink(ownerId, { eventId, role: 'collaborator' }))
          )
        ).toBeTruthy()
        yield* db
          .update(workspacePlanningSettings)
          .set({ collaboratorLinkEnabled: true })
          .where(eq(workspacePlanningSettings.organizationId, organizationId))
        // Continue the existing expiry checks against the current link generation.
        planningLink.token = rotated.token
        yield* db
          .update(eventShareLink)
          .set({ expiresAt: new Date(0) })
          .where(eq(eventShareLink.eventId, eventId))
        expect(yield* previewEventShareLink(planningLink.token)).toBe(null)
        expect(
          (yield* acceptEventShareLink(otherGuestId, planningLink.token)).role,
          'Expiry stops new joins, not existing participation'
        ).toBe('guest')
        expect((yield* previewEventShareLink(planningLink.token, otherGuestId))?.status).toBe(
          'accepted'
        )
        const renewed = yield* createEventShareLink(ownerId, { eventId, role: 'guest' })
        yield* db
          .delete(eventParticipant)
          .where(and(eq(eventParticipant.eventId, eventId), eq(eventParticipant.personId, host.id)))
        expect(
          yield* previewEventShareLink(renewed.token),
          'An inviter who loses management access cannot keep admitting people'
        ).toBe(null)
        expect(
          Exit.isFailure(yield* Effect.exit(acceptEventShareLink(unverifiedId, renewed.token)))
        ).toBeTruthy()
        const expired = yield* create(`${guestId}-expired@example.com`, 'guest')
        yield* db
          .update(eventInvitation)
          .set({ expiresAt: new Date(0) })
          .where(eq(eventInvitation.id, expired.id))
        const expiry = yield* Effect.exit(
          accept(expired.token, guestId, `${guestId}-expired@example.com`)
        )
        expect(
          Exit.isFailure(expiry) && JSON.stringify(expiry.cause).includes('EXPIRED')
        ).toBeTruthy()
        yield* db
          .update(eventInvitation)
          .set({ status: 'revoked' })
          .where(eq(eventInvitation.id, expired.id))
        const revoked = yield* Effect.exit(
          accept(expired.token, guestId, `${guestId}-expired@example.com`)
        )
        expect(
          Exit.isFailure(revoked) && JSON.stringify(revoked.cause).includes('NOT_FOUND')
        ).toBeTruthy()
        return yield* Effect.fail(new RollbackVerification())
      })
    )
  }).pipe(
    Effect.catchIf(
      (error) => error instanceof RollbackVerification,
      () => Effect.void
    ),
    Effect.provide(PgClientLive)
  )
  return yield* program
})

/** Run explicitly against local Postgres. All fixture writes roll back. */
it.effect(
  'real invitation queries rotate, accept, retry, project native identity, and isolate guests',
  () => verification,
  {
    skip: process.env.RUN_INVITATION_DB_TESTS !== '1',
  }
)
