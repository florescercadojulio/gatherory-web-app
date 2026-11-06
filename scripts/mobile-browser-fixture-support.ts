export const mobileFixtureDatabaseName = 'gatherory_mobile_browser_test'

const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]'])

export function validateMobileFixtureTargets(input: {
  databaseUrl: string | undefined
  appBaseUrl: string
  confirmed: boolean
}) {
  if (!input.confirmed) throw new Error('Explicit disposable-target confirmation is required.')
  if (!input.databaseUrl) throw new Error('DATABASE_URL is required.')

  let database: URL
  let app: URL
  try {
    database = new URL(input.databaseUrl)
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL.')
  }
  try {
    app = new URL(input.appBaseUrl)
  } catch {
    throw new Error('MOBILE_BROWSER_BASE_URL must be a valid URL.')
  }
  if (!loopbackHosts.has(database.hostname)) {
    throw new Error(`Refusing non-loopback database host: ${database.hostname}`)
  }
  if (!['postgres:', 'postgresql:'].includes(database.protocol)) {
    throw new Error('DATABASE_URL must use PostgreSQL.')
  }
  if (database.pathname !== `/${mobileFixtureDatabaseName}`) {
    throw new Error(
      `Refusing database ${database.pathname}; expected /${mobileFixtureDatabaseName}.`
    )
  }
  if (!loopbackHosts.has(app.hostname)) {
    throw new Error(`Refusing non-loopback app URL: ${app.hostname}`)
  }
  if (!['http:', 'https:'].includes(app.protocol)) {
    throw new Error('MOBILE_BROWSER_BASE_URL must use HTTP or HTTPS.')
  }
  return { database, app }
}

export function toFoundationSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000) - 978_307_200
}

export function makeNativeEventEntity(input: {
  id: string
  rootId: string
  childId: string
  title: string
  description: string
  location: string
  foundationSeconds: number
  participantIds?: string[]
}) {
  return {
    id: input.id,
    parentEventID: input.rootId,
    title: input.title,
    category: 'other',
    purpose: input.id === input.childId ? 'eventExperience' : 'planning',
    scheduledAt: input.foundationSeconds,
    endsAt: null,
    isAllDay: false,
    timeZoneIdentifier: 'America/Detroit',
    eventDescription: input.description,
    eventLocation: {
      locationName: input.location,
      placeName: input.location,
      shortAddress: input.location,
      address: '100 Jefferson Avenue',
      addressLine2: 'Suite 204',
      latitude: 42.3314,
      longitude: -83.0458,
      mapItemIdentifier: 'mobile-fixture-place',
    },
    participantIDs: input.participantIds ?? [],
    dressCode: '',
    budgetCap: null,
    status: 'approved',
    completionStatus: 'upcoming',
    schedulingState: 'scheduled',
  }
}

export function makeNativeWorkspaceArchive(input: {
  rootId: string
  title: string
  foundationSeconds: number
  timeZone: string
  location: string
  description: string
  members?: unknown[]
  eventParticipations?: unknown[]
  participantIds?: string[]
  timeline?: unknown[]
  notes?: unknown[]
  todos?: unknown[]
}) {
  return {
    mainEventID: input.rootId,
    title: input.title,
    mainEventStartsAt: input.foundationSeconds,
    mainEventEndsAt: null,
    mainEventIsAllDay: false,
    mainEventTimeZoneIdentifier: input.timeZone,
    mainEventLocation: {
      locationName: input.location,
      placeName: input.location,
      shortAddress: input.location,
      address: '100 Jefferson Avenue',
      addressLine2: 'Suite 204',
      latitude: 42.3314,
      longitude: -83.0458,
      mapItemIdentifier: 'mobile-fixture-place',
    },
    mainEventImageData: null,
    mainEventMediaAssetID: null,
    venueName: input.location,
    location: input.location,
    dressCode: '',
    eventMessage: input.description,
    planningMode: 'openToIdeas',
    members: input.members ?? [],
    eventParticipations: input.eventParticipations ?? [],
    mainEventParticipantIDs: input.participantIds ?? [],
    ideas: [],
    timeline: input.timeline ?? [],
    eventExpenses: [],
    workspaceBudgetCap: null,
    currencyCode: 'USD',
    mainEventBudgetCap: null,
    notes: input.notes ?? [],
    todos: input.todos ?? [],
    ideaResponses: [],
    mainEventStatus: 'ongoing',
    mainEventResponse: null,
    eventMoments: [],
    guides: [],
    experienceConfiguration: null,
    isMainEventDeleted: false,
    registry: [],
    isRegistryShared: false,
    isCollaboratorLinkEnabled: true,
    requiresCollaboratorApproval: true,
    defaultCollaboratorPermission: 'contribute',
  }
}

export function encodeNativePayload(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64')
}
