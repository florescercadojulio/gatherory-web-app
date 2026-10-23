import type { db } from '@/db'
import {
  createReviewWorkspaceArchive,
  encodeNativeWorkspaceSnapshot,
  reviewWorkspaceIds,
} from '@/db/review-workspace-fixture'
import type { ReviewFixtureUser, ReviewFixtureUsers } from '@/db/review-workspace-fixture'
import { eventJoinRequest, eventShareLink } from '@/db/schema/event.schema'
import { ideaMusicTrack, musicTrack } from '@/db/schema/planning.schema'
import {
  nativeSyncEntity,
  nativeSyncScopeMember,
  nativeWorkspaceSnapshot,
} from '@/db/schema/sync.schema'
import type { NativeMutation } from '@/server/sync/contracts/native-sync.contracts'
import type { materializeNativeMutation } from '@/server/sync/repos/native-materializer.persistence'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** Pure seed plan: no auth calls, environment access, or database writes. */
export function createDevelopmentWorkspaceSeed(input: {
  workspaceId: string
  users: ReviewFixtureUsers
  receptionPlanner: ReviewFixtureUser
  pendingCollaborators: readonly [ReviewFixtureUser, ReviewFixtureUser]
  now: Date
}) {
  const archive = createReviewWorkspaceArchive(input)
  const owner = input.users[0]
  const scopeId = archive.mainEventID
  const createdAt = input.now.toISOString()
  const records: Array<{ userId: string; mutation: NativeMutation }> = []
  function add(
    entityType: NativeMutation['entityType'],
    entityID: string,
    payload: unknown,
    userId = owner.id
  ) {
    records.push({
      userId,
      mutation: {
        id: entityID,
        scopeID: scopeId,
        entityType,
        entityID,
        payloadSchemaVersion: 1,
        operation: 'create',
        baseVersion: null,
        createdAt,
        attemptCount: 0,
        payload: Buffer.from(JSON.stringify(payload)).toString('base64'),
      },
    })
  }

  // Match sync's dependency order and actor identity. In particular, linking a
  // person or recording a preference must use that person's own account ID.
  add('workspace', scopeId, archive)
  for (const person of archive.members)
    add('participant', person.id, person, person.userID ?? owner.id)
  for (const event of archive.timeline) add('event', event.id, event)
  for (const participation of archive.eventParticipations)
    add('event_participation', participation.id, participation)
  for (const idea of archive.ideas) add('idea', idea.id, idea, idea.submittedByUserID)
  for (const response of archive.ideaResponses)
    add('idea_response', response.id, response, response.userID)
  for (const expense of archive.eventExpenses)
    add('expense', expense.id, expense, expense.createdByUserID)
  for (const item of archive.registry) add('registry_item', item.id, item)
  for (const note of archive.notes) add('note', note.id, note, note.authorUserID)

  const scopeMembers = archive.eventParticipations
    .filter((participation) => participation.eventID === scopeId && participation.role !== 'guest')
    .flatMap((participation) => {
      const person = archive.members.find((member) => member.id === participation.memberID)
      if (!person?.userID) return []
      return [
        {
          scopeId,
          userId: person.userID,
          role:
            participation.role === 'host'
              ? ('owner' as const)
              : participation.planningPermission === 'viewOnly'
                ? ('viewer' as const)
                : ('editor' as const),
        },
      ]
    })

  // Requests are not participants. Approval creates exact-event participation;
  // it must not pre-grant organization, team, or root-scope membership.
  const expiresAt = new Date(input.now.getTime() + 14 * 24 * 60 * 60 * 1000)
  const shareLinks = [scopeId, reviewWorkspaceIds.events.reception].map((eventId) => ({
    eventId,
    token:
      eventId === scopeId
        ? '90000000-0000-4000-8000-000000000001'
        : '90000000-0000-4000-8000-000000000002',
    role: 'collaborator',
    createdByUserId: owner.id,
    expiresAt,
    createdAt: new Date(input.now.getTime() - 3 * 60 * 60 * 1000),
    updatedAt: input.now,
  })) satisfies Array<typeof eventShareLink.$inferInsert>
  const joinRequests = shareLinks.flatMap((link, eventIndex) =>
    input.pendingCollaborators.map((person, personIndex) => ({
      id: `91000000-0000-4000-8000-${String(eventIndex * 10 + personIndex + 1).padStart(12, '0')}`,
      eventId: link.eventId,
      userId: person.id,
      shareLinkToken: link.token,
      status: 'pending',
      createdAt: new Date(input.now.getTime() - (2 - personIndex) * 60 * 60 * 1000),
      updatedAt: input.now,
    }))
  ) satisfies Array<typeof eventJoinRequest.$inferInsert>

  return {
    workspaceId: input.workspaceId,
    ownerUserId: owner.id,
    archive,
    records,
    scopeMembers,
    shareLinks,
    joinRequests,
  }
}

/** Caller owns the transaction: normalized rows, snapshot, and entity versions
 * either all become visible together or none do. No sync receipts or fake
 * outbox acknowledgements are created by a development seed. */
export async function writeDevelopmentWorkspaceSeed(
  transaction: Transaction,
  plan: ReturnType<typeof createDevelopmentWorkspaceSeed>,
  materialize: typeof materializeNativeMutation
) {
  await transaction.insert(nativeWorkspaceSnapshot).values({
    scopeId: plan.archive.mainEventID,
    ownerUserId: plan.ownerUserId,
    organizationId: plan.workspaceId,
    payload: encodeNativeWorkspaceSnapshot(plan.archive),
    serverVersion: 1,
    isDeleted: false,
  })
  for (const record of plan.records) {
    await materialize(transaction, { ...record, organizationId: plan.workspaceId })
    await transaction.insert(nativeSyncEntity).values({
      scopeId: record.mutation.scopeID,
      entityType: record.mutation.entityType,
      entityId: record.mutation.entityID,
      ownerUserId: record.userId,
      payload: record.mutation.payload,
      serverVersion: 1,
      isDeleted: false,
    })
  }
  await transaction.insert(nativeSyncScopeMember).values(plan.scopeMembers)
  await transaction.insert(eventShareLink).values(plan.shareLinks)
  await transaction.insert(eventJoinRequest).values(plan.joinRequests)

  // The native materializer retains category configuration; the web music view
  // also reads normalized tracks. Derive those rows from the same native data.
  const musicIdea = plan.archive.ideas.find(
    (idea) => idea.id === reviewWorkspaceIds.planning.musicIdea
  )!
  const trackIds = [
    reviewWorkspaceIds.planning.musicTrack,
    reviewWorkspaceIds.planning.musicTrack2,
    reviewWorkspaceIds.planning.musicTrack3,
    reviewWorkspaceIds.planning.musicTrack4,
  ]
  for (const [sortOrder, track] of musicIdea.configuration.music!._0.tracks.entries()) {
    const musicTrackId = trackIds[sortOrder]
    if (!musicTrackId) throw new Error(`Missing stable seed ID for music track ${sortOrder}`)

    await transaction.insert(musicTrack).values({
      id: musicTrackId,
      provider: 'apple_music',
      providerTrackId: track.catalogID,
      title: track.title,
      artistName: track.artistName,
      albumTitle: track.albumTitle,
      artworkUrl: track.artworkURL,
      durationMs: Math.round(track.duration * 1000),
    })
    await transaction.insert(ideaMusicTrack).values({
      ideaId: musicIdea.id,
      musicTrackId,
      sortOrder,
    })
  }
}
