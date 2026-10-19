import { expect, test } from 'vitest'

const enabled = process.env.RUN_SCOPED_EVENT_DB_TESTS === '1'

function assertLocalDatabase() {
  const value = process.env.DATABASE_URL
  if (!value) throw new Error('DATABASE_URL is required for scoped event DB tests')
  let hostname: string
  try {
    hostname = new URL(value).hostname
  } catch {
    throw new Error('Scoped event DB tests require a valid local DATABASE_URL')
  }
  if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname)) {
    throw new Error('Scoped event DB tests only run against localhost')
  }
}

function archive(
  mainEventID: string,
  title: string,
  options: {
    isScopedEvent?: boolean
    timeline?: Record<string, unknown>[]
  } = {}
) {
  return Buffer.from(
    JSON.stringify({
      mainEventID,
      title,
      mainEventStartsAt: 820_000_000,
      mainEventIsAllDay: false,
      mainEventTimeZoneIdentifier: 'America/Detroit',
      venueName: '',
      location: '',
      dressCode: '',
      eventMessage: '',
      planningMode: 'openToIdeas',
      members: [],
      mainEventParticipantIDs: [],
      ideas: [],
      timeline: options.timeline ?? [],
      eventExpenses: [],
      notes: [],
      mainEventStatus: 'draft',
      eventMoments: [],
      isMainEventDeleted: false,
      registry: [],
      isRegistryShared: false,
      isCollaboratorLinkEnabled: true,
      requiresCollaboratorApproval: true,
      defaultCollaboratorPermission: 'contribute',
      ...(options.isScopedEvent ? { isScopedEvent: true } : {}),
    })
  ).toString('base64')
}

async function createFixture() {
  assertLocalDatabase()
  const { db } = await import('@/db')
  const { user, organization } = await import('@/db/schema/auth.schema')
  const { event, eventDeparture, eventParticipant, workspacePerson } =
    await import('@/db/schema/event.schema')
  const { idea } = await import('@/db/schema/planning.schema')
  const {
    nativeWorkspaceSnapshot,
    nativeSyncScopeMember,
    nativeSyncMutationReceipt,
    nativeSyncEntity,
  } = await import('@/db/schema/sync.schema')
  const { and, eq, inArray } = await import('drizzle-orm')

  const rootID = crypto.randomUUID()
  const childID = crypto.randomUUID()
  const siblingID = crypto.randomUUID()
  const actorSuffix = crypto.randomUUID()
  const organizationID = `scoped-sync-${rootID}`
  const rootHostID = `scoped-sync-host-${actorSuffix}`
  const contributorID = `scoped-sync-contributor-${actorSuffix}`
  const managerID = `scoped-sync-manager-${actorSuffix}`
  const viewerID = `scoped-sync-viewer-${actorSuffix}`
  const guestID = `scoped-sync-guest-${actorSuffix}`
  const userIDs = [rootHostID, contributorID, managerID, viewerID, guestID]
  const personIDs = userIDs.map(() => crypto.randomUUID())
  const rootIdeaID = crypto.randomUUID()
  const childIdeaID = crypto.randomUUID()
  const siblingIdeaID = crypto.randomUUID()
  const rootParticipationID = crypto.randomUUID()
  const childParticipationIDs = [
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID(),
  ]
  const startsAt = new Date('2031-07-01T16:00:00.000Z')

  try {
    await db.insert(user).values(
      userIDs.map((id) => ({
        id,
        name: id,
        email: `${id}@example.test`,
        emailVerified: true,
      }))
    )
    await db.insert(organization).values({
      id: organizationID,
      name: 'Scoped sync fixture',
      slug: `scoped-sync-${rootID}`,
      createdAt: new Date(),
      workspaceType: 'event',
    })
    await db.insert(event).values([
      {
        id: rootID,
        organizationId: organizationID,
        title: 'Private root event',
        status: 'draft',
        timeZone: 'America/Detroit',
        startsAt,
        createdByUserId: rootHostID,
      },
      {
        id: childID,
        organizationId: organizationID,
        parentEventId: rootID,
        title: 'Child event projection',
        purpose: 'planning_scouting',
        category: 'other',
        planningStatus: 'draft',
        timeZone: 'America/Detroit',
        startsAt,
        locationName: 'Child planning room',
        locationAddress: '10 Child Lane',
        locationAddressLine2: 'Suite 2',
        locationLatitude: 42.3314,
        locationLongitude: -83.0458,
        mapItemIdentifier: 'child-map-item',
        createdByUserId: rootHostID,
      },
      {
        id: siblingID,
        organizationId: organizationID,
        parentEventId: rootID,
        title: 'Private sibling event',
        purpose: 'planning_scouting',
        category: 'other',
        planningStatus: 'draft',
        timeZone: 'America/Detroit',
        startsAt,
        createdByUserId: rootHostID,
      },
    ])
    await db.insert(workspacePerson).values(
      userIDs.map((id, index) => ({
        id: personIDs[index],
        organizationId: organizationID,
        userId: id,
        displayName: id,
      }))
    )
    await db.insert(eventParticipant).values([
      {
        id: rootParticipationID,
        eventId: rootID,
        personId: personIDs[0],
        role: 'host',
        planningPermission: 'manage',
      },
      ...[
        ['collaborator', 'contribute', 'going'],
        ['collaborator', 'manage', 'not_sure'],
        ['collaborator', 'view_only', 'not_going'],
        ['guest', 'view_only', 'pending'],
      ].map(([role, planningPermission, attendanceStatus], index) => ({
        id: childParticipationIDs[index],
        eventId: childID,
        personId: personIDs[index + 1],
        role: role as 'collaborator' | 'guest',
        planningPermission: planningPermission as 'contribute' | 'manage' | 'view_only',
        attendanceStatus: attendanceStatus as 'going' | 'not_sure' | 'not_going' | 'pending',
      })),
    ])
    await db.insert(idea).values([
      {
        id: rootIdeaID,
        organizationId: organizationID,
        eventId: rootID,
        category: 'other',
        title: 'Root-only idea sentinel',
        configuration: { version: 1 },
        submittedByUserId: rootHostID,
        materializedEventId: childID,
      },
      {
        id: childIdeaID,
        organizationId: organizationID,
        eventId: childID,
        category: 'other',
        title: 'Fresh child idea sentinel',
        configuration: { version: 1 },
        submittedByUserId: contributorID,
      },
      {
        id: siblingIdeaID,
        organizationId: organizationID,
        eventId: siblingID,
        category: 'other',
        title: 'Sibling-only idea sentinel',
        configuration: { version: 1 },
        submittedByUserId: rootHostID,
      },
    ])
    await db.insert(nativeWorkspaceSnapshot).values({
      scopeId: rootID,
      ownerUserId: rootHostID,
      organizationId: organizationID,
      payload: archive(rootID, 'Private root archive', {
        timeline: [
          {
            id: childID,
            title: 'Child event projection',
            category: 'other',
            purpose: 'planning',
            scheduledAt: 820_000_000,
            isAllDay: false,
            timeZoneIdentifier: 'America/Detroit',
            participantIDs: [],
            parentEventID: rootID,
            linkedIdeaID: rootIdeaID,
            status: 'approved',
            completionStatus: 'upcoming',
            eventDescription: '',
            dressCode: '',
          },
          {
            id: siblingID,
            title: 'Private sibling event',
            category: 'other',
            purpose: 'planning',
            scheduledAt: 820_000_000,
            isAllDay: false,
            timeZoneIdentifier: 'America/Detroit',
            participantIDs: [],
            parentEventID: rootID,
            status: 'approved',
            completionStatus: 'upcoming',
            eventDescription: '',
            dressCode: '',
          },
        ],
      }),
      serverVersion: 1,
    })
    await db.insert(nativeSyncEntity).values([
      {
        scopeId: rootID,
        entityType: 'event',
        entityId: childID,
        ownerUserId: rootHostID,
        payload: Buffer.from(
          JSON.stringify({
            id: childID,
            parentEventID: rootID,
            linkedIdeaID: rootIdeaID,
            title: 'Child event projection',
            category: 'other',
            purpose: 'planning',
            scheduledAt: 820_000_000,
            schedulingState: 'scheduled',
            isAllDay: false,
            timeZoneIdentifier: 'America/Detroit',
            participantIDs: [],
            status: 'draft',
            completionStatus: 'upcoming',
            eventDescription: '',
            dressCode: '',
          })
        ).toString('base64'),
      },
      {
        scopeId: rootID,
        entityType: 'idea',
        entityId: rootIdeaID,
        ownerUserId: rootHostID,
        payload: Buffer.from(
          JSON.stringify({ id: rootIdeaID, eventID: rootID, title: 'Root-only idea sentinel' })
        ).toString('base64'),
      },
      {
        scopeId: rootID,
        entityType: 'idea',
        entityId: childIdeaID,
        ownerUserId: rootHostID,
        payload: Buffer.from(
          JSON.stringify({
            id: childIdeaID,
            eventID: childID,
            title: 'Fresh child idea sentinel',
            note: '',
            category: 'other',
            submittedBy: 'Contributor',
            submittedByUserID: contributorID,
            estimatedCost: null,
            status: 'new',
            submittedAt: 820_000_000,
            imageData: null,
            mediaAssetID: null,
            configuration: { standard: {} },
          })
        ).toString('base64'),
      },
      {
        scopeId: rootID,
        entityType: 'idea',
        entityId: siblingIdeaID,
        ownerUserId: rootHostID,
        payload: Buffer.from(
          JSON.stringify({
            id: siblingIdeaID,
            eventID: siblingID,
            title: 'Sibling-only idea sentinel',
          })
        ).toString('base64'),
      },
    ])

    return {
      db,
      user,
      organization,
      event,
      eventDeparture,
      eventParticipant,
      workspacePerson,
      idea,
      nativeWorkspaceSnapshot,
      nativeSyncScopeMember,
      nativeSyncMutationReceipt,
      nativeSyncEntity,
      and,
      eq,
      inArray,
      rootID,
      childID,
      siblingID,
      organizationID,
      rootHostID,
      contributorID,
      managerID,
      viewerID,
      guestID,
      userIDs,
      personIDs,
      rootIdeaID,
      childIdeaID,
      siblingIdeaID,
      rootParticipationID,
      childParticipationIDs,
    }
  } catch (error) {
    await db.delete(organization).where(eq(organization.id, organizationID))
    await db.delete(user).where(inArray(user.id, userIDs))
    throw error
  }
}

async function withFixture(
  run: (fixture: Awaited<ReturnType<typeof createFixture>>) => Promise<void>
) {
  const fixture = await createFixture()
  try {
    await run(fixture)
  } finally {
    const { db, organization, user, nativeSyncMutationReceipt, eq, inArray, userIDs } = fixture
    await db
      .delete(nativeSyncMutationReceipt)
      .where(inArray(nativeSyncMutationReceipt.ownerUserId, userIDs))
    await db.delete(organization).where(eq(organization.id, fixture.organizationID))
    await db.delete(user).where(inArray(user.id, userIDs))
  }
}

function mutation(input: {
  scopeID: string
  entityType:
    | 'idea'
    | 'event'
    | 'note'
    | 'moment'
    | 'expense'
    | 'idea_response'
    | 'workspace'
    | 'event_participation'
  entityID: string
  payload: Record<string, unknown>
  id?: string
  baseVersion?: number
  operation?: 'create' | 'update' | 'delete'
}) {
  return {
    id: input.id ?? crypto.randomUUID(),
    scopeID: input.scopeID,
    entityType: input.entityType,
    entityID: input.entityID,
    operation: input.operation ?? 'create',
    payloadSchemaVersion: 1 as const,
    createdAt: new Date().toISOString(),
    attemptCount: 0,
    ...(input.baseVersion === undefined ? {} : { baseVersion: input.baseVersion }),
    payload: Buffer.from(JSON.stringify(input.payload)).toString('base64'),
  }
}

test(
  'moment tombstones require the uploader in the exact writable event scope',
  { skip: !enabled, timeout: 30_000 },
  async () => {
    await withFixture(async (fixture) => {
      const { applyNativeMutations, pullNativeChanges } = await import('@/server/sync/native-sync')
      const { eventMedia, mediaAsset } = await import('@/db/schema/media.schema')
      const { eq } = await import('drizzle-orm')
      const {
        db,
        organizationID,
        rootID,
        childID,
        siblingID,
        contributorID,
        managerID,
        viewerID,
        guestID,
        personIDs,
        eventDeparture,
        eventParticipant,
        nativeWorkspaceSnapshot,
      } = fixture

      // Root-scope contributor to exercise the legacy root persistence path.
      await db.insert(eventParticipant).values({
        id: crypto.randomUUID(),
        eventId: rootID,
        personId: personIDs[1]!,
        role: 'collaborator',
        planningPermission: 'contribute',
      })

      async function makeMoment(
        eventId: string,
        uploader: string,
        role: 'gallery' | 'cover' = 'gallery'
      ) {
        const mediaAssetId = crypto.randomUUID()
        const momentId = crypto.randomUUID()
        await db.insert(mediaAsset).values({
          id: mediaAssetId,
          organizationId: organizationID,
          uploadedByUserId: uploader,
          kind: 'image',
          status: 'ready',
          visibility: 'private',
          bucket: 'native-sync-test',
          storageKey: `native-sync-test/${mediaAssetId}`,
          originalFilename: 'moment.jpg',
          contentType: 'image/jpeg',
          byteSize: 1,
        })
        await db.insert(eventMedia).values({
          id: momentId,
          organizationId: organizationID,
          eventId,
          mediaAssetId,
          role,
        })
        return momentId
      }

      const contributorMoment = await makeMoment(childID, contributorID)
      const managerMoment = await makeMoment(childID, managerID)
      const managedMoment = await makeMoment(childID, contributorID)
      const rootMoment = await makeMoment(rootID, contributorID)
      const rootChildMoment = await makeMoment(childID, contributorID)
      const siblingMoment = await makeMoment(siblingID, contributorID)
      const viewerMoment = await makeMoment(childID, viewerID)
      const guestMoment = await makeMoment(childID, guestID)
      const coverMoment = await makeMoment(childID, contributorID, 'cover')

      const remove = (scopeID: string, entityID: string, payload: Record<string, unknown> = {}) =>
        mutation({ scopeID, entityType: 'moment', entityID, operation: 'delete', payload })
      const apply = async (userId: string, item: ReturnType<typeof mutation>) =>
        (await applyNativeMutations({ userId, mutations: [item] })).results[0]!

      const ownChildDelete = remove(childID, contributorMoment)
      expect(await apply(contributorID, ownChildDelete)).toMatchObject({
        disposition: 'applied',
      })
      expect(await apply(contributorID, ownChildDelete)).toMatchObject({
        disposition: 'duplicate',
      })
      expect(await apply(contributorID, remove(rootID, rootMoment))).toMatchObject({
        disposition: 'applied',
      })
      expect(await apply(contributorID, remove(rootID, rootChildMoment))).toMatchObject({
        disposition: 'applied',
      })
      const rootChanges = await pullNativeChanges({
        userId: contributorID,
        scopeId: rootID,
        after: 0,
      })
      expect(rootChanges?.changes).toContainEqual(
        expect.objectContaining({
          scopeID: rootID,
          entityType: 'moment',
          entityID: rootChildMoment,
          operation: 'delete',
          payload: '',
        })
      )
      const [rootSnapshot] = await db
        .select()
        .from(nativeWorkspaceSnapshot)
        .where(eq(nativeWorkspaceSnapshot.scopeId, rootID))
      expect(
        JSON.parse(Buffer.from(rootSnapshot.payload, 'base64').toString('utf8')).mainEventID
      ).toBe(rootID)

      const departedMoment = await makeMoment(childID, contributorID)
      await db.insert(eventDeparture).values({ eventId: childID, userId: contributorID })
      expect(await apply(contributorID, remove(rootID, departedMoment))).toMatchObject({
        disposition: 'rejected',
      })
      await db.delete(eventDeparture).where(eq(eventDeparture.eventId, childID))

      const spoofed = await apply(
        contributorID,
        remove(childID, managerMoment, {
          id: managerMoment,
          eventID: childID,
          uploadedByUserID: contributorID,
          mediaAssetID: crypto.randomUUID(),
        })
      )
      expect(spoofed).toMatchObject({ disposition: 'rejected' })
      expect(
        (await db.select().from(eventMedia).where(eq(eventMedia.id, managerMoment))).length
      ).toBe(1)
      expect(await apply(contributorID, remove(childID, rootMoment))).toMatchObject({
        disposition: 'rejected',
      })
      expect(await apply(contributorID, remove(childID, coverMoment))).toMatchObject({
        disposition: 'rejected',
      })
      expect(await apply(contributorID, remove(rootID, siblingMoment))).toMatchObject({
        disposition: 'rejected',
      })
      expect(await apply('', remove(childID, managerMoment))).toMatchObject({
        disposition: 'rejected',
      })
      expect(await apply(guestID, remove(childID, guestMoment))).toMatchObject({
        disposition: 'rejected',
      })
      expect(await apply(viewerID, remove(childID, viewerMoment))).toMatchObject({
        disposition: 'rejected',
      })

      // Existing management authority to remove another uploader's scoped photo remains intact.
      expect(await apply(managerID, remove(childID, managedMoment))).toMatchObject({
        disposition: 'applied',
      })
      expect(
        (await db.select().from(eventMedia).where(eq(eventMedia.id, managedMoment))).length
      ).toBe(0)

      const staleActorMoment = await makeMoment(childID, contributorID)
      await db
        .delete(eventParticipant)
        .where(eq(eventParticipant.id, fixture.childParticipationIDs[0]!))
      expect(await apply(contributorID, remove(rootID, staleActorMoment))).toMatchObject({
        disposition: 'rejected',
      })
      await db.insert(eventParticipant).values({
        id: fixture.childParticipationIDs[0]!,
        eventId: childID,
        personId: personIDs[1]!,
        role: 'collaborator',
        planningPermission: 'contribute',
        attendanceStatus: 'going',
      })

      const deferredAssetId = crypto.randomUUID()
      const deferredScopedId = crypto.randomUUID()
      const deferredScopedCreate = mutation({
        scopeID: childID,
        entityType: 'moment',
        entityID: deferredScopedId,
        payload: {
          id: deferredScopedId,
          eventID: childID,
          mediaAssetID: deferredAssetId,
        },
      })
      expect(await apply(contributorID, deferredScopedCreate)).toMatchObject({
        disposition: 'applied',
      })
      expect(
        await apply(
          managerID,
          mutation({
            scopeID: childID,
            entityType: 'moment',
            entityID: deferredScopedId,
            operation: 'update',
            payload: {
              id: deferredScopedId,
              eventID: childID,
              mediaAssetID: deferredAssetId,
              uploadedByUserID: managerID,
            },
          })
        )
      ).toMatchObject({ disposition: 'applied' })
      const deferredScopedDelete = remove(childID, deferredScopedId)
      expect(await apply(contributorID, deferredScopedDelete)).toMatchObject({
        disposition: 'applied',
      })
      expect(await apply(contributorID, remove(childID, deferredScopedId))).toMatchObject({
        disposition: 'applied',
      })

      const deferredRootAssetId = crypto.randomUUID()
      const deferredRootId = crypto.randomUUID()
      expect(
        await apply(
          contributorID,
          mutation({
            scopeID: rootID,
            entityType: 'moment',
            entityID: deferredRootId,
            payload: {
              id: deferredRootId,
              eventID: childID,
              mediaAssetID: deferredRootAssetId,
            },
          })
        )
      ).toMatchObject({ disposition: 'applied' })
      expect(await apply(contributorID, remove(rootID, deferredRootId))).toMatchObject({
        disposition: 'applied',
      })

      const deferredLegacyRootId = crypto.randomUUID()
      const deferredLegacyAssetId = crypto.randomUUID()
      expect(
        await apply(
          contributorID,
          mutation({
            scopeID: rootID,
            entityType: 'moment',
            entityID: deferredLegacyRootId,
            payload: {
              id: deferredLegacyRootId,
              eventID: null,
              mediaAssetID: deferredLegacyAssetId,
            },
          })
        )
      ).toMatchObject({ disposition: 'applied' })
      expect(await apply(contributorID, remove(rootID, deferredLegacyRootId))).toMatchObject({
        disposition: 'applied',
      })

      const malformedLegacyRootId = crypto.randomUUID()
      expect(
        await apply(
          contributorID,
          mutation({
            scopeID: rootID,
            entityType: 'moment',
            entityID: malformedLegacyRootId,
            payload: {
              id: malformedLegacyRootId,
              eventID: 'not-a-uuid',
              mediaAssetID: crypto.randomUUID(),
            },
          })
        )
      ).toMatchObject({ disposition: 'applied' })
      expect(await apply(contributorID, remove(rootID, malformedLegacyRootId))).toMatchObject({
        disposition: 'rejected',
      })
    })
  }
)

test(
  'child collaborators get an isolated, Swift-decodable workspace snapshot without organization membership',
  { skip: !enabled, timeout: 30_000 },
  async () => {
    await withFixture(async (fixture) => {
      const { listNativeWorkspaceSnapshots, pullNativeChanges } =
        await import('@/server/sync/native-sync')
      const { member } = await import('@/db/schema/auth.schema')
      const { eq } = await import('drizzle-orm')
      const {
        childID,
        rootID,
        siblingID,
        contributorID,
        managerID,
        viewerID,
        guestID,
        personIDs,
        childParticipationIDs,
        eventParticipant,
      } = fixture

      for (const userId of [contributorID, managerID]) {
        const snapshotSet = await listNativeWorkspaceSnapshots(userId)
        const scopedSnapshot = snapshotSet.snapshots.find(
          (snapshot) => snapshot.scopeID === childID
        )
        expect(scopedSnapshot).toBeDefined()
        const decoded = JSON.parse(Buffer.from(scopedSnapshot!.payload, 'base64').toString('utf8'))
        expect(decoded).toMatchObject({ mainEventID: childID, isScopedEvent: true })
        expect(decoded.title).toBe('Child event projection')
        for (const key of [
          'mainEventID',
          'title',
          'mainEventStartsAt',
          'mainEventIsAllDay',
          'mainEventTimeZoneIdentifier',
          'venueName',
          'location',
          'dressCode',
          'eventMessage',
          'planningMode',
          'members',
          'mainEventParticipantIDs',
          'ideas',
          'timeline',
          'eventExpenses',
          'notes',
          'mainEventStatus',
          'eventMoments',
          'isMainEventDeleted',
          'registry',
          'isRegistryShared',
          'isCollaboratorLinkEnabled',
          'requiresCollaboratorApproval',
          'defaultCollaboratorPermission',
        ]) {
          expect(decoded).toHaveProperty(key)
        }
        expect(decoded.mainEventLocation).toMatchObject({
          locationName: 'Child planning room',
          placeName: '',
          shortAddress: '',
          address: '10 Child Lane',
          addressLine2: 'Suite 2',
          latitude: 42.3314,
          longitude: -83.0458,
          mapItemIdentifier: 'child-map-item',
        })
        expect(decoded.eventParticipations).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: childParticipationIDs[0],
              memberID: personIDs[1],
              attendance: 'going',
              invitationStatus: 'active',
            }),
            expect.objectContaining({
              id: childParticipationIDs[1],
              memberID: personIDs[2],
              attendance: 'maybe',
              invitationStatus: 'active',
            }),
            expect.objectContaining({
              id: childParticipationIDs[2],
              memberID: personIDs[3],
              attendance: 'declined',
              invitationStatus: 'active',
            }),
            expect.objectContaining({
              id: childParticipationIDs[3],
              memberID: personIDs[4],
              attendance: 'invited',
              invitationStatus: 'active',
            }),
          ])
        )
        expect(JSON.stringify(decoded)).toContain('Fresh child idea sentinel')
        expect(JSON.stringify(decoded)).not.toContain('Root-only idea sentinel')
        expect(JSON.stringify(decoded)).not.toContain('Sibling-only idea sentinel')
        expect(snapshotSet.snapshots.map((item) => item.scopeID)).not.toContain(rootID)
        expect(snapshotSet.snapshots.map((item) => item.scopeID)).not.toContain(siblingID)
        expect(
          (await fixture.db.select().from(member).where(eq(member.userId, userId))).length
        ).toBe(0)
      }

      const viewerSnapshots = await listNativeWorkspaceSnapshots(viewerID)
      expect(viewerSnapshots.snapshots.map((item) => item.scopeID)).toContain(childID)
      expect((await listNativeWorkspaceSnapshots(guestID)).snapshots).toHaveLength(0)
      const guestPull = await pullNativeChanges({ userId: guestID, scopeId: childID, after: 0 })
      if (!guestPull) throw new Error('Expected a scoped revocation response for the guest')
      expect(guestPull.changes).toHaveLength(1)
      expect(guestPull.changes[0]).toMatchObject({
        scopeID: childID,
        entityType: 'workspace',
        operation: 'delete',
        payload: '',
      })

      const first = await pullNativeChanges({ userId: contributorID, scopeId: childID, after: 0 })
      expect(first).not.toBeNull()
      expect(first?.nextCursor).toBe('0')
      const repeated = await pullNativeChanges({
        userId: contributorID,
        scopeId: childID,
        after: 0,
      })
      expect(repeated?.nextCursor).toBe(first?.nextCursor)
      expect(repeated?.changes[0]?.id).toBe(first?.changes[0]?.id)

      await fixture.db
        .update(eventParticipant)
        .set({ planningPermission: 'view_only' })
        .where(eq(eventParticipant.id, childParticipationIDs[0]))
      const permissionRefresh = await pullNativeChanges({
        userId: contributorID,
        scopeId: childID,
        after: Number(first?.nextCursor),
      })
      expect(permissionRefresh?.nextCursor).toBe(first?.nextCursor)
      expect(permissionRefresh?.changes).toHaveLength(1)
      expect(permissionRefresh?.changes[0]?.id).not.toBe(first?.changes[0]?.id)
      const permissionArchive = JSON.parse(
        Buffer.from(permissionRefresh!.changes[0]!.payload, 'base64').toString('utf8')
      )
      expect(
        permissionArchive.members.find(
          (person: { userID: string }) => person.userID === contributorID
        ).planningPermission
      ).toBe('viewOnly')
    })
  }
)

test(
  'child planning mutations materialize canonically, replicate to the root host, and remain idempotent',
  { skip: !enabled, timeout: 30_000 },
  async () => {
    await withFixture(async (fixture) => {
      const { applyNativeMutations, listNativeWorkspaceSnapshots, pullNativeChanges } =
        await import('@/server/sync/native-sync')
      const { ideaResponseID } = await import('@/server/sync/contracts/idea-response')
      const { eventExpense, eventNote, idea, ideaDecision } =
        await import('@/db/schema/planning.schema')
      const { nativeSyncChange, nativeSyncEntity } = await import('@/db/schema/sync.schema')
      const { and, eq } = await import('drizzle-orm')
      const { childID, rootID, contributorID, rootHostID, organizationID, childIdeaID, personIDs } =
        fixture
      const { siblingID } = fixture
      const newIdeaID = crypto.randomUUID()
      const noteID = crypto.randomUUID()
      const expenseID = crypto.randomUUID()
      const responseID = ideaResponseID(childIdeaID, contributorID)
      const mutations = [
        mutation({
          scopeID: childID,
          entityType: 'idea',
          entityID: newIdeaID,
          payload: {
            id: newIdeaID,
            eventID: childID,
            category: 'other',
            status: 'new',
            title: 'Contributor child idea',
            submittedByUserID: contributorID,
          },
        }),
        mutation({
          scopeID: childID,
          entityType: 'note',
          entityID: noteID,
          payload: {
            id: noteID,
            eventID: childID,
            authorUserID: 'forged-author',
            body: 'Contributor child note',
            sentAt: 820_000_000,
          },
        }),
        mutation({
          scopeID: childID,
          entityType: 'expense',
          entityID: expenseID,
          payload: {
            id: expenseID,
            eventID: childID,
            title: 'Child venue deposit',
            amount: '125.50',
            category: 'venue',
            status: 'estimated',
          },
        }),
        mutation({
          scopeID: childID,
          entityType: 'idea_response',
          entityID: responseID,
          payload: {
            id: responseID,
            ideaID: childIdeaID,
            userID: contributorID,
            choice: 'love',
          },
        }),
      ]
      const pushed = await applyNativeMutations({ userId: contributorID, mutations })
      expect(pushed.results.map((result) => result.disposition)).toEqual([
        'applied',
        'applied',
        'applied',
        'applied',
      ])

      const [canonicalIdea] = await fixture.db.select().from(idea).where(eq(idea.id, newIdeaID))
      const [canonicalNote] = await fixture.db
        .select()
        .from(eventNote)
        .where(eq(eventNote.id, noteID))
      const [canonicalExpense] = await fixture.db
        .select()
        .from(eventExpense)
        .where(eq(eventExpense.id, expenseID))
      const [canonicalDecision] = await fixture.db
        .select()
        .from(ideaDecision)
        .where(and(eq(ideaDecision.ideaId, childIdeaID), eq(ideaDecision.userId, contributorID)))
      expect(canonicalIdea.eventId).toBe(childID)
      expect(canonicalNote.eventId).toBe(childID)
      expect(canonicalNote.authorUserId).toBe(contributorID)
      expect(canonicalExpense.eventId).toBe(childID)
      expect(canonicalDecision.choice).toBe('love')

      const managerEventUpdate = mutation({
        scopeID: childID,
        entityType: 'event',
        entityID: childID,
        operation: 'update',
        payload: {
          id: childID,
          title: 'Manager-updated child event',
          category: 'other',
          purpose: 'planning',
          status: 'draft',
          scheduledAt: 820_000_000,
          schedulingState: 'scheduled',
          timeZoneIdentifier: 'America/Detroit',
          participantIDs: personIDs,
          eventDescription: 'Updated by the child manager',
          dressCode: '',
        },
      })
      expect(
        (await applyNativeMutations({ userId: fixture.managerID, mutations: [managerEventUpdate] }))
          .results[0].disposition
      ).toBe('applied')
      const [canonicalChildEvent] = await fixture.db
        .select()
        .from(fixture.event)
        .where(eq(fixture.event.id, childID))
      const [canonicalRootIdea] = await fixture.db
        .select()
        .from(idea)
        .where(eq(idea.id, fixture.rootIdeaID))
      const [canonicalChildEventEntity] = await fixture.db
        .select()
        .from(nativeSyncEntity)
        .where(
          and(
            eq(nativeSyncEntity.scopeId, rootID),
            eq(nativeSyncEntity.entityType, 'event'),
            eq(nativeSyncEntity.entityId, childID)
          )
        )
      const canonicalChildEventPayload = JSON.parse(
        Buffer.from(canonicalChildEventEntity.payload, 'base64').toString('utf8')
      )
      expect(canonicalChildEvent.title).toBe('Manager-updated child event')
      expect(canonicalChildEvent.parentEventId).toBe(rootID)
      expect(canonicalRootIdea.materializedEventId).toBe(childID)
      expect(canonicalChildEventPayload).toMatchObject({
        id: childID,
        parentEventID: rootID,
        linkedIdeaID: fixture.rootIdeaID,
        title: 'Manager-updated child event',
      })
      const managerSnapshot = await listNativeWorkspaceSnapshots(fixture.managerID)
      const managerChildSnapshot = managerSnapshot.snapshots.find(
        (item) => item.scopeID === childID
      )
      expect(managerChildSnapshot).toBeDefined()
      const managerChildArchive = JSON.parse(
        Buffer.from(managerChildSnapshot!.payload, 'base64').toString('utf8')
      )
      expect(managerChildArchive).toMatchObject({
        mainEventID: childID,
        title: 'Manager-updated child event',
        timeline: [],
      })
      expect(managerChildArchive.ideas.map((item: { id: string }) => item.id)).not.toContain(
        fixture.rootIdeaID
      )
      expect(JSON.stringify(managerChildArchive)).not.toContain(rootID)
      expect(JSON.stringify(managerChildArchive)).not.toContain(siblingID)
      expect(JSON.stringify(managerChildArchive)).not.toContain('Root-only idea sentinel')
      expect(JSON.stringify(managerChildArchive)).not.toContain('Sibling-only idea sentinel')

      const rootPull = await pullNativeChanges({ userId: rootHostID, scopeId: rootID, after: 0 })
      expect(rootPull?.changes.map((change) => change.entityID)).toEqual(
        expect.arrayContaining(mutations.map((item) => item.entityID))
      )
      expect(rootPull?.changes.every((change) => change.scopeID === rootID)).toBe(true)
      const canonicalEntities = await fixture.db
        .select()
        .from(nativeSyncEntity)
        .where(
          and(eq(nativeSyncEntity.scopeId, rootID), eq(nativeSyncEntity.ownerUserId, contributorID))
        )
      expect(canonicalEntities.map((entity) => entity.entityId)).toEqual(
        expect.arrayContaining(mutations.map((item) => item.entityID))
      )

      const firstChildPull = await pullNativeChanges({
        userId: contributorID,
        scopeId: childID,
        after: 0,
      })
      expect(firstChildPull?.changes).toHaveLength(1)
      const childEventUpdate = mutation({
        scopeID: rootID,
        entityType: 'event',
        entityID: childID,
        operation: 'update',
        payload: {
          id: childID,
          parentEventID: rootID,
          linkedIdeaID: fixture.rootIdeaID,
          title: 'Root-updated child entry',
          category: 'other',
          purpose: 'planning',
          status: 'draft',
          scheduledAt: 820_000_000,
          schedulingState: 'scheduled',
          timeZoneIdentifier: 'America/Detroit',
          participantIDs: personIDs,
          eventDescription: '',
          dressCode: '',
        },
      })
      expect(
        (await applyNativeMutations({ userId: rootHostID, mutations: [childEventUpdate] }))
          .results[0].disposition
      ).toBe('applied')
      const childTitleRefresh = await pullNativeChanges({
        userId: contributorID,
        scopeId: childID,
        after: Number(firstChildPull?.nextCursor),
      })
      expect(childTitleRefresh?.changes).toHaveLength(1)
      const childTitleArchive = JSON.parse(
        Buffer.from(childTitleRefresh!.changes[0]!.payload, 'base64').toString('utf8')
      )
      expect(childTitleArchive.title).toBe('Root-updated child entry')
      expect(JSON.stringify(childTitleArchive)).not.toContain('Sibling-only idea sentinel')

      const siblingOnlyID = crypto.randomUUID()
      const siblingOnlyMutation = mutation({
        scopeID: rootID,
        entityType: 'idea',
        entityID: siblingOnlyID,
        payload: {
          id: siblingOnlyID,
          eventID: siblingID,
          category: 'other',
          status: 'new',
          title: 'Sibling-only root change',
        },
      })
      expect(
        (await applyNativeMutations({ userId: rootHostID, mutations: [siblingOnlyMutation] }))
          .results[0].disposition
      ).toBe('applied')
      const siblingOnlyRefresh = await pullNativeChanges({
        userId: contributorID,
        scopeId: childID,
        after: Number(childTitleRefresh?.nextCursor),
      })
      expect(siblingOnlyRefresh?.changes).toHaveLength(1)
      const siblingOnlyArchive = JSON.parse(
        Buffer.from(siblingOnlyRefresh!.changes[0]!.payload, 'base64').toString('utf8')
      )
      expect(siblingOnlyArchive.title).toBe('Root-updated child entry')
      expect(JSON.stringify(siblingOnlyArchive)).not.toContain('Sibling-only root change')

      const managerDelete = mutation({
        scopeID: childID,
        entityType: 'idea',
        entityID: childIdeaID,
        operation: 'delete',
        payload: {},
      })
      const deleted = await applyNativeMutations({
        userId: fixture.managerID,
        mutations: [managerDelete],
      })
      expect(deleted.results[0].disposition).toBe('applied')
      const recreateDeletedIdea = mutation({
        scopeID: childID,
        entityType: 'idea',
        entityID: childIdeaID,
        payload: {
          id: childIdeaID,
          eventID: childID,
          category: 'other',
          status: 'new',
          title: 'Attempt to recreate deleted child idea',
        },
      })
      expect(
        (
          await applyNativeMutations({
            userId: fixture.managerID,
            mutations: [recreateDeletedIdea],
          })
        ).results[0]
      ).toMatchObject({ disposition: 'rejected', failureCode: 'ENTITY_DELETED' })
      expect(
        (await applyNativeMutations({ userId: fixture.managerID, mutations: [managerDelete] }))
          .results[0].disposition
      ).toBe('duplicate')
      expect((await fixture.db.select().from(idea).where(eq(idea.id, childIdeaID))).length).toBe(0)
      const [deletedChildIdeaEntity] = await fixture.db
        .select()
        .from(nativeSyncEntity)
        .where(
          and(
            eq(nativeSyncEntity.scopeId, rootID),
            eq(nativeSyncEntity.entityType, 'idea'),
            eq(nativeSyncEntity.entityId, childIdeaID)
          )
        )
      expect(deletedChildIdeaEntity).toMatchObject({ isDeleted: true, payload: '' })
      const deleteRootPull = await pullNativeChanges({
        userId: rootHostID,
        scopeId: rootID,
        after: Number(siblingOnlyRefresh?.nextCursor),
      })
      expect(deleteRootPull?.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            scopeID: rootID,
            entityType: 'idea',
            entityID: childIdeaID,
            operation: 'delete',
            payload: '',
          }),
        ])
      )

      const duplicate = await applyNativeMutations({
        userId: contributorID,
        mutations: [mutations[0]],
      })
      expect(duplicate.results[0]).toMatchObject({
        mutationID: mutations[0].id,
        disposition: 'duplicate',
        serverVersion: pushed.results[0].serverVersion,
      })
      expect((await fixture.db.select().from(idea).where(eq(idea.id, newIdeaID))).length).toBe(1)
      const crossScopeReceiptReplay = await applyNativeMutations({
        userId: contributorID,
        mutations: [{ ...mutations[0], scopeID: rootID }],
      })
      expect(crossScopeReceiptReplay.results[0]).toMatchObject({
        mutationID: mutations[0].id,
        disposition: 'rejected',
        failureCode: 'MUTATION_ID_OWNERSHIP_MISMATCH',
      })

      const conflictID = crypto.randomUUID()
      const conflict = mutation({
        id: conflictID,
        scopeID: childID,
        entityType: 'idea',
        entityID: newIdeaID,
        baseVersion: 0,
        payload: {
          id: newIdeaID,
          eventID: childID,
          category: 'other',
          status: 'new',
          title: 'Stale conflicting edit',
        },
      })
      const conflictResult = await applyNativeMutations({
        userId: contributorID,
        mutations: [conflict],
      })
      expect(conflictResult.results[0]).toMatchObject({
        mutationID: conflictID,
        disposition: 'conflict',
        failureCode: 'SERVER_VERSION_CONFLICT',
      })
      expect(
        (await applyNativeMutations({ userId: contributorID, mutations: [conflict] })).results[0]
          .disposition
      ).toBe('conflict')

      const changesBeforeRollback = await fixture.db
        .select()
        .from(nativeSyncChange)
        .where(eq(nativeSyncChange.scopeId, rootID))
      const invalidWorkspace = JSON.parse(
        Buffer.from(archive(rootID, 'Transient rollback title'), 'base64').toString('utf8')
      )
      invalidWorkspace.mainEventStartsAt = 'not-a-native-date'
      const failedAfterWrite = await applyNativeMutations({
        userId: rootHostID,
        mutations: [
          mutation({
            scopeID: rootID,
            entityType: 'workspace',
            entityID: rootID,
            operation: 'update',
            payload: invalidWorkspace,
          }),
        ],
      })
      expect(failedAfterWrite.results[0]).toMatchObject({
        disposition: 'rejected',
        failureCode: 'WORKSPACE_START_MISSING',
      })
      const [organizationAfterRollback] = await fixture.db
        .select()
        .from(fixture.organization)
        .where(eq(fixture.organization.id, organizationID))
      expect(organizationAfterRollback.name).toBe('Scoped sync fixture')
      expect(
        (
          await fixture.db
            .select()
            .from(nativeSyncChange)
            .where(eq(nativeSyncChange.scopeId, rootID))
        ).length
      ).toBe(changesBeforeRollback.length)
      expect(
        (
          await fixture.db
            .select()
            .from(nativeSyncEntity)
            .where(
              and(
                eq(nativeSyncEntity.scopeId, rootID),
                eq(nativeSyncEntity.entityType, 'workspace'),
                eq(nativeSyncEntity.entityId, rootID)
              )
            )
        ).length
      ).toBe(0)
      expect(personIDs).toHaveLength(5)
      expect(organizationID).toBeTruthy()
    })
  }
)

test(
  'scope and object hijacks, workspace and role escalation, read-only writes, and revoked access are denied',
  { skip: !enabled, timeout: 30_000 },
  async () => {
    await withFixture(async (fixture) => {
      const { applyNativeMutations, listNativeWorkspaceSnapshots, pullNativeChanges } =
        await import('@/server/sync/native-sync')
      const { idea } = await import('@/db/schema/planning.schema')
      const { eq } = await import('drizzle-orm')
      const {
        childID,
        rootID,
        siblingID,
        contributorID,
        rootHostID,
        viewerID,
        guestID,
        managerID,
        eventDeparture,
        eventParticipant,
        childParticipationIDs,
        rootParticipationID,
        rootIdeaID,
        siblingIdeaID,
      } = fixture

      const denied = async (
        userId: string,
        item: ReturnType<typeof mutation>,
        failureCode?: string
      ) => {
        const response = await applyNativeMutations({ userId, mutations: [item] })
        expect(response.results[0].disposition).toBe('rejected')
        if (failureCode) expect(response.results[0].failureCode).toBe(failureCode)
      }
      const ideaPayload = (id: string, eventID: string, title: string) => ({
        id,
        eventID,
        category: 'other',
        status: 'new',
        title,
      })

      const rootScopeIdeaID = crypto.randomUUID()
      await denied(
        contributorID,
        mutation({
          scopeID: rootID,
          entityType: 'idea',
          entityID: rootScopeIdeaID,
          payload: ideaPayload(rootScopeIdeaID, rootID, 'Root scope hijack'),
        })
      )
      const siblingScopeIdeaID = crypto.randomUUID()
      await denied(
        contributorID,
        mutation({
          scopeID: siblingID,
          entityType: 'idea',
          entityID: siblingScopeIdeaID,
          payload: ideaPayload(siblingScopeIdeaID, siblingID, 'Sibling scope hijack'),
        })
      )
      await denied(
        contributorID,
        mutation({
          scopeID: childID,
          entityType: 'idea',
          entityID: rootIdeaID,
          operation: 'update',
          payload: ideaPayload(rootIdeaID, childID, 'Root object hijack'),
        })
      )
      const rootIdReuseID = crypto.randomUUID()
      await denied(
        contributorID,
        mutation({
          scopeID: childID,
          entityType: 'idea',
          entityID: rootIdReuseID,
          payload: ideaPayload(rootIdReuseID, rootID, 'Root event ID reused by child payload'),
        })
      )
      await denied(
        contributorID,
        mutation({
          scopeID: childID,
          entityType: 'workspace',
          entityID: childID,
          payload: JSON.parse(
            Buffer.from(
              archive(childID, 'Forged child workspace snapshot', { isScopedEvent: true }),
              'base64'
            ).toString()
          ),
        })
      )
      await denied(
        contributorID,
        mutation({
          scopeID: childID,
          entityType: 'workspace',
          entityID: childID,
          payload: JSON.parse(
            Buffer.from(
              archive(rootID, 'Root archive replayed into child scope'),
              'base64'
            ).toString()
          ),
        })
      )
      const siblingSourceExpenseID = crypto.randomUUID()
      await denied(
        contributorID,
        mutation({
          scopeID: childID,
          entityType: 'expense',
          entityID: siblingSourceExpenseID,
          payload: {
            id: siblingSourceExpenseID,
            eventID: childID,
            sourceIdeaID: siblingIdeaID,
            title: 'Expense linked to sibling idea',
            amount: '50.00',
            category: 'other',
            status: 'estimated',
          },
        })
      )

      const escalationID = crypto.randomUUID()
      await denied(
        contributorID,
        mutation({
          scopeID: childID,
          entityType: 'event_participation',
          entityID: rootParticipationID,
          payload: {
            id: rootParticipationID,
            eventID: rootID,
            memberID: fixture.personIDs[0],
            role: 'host',
            planningPermission: 'manage',
            attendance: 'going',
          },
        })
      )
      await denied(
        contributorID,
        mutation({
          scopeID: childID,
          entityType: 'event_participation',
          entityID: childParticipationIDs[0],
          payload: {
            id: childParticipationIDs[0],
            eventID: childID,
            memberID: fixture.personIDs[1],
            role: 'host',
            planningPermission: 'manage',
            attendance: 'going',
          },
        })
      )
      expect(escalationID).toMatch(/[0-9a-f-]{36}/)

      const viewerWriteID = crypto.randomUUID()
      await denied(
        viewerID,
        mutation({
          scopeID: childID,
          entityType: 'idea',
          entityID: viewerWriteID,
          payload: ideaPayload(viewerWriteID, childID, 'Viewer write'),
        })
      )
      const guestWriteID = crypto.randomUUID()
      await denied(
        guestID,
        mutation({
          scopeID: childID,
          entityType: 'idea',
          entityID: guestWriteID,
          payload: ideaPayload(guestWriteID, childID, 'Guest write'),
        }),
        'SCOPE_WRITE_FORBIDDEN'
      )
      const missingActorID = crypto.randomUUID()
      await denied(
        rootHostID,
        mutation({
          scopeID: childID,
          entityType: 'idea',
          entityID: missingActorID,
          payload: ideaPayload(missingActorID, childID, 'Missing child participation'),
        }),
        'SCOPE_WRITE_FORBIDDEN'
      )
      await fixture.db.insert(eventDeparture).values({ eventId: childID, userId: managerID })
      const departedActorID = crypto.randomUUID()
      await denied(
        managerID,
        mutation({
          scopeID: childID,
          entityType: 'idea',
          entityID: departedActorID,
          payload: ideaPayload(departedActorID, childID, 'Departed participant write'),
        }),
        'SCOPE_WRITE_FORBIDDEN'
      )
      expect((await fixture.db.select().from(idea).where(eq(idea.id, viewerWriteID))).length).toBe(
        0
      )
      expect((await fixture.db.select().from(idea).where(eq(idea.id, guestWriteID))).length).toBe(0)

      const acceptedBeforeClose = mutation({
        scopeID: childID,
        entityType: 'idea',
        entityID: crypto.randomUUID(),
        payload: {},
      })
      acceptedBeforeClose.payload = Buffer.from(
        JSON.stringify(
          ideaPayload(acceptedBeforeClose.entityID, childID, 'Accepted before event close')
        )
      ).toString('base64')
      expect(
        (
          await applyNativeMutations({
            userId: contributorID,
            mutations: [acceptedBeforeClose],
          })
        ).results[0].disposition
      ).toBe('applied')
      await fixture.db
        .update(fixture.event)
        .set({ planningStatus: 'archived' })
        .where(eq(fixture.event.id, childID))
      expect(
        (
          await applyNativeMutations({
            userId: contributorID,
            mutations: [acceptedBeforeClose],
          })
        ).results[0].disposition
      ).toBe('duplicate')
      const closedWriteID = crypto.randomUUID()
      await denied(
        contributorID,
        mutation({
          scopeID: childID,
          entityType: 'idea',
          entityID: closedWriteID,
          payload: ideaPayload(closedWriteID, childID, 'Write after event close'),
        }),
        'EVENT_CLOSED'
      )
      expect((await fixture.db.select().from(idea).where(eq(idea.id, closedWriteID))).length).toBe(
        0
      )
      await fixture.db
        .update(fixture.event)
        .set({ planningStatus: 'draft' })
        .where(eq(fixture.event.id, childID))

      const successfulBeforeRevocation = mutation({
        scopeID: childID,
        entityType: 'idea',
        entityID: crypto.randomUUID(),
        payload: {},
      })
      successfulBeforeRevocation.payload = Buffer.from(
        JSON.stringify(
          ideaPayload(successfulBeforeRevocation.entityID, childID, 'Accepted before revocation')
        )
      ).toString('base64')
      expect(
        (
          await applyNativeMutations({
            userId: contributorID,
            mutations: [successfulBeforeRevocation],
          })
        ).results[0].disposition
      ).toBe('applied')

      await fixture.db
        .update(eventParticipant)
        .set({ role: 'collaborator', planningPermission: 'view_only' })
        .where(eq(eventParticipant.id, childParticipationIDs[0]))
      const downgradedRetry = await applyNativeMutations({
        userId: contributorID,
        mutations: [successfulBeforeRevocation],
      })
      expect(downgradedRetry.results[0].disposition).toBe('rejected')
      expect(downgradedRetry.results[0].failureCode).toBe('SCOPE_READ_ONLY')
      const viewOnlyNewID = crypto.randomUUID()
      await denied(
        contributorID,
        mutation({
          scopeID: childID,
          entityType: 'idea',
          entityID: viewOnlyNewID,
          payload: ideaPayload(viewOnlyNewID, childID, 'View-only write'),
        }),
        'SCOPE_READ_ONLY'
      )
      expect(
        (await listNativeWorkspaceSnapshots(contributorID)).snapshots.map((item) => item.scopeID)
      ).toContain(childID)
      const viewOnlyRefresh = await pullNativeChanges({
        userId: contributorID,
        scopeId: childID,
        after: 0,
      })
      if (!viewOnlyRefresh) throw new Error('Expected the view-only projection to remain readable')
      const viewOnlyArchive = JSON.parse(
        Buffer.from(viewOnlyRefresh.changes[0]!.payload, 'base64').toString('utf8')
      )
      expect(
        viewOnlyArchive.members.find(
          (person: { userID: string }) => person.userID === contributorID
        ).planningPermission
      ).toBe('viewOnly')

      await fixture.db
        .update(eventParticipant)
        .set({ role: 'guest', planningPermission: 'view_only' })
        .where(eq(eventParticipant.id, childParticipationIDs[0]))
      const revokedRetry = await applyNativeMutations({
        userId: contributorID,
        mutations: [successfulBeforeRevocation],
      })
      expect(revokedRetry.results[0].disposition).toBe('rejected')
      expect(revokedRetry.results[0].failureCode).toBe('SCOPE_WRITE_FORBIDDEN')
      const revokedNewID = crypto.randomUUID()
      await denied(
        contributorID,
        mutation({
          scopeID: childID,
          entityType: 'idea',
          entityID: revokedNewID,
          payload: ideaPayload(revokedNewID, childID, 'Post-revocation write'),
        })
      )
      const revokedPull = await pullNativeChanges({
        userId: contributorID,
        scopeId: childID,
        after: 0,
      })
      if (!revokedPull)
        throw new Error('Expected a scoped revocation response after access removal')
      expect(revokedPull.changes).toHaveLength(1)
      expect(revokedPull.changes[0]).toMatchObject({
        scopeID: childID,
        entityType: 'workspace',
        operation: 'delete',
        payload: '',
      })
      expect((await listNativeWorkspaceSnapshots(contributorID)).snapshots).toHaveLength(0)
    })
  }
)
