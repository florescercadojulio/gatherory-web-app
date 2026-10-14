import { expect, test } from 'vitest'
import { hashPassword } from 'better-auth/crypto'
import { and, eq, inArray } from 'drizzle-orm'

/** Real HTTP requests matching the native client, not a mocked deletion hook.
 * Requires the existing local server and local DB; never starts/builds the app.
 * R2 is a separate opt-in, restricted to the private DEV bucket and exact new keys.
 */
test(
  'account deletion through the server cleans private data and preserves shared planning',
  {
    skip: process.env.RUN_ACCOUNT_DELETION_HTTP_TESTS !== '1',
    timeout: 120_000,
  },
  async () => {
    const step = async (_name: string, run: () => Promise<void>) => run()
    const diagnostic = (message: string) => console.info(message)
    const localHosts = ['localhost', '127.0.0.1', '[::1]']
    expect(localHosts.includes(new URL(process.env.DATABASE_URL!).hostname)).toBeTruthy()
    const base = process.env.ACCOUNT_DELETION_TEST_BASE_URL ?? 'http://127.0.0.1:3003'
    expect(
      localHosts.includes(new URL(base).hostname),
      'Never delete accounts on a remote server'
    ).toBeTruthy()
    const withR2 = process.env.RUN_ACCOUNT_DELETION_R2_TESTS === '1'
    if (withR2) expect(process.env.CLOUDFLARE_R2_PRIVATE_BUCKET_NAME).toBe('gatherory-private-dev')

    const { db, pool } = await import('@/db')
    const {
      user,
      account,
      session,
      organization,
      member,
      event,
      workspacePerson,
      eventParticipant,
      mediaAsset,
      nativeWorkspaceSnapshot,
      nativeSyncScopeMember,
      nativeSyncEntity,
      nativeSyncChange,
    } = await import('@/db/schema')
    const { inspectMediaObject, deleteMediaObject } =
      await import('@/server/media/connectors/media-storage.con')
    const suffix = crypto.randomUUID()
    const ids = ['private-owner', 'shared-owner', 'successor', 'writer', 'guest'].map(
      (role) => `deletion-http-${role}-${suffix}`
    )
    const orgs = ['private', 'shared'].map((role) => `deletion-http-${role}-${suffix}`)
    const scopes = [crypto.randomUUID(), crypto.randomUUID()]
    const tokens: string[] = []
    const objects = new Map<string, { bucket: string; key: string }>()
    const assetIds: string[] = []
    const bytes = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6dEAAAAAASUVORK5CYII=',
      'base64'
    )
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')

    async function request(path: string, actor?: number, body?: unknown) {
      const response = await fetch(`${base}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        signal: AbortSignal.timeout(30_000),
        headers: {
          ...(path === '/api/auth/sign-in/email'
            ? { Origin: new URL(process.env.BETTER_AUTH_URL!).origin }
            : {}),
          ...(actor === undefined ? {} : { Authorization: `Bearer ${tokens[actor]}` }),
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      return { status: response.status, json: await response.json() }
    }

    async function upload(actor: number, scope: number) {
      const id = crypto.randomUUID()
      const prepared = await request('/api/media/native/prepare', actor, {
        scopeId: scopes[scope],
        mediaAssetId: id,
        originalFilename: 'deletion-verification.png',
        contentType: 'image/png',
        byteSize: bytes.length,
      })
      expect(prepared.status, 'Disposable media preparation must succeed').toBe(200)
      const [asset] = await db.select().from(mediaAsset).where(eq(mediaAsset.id, id))
      expect(asset.bucket, 'Server must also target DEV storage').toBe('gatherory-private-dev')
      expect(asset.organizationId).toBe(orgs[scope])
      expect(asset.storageKey).toBe(`workspaces/${orgs[scope]}/media/${id}/original.png`)
      const object = { bucket: asset.bucket, key: asset.storageKey }
      objects.set(id, object)
      const uploaded = await fetch(prepared.json.data.uploadUrl, {
        method: 'PUT',
        headers: prepared.json.data.requiredHeaders,
        body: bytes,
        signal: AbortSignal.timeout(30_000),
      })
      expect(uploaded.status, 'Disposable image must reach real R2').toBe(200)
      expect(
        (await request('/api/media/native/finalize', actor, { mediaAssetId: id })).status
      ).toBe(200)
      expect((await inspectMediaObject(object)).byteSize).toBe(bytes.length)
      return id
    }

    try {
      expect((await request('/api/auth/ok')).status).toBe(200)
      const password = `Deletion-test-${crypto.randomUUID()}`
      const hashedPassword = await hashPassword(password)
      await db.insert(user).values(
        ids.map((id) => ({
          id,
          name: 'Disposable deletion verification',
          email: `${id}@example.com`,
          emailVerified: true,
        }))
      )
      await db.insert(account).values(
        ids.map((userId) => ({
          id: crypto.randomUUID(),
          userId,
          accountId: userId,
          providerId: 'credential',
          password: hashedPassword,
          updatedAt: new Date(),
        }))
      )
      for (const [index, id] of ids.entries()) {
        const signedIn = await request('/api/auth/sign-in/email', undefined, {
          email: `${id}@example.com`,
          password,
        })
        expect(
          signedIn.status,
          `Real email/password sign-in must succeed (${signedIn.json.code ?? 'no error code'})`
        ).toBe(200)
        expect(signedIn.json.user.id, 'Server and test must use the same database').toBe(id)
        expect(typeof signedIn.json.token).toBe('string')
        tokens[index] = signedIn.json.token
        expect((await request('/api/auth/get-session', index)).json.user.id).toBe(id)
      }
      await db.insert(organization).values(
        orgs.map((id) => ({
          id,
          slug: id,
          name: 'Disposable deletion verification',
          createdAt: new Date(),
        }))
      )
      await db.insert(member).values([
        {
          id: crypto.randomUUID(),
          organizationId: orgs[0],
          userId: ids[0],
          role: 'owner',
          createdAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          organizationId: orgs[1],
          userId: ids[1],
          role: 'owner',
          createdAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          organizationId: orgs[1],
          userId: ids[2],
          role: 'member',
          createdAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          organizationId: orgs[1],
          userId: ids[3],
          role: 'member',
          createdAt: new Date(Date.now() + 1000),
        },
        // Deliberately stale org membership: oldest member is a guest, never an heir.
        {
          id: crypto.randomUUID(),
          organizationId: orgs[1],
          userId: ids[4],
          role: 'member',
          createdAt: new Date(0),
        },
      ])
      await db.insert(event).values(
        scopes.map((id, index) => ({
          id,
          organizationId: orgs[index],
          title: 'Disposable deletion event',
          status: 'draft' as const,
          startsAt: new Date(),
          timeZone: 'America/Detroit',
        }))
      )
      const people = await db
        .insert(workspacePerson)
        .values(
          ids.map((userId, index) => ({
            organizationId: orgs[index === 0 ? 0 : 1],
            userId,
            displayName: 'Disposable deletion verification',
            email: `${userId}@example.com`,
            avatarUrl: `https://example.com/${userId}.png`,
          }))
        )
        .returning()
      const participations = await db
        .insert(eventParticipant)
        .values(
          people.map((person) => ({
            personId: person.id,
            eventId: scopes[person.userId === ids[0] ? 0 : 1],
            role:
              person.userId === ids[4]
                ? ('guest' as const)
                : [ids[2], ids[3]].includes(person.userId!)
                  ? ('collaborator' as const)
                  : ('host' as const),
            planningPermission:
              person.userId === ids[4]
                ? ('view_only' as const)
                : [ids[2], ids[3]].includes(person.userId!)
                  ? ('contribute' as const)
                  : ('manage' as const),
          }))
        )
        .returning()
      const personPayloads = people.map((person) => ({
        id: person.id,
        userID: person.userId,
        name: person.displayName,
        email: person.email,
        profileImageURL: person.avatarUrl,
        initials: 'DV',
        participantRole:
          person.userId === ids[4]
            ? 'guest'
            : person.userId === ids[0] || person.userId === ids[1]
              ? 'host'
              : 'collaborator',
        planningPermission:
          person.userId === ids[4]
            ? 'viewOnly'
            : person.userId === ids[0] || person.userId === ids[1]
              ? 'manage'
              : 'contribute',
        attendance: 'going',
        invitationStatus: 'active',
      }))
      const participationPayloads = participations.map((item) => ({
        id: item.id,
        eventID: item.eventId,
        memberID: item.personId,
        role: item.role,
        planningPermission: item.planningPermission,
        attendance: 'going',
        invitationStatus: 'active',
        createdAt: 800_000_000,
        updatedAt: 800_000_000,
      }))
      await db.insert(nativeWorkspaceSnapshot).values(
        scopes.map((scopeId, index) => ({
          scopeId,
          organizationId: orgs[index],
          ownerUserId: ids[index],
          payload: encode({
            mainEventID: scopeId,
            members: personPayloads.filter(
              (person) => people.find((p) => p.id === person.id)!.organizationId === orgs[index]
            ),
            eventParticipations: participationPayloads.filter((item) => item.eventID === scopeId),
            mainEventParticipantIDs: participations
              .filter((item) => item.eventId === scopeId)
              .map((item) => item.personId),
          }),
        }))
      )
      await db.insert(nativeSyncScopeMember).values([
        { scopeId: scopes[0], userId: ids[0], role: 'owner' },
        { scopeId: scopes[1], userId: ids[1], role: 'owner' },
        { scopeId: scopes[1], userId: ids[2], role: 'editor' },
        { scopeId: scopes[1], userId: ids[3], role: 'editor' },
      ])
      // A shared event record last written by the departing owner must survive.
      const entity = {
        scopeId: scopes[1],
        ownerUserId: ids[1],
        entityType: 'event',
        entityId: scopes[1],
        payload: encode({ id: scopes[1], title: 'Shared event' }),
        serverVersion: 1,
      }
      await db.insert(nativeSyncEntity).values(entity)
      await db.insert(nativeSyncChange).values({ ...entity, operation: 'upsert' })
      const writerNoteId = crypto.randomUUID()
      const writerEntity = {
        ...entity,
        entityType: 'note',
        entityId: writerNoteId,
        ownerUserId: ids[3],
        payload: encode({
          id: writerNoteId,
          body: 'Shared planning note',
          authorUserID: ids[3],
          sentAt: 800_000_000,
        }),
      }
      await db.insert(nativeSyncEntity).values(writerEntity)
      await db.insert(nativeSyncChange).values({ ...writerEntity, operation: 'upsert' })
      for (const person of personPayloads.filter((item) => item.userID !== ids[0])) {
        const record = {
          ...entity,
          entityType: 'participant',
          entityId: person.id,
          payload: encode(person),
        }
        await db.insert(nativeSyncEntity).values(record)
        await db.insert(nativeSyncChange).values({ ...record, operation: 'upsert' })
      }
      expect((await request('/api/sync/bootstrap', 2)).json.snapshots.length).toBe(1)
      if (withR2) {
        assetIds.push(await upload(0, 0), await upload(1, 1), await upload(2, 1))
      } else {
        diagnostic('R2 checks disabled; this run does not verify object deletion')
      }

      await step('authentication rejects anonymous deletion and native media access', async () => {
        expect((await request('/api/auth/delete-user', undefined, {})).status).toBe(401)
        for (const route of ['prepare', 'finalize']) {
          expect((await request(`/api/media/native/${route}`, undefined, {})).status).toBe(401)
        }
        expect(
          (await request(`/api/media/native/url?mediaAssetId=${crypto.randomUUID()}`)).status
        ).toBe(401)
        expect((await db.select().from(user).where(inArray(user.id, ids))).length).toBe(5)
      })

      await step(
        'deleting a non-owner writer preserves shared entities and cleans historical attribution',
        async () => {
          expect((await request('/api/auth/delete-user', 3, {})).status).toBe(200)
          expect((await request('/api/sync/bootstrap', 3)).status).toBe(401)
          const [preserved] = await db
            .select()
            .from(nativeSyncEntity)
            .where(
              and(
                eq(nativeSyncEntity.scopeId, scopes[1]),
                eq(nativeSyncEntity.entityId, writerEntity.entityId)
              )
            )
          expect(preserved.ownerUserId).toBe(ids[1])
          expect(JSON.parse(Buffer.from(preserved.payload, 'base64').toString()).body).toBe(
            'Shared planning note'
          )
          expect(JSON.parse(Buffer.from(preserved.payload, 'base64').toString()).authorUserID).toBe(
            undefined
          )
          const history = await request(`/api/sync/pull?scopeID=${scopes[1]}&after=0`, 2)
          expect(history.status).toBe(200)
          for (const change of history.json.changes) {
            expect(
              !Buffer.from(change.payload, 'base64').toString().includes(ids[3]),
              'Historical payloads must not retain deleted identity'
            ).toBeTruthy()
          }
        }
      )

      await step(
        'private owner deletion removes credentials, sessions, workspace, and R2 image',
        async () => {
          const deleted = await request('/api/auth/delete-user', 0, {})
          expect(deleted.status).toBe(200)
          expect(deleted.json, 'Matches the iOS client response contract').toEqual({
            success: true,
            message: 'User deleted',
          })
          expect((await db.select().from(user).where(eq(user.id, ids[0]))).length).toBe(0)
          expect((await db.select().from(account).where(eq(account.userId, ids[0]))).length).toBe(0)
          expect((await db.select().from(session).where(eq(session.userId, ids[0]))).length).toBe(0)
          expect(
            (await db.select().from(organization).where(eq(organization.id, orgs[0]))).length
          ).toBe(0)
          expect(
            (
              await db
                .select()
                .from(nativeWorkspaceSnapshot)
                .where(eq(nativeWorkspaceSnapshot.scopeId, scopes[0]))
            ).length
          ).toBe(0)
          expect(
            (await request('/api/sync/bootstrap', 0)).status,
            'Deleted native bearer must lose access'
          ).toBe(401)
          if (withR2) {
            expect(
              (await db.select().from(mediaAsset).where(eq(mediaAsset.id, assetIds[0]))).length
            ).toBe(0)
            await expect(inspectMediaObject(objects.get(assetIds[0])!)).rejects.toMatchObject({
              $metadata: { httpStatusCode: 404 },
            })
          }
        }
      )

      await step(
        'shared owner deletion preserves collaborator planning and removes personal contact data',
        async () => {
          expect((await request('/api/auth/delete-user', 1, {})).status).toBe(200)
          expect((await db.select().from(user).where(eq(user.id, ids[1]))).length).toBe(0)
          expect((await request('/api/sync/bootstrap', 1)).status).toBe(401)
          if (withR2) {
            expect(
              (await db.select().from(mediaAsset).where(eq(mediaAsset.id, assetIds[1]))).length
            ).toBe(0)
            await expect(inspectMediaObject(objects.get(assetIds[1])!)).rejects.toMatchObject({
              $metadata: { httpStatusCode: 404 },
            })
            expect(
              (await inspectMediaObject(objects.get(assetIds[2])!)).byteSize,
              "Successor's image must not be removed"
            ).toBe(bytes.length)
          }
          const bootstrap = await request('/api/sync/bootstrap', 2)
          expect(bootstrap.status).toBe(200)
          const [successor] = await db
            .select()
            .from(member)
            .where(and(eq(member.organizationId, orgs[1]), eq(member.userId, ids[2])))
          const [departingPerson] = await db
            .select()
            .from(workspacePerson)
            .where(eq(workspacePerson.id, people.find((p) => p.userId === ids[1])!.id))
          // Compare this data boundary together so the failure identifies lost sync
          // records and retained PII without logging any credentials or real users.
          expect({
            sharedWorkspaceCount: (
              await db.select().from(organization).where(eq(organization.id, orgs[1]))
            ).length,
            canonicalEventCount: (await db.select().from(event).where(eq(event.id, scopes[1])))
              .length,
            successorRole: successor?.role,
            nativeSnapshotCount: bootstrap.json.snapshots.length,
            nativeEntityCount: (
              await db
                .select()
                .from(nativeSyncEntity)
                .where(
                  and(
                    eq(nativeSyncEntity.scopeId, scopes[1]),
                    eq(nativeSyncEntity.entityId, entity.entityId)
                  )
                )
            ).length,
            nativeChangeCount: (
              await db
                .select()
                .from(nativeSyncChange)
                .where(
                  and(
                    eq(nativeSyncChange.scopeId, scopes[1]),
                    eq(nativeSyncChange.entityId, entity.entityId),
                    eq(nativeSyncChange.entityType, 'event')
                  )
                )
            ).length,
            retainedDepartingEmail: Boolean(departingPerson?.email),
            retainedDepartingAvatar: Boolean(departingPerson?.avatarUrl),
          }).toEqual({
            sharedWorkspaceCount: 1,
            canonicalEventCount: 1,
            successorRole: 'owner',
            nativeSnapshotCount: 1,
            nativeEntityCount: 1,
            nativeChangeCount: 1,
            retainedDepartingEmail: false,
            retainedDepartingAvatar: false,
          })
          const archive = JSON.parse(
            Buffer.from(bootstrap.json.snapshots[0].payload, 'base64').toString()
          )
          expect(archive.members.map((person: { userID: string }) => person.userID)).toEqual([
            ids[2],
            ids[4],
          ])
          expect(archive.members[0].participantRole).toBe('host')
          expect(archive.eventParticipations[0].role).toBe('host')
          const removedPerson = personPayloads.find((person) => person.userID === ids[1])!
          const pull = await request(`/api/sync/pull?scopeID=${scopes[1]}&after=0`, 2)
          expect(pull.status).toBe(200)
          expect(
            pull.json.changes.some(
              (change: { entityType: string; payload: string }) =>
                change.entityType === 'event_participation' &&
                JSON.parse(Buffer.from(change.payload || 'e30=', 'base64').toString()).role ===
                  'host'
            ),
            'Successor role reaches already-synced phones too'
          ).toBeTruthy()
          const [guestMembership] = await db
            .select()
            .from(member)
            .where(and(eq(member.organizationId, orgs[1]), eq(member.userId, ids[4])))
          expect(guestMembership.role, 'An older guest membership must not inherit ownership').toBe(
            'member'
          )
          expect((await request('/api/sync/bootstrap', 4)).json.snapshots.length).toBe(0)
          expect(
            pull.json.changes.some(
              (change: { entityType: string; entityID: string; operation: string }) =>
                change.entityType === 'participant' &&
                change.entityID === removedPerson.id &&
                change.operation === 'delete'
            )
          ).toBeTruthy()
          for (const change of pull.json.changes) {
            expect(
              !Buffer.from(change.payload, 'base64').toString().includes(ids[1]),
              'Historical identity is scrubbed, not just the latest snapshot'
            ).toBeTruthy()
          }
          // A stale phone cannot reintroduce that contact at the previous version.
          const stale = await request('/api/sync/push', 2, {
            mutations: [
              {
                id: crypto.randomUUID(),
                scopeID: scopes[1],
                entityType: 'participant',
                entityID: removedPerson.id,
                operation: 'update',
                payload: encode(removedPerson),
                baseVersion: 1,
                createdAt: new Date().toISOString(),
                attemptCount: 0,
              },
            ],
          })
          expect(stale.json.results[0].disposition).toBe('rejected')
          expect(stale.json.results[0].failureCode).toBe('PARTICIPANT_ACCOUNT_DELETED')
          const unversioned = await request('/api/sync/push', 2, {
            mutations: [
              {
                id: crypto.randomUUID(),
                scopeID: scopes[1],
                entityType: 'participant',
                entityID: removedPerson.id,
                operation: 'create',
                payload: encode(removedPerson),
                baseVersion: null,
                createdAt: new Date().toISOString(),
                attemptCount: 0,
              },
            ],
          })
          expect(
            unversioned.json.results[0].failureCode,
            'An offline queued create cannot bypass the privacy tombstone'
          ).toBe('PARTICIPANT_ACCOUNT_DELETED')
          const repeatedDelete = await request('/api/sync/push', 2, {
            mutations: [
              {
                id: crypto.randomUUID(),
                scopeID: scopes[1],
                entityType: 'participant',
                entityID: removedPerson.id,
                operation: 'delete',
                payload: '',
                baseVersion: null,
                createdAt: new Date().toISOString(),
                attemptCount: 0,
              },
            ],
          })
          expect(
            repeatedDelete.json.results[0].failureCode,
            'A queued delete cannot erase the permanent privacy marker'
          ).toBe('PARTICIPANT_ACCOUNT_DELETED')
        }
      )
    } finally {
      try {
        // Exact keys only, including images already removed by the server.
        for (const object of objects.values()) {
          await deleteMediaObject(object)
          await expect(inspectMediaObject(object)).rejects.toMatchObject({
            $metadata: { httpStatusCode: 404 },
          })
        }
      } finally {
        await db.delete(organization).where(inArray(organization.id, orgs))
        await db.delete(user).where(inArray(user.id, ids))
        expect((await db.select().from(user).where(inArray(user.id, ids))).length).toBe(0)
        expect(
          (await db.select().from(organization).where(inArray(organization.id, orgs))).length
        ).toBe(0)
        diagnostic('Disposable accounts, organizations, and exact temporary R2 objects cleaned up')
        await pool.end()
      }
    }
  }
)
