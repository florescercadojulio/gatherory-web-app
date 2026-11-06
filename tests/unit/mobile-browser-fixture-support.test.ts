import { expect, test } from 'vitest'
import {
  encodeNativePayload,
  makeNativeEventEntity,
  makeNativeWorkspaceArchive,
  mobileFixtureDatabaseName,
  toFoundationSeconds,
  validateMobileFixtureTargets,
} from '../../scripts/mobile-browser-fixture-support'

const disposableDatabaseUrl = `postgresql://fixture:fixture@127.0.0.1:5432/${mobileFixtureDatabaseName}`

test('fixture target guard requires explicit confirmation and the named loopback database', () => {
  expect(() =>
    validateMobileFixtureTargets({
      databaseUrl: disposableDatabaseUrl,
      appBaseUrl: 'http://localhost:3011',
      confirmed: false,
    })
  ).toThrow('Explicit disposable-target confirmation is required')

  expect(() =>
    validateMobileFixtureTargets({
      databaseUrl: 'postgresql://user:secret@db.example.test/gatherory_mobile_browser_test',
      appBaseUrl: 'http://localhost:3011',
      confirmed: true,
    })
  ).toThrow('Refusing non-loopback database host')

  expect(() =>
    validateMobileFixtureTargets({
      databaseUrl: 'postgresql://fixture:fixture@127.0.0.1:5432/development',
      appBaseUrl: 'http://localhost:3011',
      confirmed: true,
    })
  ).toThrow(`expected /${mobileFixtureDatabaseName}`)
})

test('native event fixture payload preserves required strings and Foundation numeric dates', () => {
  const scheduledDate = new Date('2026-11-04T20:30:00.000Z')
  const foundationSeconds = toFoundationSeconds(scheduledDate)
  const entity = makeNativeEventEntity({
    id: 'child-event-id',
    rootId: 'root-event-id',
    childId: 'child-event-id',
    title: 'Fiesta familiar',
    description: '',
    location: 'Salón comunitario',
    foundationSeconds,
    participantIds: ['person-id'],
  })
  const serialized = JSON.parse(Buffer.from(encodeNativePayload(entity), 'base64').toString('utf8'))

  expect(foundationSeconds).toBe(815_517_000)
  expect(serialized).toMatchObject({
    id: 'child-event-id',
    parentEventID: 'root-event-id',
    purpose: 'eventExperience',
    scheduledAt: foundationSeconds,
    eventDescription: '',
    eventLocation: {
      locationName: 'Salón comunitario',
      placeName: 'Salón comunitario',
      shortAddress: 'Salón comunitario',
      address: '100 Jefferson Avenue',
      addressLine2: 'Suite 204',
      mapItemIdentifier: 'mobile-fixture-place',
    },
    participantIDs: ['person-id'],
  })
  expect(typeof serialized.scheduledAt).toBe('number')
})

test('workspace archive fixture uses the complete iOS V1 shape and an EventLocation object', () => {
  const child = makeNativeEventEntity({
    id: 'child-event-id',
    rootId: 'root-event-id',
    childId: 'child-event-id',
    title: 'Fiesta familiar',
    description: '',
    location: 'Salón comunitario',
    foundationSeconds: 815_517_000,
    participantIds: ['person-id'],
  })
  const archive = makeNativeWorkspaceArchive({
    rootId: 'root-event-id',
    title: 'Celebración familiar',
    foundationSeconds: 815_517_000,
    timeZone: 'America/Detroit',
    location: 'Salón comunitario',
    description: 'Una descripción larga para la prueba.',
    members: [
      {
        id: 'person-id',
        userID: 'user-id',
        name: 'María José de la Cruz',
        participantRole: 'collaborator',
        initials: 'MJ',
        attendance: 'maybe',
        email: 'maria@example.test',
        profileImageAssetName: null,
        profileImageURL: null,
        planningPermission: 'viewOnly',
        invitationStatus: 'active',
      },
    ],
    eventParticipations: [
      {
        id: 'participation-id',
        eventID: 'root-event-id',
        memberID: 'person-id',
        role: 'collaborator',
        planningPermission: 'viewOnly',
        attendance: 'maybe',
        invitationStatus: 'active',
        createdAt: 815_517_000,
        updatedAt: 815_517_000,
      },
    ],
    participantIds: ['person-id'],
    timeline: [child],
    notes: [
      {
        id: 'note-id',
        eventID: 'child-event-id',
        authorUserID: 'author-id',
        body: 'Nota de prueba',
        sentAt: 815_517_000,
      },
    ],
    todos: [
      {
        id: 'todo-id',
        eventID: 'child-event-id',
        title: 'Confirmar detalles',
        dueDate: null,
        websiteURL: null,
        assigneePersonID: null,
        isCompleted: false,
        createdAt: 815_517_000,
      },
    ],
  })
  const serialized = JSON.parse(
    Buffer.from(encodeNativePayload(archive), 'base64').toString('utf8')
  )

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
    'eventParticipations',
    'mainEventParticipantIDs',
    'ideas',
    'timeline',
    'eventExpenses',
    'notes',
    'eventMoments',
    'isMainEventDeleted',
    'registry',
    'isRegistryShared',
    'isCollaboratorLinkEnabled',
    'requiresCollaboratorApproval',
    'defaultCollaboratorPermission',
  ])
    expect(serialized).toHaveProperty(key)
  expect(serialized.mainEventLocation).toMatchObject({
    locationName: 'Salón comunitario',
    placeName: 'Salón comunitario',
    shortAddress: 'Salón comunitario',
    address: '100 Jefferson Avenue',
    addressLine2: 'Suite 204',
  })
  expect(typeof serialized.mainEventStartsAt).toBe('number')
  expect(serialized.members).toMatchObject([{ id: 'person-id', name: 'María José de la Cruz' }])
  expect(serialized.eventParticipations).toMatchObject([
    { id: 'participation-id', eventID: 'root-event-id', memberID: 'person-id' },
  ])
  expect(serialized.mainEventParticipantIDs).toEqual(['person-id'])
  expect(serialized.timeline[0]).toMatchObject({
    purpose: 'eventExperience',
    scheduledAt: 815_517_000,
    participantIDs: ['person-id'],
  })
  expect(serialized.notes[0].sentAt).toBe(815_517_000)
  expect(serialized.todos[0].createdAt).toBe(815_517_000)
})
