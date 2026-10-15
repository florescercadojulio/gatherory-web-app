type JsonRecord = Record<string, unknown>

export type NativeProjectionEntity = {
  entityType: string
  entityId: string
  payload: string
  isDeleted: boolean
}

export type ScopedEventMember = JsonRecord & { id: string }
export type ScopedEventParticipation = JsonRecord & {
  id?: string
  eventID?: string
  eventId?: string
  memberID?: string
  memberId?: string
}

export type CanonicalEventGuide = {
  id: string
  eventID: string
  key: string
  title: string
  body: string
  sortOrder: number
  visibility: 'planning_only' | 'event_participants'
}

export type CanonicalExperienceConfiguration = {
  eventID: string
  experienceType: string
  categoryOrder: string[]
}

export type BuildScopedEventArchiveInput = {
  snapshotPayload: string
  entities: NativeProjectionEntity[]
  eventId: string
  members?: ScopedEventMember[]
  participations?: ScopedEventParticipation[]
  /** Compatibility alias for callers that name the rows after the archive field. */
  eventParticipations?: ScopedEventParticipation[]
  childEvent?: Record<string, unknown>
  guides?: CanonicalEventGuide[]
  experienceConfiguration?: CanonicalExperienceConfiguration | null
}

const ENTITY_ARRAYS: Record<string, string> = {
  participant: 'members',
  event_participation: 'eventParticipations',
  idea: 'ideas',
  event: 'timeline',
  expense: 'eventExpenses',
  note: 'notes',
  idea_response: 'ideaResponses',
  attendance: 'eventParticipations',
  moment: 'eventMoments',
  registry_item: 'registry',
}

const ARCHIVE_V1_FIELDS = [
  'mainEventID',
  'title',
  'mainEventStartsAt',
  'mainEventEndsAt',
  'mainEventIsAllDay',
  'mainEventTimeZoneIdentifier',
  'mainEventLocation',
  'mainEventImageData',
  'mainEventMediaAssetID',
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
  'workspaceBudgetCap',
  'currencyCode',
  'mainEventBudgetCap',
  'notes',
  'ideaResponses',
  'mainEventStatus',
  'mainEventResponse',
  'eventMoments',
  'isMainEventDeleted',
  'registry',
  'scopedEvent',
  'isRegistryShared',
  'isCollaboratorLinkEnabled',
  'requiresCollaboratorApproval',
  'defaultCollaboratorPermission',
  'isScopedEvent',
  'guides',
  'experienceConfiguration',
] as const

function canonicalId(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : null
}

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null
}

function array(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.map(record).filter((item): item is JsonRecord => item !== null)
    : []
}

function parsePayload(payload: string): unknown {
  try {
    return JSON.parse(payload)
  } catch {
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
  }
}

function decodeSnapshot(payload: string): JsonRecord | null {
  const decoded = parsePayload(payload)
  return record(decoded)
}

function entityRecord(entity: NativeProjectionEntity): JsonRecord | null {
  const decoded = parsePayload(entity.payload)
  return record(decoded)
}

function idOf(value: JsonRecord): string | null {
  return canonicalId(value.id)
}

function replaceById(values: JsonRecord[], id: string, replacement: JsonRecord | null) {
  const index = values.findIndex((item) => idOf(item) === id)
  if (index >= 0) {
    if (replacement) values[index] = replacement
    else values.splice(index, 1)
  } else if (replacement) {
    values.push(replacement)
  }
}

function eventReference(value: JsonRecord): string | null {
  // Null or absent event IDs are legacy implicit-root records, never child data.
  return canonicalId(value.eventID ?? value.eventId)
}

function participationEventId(value: JsonRecord): string | null {
  return canonicalId(value.eventID ?? value.eventId)
}

function participationMemberId(value: JsonRecord): string | null {
  return canonicalId(value.memberID ?? value.memberId ?? value.personId)
}

function scrubIdeaReferences(
  value: unknown,
  allowedIdeaIds: Set<string>,
  allowedEventIds: Set<string>
): unknown {
  if (Array.isArray(value))
    return value.map((item) => scrubIdeaReferences(item, allowedIdeaIds, allowedEventIds))
  const item = record(value)
  if (!item) return value
  const result: JsonRecord = {}
  for (const [key, nested] of Object.entries(item)) {
    if (['linkedIdeaID', 'sourceIdeaID', 'ideaID'].includes(key)) {
      const reference = canonicalId(nested)
      result[key] = reference && allowedIdeaIds.has(reference) ? nested : null
    } else if (
      [
        'eventID',
        'eventId',
        'parentEventID',
        'parentEventId',
        'linkedEventID',
        'linkedEventId',
      ].includes(key)
    ) {
      const reference = canonicalId(nested)
      result[key] = reference && allowedEventIds.has(reference) ? nested : null
    } else {
      result[key] = scrubIdeaReferences(nested, allowedIdeaIds, allowedEventIds)
    }
  }
  return result
}

function overlayEntities(archive: JsonRecord, entities: NativeProjectionEntity[]) {
  // Last record for an entity wins regardless of UUID letter case.
  const latest = new Map<string, NativeProjectionEntity>()
  for (const entity of entities) {
    const id = canonicalId(entity.entityId)
    if (id) latest.set(`${entity.entityType.toLowerCase()}:${id}`, entity)
  }

  for (const [key, entity] of latest) {
    const [entityType, id] = key.split(':', 2)
    const targetArray = ENTITY_ARRAYS[entityType]
    if (!targetArray) continue
    const records = array(archive[targetArray])
    // Attendance is a legacy entity type and may carry a participation payload;
    // the newer event_participation type follows the same archive collection.
    const replacement = entity.isDeleted ? null : entityRecord(entity)
    if (replacement) replacement.id = entity.entityId
    replaceById(records, id, replacement)
    archive[targetArray] = records
  }
}

function applyAuthoritativeMembers(archive: JsonRecord, members?: ScopedEventMember[]) {
  if (!members) return
  const existing = array(archive.members)
  archive.members = members.flatMap((member) => {
    const id = canonicalId(member.id)
    if (!id) return []
    const previous = existing.find((item) => idOf(item) === id)
    const name = typeof member.name === 'string' ? member.name : 'Guest'
    return [
      {
        userID: null,
        name,
        participantRole: 'guest',
        initials: name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0])
          .join(''),
        attendance: 'notGoing',
        email: null,
        profileImageAssetName: null,
        profileImageURL: null,
        planningPermission: 'viewOnly',
        invitationStatus: 'active',
        ...previous,
        ...member,
        id: member.id,
      },
    ]
  })
}

function applyAuthoritativeParticipations(
  archive: JsonRecord,
  eventId: string,
  participations?: ScopedEventParticipation[]
) {
  if (!participations) return
  const existing = array(archive.eventParticipations).filter(
    (item) => participationEventId(item) !== eventId
  )
  for (const participation of participations) {
    if (participationEventId(participation) !== eventId) continue
    existing.push({ ...participation })
  }
  archive.eventParticipations = existing
}

function mergeCanonicalChildEvent(
  timeline: JsonRecord[],
  eventId: string,
  childEvent?: Record<string, unknown>
) {
  const fromArchive = timeline.find((item) => idOf(item) === eventId)
  if (!childEvent) return fromArchive ?? null
  const canonical = { ...childEvent }
  if (canonicalId(canonical.id) !== eventId) return null
  if (fromArchive) return { ...fromArchive, ...canonical }
  return canonical
}

const TIMELINE_CATEGORIES = new Set([
  'venue',
  'foodTasting',
  'photography',
  'honeymoon',
  'attireFitting',
  'weddingShower',
  'bachelorBachelorette',
  'rehearsal',
  'ceremony',
  'reception',
  'other',
])
const EVENT_STATUSES = new Set([
  'draft',
  'approved',
  'notSure',
  'rejected',
  'archived',
  'cancelled',
])

function normalizedLocation(value: unknown): JsonRecord | null {
  const location = record(value)
  if (!location) return null
  return {
    address: typeof location.address === 'string' ? location.address : '',
    shortAddress: typeof location.shortAddress === 'string' ? location.shortAddress : '',
    placeName: typeof location.placeName === 'string' ? location.placeName : '',
    locationName: typeof location.locationName === 'string' ? location.locationName : '',
    addressLine2: typeof location.addressLine2 === 'string' ? location.addressLine2 : '',
    latitude: typeof location.latitude === 'number' ? location.latitude : null,
    longitude: typeof location.longitude === 'number' ? location.longitude : null,
    mapItemIdentifier:
      typeof location.mapItemIdentifier === 'string' ? location.mapItemIdentifier : null,
  }
}

function scopedTimelineItem(child: JsonRecord, participantIDs: string[]): JsonRecord {
  const category = child.category
  const purpose = child.purpose
  const status = child.status === 'not_sure' ? 'notSure' : child.status
  const statusBeforeArchiving =
    child.statusBeforeArchiving === 'not_sure' ? 'notSure' : child.statusBeforeArchiving
  return {
    id: child.id,
    title: typeof child.title === 'string' ? child.title : '',
    category:
      typeof category === 'string' && TIMELINE_CATEGORIES.has(category) ? category : 'other',
    purpose: purpose === 'eventExperience' || purpose === 'planning' ? purpose : 'planning',
    scheduledAt: typeof child.scheduledAt === 'number' ? child.scheduledAt : 0,
    schedulingState:
      child.schedulingState === 'scheduled' || child.schedulingState === 'unscheduled'
        ? child.schedulingState
        : null,
    endsAt: typeof child.endsAt === 'number' ? child.endsAt : null,
    isAllDay: child.isAllDay === true,
    timeZoneIdentifier:
      typeof child.timeZoneIdentifier === 'string' ? child.timeZoneIdentifier : 'UTC',
    eventLocation: normalizedLocation(child.eventLocation),
    participantIDs,
    status: typeof status === 'string' && EVENT_STATUSES.has(status) ? status : 'draft',
    statusBeforeArchiving:
      typeof statusBeforeArchiving === 'string' && EVENT_STATUSES.has(statusBeforeArchiving)
        ? statusBeforeArchiving
        : null,
    completionStatus: child.completionStatus === 'complete' ? 'complete' : 'upcoming',
    response: child.response ?? null,
    imageData: child.imageData ?? null,
    mediaAssetID: child.mediaAssetID ?? null,
    eventDescription: typeof child.eventDescription === 'string' ? child.eventDescription : '',
    dressCode: typeof child.dressCode === 'string' ? child.dressCode : '',
    budgetCap: child.budgetCap ?? null,
  }
}

function projectChildMetadata(archive: JsonRecord, child: JsonRecord) {
  const location = normalizedLocation(child.eventLocation)
  archive.mainEventID = child.id
  archive.title = child.title
  // Foundation's deferred Date encoding requires a number. Zero is the safe
  // epoch fallback for unscheduled scoped events; isScopedEvent carries scope.
  archive.mainEventStartsAt = child.scheduledAt ?? 0
  archive.mainEventEndsAt = child.endsAt ?? null
  archive.mainEventIsAllDay = child.isAllDay === true
  archive.mainEventTimeZoneIdentifier = child.timeZoneIdentifier ?? 'UTC'
  archive.mainEventLocation = location
  archive.mainEventImageData = child.imageData ?? null
  archive.mainEventMediaAssetID = child.mediaAssetID ?? null
  archive.venueName = location?.locationName ?? ''
  archive.location = location?.address ?? ''
  archive.dressCode = child.dressCode ?? ''
  archive.eventMessage = child.eventDescription ?? ''
  // Root-only planning and registry settings must not be inherited by a child.
  archive.planningMode = 'openToIdeas'
  archive.workspaceBudgetCap = null
  archive.mainEventBudgetCap = child.budgetCap ?? null
  archive.mainEventStatus =
    child.status === 'cancelled'
      ? 'cancelled'
      : child.completionStatus === 'complete'
        ? 'finished'
        : child.status === 'approved'
          ? 'ongoing'
          : 'draft'
  archive.mainEventResponse = child.response ?? null
  archive.isMainEventDeleted = false
  archive.isRegistryShared = false
  archive.isCollaboratorLinkEnabled = false
  archive.requiresCollaboratorApproval = false
  archive.defaultCollaboratorPermission = 'viewOnly'
  archive.isScopedEvent = true
  const memberIDs = array(archive.eventParticipations)
    .filter((participation) => participationEventId(participation) === canonicalId(child.id))
    .map(participationMemberId)
    .filter((id): id is string => id !== null)
  archive.scopedEvent = scopedTimelineItem(child, memberIDs)
  archive.timeline = []
}

/**
 * Builds a native WorkspaceArchiveV1-compatible archive scoped to one child event.
 * Returns null when the child cannot be established from the merged snapshot or
 * the canonical child event supplied by the caller.
 */
export function buildScopedEventArchive(input: BuildScopedEventArchiveInput): string | null {
  const targetEventId = canonicalId(input.eventId)
  if (!targetEventId) return null

  let archive = decodeSnapshot(input.snapshotPayload)
  if (!archive) return null
  overlayEntities(archive, input.entities)
  applyAuthoritativeMembers(archive, input.members)
  applyAuthoritativeParticipations(
    archive,
    targetEventId,
    input.participations ?? input.eventParticipations
  )

  const timeline = array(archive.timeline)
  const child = mergeCanonicalChildEvent(timeline, targetEventId, input.childEvent)
  if (!child) return null
  const childParentId = canonicalId(child.parentEventID ?? child.parentEventId)
  const rootId = canonicalId(archive.mainEventID)
  // Old snapshots can omit parentEventID. The caller authorizes canonical
  // child rows; when hierarchy is present, reject any explicit wrong parent.
  if (childParentId && childParentId !== rootId) return null

  const participations = array(archive.eventParticipations).filter(
    (item) => participationEventId(item) === targetEventId
  )
  const memberIds = new Set(
    participations.map(participationMemberId).filter((id): id is string => id !== null)
  )
  const members = array(archive.members).filter((item) => {
    const id = idOf(item)
    return id !== null && memberIds.has(id)
  })
  const memberById = new Map(members.map((member) => [idOf(member)!, member]))
  for (const participation of participations) {
    const member = memberById.get(participationMemberId(participation) ?? '')
    if (!member) continue
    if (typeof participation.role === 'string') member.participantRole = participation.role
    if (typeof participation.planningPermission === 'string')
      member.planningPermission = participation.planningPermission
    if (typeof participation.attendance === 'string') member.attendance = participation.attendance
    if (typeof participation.invitationStatus === 'string')
      member.invitationStatus = participation.invitationStatus
  }

  const ideas = array(archive.ideas).filter((item) => eventReference(item) === targetEventId)
  const ideaIds = new Set(ideas.map(idOf).filter((id): id is string => id !== null))
  const scopedIdeas = ideas.map((idea) => ({
    ...idea,
    configuration: scrubIdeaReferences(idea.configuration, ideaIds, new Set([targetEventId])),
  }))
  const scopedExpenses = array(archive.eventExpenses)
    .filter((item) => eventReference(item) === targetEventId)
    .map((item) => ({
      ...item,
      sourceIdeaID: ideaIds.has(canonicalId(item.sourceIdeaID) ?? '') ? item.sourceIdeaID : null,
    }))
  const scopedNotes = array(archive.notes).filter((item) => eventReference(item) === targetEventId)
  const scopedMoments = array(archive.eventMoments).filter(
    (item) => eventReference(item) === targetEventId
  )
  const scopedRegistry = array(archive.registry)
    .filter((item) => eventReference(item) === targetEventId)
    .map((item) => ({
      ...item,
      sourceIdeaID: ideaIds.has(canonicalId(item.sourceIdeaID) ?? '') ? item.sourceIdeaID : null,
    }))
  const scopedResponses = array(archive.ideaResponses).filter((item) =>
    ideaIds.has(canonicalId(item.ideaID ?? item.ideaId) ?? '')
  )

  projectChildMetadata(archive, child)
  archive.members = members
  archive.eventParticipations = participations
  archive.mainEventParticipantIDs = [...memberIds]
  archive.ideas = scopedIdeas
  archive.eventExpenses = scopedExpenses
  archive.notes = scopedNotes
  archive.eventMoments = scopedMoments
  archive.registry = scopedRegistry
  archive.ideaResponses = scopedResponses
  archive.guides = (input.guides ?? []).filter(
    (guide) => canonicalId(guide.eventID) === targetEventId
  )
  if (input.experienceConfiguration) {
    archive.experienceConfiguration = {
      experienceType: input.experienceConfiguration.experienceType,
      categoryOrder: [...input.experienceConfiguration.categoryOrder],
    }
  } else {
    delete archive.experienceConfiguration
  }

  const archiveV1 = Object.fromEntries(
    ARCHIVE_V1_FIELDS.filter((field) => field in archive).map((field) => [field, archive[field]])
  )
  return Buffer.from(JSON.stringify(archiveV1), 'utf8').toString('base64')
}
