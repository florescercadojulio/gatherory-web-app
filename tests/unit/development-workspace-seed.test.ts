import { describe, expect, test, vi } from 'vitest'

import {
  createDevelopmentWorkspaceSeed,
  writeDevelopmentWorkspaceSeed,
} from '@/db/development-workspace-seed'
import { encodeNativeWorkspaceSnapshot, reviewWorkspaceIds } from '@/db/review-workspace-fixture'
import { eventJoinRequest, eventShareLink } from '@/db/schema/event.schema'
import {
  nativeSyncEntity,
  nativeSyncScopeMember,
  nativeWorkspaceSnapshot,
} from '@/db/schema/sync.schema'
import { ideaResponseID } from '@/server/sync/contracts/idea-response'
import { pushRequestSchema } from '@/server/sync/contracts/native-sync.contracts'
import { buildScopedEventArchive } from '@/server/sync/services/scoped-event-projection'

const person = (id: string) => ({ id, name: id, email: `${id}@gatherory.test` })
const input = {
  workspaceId: 'workspace-id',
  users: [
    person('alex'),
    person('jordan'),
    person('maya'),
    person('sam'),
    person('reviewer'),
  ] as const,
  receptionPlanner: person('taylor'),
  pendingCollaborators: [person('casey'), person('riley')] as const,
  now: new Date('2026-10-14T12:00:00Z'),
}
const { events, people, planning } = reviewWorkspaceIds

describe('development seed plan', () => {
  test('is deterministic and uses current mutation envelopes with dependency ordering', () => {
    const plan = createDevelopmentWorkspaceSeed(input)
    expect(plan).toEqual(createDevelopmentWorkspaceSeed(input))
    const seen = new Set<string>()
    for (const { userId, mutation } of plan.records) {
      expect(pushRequestSchema.safeParse({ mutations: [mutation] }).success).toBe(true)
      expect(mutation.scopeID).toBe(events.main)
      const key = `${mutation.entityType}:${mutation.entityID}`
      expect(seen.has(key)).toBe(false)
      const payload = JSON.parse(Buffer.from(mutation.payload, 'base64').toString())
      if (mutation.entityType !== 'workspace')
        expect(seen.has(`workspace:${events.main}`)).toBe(true)
      if (payload.eventID && payload.eventID !== events.main)
        expect(seen.has(`event:${payload.eventID}`)).toBe(true)
      if (mutation.entityType === 'event_participation')
        expect(seen.has(`participant:${payload.memberID}`)).toBe(true)
      if (mutation.entityType === 'participant' && payload.userID)
        expect(userId).toBe(payload.userID)
      if (mutation.entityType === 'idea_response') {
        expect(seen.has(`idea:${payload.ideaID}`)).toBe(true)
        expect(userId).toBe(payload.userID)
        expect(mutation.entityID).toBe(ideaResponseID(payload.ideaID, userId))
      }
      seen.add(key)
    }
  })

  test('gives root sync access only to root planners, never guests or child-only planners', () => {
    const { archive, scopeMembers, joinRequests } = createDevelopmentWorkspaceSeed(input)
    expect(scopeMembers.map((member) => member.userId).sort()).toEqual([
      'alex',
      'jordan',
      'maya',
      'reviewer',
    ])
    expect(archive.mainEventParticipantIDs).not.toContain(people.receptionPlanner)
    expect(
      archive.eventParticipations.filter((item) => item.memberID === people.receptionPlanner)
    ).toEqual([
      expect.objectContaining({
        eventID: events.reception,
        role: 'collaborator',
        planningPermission: 'contribute',
      }),
    ])
    for (const request of joinRequests) {
      expect(archive.members.some((person) => person.userID === request.userId)).toBe(false)
      expect(scopeMembers.some((person) => person.userId === request.userId)).toBe(false)
    }
  })

  test('keeps the seeded planner as a managing host for the root and every child event', () => {
    const { archive } = createDevelopmentWorkspaceSeed(input)
    const planner = archive.members.find((member) => member.userID === input.users[0].id)!
    const plannerParticipations = archive.eventParticipations.filter(
      (participation) => participation.memberID === planner.id
    )

    expect(planner.participantRole).toBe('host')
    expect(planner.planningPermission).toBe('manage')
    expect(plannerParticipations).toHaveLength(7)
    expect(new Set(plannerParticipations.map((participation) => participation.eventID))).toEqual(
      new Set(Object.values(reviewWorkspaceIds.events))
    )
    expect(
      plannerParticipations.every(
        (participation) =>
          participation.role === 'host' && participation.planningPermission === 'manage'
      )
    ).toBe(true)
  })

  test('seeds real approval requests against live per-event links with a clear latest request', () => {
    const plan = createDevelopmentWorkspaceSeed(input)
    expect(plan.archive).not.toHaveProperty('collaboratorInviteURL')
    expect(plan.archive.requiresCollaboratorApproval).toBe(true)
    for (const eventId of [events.main, events.reception]) {
      const requests = plan.joinRequests.filter((item) => item.eventId === eventId)
      const link = plan.shareLinks.find((item) => item.eventId === eventId)!
      expect(requests).toHaveLength(2)
      expect(link.role).toBe('collaborator')
      expect(link.expiresAt.getTime()).toBeGreaterThan(input.now.getTime())
      expect(
        requests.every(
          (request) => request.shareLinkToken === link.token && request.status === 'pending'
        )
      ).toBe(true)
      expect(requests[0].createdAt.getTime()).toBeGreaterThan(link.createdAt.getTime())
      expect(requests[1].createdAt.getTime()).toBeGreaterThan(requests[0].createdAt.getTime())
      expect(requests[1].userId).toBe('riley')
    }
  })

  test('has coherent RSVP, category configurations, notes, budget, and authorship fixtures', () => {
    const { archive } = createDevelopmentWorkspaceSeed(input)
    const rootGuests = archive.eventParticipations.filter(
      (item) => item.eventID === events.main && item.role === 'guest'
    )
    expect(new Set(rootGuests.map((item) => item.attendance))).toEqual(
      new Set(['going', 'maybe', 'declined', 'invited'])
    )
    const allocated =
      archive.mainEventBudgetCap +
      archive.timeline.reduce((sum, item) => sum + (item.budgetCap ?? 0), 0)
    expect(allocated).toBeLessThanOrEqual(archive.workspaceBudgetCap)
    expect(new Set(archive.eventExpenses.map((item) => item.status))).toEqual(
      new Set(['paid', 'committed', 'estimated'])
    )
    for (const idea of archive.ideas) {
      expect(Object.keys(idea.configuration)).toEqual([
        idea.category === 'other' ? 'standard' : idea.category,
      ])
      const author = archive.members.find((person) => person.userID === idea.submittedByUserID)!
      expect(
        archive.eventParticipations.some(
          (item) =>
            item.eventID === idea.eventID && item.memberID === author.id && item.role !== 'guest'
        )
      ).toBe(true)
    }
    for (const eventId of [events.main, events.reception]) {
      const notes = archive.notes.filter((note) => note.eventID === eventId)
      expect(notes).toHaveLength(2)
      expect(notes[1].sentAt).toBeGreaterThan(notes[0].sentAt)
    }
    expect(archive.notes.filter((note) => String(note.eventID) === events.tasting)).toEqual([])
    for (const event of archive.timeline) {
      expect(event.participantIDs).toEqual(
        archive.eventParticipations
          .filter((item) => item.eventID === event.id)
          .map((item) => item.memberID)
      )
    }
  })

  test('projects a useful isolated reception workspace without root or sibling content', () => {
    const plan = createDevelopmentWorkspaceSeed(input)
    const payload = buildScopedEventArchive({
      snapshotPayload: encodeNativeWorkspaceSnapshot(plan.archive),
      eventId: events.reception,
      entities: plan.records.map(({ mutation }) => ({
        entityType: mutation.entityType,
        entityId: mutation.entityID,
        payload: mutation.payload,
        isDeleted: false,
      })),
    })
    expect(payload).not.toBeNull()
    const projected: Record<string, unknown> = JSON.parse(
      Buffer.from(payload!, 'base64').toString()
    )
    expect(projected.mainEventID).toBe(events.reception)
    expect(projected.isScopedEvent).toBe(true)
    expect(projected.timeline).toEqual([])
    expect(projected.ideas).toEqual([expect.objectContaining({ id: planning.decorIdea })])
    expect(projected.notes).toHaveLength(2)
    expect(projected.eventExpenses).toHaveLength(2)
    expect(projected.ideaResponses).toEqual([])
    expect(projected.members).toContainEqual(expect.objectContaining({ userID: 'taylor' }))
    const serialized = JSON.stringify(projected)
    expect(serialized).not.toContain(events.main)
    expect(serialized).not.toContain(events.tasting)
    expect(serialized).not.toContain(planning.eventNote)
    expect(serialized).not.toContain(planning.venueIdea)
  })
})

describe('development seed persistence', () => {
  function setup() {
    const writes: Array<{ table: unknown; values: unknown }> = []
    const transaction = {
      insert: vi.fn((table: unknown) => ({
        values: vi.fn(async (values: unknown) => {
          writes.push({ table, values })
        }),
      })),
    } as unknown as Parameters<typeof writeDevelopmentWorkspaceSeed>[0]
    const materialize = vi
      .fn<Parameters<typeof writeDevelopmentWorkspaceSeed>[2]>()
      .mockResolvedValue({ organizationId: input.workspaceId })
    return { writes, transaction, materialize }
  }

  test('uses the caller transaction and identical payloads for canonical materialization and native records', async () => {
    const plan = createDevelopmentWorkspaceSeed(input)
    const { writes, transaction, materialize } = setup()
    await writeDevelopmentWorkspaceSeed(transaction, plan, materialize)
    expect(writes[0]).toEqual({
      table: nativeWorkspaceSnapshot,
      values: expect.objectContaining({
        payload: encodeNativeWorkspaceSnapshot(plan.archive),
        organizationId: input.workspaceId,
      }),
    })
    expect(materialize).toHaveBeenCalledTimes(plan.records.length)
    const entities = writes.filter((write) => write.table === nativeSyncEntity)
    expect(entities).toHaveLength(plan.records.length)
    plan.records.forEach((record, index) => {
      expect(materialize).toHaveBeenNthCalledWith(index + 1, transaction, {
        ...record,
        organizationId: input.workspaceId,
      })
      expect(entities[index].values).toMatchObject({
        scopeId: events.main,
        entityId: record.mutation.entityID,
        entityType: record.mutation.entityType,
        payload: record.mutation.payload,
        serverVersion: 1,
      })
    })
    expect(writes.find((write) => write.table === nativeSyncScopeMember)?.values).toEqual(
      plan.scopeMembers
    )
    expect(writes.find((write) => write.table === eventShareLink)?.values).toEqual(plan.shareLinks)
    expect(writes.find((write) => write.table === eventJoinRequest)?.values).toEqual(
      plan.joinRequests
    )
  })

  test('propagates materialization failures so the caller transaction can roll back', async () => {
    const plan = createDevelopmentWorkspaceSeed(input)
    const { writes, transaction, materialize } = setup()
    const error = new Error('materialization failed')
    materialize.mockRejectedValueOnce(error)
    await expect(writeDevelopmentWorkspaceSeed(transaction, plan, materialize)).rejects.toBe(error)
    expect(materialize).toHaveBeenCalledTimes(1)
    expect(writes).toHaveLength(1)
    expect(writes.some((write) => write.table === nativeSyncScopeMember)).toBe(false)
  })
})
