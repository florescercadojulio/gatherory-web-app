import { expect, test } from 'vitest'
import { and, eq, inArray } from 'drizzle-orm'
import { ideaResponseID } from '@/server/sync/idea-response'

/** Requires the existing local dev server. Does not start or build a web app. */
test(
  'native bearer HTTP flow joins, refreshes guest content, responds, and denies private sync',
  {
    skip: process.env.RUN_INVITATION_HTTP_TESTS !== '1',
    timeout: 60_000,
  },
  async () => {
    expect(
      ['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env.DATABASE_URL!).hostname)
    ).toBeTruthy()
    const base = process.env.INVITATION_TEST_BASE_URL ?? 'http://127.0.0.1:3003'
    expect(['localhost', '127.0.0.1'].includes(new URL(base).hostname)).toBeTruthy()
    const { db, pool } = await import('@/db')
    const { ideaDecision } = await import('@/db/schema')
    const {
      user,
      session,
      organization,
      event,
      workspacePerson,
      eventParticipant,
      idea,
      mediaAsset,
      eventMedia,
      nativeWorkspaceSnapshot,
      nativeSyncScopeMember,
      nativeSyncChange,
      nativeSyncMutationReceipt,
      eventNote,
    } = await import('@/db/schema')
    const suffix = crypto.randomUUID()
    const ids = ['host', 'guest', 'collaborator'].map((role) => `http-invite-${role}-${suffix}`)
    const tokens = ids.map(() => crypto.randomUUID())
    const org = `http-invite-org-${suffix}`
    const otherOrg = `http-invite-other-org-${suffix}`
    const eventId = crypto.randomUUID()
    const otherRootEventId = crypto.randomUUID()
    const foreignEventId = crypto.randomUUID()
    let uploadedCover: { bucket: string; key: string } | undefined
    const storage = await import('@/server/media/connectors/media-storage.con')
    async function request(path: string, actor?: number, method = 'GET', body?: unknown) {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: {
          'X-Client-Source': 'integration-test',
          'X-Request-ID': crypto.randomUUID(),
          ...(actor !== undefined ? { Authorization: `Bearer ${tokens[actor]}` } : {}),
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      })
      return {
        status: response.status,
        json: await response.json(),
        cache: response.headers.get('Cache-Control'),
      }
    }
    try {
      await db.insert(user).values(
        ids.map((id) => ({
          id,
          name: 'Invitation HTTP verification',
          email: `${id}@example.com`,
          emailVerified: true,
        }))
      )
      await db.insert(session).values(
        ids.map((id, index) => ({
          id: crypto.randomUUID(),
          token: tokens[index],
          userId: id,
          expiresAt: new Date(Date.now() + 3600_000),
          updatedAt: new Date(),
        }))
      )
      await db.insert(organization).values([
        {
          id: org,
          name: 'HTTP verification',
          slug: org,
          workspaceType: 'event',
          createdAt: new Date(),
        },
        {
          id: otherOrg,
          name: 'Other HTTP workspace',
          slug: otherOrg,
          workspaceType: 'event',
          createdAt: new Date(),
        },
      ])
      await db.insert(event).values([
        {
          id: eventId,
          organizationId: org,
          title: 'Shared HTTP event',
          status: 'draft',
          startsAt: new Date(),
          timeZone: 'America/Detroit',
          budgetCap: '9000.00',
        },
        {
          id: foreignEventId,
          organizationId: org,
          parentEventId: eventId,
          title: 'PRIVATE other event',
          planningStatus: 'draft',
          category: 'other',
          purpose: 'planning_scouting',
          startsAt: new Date(),
          timeZone: 'America/Detroit',
        },
        {
          id: otherRootEventId,
          organizationId: otherOrg,
          title: 'Other root event',
          status: 'draft',
          startsAt: new Date(),
          timeZone: 'America/Detroit',
        },
      ])
      const [person] = await db
        .insert(workspacePerson)
        .values({ organizationId: org, userId: ids[0], displayName: 'Host' })
        .returning()
      await db
        .insert(eventParticipant)
        .values({ eventId, personId: person.id, role: 'host', planningPermission: 'manage' })
      const [otherPerson] = await db
        .insert(workspacePerson)
        .values({
          organizationId: otherOrg,
          userId: ids[0],
          displayName: 'Host in other workspace',
        })
        .returning()
      await db.insert(eventParticipant).values({
        eventId: otherRootEventId,
        personId: otherPerson.id,
        role: 'host',
        planningPermission: 'manage',
      })
      await db.insert(nativeWorkspaceSnapshot).values({
        scopeId: eventId,
        ownerUserId: ids[0],
        organizationId: org,
        payload: Buffer.from(
          JSON.stringify({
            mainEventID: eventId,
            members: [],
            eventParticipations: [],
            mainEventParticipantIDs: [],
            privateBudget: 'PRIVATE',
          })
        ).toString('base64'),
      })
      await db.insert(idea).values([
        {
          organizationId: org,
          eventId,
          title: 'Published song',
          category: 'music',
          status: 'approved',
          guestVisibility: 'shown_to_guests',
          configuration: { version: 1, native: { music: { _0: { tracks: [] } } } },
        },
        {
          organizationId: org,
          eventId,
          title: 'PRIVATE idea',
          category: 'decor',
          status: 'approved',
          guestVisibility: 'planning_only',
          configuration: { version: 1 },
        },
      ])
      // Exercise the real media workflow, not only its authorization helper.
      // Signing a URL creates no R2 object; pending metadata is fixture-scoped.
      const prepareMedia = (actor: number, scopeId = eventId) =>
        request('/api/media/native/prepare', actor, 'POST', {
          scopeId: scopeId.toUpperCase(),
          mediaAssetId: crypto.randomUUID().toUpperCase(),
          originalFilename: 'scope-regression.jpg',
          contentType: 'image/jpeg',
          byteSize: 100,
        })
      async function assertPreparedMedia(actor: number, scopeId = eventId, expectedOrg = org) {
        const prepared = await prepareMedia(actor, scopeId)
        expect(
          prepared.status,
          'The event scope UUID must resolve to its storage organization'
        ).toBe(200)
        expect(prepared.json.ok).toBe(true)
        expect(prepared.json.data.method).toBe('PUT')
        expect(prepared.json.data.requiredHeaders['Content-Type']).toBe('image/jpeg')
        const [asset] = await db
          .select()
          .from(mediaAsset)
          .where(eq(mediaAsset.id, prepared.json.data.mediaAssetId))
        expect(asset.organizationId).toBe(expectedOrg)
        expect(asset.uploadedByUserId).toBe(ids[actor])
        expect(asset.status).toBe('pending')
        expect(asset.storageKey).toBe(`workspaces/${expectedOrg}/media/${asset.id}/original.jpg`)
        expect(
          new URL(prepared.json.data.uploadUrl).pathname.includes(asset.storageKey)
        ).toBeTruthy()
      }
      // A session's active web workspace must not reroute a mobile outbox item.
      await db
        .update(session)
        .set({ activeOrganizationId: otherOrg })
        .where(eq(session.userId, ids[0]))
      expect((await request('/api/auth/get-session', 0)).json.session.activeOrganizationId).toBe(
        otherOrg
      )
      await assertPreparedMedia(0, eventId, org)
      await db.update(session).set({ activeOrganizationId: org }).where(eq(session.userId, ids[0]))
      expect((await request('/api/auth/get-session', 0)).json.session.activeOrganizationId).toBe(
        org
      )
      await assertPreparedMedia(0, otherRootEventId, otherOrg)
      expect(
        (await prepareMedia(0, foreignEventId)).json.ok,
        'A child event is not a native planning scope'
      ).toBe(false)
      expect((await prepareMedia(2)).json.ok, 'An uninvited account cannot upload').toBe(false)
      const generated = await request('/api/invitations', 0, 'POST', { eventId, role: 'guest' })
      expect(generated.status, JSON.stringify(generated.json)).toBe(200)
      const token = new URL(generated.json.data.url).pathname.split('/').at(-1)
      const preview = await request(`/api/invitations/preview?token=${token}`)
      expect(preview.status).toBe(200)
      expect(preview.json.data.title).toBe('Shared HTTP event')
      expect(
        preview.json.data.coverURL,
        'No upload means the client uses its default artwork'
      ).toBe(null)
      const coverId = crypto.randomUUID()
      // Real private R2 object: verify the bytes, not just that a URL was signed.
      const { env } = await import('@/env')
      const coverBytes = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
        'base64'
      )
      const key = `test-only/invitation-http/${suffix}/${coverId}.png`
      const upload = await storage.createMediaUploadUrl({
        key,
        contentType: 'image/png',
        mediaAssetId: coverId,
      })
      uploadedCover = { bucket: upload.bucket, key }
      const uploaded = await fetch(upload.uploadUrl, {
        method: 'PUT',
        headers: upload.requiredHeaders,
        body: coverBytes,
      })
      expect(uploaded.status, 'Private cover upload must succeed').toBe(200)
      async function assertCoverReadable(url: string) {
        expect(new URL(url).protocol).toBe('https:')
        const image = await fetch(url)
        expect(image.status, 'Invitation recipient can download the signed private image').toBe(200)
        expect(Buffer.from(await image.arrayBuffer())).toEqual(coverBytes)
      }
      await db.insert(mediaAsset).values({
        id: coverId,
        organizationId: org,
        uploadedByUserId: ids[0],
        kind: 'image',
        status: 'ready',
        bucket: env.CLOUDFLARE_R2_PRIVATE_BUCKET_NAME,
        storageKey: key,
        originalFilename: 'cover.png',
        contentType: 'image/png',
        byteSize: coverBytes.length,
      })
      await db
        .insert(eventMedia)
        .values({ organizationId: org, eventId, mediaAssetId: coverId, role: 'cover' })
      const coveredPreview = await request(`/api/invitations/preview?token=${token}`)
      expect(new URL(coveredPreview.json.data.coverURL).pathname.includes(coverId)).toBeTruthy()
      await assertCoverReadable(coveredPreview.json.data.coverURL)
      expect((await request('/api/sync/bootstrap', 1)).json.account.hasCompletedOnboarding).toBe(
        false
      )
      await assertCoverReadable(
        (await request(`/api/invitations/preview?token=${token}`, 1)).json.data.coverURL
      )
      await db
        .update(mediaAsset)
        .set({ moderationHiddenAt: new Date() })
        .where(eq(mediaAsset.id, coverId))
      expect((await request(`/api/invitations/preview?token=${token}`)).json.data.coverURL).toBe(
        null
      )
      await db
        .update(mediaAsset)
        .set({ moderationHiddenAt: null })
        .where(eq(mediaAsset.id, coverId))
      const accepted = await request('/api/invitations/accept', 1, 'POST', { token })
      expect(accepted.status, JSON.stringify(accepted.json)).toBe(200)
      expect(accepted.json.data.role).toBe('guest')
      expect(accepted.json.data.planningScopeId).toBe(null)
      expect(
        (await prepareMedia(1)).json.ok,
        'A guest cannot upload through private planning media'
      ).toBe(false)
      expect((await request('/api/invitations/accept', 1, 'POST', { token })).status).toBe(200)
      const feed = await request('/api/events/invitations', 1)
      expect(feed.status).toBe(200)
      expect(feed.cache!).toMatch(/no-store/)
      expect(feed.json.data.events.length).toBe(1)
      await assertCoverReadable(feed.json.data.events[0].coverURL)
      expect(feed.json.data.events[0].ideas.length).toBe(1)
      expect(JSON.stringify(feed.json)).not.toMatch(/PRIVATE|budgetCap|estimatedCost|email/)
      expect(
        (await request('/api/events/invitations', 1, 'POST', { eventId, attendance: 'going' }))
          .status
      ).toBe(200)
      expect((await request('/api/events/invitations', 1)).json.data.events[0].attendance).toBe(
        'going'
      )
      const hostView = await request('/api/events/invitations', 0)
      expect(
        hostView.json.data.events[0].people.find(
          (person: { id: string }) => person.id === feed.json.data.events[0].viewerPersonId
        ).attendance
      ).toBe('going')
      const hostUpdates = await request(`/api/sync/pull?scopeID=${eventId}`, 0)
      expect(hostUpdates.status).toBe(200)
      expect(
        hostUpdates.json.changes.some(
          (change: { entityType: string; payload: string }) =>
            change.entityType === 'event_participation' &&
            JSON.parse(Buffer.from(change.payload, 'base64').toString()).attendance === 'going'
        )
      ).toBeTruthy()
      expect(
        (
          await request('/api/events/invitations', 1, 'POST', {
            eventId: foreignEventId,
            attendance: 'going',
          })
        ).status
      ).toBe(403)
      // A stale seeded scope grant must not bypass the canonical guest role.
      await db
        .insert(nativeSyncScopeMember)
        .values({ scopeId: eventId, userId: ids[1], role: 'viewer' })
      expect((await request('/api/sync/bootstrap', 1)).json.snapshots.length).toBe(0)
      expect((await request(`/api/sync/pull?scopeID=${eventId}`, 1)).status).toBe(404)
      expect((await request('/api/events/invitations')).status).toBe(401)
      const planningLink = await request('/api/invitations', 0, 'POST', {
        eventId,
        role: 'collaborator',
      })
      const planningToken = new URL(planningLink.json.data.url).pathname.split('/').at(-1)
      const collaborator = await request('/api/invitations/accept', 2, 'POST', {
        token: planningToken,
      })
      expect(collaborator.status).toBe(200)
      expect(collaborator.json.data.status).toBe('awaiting_approval')
      expect(collaborator.json.data.planningScopeId).toBe(null)
      expect((await request('/api/sync/bootstrap', 2)).json.snapshots.length).toBe(0)
      const pending = (await request(`/api/invitations?eventId=${eventId}`, 0)).json.data.requests
      expect(pending.length).toBe(1)
      expect(
        (
          await request('/api/invitations', 2, 'PATCH', {
            eventId,
            requestId: pending[0].id,
            action: 'approve',
          })
        ).status
      ).toBe(403)
      expect(
        (
          await request('/api/invitations', 0, 'PATCH', {
            eventId,
            requestId: pending[0].id,
            action: 'approve',
          })
        ).status
      ).toBe(200)
      expect(
        (await request('/api/invitations/accept', 2, 'POST', { token: planningToken })).json.data
          .planningScopeId
      ).toBe(eventId)
      expect((await request('/api/sync/bootstrap', 2)).json.snapshots.length).toBe(1)
      const joinedChanges = await request(`/api/sync/pull?scopeID=${eventId}`, 2)
      // Who's Coming refreshes this canonical feed, not an event-wide response.
      // Exercise each choice for both guest HTTP RSVP and native planner sync.
      const guestPersonId = feed.json.data.events[0].viewerPersonId
      const collaboratorPersonId = (await request('/api/events/invitations', 2)).json.data.events[0]
        .viewerPersonId
      const participationChange = joinedChanges.json.changes.find(
        (change: { entityType: string; payload: string }) =>
          change.entityType === 'event_participation' &&
          JSON.parse(Buffer.from(change.payload, 'base64').toString()).memberID ===
            collaboratorPersonId
      )
      expect(participationChange).toBeTruthy()
      const participationPayload = JSON.parse(
        Buffer.from(participationChange.payload, 'base64').toString()
      )
      let participationVersion = participationChange.serverVersion
      for (const [wireAttendance, nativeAttendance] of [
        ['not_sure', 'maybe'],
        ['not_going', 'declined'],
        ['going', 'going'],
      ]) {
        expect(
          (
            await request('/api/events/invitations', 1, 'POST', {
              eventId,
              attendance: wireAttendance,
            })
          ).status
        ).toBe(200)
        const beforePlannerResponse = (await request('/api/events/invitations', 0)).json.data
          .events[0]
        expect(
          beforePlannerResponse.people.find((p: { id: string }) => p.id === guestPersonId)
            .attendance
        ).toBe(wireAttendance)
        const updatedParticipation = {
          ...participationPayload,
          attendance: nativeAttendance,
          updatedAt: (Date.now() - Date.UTC(2001, 0, 1)) / 1000,
        }
        const response = await request('/api/sync/push', 2, 'POST', {
          mutations: [
            {
              id: crypto.randomUUID(),
              scopeID: eventId,
              entityID: participationChange.entityID,
              entityType: 'event_participation',
              operation: 'update',
              payloadSchemaVersion: 1,
              payload: Buffer.from(JSON.stringify(updatedParticipation)).toString('base64'),
              baseVersion: participationVersion,
              createdAt: new Date().toISOString(),
              attemptCount: 0,
            },
          ],
        })
        expect(response.json.results[0].disposition, JSON.stringify(response.json)).toBe('applied')
        participationVersion = response.json.results[0].serverVersion
        for (const viewer of [0, 1, 2]) {
          const refreshed = (await request('/api/events/invitations', viewer)).json.data.events[0]
          expect(
            refreshed.people.find((p: { id: string }) => p.id === collaboratorPersonId).attendance
          ).toBe(wireAttendance)
          expect(
            refreshed.people.find((p: { id: string }) => p.id === guestPersonId).attendance
          ).toBe(wireAttendance)
          expect(
            refreshed.people.find((p: { id: string }) => p.id === person.id).attendance,
            "Responding must not change the host's RSVP"
          ).toBe(
            beforePlannerResponse.people.find((p: { id: string }) => p.id === person.id).attendance
          )
        }
      }
      expect(joinedChanges.json.changes.length > 0).toBeTruthy()
      expect(
        joinedChanges.json.changes.every((change: { operation: string }) =>
          ['create', 'update', 'delete'].includes(change.operation)
        ),
        'Every join and RSVP change must use an operation iOS can decode'
      ).toBeTruthy()
      // Existing development rows must heal without another database reset.
      const [historical] = await db
        .insert(nativeSyncChange)
        .values({
          scopeId: eventId,
          ownerUserId: ids[0],
          entityType: 'workspace',
          entityId: eventId,
          operation: 'upsert',
          payload: '',
          serverVersion: 1,
        })
        .returning()
      const repaired = await request(`/api/sync/pull?scopeID=${eventId}`, 2)
      expect(
        repaired.json.changes.find((change: { id: string }) => change.id === historical.id)
          .operation
      ).toBe('update')
      await assertCoverReadable(
        (await request('/api/events/invitations', 2)).json.data.events[0].coverURL
      )
      const nativeCover = await request(
        `/api/media/native/url?mediaAssetId=${coverId.toUpperCase()}`,
        2
      )
      expect(
        nativeCover.status,
        'A collaborator can resolve native media without an active organization'
      ).toBe(200)
      await assertCoverReadable(nativeCover.json.data.url)
      // Canonical collaboration must survive a missing replication grant (for
      // example a role change), without admitting guests with stale grants.
      await db
        .delete(nativeSyncScopeMember)
        .where(
          and(eq(nativeSyncScopeMember.scopeId, eventId), eq(nativeSyncScopeMember.userId, ids[2]))
        )
      expect((await request('/api/sync/bootstrap', 2)).json.snapshots.length).toBe(1)
      expect((await request(`/api/sync/pull?scopeID=${eventId}`, 2)).status).toBe(200)
      // Final sign-out sync can overlap background delivery or another device.
      // Exercise real HTTP + Postgres, not a mocked sequential version check.
      const noteId = crypto.randomUUID()
      const mutation = (body: string, baseVersion: number | null = null) => ({
        id: crypto.randomUUID(),
        scopeID: eventId,
        entityID: noteId,
        entityType: 'note',
        operation: 'update',
        payloadSchemaVersion: 1,
        payload: Buffer.from(
          JSON.stringify({
            id: noteId,
            eventID: eventId,
            authorUserID: 'untrusted-author',
            body,
            sentAt: 813456000,
          })
        ).toString('base64'),
        baseVersion,
        createdAt: new Date().toISOString(),
        attemptCount: 0,
      })
      const push = async (value: ReturnType<typeof mutation>, actor = 0) => {
        const result = await request('/api/sync/push', actor, 'POST', { mutations: [value] })
        expect(result.status, JSON.stringify(result.json)).toBe(200)
        return result.json.results[0]
      }
      const initial = mutation('One durable delivery')
      const retries = await Promise.all(Array.from({ length: 6 }, () => push(initial)))
      expect(retries.filter((r) => r.disposition === 'applied').length).toBe(1)
      expect(retries.filter((r) => r.disposition === 'duplicate').length).toBe(5)
      const storedNote = (await db.select().from(eventNote).where(eq(eventNote.id, noteId)))[0]
      expect(storedNote.eventId).toBe(eventId)
      expect(storedNote.authorUserId).toBe(ids[0])
      expect(storedNote.body).toBe('One durable delivery')
      const collaboratorNotes = await request(`/api/sync/pull?scopeID=${eventId}`, 2)
      expect(collaboratorNotes.status).toBe(200)
      const receivedNote = collaboratorNotes.json.changes.find(
        (change: { entityID: string }) => change.entityID === noteId
      )
      expect(receivedNote, 'A collaborator can pull a newly sent note').toBeTruthy()
      expect(JSON.parse(Buffer.from(receivedNote.payload, 'base64').toString())).toEqual({
        id: noteId,
        eventID: eventId,
        authorUserID: ids[0],
        body: 'One durable delivery',
        sentAt: 813456000,
      })
      expect(
        (await request(`/api/sync/pull?scopeID=${eventId}`, 1)).status,
        'Planning notes remain inaccessible to guests'
      ).toBe(404)
      expect((await push(mutation('Guest cannot send'), 1)).disposition).toBe('rejected')
      const edits = Array.from({ length: 6 }, (_, i) => mutation(`Concurrent edit ${i}`, 1))
      const races = await Promise.all(edits.map((edit, i) => push(edit, i % 2 === 0 ? 0 : 2)))
      expect(races.filter((r) => r.disposition === 'applied').length).toBe(1)
      expect(races.filter((r) => r.disposition === 'conflict').length).toBe(5)
      const losingIndex = races.findIndex((r) => r.disposition === 'conflict')
      expect(
        (await push(edits[losingIndex], losingIndex % 2 === 0 ? 0 : 2)).disposition,
        'Retrying a conflict must not acknowledge an unapplied edit'
      ).toBe('conflict')
      expect((await push(initial, 2)).failureCode).toBe('MUTATION_ID_OWNERSHIP_MISMATCH')
      const changes = await db
        .select()
        .from(nativeSyncChange)
        .where(and(eq(nativeSyncChange.scopeId, eventId), eq(nativeSyncChange.entityId, noteId)))
      expect(changes.map((row) => row.serverVersion).sort()).toEqual([1, 2])
      const winner = races.findIndex((r) => r.disposition === 'applied')
      expect((await db.select().from(eventNote).where(eq(eventNote.id, noteId)))[0].body).toBe(
        `Concurrent edit ${winner}`
      )
      const invalid = mutation('', 2)
      const rejected = await Promise.all([push(invalid), push(invalid)])
      expect(
        rejected.every((r) => r.disposition === 'rejected' && r.failureCode === 'NOTE_BODY_MISSING')
      ).toBeTruthy()
      expect(
        (
          await db
            .select()
            .from(nativeSyncMutationReceipt)
            .where(eq(nativeSyncMutationReceipt.mutationId, invalid.id))
        ).length
      ).toBe(1)
      await assertPreparedMedia(2)
      // Personal input is independent of the shared approval and of other voters.
      const votingIdeaId = crypto.randomUUID()
      await db.insert(idea).values({
        id: votingIdeaId,
        organizationId: org,
        eventId,
        title: 'Team response test',
        category: 'decor',
        status: 'new',
        configuration: { version: 1 },
      })
      const vote = (
        actor: number,
        choice: string | null,
        baseVersion: number | null = null,
        ideaId = votingIdeaId
      ) => ({
        id: crypto.randomUUID(),
        scopeID: eventId,
        entityID: ideaResponseID(ideaId, ids[actor]),
        entityType: 'idea_response',
        operation: 'update',
        payloadSchemaVersion: 1,
        baseVersion,
        createdAt: new Date().toISOString(),
        attemptCount: 0,
        payload: Buffer.from(
          JSON.stringify({
            id: ideaResponseID(ideaId, ids[actor]),
            ideaID: ideaId,
            userID: ids[actor],
            choice,
          })
        ).toString('base64'),
      })
      const submitVote = async (actor: number, mutation: ReturnType<typeof vote>) => {
        const result = await request('/api/sync/push', actor, 'POST', { mutations: [mutation] })
        expect(result.status, JSON.stringify(result.json)).toBe(200)
        return result.json.results[0]
      }
      const hostVote = vote(0, 'love')
      const simultaneous = await Promise.all([
        submitVote(0, hostVote),
        submitVote(2, vote(2, 'pass')),
      ])
      expect(
        simultaneous.every((result) => result.disposition === 'applied'),
        JSON.stringify(simultaneous)
      ).toBeTruthy()
      expect((await submitVote(0, hostVote)).disposition).toBe('duplicate')
      expect(
        (await db.select().from(ideaDecision).where(eq(ideaDecision.ideaId, votingIdeaId))).length
      ).toBe(2)
      expect((await db.select().from(idea).where(eq(idea.id, votingIdeaId)))[0].status).toBe('new')
      expect((await submitVote(2, vote(2, 'maybe', 1))).disposition).toBe('applied')
      expect((await submitVote(0, vote(0, null, 1))).disposition).toBe('applied')
      const remainingVotes = await db
        .select()
        .from(ideaDecision)
        .where(eq(ideaDecision.ideaId, votingIdeaId))
      expect(remainingVotes.map((row) => [row.userId, row.choice])).toEqual([[ids[2], 'maybe']])
      const receivedVotes = (
        await request(`/api/sync/pull?scopeID=${eventId}`, 2)
      ).json.changes.filter(
        (change: { entityType: string }) => change.entityType === 'idea_response'
      )
      expect(
        receivedVotes.length,
        'Both accounts receive independent votes, changes, and retractions'
      ).toBe(4)
      expect((await submitVote(0, vote(2, 'love', 2))).failureCode).toBe(
        'IDEA_RESPONSE_OWNER_MISMATCH'
      )
      expect((await submitVote(1, vote(1, 'love'))).disposition).toBe('rejected')
      expect((await submitVote(0, vote(0, 'love', null, crypto.randomUUID()))).failureCode).toBe(
        'IDEA_RESPONSE_SCOPE_MISMATCH'
      )
      await db.update(idea).set({ status: 'approved' }).where(eq(idea.id, votingIdeaId))
      expect((await submitVote(2, vote(2, 'pass', 2))).failureCode).toBe('IDEA_RESPONSE_CLOSED')
      expect(
        (await prepareMedia(2, otherRootEventId)).json.ok,
        'Collaboration in one organization grants no access to another'
      ).toBe(false)
      await request('/api/invitations', 0, 'DELETE', { eventId })
      expect((await request(`/api/invitations/preview?token=${planningToken}`)).status).toBe(404)
      expect(
        (await request(`/api/invitations/preview?token=${planningToken}`, 2)).json.data.status
      ).toBe('accepted')
      expect(
        (await request('/api/invitations/accept', 2, 'POST', { token: planningToken })).status
      ).toBe(200)
      await db
        .delete(eventParticipant)
        .where(
          and(
            eq(eventParticipant.eventId, eventId),
            eq(
              eventParticipant.personId,
              (await db.select().from(workspacePerson).where(eq(workspacePerson.userId, ids[1])))[0]
                .id
            )
          )
        )
      expect((await request('/api/events/invitations', 1)).json.data.events.length).toBe(0)
      expect((await request('/api/auth/sign-out', 0, 'POST', {})).status).toBe(200)
      expect(
        (await request('/api/sync/push', 0, 'POST', { mutations: [initial] })).status,
        'After sign-out, the old bearer must not deliver any more work'
      ).toBe(401)
    } finally {
      if (uploadedCover) await storage.deleteMediaObject(uploadedCover)
      // Exact, uniquely named test fixtures only. Never reset or seed the database.
      await db.delete(organization).where(inArray(organization.id, [org, otherOrg]))
      await db.delete(user).where(inArray(user.id, ids))
      await pool.end()
    }
  }
)
