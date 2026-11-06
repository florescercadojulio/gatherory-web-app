import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import {
  encodeNativePayload,
  makeNativeEventEntity,
  makeNativeWorkspaceArchive,
  mobileFixtureDatabaseName,
  toFoundationSeconds,
  validateMobileFixtureTargets,
} from './mobile-browser-fixture-support'

const confirmationFlag = '--confirm-disposable-target'
const databaseUrl = process.env.DATABASE_URL
const baseUrl = process.env.MOBILE_BROWSER_BASE_URL ?? 'http://localhost:3011'

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

try {
  validateMobileFixtureTargets({
    databaseUrl,
    appBaseUrl: baseUrl,
    confirmed: process.argv.includes(confirmationFlag),
  })
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
}

const suffix = randomUUID().replaceAll('-', '').slice(0, 12)
const password = 'MobileBrowser-Fixture-2026-Only'

const ids = {
  host: `mobile-fixture-host-${suffix}`,
  manager: `mobile-fixture-manager-${suffix}`,
  contributor: `mobile-fixture-contributor-${suffix}`,
  viewer: `mobile-fixture-viewer-${suffix}`,
  signedGuest: `mobile-fixture-signed-guest-${suffix}`,
  childOnly: `mobile-fixture-child-only-${suffix}`,
  org: `mobile-fixture-${suffix}`,
  root: randomUUID(),
  child: randomUUID(),
  sibling: randomUUID(),
  guestChild: randomUUID(),
  expiredEvent: randomUUID(),
  revokedEvent: randomUUID(),
  pendingApprovalEvent: randomUUID(),
}
const emails = Object.fromEntries(
  Object.entries(ids)
    .filter(([key]) =>
      ['host', 'manager', 'contributor', 'viewer', 'signedGuest', 'childOnly'].includes(key)
    )
    .map(([key, id]) => [key, `${id}@example.test`])
) as Record<string, string>
const tokens = {
  publicGuest: randomUUID(),
  collaboratorApproval: randomUUID(),
  expiredGuest: randomUUID(),
  revokedGuest: randomUUID(),
  expiredInvitation: randomUUID(),
  revokedInvitation: randomUUID(),
}
const passwordHash = await (await import('better-auth/crypto')).hashPassword(password)
const isoSeconds = toFoundationSeconds(new Date(Date.now() + 86_400_000))
const startsAt = new Date((isoSeconds + 978_307_200) * 1000)
const personIds = Object.fromEntries(
  ['host', 'manager', 'contributor', 'viewer', 'signedGuest', 'childOnly'].map((key) => [
    key,
    randomUUID(),
  ])
) as Record<string, string>
const userIdFor = (key: string) => (ids as Record<string, string>)[key]!
const accounts = [
  ['host', 'Host / manager'],
  ['manager', 'María José de la Cruz — colaboradora coordinadora'],
  ['contributor', 'Contributing collaborator'],
  ['viewer', 'View-only collaborator'],
  ['signedGuest', 'Lucía Fernández-García de la Cruz'],
  ['childOnly', 'Child-only planner'],
] as const
const accountName = (key: string) => accounts.find(([accountKey]) => accountKey === key)![1]
const participation = (
  eventId: string,
  personKey: string,
  role: 'host' | 'collaborator' | 'guest',
  planningPermission: 'manage' | 'contribute' | 'view_only',
  attendanceStatus: 'going' | 'not_sure' | 'not_going' | 'pending'
) => ({
  id: randomUUID(),
  eventId,
  personId: personIds[personKey]!,
  role,
  planningPermission,
  attendanceStatus,
  createdAt: new Date(),
  updatedAt: new Date(),
})
const participantRows = [
  participation(ids.root, 'host', 'host', 'manage', 'going'),
  participation(ids.root, 'manager', 'collaborator', 'manage', 'not_sure'),
  participation(ids.root, 'contributor', 'collaborator', 'contribute', 'going'),
  participation(ids.root, 'viewer', 'collaborator', 'view_only', 'not_going'),
  participation(ids.root, 'signedGuest', 'guest', 'view_only', 'going'),
  participation(ids.child, 'host', 'host', 'manage', 'going'),
  participation(ids.child, 'manager', 'collaborator', 'manage', 'not_sure'),
  participation(ids.child, 'contributor', 'collaborator', 'contribute', 'going'),
  participation(ids.child, 'viewer', 'collaborator', 'view_only', 'not_going'),
  participation(ids.child, 'signedGuest', 'guest', 'view_only', 'going'),
  participation(ids.child, 'childOnly', 'collaborator', 'contribute', 'pending'),
  participation(ids.guestChild, 'signedGuest', 'guest', 'view_only', 'pending'),
  ...[ids.guestChild, ids.expiredEvent, ids.revokedEvent, ids.pendingApprovalEvent].map((eventId) =>
    participation(eventId, 'host', 'host', 'manage', 'going')
  ),
]
const longTitle = `Celebración familiar de Lucía — Mobile event title testing narrow-screen wrapping in Detroit (${suffix})`
const longLocation =
  'Salón comunitario del vecindario junto al río Detroit, entrada accesible por la avenida Jefferson, suite 204'

const { db, pool } = await import('../src/db/index')
const schema = await import('../src/db/schema/index')
const {
  user,
  account,
  organization,
  member,
  event,
  workspacePerson,
  eventParticipant,
  eventShareLink,
  eventInvitation,
  workspacePlanningSettings,
  eventTodo,
  eventNote,
  nativeWorkspaceSnapshot,
  nativeSyncScopeMember,
  nativeSyncEntity,
} = schema

try {
  await db.transaction(async (tx) => {
    await tx.insert(user).values(
      accounts.map(([key, name]) => ({
        id: ids[key],
        name,
        email: emails[key],
        emailVerified: true,
        hasCompletedOnboarding: true,
      }))
    )
    await tx.insert(account).values(
      accounts.map(([key]) => ({
        id: `mobile-fixture-credential-${key}-${suffix}`,
        accountId: ids[key],
        providerId: 'credential',
        userId: userIdFor(key),
        password: passwordHash,
      }))
    )
    await tx.insert(organization).values({
      id: ids.org,
      slug: ids.org,
      name: `Mobile browser fixture ${suffix}`,
      workspaceType: 'event',
      createdAt: new Date(),
    })
    await tx.insert(member).values(
      accounts.map(([key]) => ({
        id: randomUUID(),
        organizationId: ids.org,
        userId: userIdFor(key),
        role: 'member',
        createdAt: new Date(),
      }))
    )
    await tx.insert(workspacePlanningSettings).values({
      organizationId: ids.org,
      collaboratorLinkEnabled: true,
      requiresCollaboratorApproval: true,
      defaultCollaboratorPermission: 'contribute',
    })
    await tx.insert(event).values([
      {
        id: ids.root,
        organizationId: ids.org,
        title: longTitle,
        description:
          'Descripción larga para comprobar wrapping en pantallas pequeñas. Please preserve this draft while reviewing current values.',
        status: 'ongoing',
        startsAt,
        schedulingState: 'scheduled',
        timeZone: 'America/Detroit',
        locationName: longLocation,
        locationAddress: '100 Jefferson Avenue',
        locationAddressLine2: 'Suite 204',
        locationLatitude: 42.3314,
        locationLongitude: -83.0458,
        mapItemIdentifier: 'mobile-fixture-place',
        createdByUserId: ids.host,
      },
      ...[
        [
          ids.child,
          'Authorized child event — Fiesta para Lucía',
          'Child detail visible to scoped participants',
          'Salón comunitario',
        ],
        [
          ids.sibling,
          'PRIVATE_SIBLING_TITLE_SENTINEL',
          'Sibling must stay outside child-only scope',
          'PRIVATE_SIBLING_LOCATION_SENTINEL',
        ],
        [
          ids.guestChild,
          'Public guest RSVP — Día de celebración',
          'Hidden from guests in the RSVP summary',
          'Private venue room',
        ],
        [
          ids.expiredEvent,
          'Expired guest invitation fixture',
          'Unavailable after expiration',
          'Private room',
        ],
        [
          ids.revokedEvent,
          'Revoked guest invitation fixture',
          'Unavailable after revocation',
          'Private room',
        ],
        [
          ids.pendingApprovalEvent,
          'Collaborator approval fixture',
          'Pending approval status can be refreshed',
          'Planner room',
        ],
      ].map(([id, title, description, location]) => ({
        id,
        organizationId: ids.org,
        parentEventId: ids.root,
        title,
        description,
        planningStatus: 'approved' as const,
        category: 'other' as const,
        purpose:
          id === ids.child || id === ids.guestChild
            ? ('part_of_event' as const)
            : ('planning_scouting' as const),
        startsAt,
        schedulingState: 'scheduled' as const,
        timeZone: 'America/Detroit',
        locationName: location,
        createdByUserId: ids.host,
      })),
    ])
    await tx.insert(workspacePerson).values(
      accounts.map(([key, name]) => ({
        id: personIds[key],
        organizationId: ids.org,
        userId: userIdFor(key),
        displayName: name,
        email: emails[key],
      }))
    )
    await tx.insert(eventParticipant).values(participantRows)
    const rootParticipants = participantRows.filter((row) => row.eventId === ids.root)
    const nativeMembers = rootParticipants.map((row) => {
      const key = Object.keys(personIds).find((personKey) => personIds[personKey] === row.personId)!
      const name = accountName(key)
      return {
        id: row.personId,
        userID: userIdFor(key),
        name,
        participantRole: row.role,
        initials: name
          .split(' ')
          .map((part) => part[0])
          .slice(0, 2)
          .join(''),
        attendance:
          row.attendanceStatus === 'not_sure'
            ? 'maybe'
            : row.attendanceStatus === 'not_going'
              ? 'declined'
              : row.attendanceStatus === 'pending'
                ? 'invited'
                : 'going',
        email: emails[key],
        profileImageAssetName: null,
        profileImageURL: null,
        planningPermission:
          row.planningPermission === 'view_only' ? 'viewOnly' : row.planningPermission,
        invitationStatus: 'active',
      }
    })
    const nativeParticipations = rootParticipants.map((row) => ({
      id: row.id,
      eventID: ids.root,
      memberID: row.personId,
      role: row.role,
      planningPermission:
        row.planningPermission === 'view_only' ? 'viewOnly' : row.planningPermission,
      attendance:
        row.attendanceStatus === 'not_sure'
          ? 'maybe'
          : row.attendanceStatus === 'not_going'
            ? 'declined'
            : row.attendanceStatus === 'pending'
              ? 'invited'
              : 'going',
      invitationStatus: 'active',
      createdAt: toFoundationSeconds(row.createdAt),
      updatedAt: toFoundationSeconds(row.updatedAt),
    }))
    const todoId = randomUUID()
    const noteId = randomUUID()
    const todoTitle = 'Confirm accessibility details and guest seating — revisar accesibilidad'
    const noteBody =
      'Nota compartida: revisar el acceso accesible y confirmar los detalles del salón con el equipo.'
    await tx.insert(nativeWorkspaceSnapshot).values({
      scopeId: ids.root,
      ownerUserId: ids.host,
      organizationId: ids.org,
      serverVersion: 5,
      isDeleted: false,
      payload: encodeNativePayload(
        makeNativeWorkspaceArchive({
          rootId: ids.root,
          title: longTitle,
          foundationSeconds: isoSeconds,
          timeZone: 'America/Detroit',
          location: longLocation,
          description:
            'Descripción larga para comprobar wrapping en pantallas pequeñas. Please preserve this draft while reviewing current values.',
          members: nativeMembers,
          eventParticipations: nativeParticipations,
          participantIds: rootParticipants.map((row) => row.personId),
          timeline: [
            [
              ids.child,
              'Authorized child event — Fiesta para Lucía',
              'Child detail visible to scoped participants',
              'Salón comunitario',
            ],
            [
              ids.sibling,
              'PRIVATE_SIBLING_TITLE_SENTINEL',
              'Sibling must stay outside child-only scope',
              'PRIVATE_SIBLING_LOCATION_SENTINEL',
            ],
            [
              ids.guestChild,
              'Public guest RSVP — Día de celebración',
              'Hidden from guests in the RSVP summary',
              'Private venue room',
            ],
            [
              ids.expiredEvent,
              'Expired guest invitation fixture',
              'Unavailable after expiration',
              'Private room',
            ],
            [
              ids.revokedEvent,
              'Revoked guest invitation fixture',
              'Unavailable after revocation',
              'Private room',
            ],
            [
              ids.pendingApprovalEvent,
              'Collaborator approval fixture',
              'Pending approval status can be refreshed',
              'Planner room',
            ],
          ].map(([id, title, description, location]) => {
            return makeNativeEventEntity({
              id,
              rootId: ids.root,
              childId: ids.child,
              title,
              description,
              location,
              foundationSeconds: isoSeconds,
              participantIds: participantRows
                .filter((row) => row.eventId === id)
                .map((row) => row.personId),
            })
          }),
          notes: [
            {
              id: noteId,
              eventID: ids.child,
              authorUserID: ids.contributor,
              body: noteBody,
              sentAt: isoSeconds,
            },
          ],
          todos: [
            {
              id: todoId,
              eventID: ids.child,
              title: todoTitle,
              dueDate: null,
              websiteURL: null,
              assigneePersonID: null,
              isCompleted: false,
              createdAt: isoSeconds,
            },
          ],
        })
      ),
    })
    await tx.insert(nativeSyncScopeMember).values(
      ['host', 'manager', 'contributor', 'viewer'].map((key) => ({
        scopeId: ids.root,
        userId: userIdFor(key),
        role: key === 'host' ? ('owner' as const) : ('editor' as const),
      }))
    )
    await tx.insert(eventTodo).values({
      id: todoId,
      organizationId: ids.org,
      eventId: ids.child,
      title: todoTitle,
      isCompleted: false,
      createdAt: startsAt,
    })
    await tx.insert(eventNote).values({
      id: noteId,
      organizationId: ids.org,
      eventId: ids.child,
      authorUserId: ids.contributor,
      body: noteBody,
      sentAt: startsAt,
    })
    await tx.insert(nativeSyncEntity).values([
      ...[
        [
          ids.child,
          'Authorized child event — Fiesta para Lucía',
          'Child detail visible to scoped participants',
          'Salón comunitario',
        ],
        [
          ids.sibling,
          'PRIVATE_SIBLING_TITLE_SENTINEL',
          'Sibling must stay outside child-only scope',
          'PRIVATE_SIBLING_LOCATION_SENTINEL',
        ],
        [
          ids.guestChild,
          'Public guest RSVP — Día de celebración',
          'Hidden from guests in the RSVP summary',
          'Private venue room',
        ],
        [
          ids.expiredEvent,
          'Expired guest invitation fixture',
          'Unavailable after expiration',
          'Private room',
        ],
        [
          ids.revokedEvent,
          'Revoked guest invitation fixture',
          'Unavailable after revocation',
          'Private room',
        ],
        [
          ids.pendingApprovalEvent,
          'Collaborator approval fixture',
          'Pending approval status can be refreshed',
          'Planner room',
        ],
      ].map(([id, title, description, location]) => ({
        scopeId: ids.root,
        entityType: 'event',
        entityId: id,
        ownerUserId: ids.host,
        payload: encodeNativePayload(
          makeNativeEventEntity({
            id,
            rootId: ids.root,
            childId: ids.child,
            title,
            description,
            location,
            foundationSeconds: isoSeconds,
            participantIds: participantRows
              .filter((row) => row.eventId === id)
              .map((row) => row.personId),
          })
        ),
        serverVersion: 1,
        isDeleted: false,
      })),
      {
        scopeId: ids.root,
        entityType: 'todo',
        entityId: todoId,
        ownerUserId: ids.host,
        payload: encodeNativePayload({
          id: todoId,
          eventID: ids.child,
          title: todoTitle,
          dueDate: null,
          websiteURL: null,
          assigneePersonID: null,
          isCompleted: false,
          createdAt: isoSeconds,
        }),
        serverVersion: 1,
        isDeleted: false,
      },
      {
        scopeId: ids.root,
        entityType: 'note',
        entityId: noteId,
        ownerUserId: ids.contributor,
        payload: encodeNativePayload({
          id: noteId,
          eventID: ids.child,
          authorUserID: ids.contributor,
          body: noteBody,
          sentAt: isoSeconds,
        }),
        serverVersion: 1,
        isDeleted: false,
      },
    ])
    await tx.insert(eventShareLink).values([
      {
        eventId: ids.guestChild,
        token: tokens.publicGuest,
        role: 'guest',
        createdByUserId: ids.host,
      },
      {
        eventId: ids.pendingApprovalEvent,
        token: tokens.collaboratorApproval,
        role: 'collaborator',
        createdByUserId: ids.host,
      },
      {
        eventId: ids.expiredEvent,
        token: tokens.expiredGuest,
        role: 'guest',
        createdByUserId: ids.host,
        expiresAt: new Date(Date.now() - 60_000),
      },
      {
        eventId: ids.revokedEvent,
        token: tokens.revokedGuest,
        role: 'guest',
        createdByUserId: ids.host,
        revokedAt: new Date(),
      },
    ])
    const invitationPerson = personIds.childOnly
    await tx.insert(eventInvitation).values([
      {
        eventId: ids.expiredEvent,
        personId: invitationPerson,
        email: `expired-${suffix}@example.test`,
        token: tokens.expiredInvitation,
        role: 'collaborator',
        planningPermission: 'contribute',
        status: 'expired',
        invitedByUserId: ids.host,
        expiresAt: new Date(Date.now() - 60_000),
      },
      {
        eventId: ids.revokedEvent,
        personId: invitationPerson,
        email: `revoked-${suffix}@example.test`,
        token: tokens.revokedInvitation,
        role: 'collaborator',
        planningPermission: 'contribute',
        status: 'revoked',
        invitedByUserId: ids.host,
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    ])
  })
} catch (error) {
  await pool.end()
  throw error
}

await pool.end()

const route = (path: string) => new URL(path, baseUrl).toString()
const metadata = {
  generatedAt: new Date().toISOString(),
  appBaseUrl: baseUrl,
  database: mobileFixtureDatabaseName,
  credentials: Object.fromEntries(accounts.map(([key]) => [key, { email: emails[key] }])),
  routes: {
    signIn: route('/auth/sign-in'),
    plannerRoot: route(`/events/${ids.root}`),
    plannerChild: route(`/events/${ids.child}`),
    childOnlyRootDenied: route(`/events/${ids.root}`),
    childOnlyEvent: route(`/events/${ids.child}`),
    publicGuestJoin: route(`/join/${tokens.publicGuest}`),
    publicGuestEvent: route(`/invited/events/${ids.guestChild}`),
    collaboratorApproval: route(`/join/${tokens.collaboratorApproval}`),
    expiredGuestInvitation: route(`/join/${tokens.expiredGuest}`),
    revokedGuestInvitation: route(`/join/${tokens.revokedGuest}`),
    expiredAccountInvitation: route(`/join/${tokens.expiredInvitation}`),
    revokedAccountInvitation: route(`/join/${tokens.revokedInvitation}`),
  },
  fixtureIds: {
    organizationId: ids.org,
    rootEventId: ids.root,
    childEventId: ids.child,
    siblingEventId: ids.sibling,
  },
  expected: {
    rootTitle: longTitle,
    locationName: longLocation,
    languageMix: 'English + Spanish',
    childOnlyPlannerMustNotReadRoot: true,
  },
}
const outputPath = '/tmp/gatherory-mobile-browser-fixture.json'
await writeFile(outputPath, `${JSON.stringify(metadata, null, 2)}\n`, { mode: 0o600 })
console.info(`Fixture seeded in ${mobileFixtureDatabaseName}; metadata: ${outputPath}`)
