import { expect, test } from 'vitest'

import { createReviewWorkspaceArchive } from '@/db/review-workspace-fixture'
import { buildScopedEventArchive } from '@/server/sync/services/scoped-event-projection'

const ids = {
  root: '10000000-0000-4000-8000-000000000001',
  child: '10000000-0000-4000-8000-000000000002',
  sibling: '10000000-0000-4000-8000-000000000003',
  rootIdea: '20000000-0000-4000-8000-000000000001',
  childIdea: '20000000-0000-4000-8000-000000000002',
  siblingIdea: '20000000-0000-4000-8000-000000000003',
  rootExpense: '30000000-0000-4000-8000-000000000001',
  childExpense: '30000000-0000-4000-8000-000000000002',
  childNote: '40000000-0000-4000-8000-000000000001',
  rootMoment: '50000000-0000-4000-8000-000000000001',
  childMoment: '50000000-0000-4000-8000-000000000002',
  rootRegistry: '60000000-0000-4000-8000-000000000001',
  childRegistry: '60000000-0000-4000-8000-000000000002',
  member: '70000000-0000-4000-8000-000000000001',
  participation: '80000000-0000-4000-8000-000000000001',
}

const users = [
  { id: 'host-user', name: 'Root Host', email: 'host@example.test' },
  { id: 'other-user', name: 'Other', email: 'other@example.test' },
  { id: 'planner-user', name: 'Planner', email: 'planner@example.test' },
  { id: 'guest-user', name: 'Guest', email: 'guest@example.test' },
  { id: 'review-user', name: 'Review', email: 'review@example.test' },
] as const

const makeArchive = () => {
  const archive: Record<string, any> = createReviewWorkspaceArchive({ users })
  archive.mainEventID = ids.root
  archive.title = 'Root only title'
  archive.mainEventBudgetCap = 50000
  archive.workspaceBudgetCap = 75000
  archive.isRegistryShared = true
  archive.isCollaboratorLinkEnabled = true
  archive.requiresCollaboratorApproval = true
  archive.defaultCollaboratorPermission = 'manage'
  archive.timeline = [
    {
      id: ids.child,
      title: 'Snapshot child title',
      category: 'reception',
      purpose: 'eventExperience',
      scheduledAt: 800000000,
      endsAt: 800003600,
      isAllDay: false,
      timeZoneIdentifier: 'America/Detroit',
      eventLocation: { locationName: 'Child hall', address: 'Child address' },
      participantIDs: [ids.member],
      parentEventID: ids.root,
      status: 'approved',
      statusBeforeArchiving: 'notSure',
      completionStatus: 'upcoming',
      response: null,
      linkedIdeaID: ids.rootIdea,
      imageData: null,
      mediaAssetID: '90000000-0000-4000-8000-000000000001',
      eventDescription: 'Child description',
      dressCode: 'Child dress code',
      budgetCap: 1200,
    },
    {
      id: ids.sibling,
      title: 'Sibling sentinel',
      parentEventID: ids.root,
    },
  ]
  archive.ideas = [
    { id: ids.rootIdea, eventID: ids.root, title: 'Root idea', configuration: {} },
    {
      id: ids.childIdea,
      eventID: ids.child,
      title: 'Child idea',
      configuration: {
        event: {
          _0: {
            linkedIdeaID: ids.rootIdea,
            ideaID: ids.siblingIdea,
            parentEventID: ids.root,
            linkedEventID: ids.sibling,
          },
        },
      },
    },
    { id: ids.siblingIdea, eventID: ids.sibling, title: 'Sibling idea', configuration: {} },
    { id: '20000000-0000-4000-8000-000000000004', eventID: null, title: 'Legacy root idea' },
  ]
  archive.eventExpenses = [
    { id: ids.rootExpense, eventID: ids.root, sourceIdeaID: ids.rootIdea, title: 'Root expense' },
    {
      id: ids.childExpense,
      eventID: ids.child,
      sourceIdeaID: ids.rootIdea,
      title: 'Child expense',
    },
  ]
  archive.notes = [
    { id: ids.childNote, eventID: ids.child, body: 'Child note' },
    { id: '40000000-0000-4000-8000-000000000002', eventID: null, body: 'Legacy root note' },
  ]
  archive.eventMoments = [
    { id: ids.rootMoment, eventID: ids.root, imageData: '', addedBy: 'Root' },
    { id: ids.childMoment, eventID: ids.child, imageData: '', addedBy: 'Child' },
    { id: '50000000-0000-4000-8000-000000000003', eventID: null, imageData: '', addedBy: 'Legacy' },
  ]
  archive.registry = [
    { id: ids.rootRegistry, eventID: ids.root, title: 'Root registry' },
    {
      id: ids.childRegistry,
      eventID: ids.child,
      sourceIdeaID: ids.siblingIdea,
      title: 'Child registry',
    },
  ]
  archive.eventParticipations = [
    {
      id: ids.participation,
      eventID: ids.child,
      memberID: ids.member,
      role: 'host',
      planningPermission: 'manage',
      attendance: 'going',
      invitationStatus: 'active',
      createdAt: 800000000,
      updatedAt: 800000000,
    },
  ]
  archive.members = [
    {
      id: ids.member,
      userID: 'host-user',
      name: 'Child planner',
      participantRole: 'host',
      initials: 'CP',
      attendance: 'going',
      planningPermission: 'manage',
      invitationStatus: 'active',
    },
    {
      id: '70000000-0000-4000-8000-000000000002',
      userID: 'root-only-user',
      name: 'Root only member',
      participantRole: 'host',
      initials: 'RO',
      attendance: 'going',
      planningPermission: 'manage',
      invitationStatus: 'active',
    },
  ]
  archive.ideaResponses = [
    { id: 'a0000000-0000-4000-8000-000000000001', ideaID: ids.childIdea, memberID: ids.member },
    { id: 'a0000000-0000-4000-8000-000000000002', ideaID: ids.rootIdea, memberID: ids.member },
  ]
  return archive
}

const decode = (payload: string) =>
  JSON.parse(Buffer.from(payload, 'base64').toString('utf8')) as Record<string, any>
const encodeSnapshot = (archive: Record<string, any>) =>
  Buffer.from(JSON.stringify(archive)).toString('base64')

test('projects only the selected child and replaces root metadata with child metadata', () => {
  const archive = makeArchive()
  const payload = buildScopedEventArchive({
    snapshotPayload: encodeSnapshot(archive),
    entities: [],
    eventId: ids.child.toUpperCase(),
  })

  expect(payload).not.toBeNull()
  const projected = decode(payload!)
  expect(projected.mainEventID).toBe(ids.child)
  expect(projected.title).toBe('Snapshot child title')
  expect(projected.mainEventStartsAt).toBe(800000000)
  expect(projected.mainEventLocation).toEqual({
    address: 'Child address',
    shortAddress: '',
    placeName: '',
    locationName: 'Child hall',
    addressLine2: '',
    latitude: null,
    longitude: null,
    mapItemIdentifier: null,
  })
  expect(projected.mainEventMediaAssetID).toBe('90000000-0000-4000-8000-000000000001')
  expect(projected.eventMessage).toBe('Child description')
  expect(projected.mainEventBudgetCap).toBe(1200)
  expect(projected.mainEventStatus).toBe('ongoing')
  expect(projected.isScopedEvent).toBe(true)
  expect(projected.scopedEvent).toEqual({
    id: ids.child,
    title: 'Snapshot child title',
    category: 'reception',
    purpose: 'eventExperience',
    scheduledAt: 800000000,
    schedulingState: null,
    endsAt: 800003600,
    isAllDay: false,
    timeZoneIdentifier: 'America/Detroit',
    eventLocation: projected.mainEventLocation,
    participantIDs: [ids.member],
    status: 'approved',
    statusBeforeArchiving: 'notSure',
    completionStatus: 'upcoming',
    response: null,
    imageData: null,
    mediaAssetID: '90000000-0000-4000-8000-000000000001',
    eventDescription: 'Child description',
    dressCode: 'Child dress code',
    budgetCap: 1200,
  })
  expect(projected.scopedEvent).not.toHaveProperty('parentEventID')
  expect(projected.scopedEvent).not.toHaveProperty('linkedIdeaID')
  expect(projected).not.toHaveProperty('collaboratorInviteURL')
  expect(projected.timeline).toEqual([])
  expect(projected.workspaceBudgetCap).toBeNull()
  expect(projected.isRegistryShared).toBe(false)
  expect(projected.isCollaboratorLinkEnabled).toBe(false)
  expect(projected.requiresCollaboratorApproval).toBe(false)
  expect(projected.defaultCollaboratorPermission).toBe('viewOnly')
  expect(projected.ideas.map((idea: any) => idea.id)).toEqual([ids.childIdea])
  expect(projected.eventExpenses.map((expense: any) => expense.id)).toEqual([ids.childExpense])
  expect(projected.notes.map((note: any) => note.id)).toEqual([ids.childNote])
  expect(projected.eventMoments.map((moment: any) => moment.id)).toEqual([ids.childMoment])
  expect(projected.registry.map((item: any) => item.id)).toEqual([ids.childRegistry])
  expect(projected.ideaResponses.map((response: any) => response.ideaID)).toEqual([ids.childIdea])
  expect(projected.members.map((member: any) => member.id)).toEqual([ids.member])
  expect(projected.mainEventParticipantIDs).toEqual([ids.member])
  expect(projected.eventExpenses[0].sourceIdeaID).toBeNull()
  expect(projected.registry[0].sourceIdeaID).toBeNull()
  expect(projected.ideas[0].configuration.event._0.linkedIdeaID).toBeNull()
  expect(projected.ideas[0].configuration.event._0.ideaID).toBeNull()
  expect(projected.ideas[0].configuration.event._0.parentEventID).toBeNull()
  expect(projected.ideas[0].configuration.event._0.linkedEventID).toBeNull()
})

test('latest case-insensitive entity overlays and tombstones are applied before projection', () => {
  const archive = makeArchive()
  const childEvent = archive.timeline[0]
  const payload = buildScopedEventArchive({
    snapshotPayload: encodeSnapshot(archive),
    entities: [
      {
        entityType: 'event',
        entityId: ids.child.toUpperCase(),
        isDeleted: false,
        payload: Buffer.from(
          JSON.stringify({ ...childEvent, title: 'Latest child title' })
        ).toString('base64'),
      },
      {
        entityType: 'idea',
        entityId: ids.childIdea.toUpperCase(),
        isDeleted: true,
        payload: '',
      },
      {
        entityType: 'note',
        entityId: ids.childNote,
        isDeleted: true,
        payload: '',
      },
    ],
    eventId: ids.child,
  })

  expect(payload).not.toBeNull()
  const projected = decode(payload!)
  expect(projected.title).toBe('Latest child title')
  expect(projected.ideas).toEqual([])
  expect(projected.notes).toEqual([])
  expect(projected.ideaResponses).toEqual([])
})

test('canonical child participation roles and child metadata override stale snapshot values', () => {
  const archive = makeArchive()
  const payload = buildScopedEventArchive({
    snapshotPayload: encodeSnapshot(archive),
    entities: [],
    eventId: ids.child,
    members: [
      {
        ...archive.members[0],
        id: ids.member.toUpperCase(),
        name: 'Canonical planner',
        participantRole: 'host',
        planningPermission: 'manage',
      },
    ],
    participations: [
      {
        id: ids.participation.toUpperCase(),
        eventID: ids.child.toUpperCase(),
        memberID: ids.member.toUpperCase(),
        role: 'guest',
        planningPermission: 'viewOnly',
        attendance: 'maybe',
        invitationStatus: 'invited',
      },
    ],
    childEvent: {
      ...archive.timeline[0],
      title: 'Canonical child title',
      scheduledAt: undefined,
      status: 'cancelled',
      completionStatus: 'complete',
      eventLocation: { locationName: 'Canonical venue', address: 'Canonical address' },
      mediaAssetID: '90000000-0000-4000-8000-000000000002',
      eventDescription: null,
      dressCode: null,
    },
  })

  expect(payload).not.toBeNull()
  const projected = decode(payload!)
  expect(projected.title).toBe('Canonical child title')
  expect(projected.mainEventStartsAt).toBe(0)
  expect(projected.mainEventStatus).toBe('cancelled')
  expect(projected.mainEventLocation.locationName).toBe('Canonical venue')
  expect(projected.mainEventMediaAssetID).toBe('90000000-0000-4000-8000-000000000002')
  expect(projected.eventParticipations).toHaveLength(1)
  expect(projected.eventParticipations[0].role).toBe('guest')
  expect(projected.eventParticipations[0].planningPermission).toBe('viewOnly')
  expect(projected.members[0].participantRole).toBe('guest')
  expect(projected.members[0].planningPermission).toBe('viewOnly')
  expect(projected.members[0].attendance).toBe('maybe')
  expect(projected.members[0].invitationStatus).toBe('invited')
  expect(projected.scopedEvent).toMatchObject({
    category: 'reception',
    purpose: 'eventExperience',
    scheduledAt: 0,
    status: 'cancelled',
    completionStatus: 'complete',
    eventDescription: '',
    dressCode: '',
    participantIDs: [ids.member],
  })
  expect(projected.scopedEvent).not.toHaveProperty('parentEventID')
  expect(projected.scopedEvent).not.toHaveProperty('linkedIdeaID')
  expect(projected.scopedEvent.eventLocation).toEqual({
    address: 'Canonical address',
    shortAddress: '',
    placeName: '',
    locationName: 'Canonical venue',
    addressLine2: '',
    latitude: null,
    longitude: null,
    mapItemIdentifier: null,
  })
})

test('scopedEvent defaults missing category and purpose and maps the native notSure status', () => {
  const archive = makeArchive()
  delete archive.timeline[0].category
  delete archive.timeline[0].purpose
  archive.timeline[0].status = 'not_sure'
  archive.timeline[0].statusBeforeArchiving = 'not_sure'
  const payload = buildScopedEventArchive({
    snapshotPayload: encodeSnapshot(archive),
    entities: [],
    eventId: ids.child,
  })

  expect(payload).not.toBeNull()
  const projected = decode(payload!)
  expect(projected.scopedEvent).toMatchObject({
    category: 'other',
    purpose: 'planning',
    status: 'notSure',
    statusBeforeArchiving: 'notSure',
  })
})

test('fails closed when the requested child is absent or tombstoned', () => {
  const archive = makeArchive()
  const snapshotPayload = encodeSnapshot(archive)
  expect(
    buildScopedEventArchive({
      snapshotPayload,
      entities: [],
      eventId: '10000000-0000-4000-8000-000000000099',
    })
  ).toBeNull()
  expect(
    buildScopedEventArchive({
      snapshotPayload,
      entities: [{ entityType: 'event', entityId: ids.child, payload: '', isDeleted: true }],
      eventId: ids.child,
    })
  ).toBeNull()
})

test('accepts legacy children without a parent ID and rejects explicit wrong parents', () => {
  const archive = makeArchive()
  delete archive.timeline[0].parentEventID
  const snapshotPayload = encodeSnapshot(archive)
  expect(
    buildScopedEventArchive({ snapshotPayload, entities: [], eventId: ids.child })
  ).not.toBeNull()

  archive.timeline[0].parentEventID = ids.sibling
  expect(
    buildScopedEventArchive({
      snapshotPayload: encodeSnapshot(archive),
      entities: [],
      eventId: ids.child,
    })
  ).toBeNull()
})
