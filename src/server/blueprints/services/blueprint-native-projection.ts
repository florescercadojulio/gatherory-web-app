import type { BlueprintExpandedPlan } from '@/contracts/blueprint-install.contracts'
import type {
  BlueprintActor,
  BlueprintManifest,
} from '@/server/blueprints/contracts/blueprint-runtime.contracts'

export type { BlueprintManifest } from '@/server/blueprints/contracts/blueprint-runtime.contracts'

const APPLE_REFERENCE_DATE_OFFSET_SECONDS = 978_307_200

export type BlueprintNativeEntity = {
  entityType: string
  entityId: string
  payload: Record<string, unknown>
}

/**
 * Projects the canonical, ID-free installation plan into the native v1
 * workspace archive and the normalized native entity payloads written beside
 * it. All identities come from the installer's stable-key manifest.
 */
export function buildBlueprintNativeProjection(input: {
  plan: BlueprintExpandedPlan
  manifest: BlueprintManifest
  actor: BlueprintActor
  createdAt: Date
}) {
  const { plan, manifest, actor, createdAt } = input
  const createdAtValue = foundationDate(createdAt)
  const mainEventID = requiredID(manifest.events, plan.main.sourceKey)
  const eventIDFor = (sourceKey: string) => requiredID(manifest.events, sourceKey)
  const memberID = manifest.personID

  const member = {
    id: memberID,
    userID: actor.id,
    name: actor.name,
    participantRole: 'host',
    initials: initials(actor.name),
    attendance: 'invited',
    email: actor.email,
    profileImageAssetName: null,
    profileImageURL: null,
    planningPermission: 'manage',
    invitationStatus: 'active',
  }

  const eventParticipations = [plan.main, ...plan.children].map((eventPlan) => ({
    id: requiredID(manifest.participations, eventPlan.sourceKey),
    eventID: eventIDFor(eventPlan.sourceKey),
    memberID,
    role: 'host',
    planningPermission: 'manage',
    // A newly created host has not answered an attendance prompt yet.
    attendance: 'invited',
    invitationStatus: 'active',
    createdAt: createdAtValue,
    updatedAt: createdAtValue,
  }))

  const timeline = plan.children.map((child) => ({
    id: eventIDFor(child.sourceKey),
    title: child.name,
    category: nativeTimelineCategory(child.category ?? 'other'),
    purpose: child.purpose === 'part_of_event' ? 'eventExperience' : 'planning',
    scheduledAt: foundationDate(child.startsAt),
    schedulingState: 'scheduled',
    endsAt: null,
    isAllDay: false,
    timeZoneIdentifier: child.timeZone,
    eventLocation: null,
    participantIDs: [memberID],
    parentEventID: mainEventID,
    status: 'approved',
    statusBeforeArchiving: null,
    completionStatus: 'upcoming',
    response: null,
    linkedIdeaID: null,
    imageData: null,
    mediaAssetID: null,
    eventDescription: '',
    dressCode: '',
    budgetCap: null,
  }))

  const ideas = plan.ideas.map((idea) => ({
    id: requiredID(manifest.ideas, idea.sourceKey),
    eventID: eventIDFor(idea.targetSourceKey),
    title: idea.title,
    note: idea.notes ?? '',
    category: idea.category,
    submittedBy: actor.name,
    submittedByUserID: actor.id,
    estimatedCost: null,
    status: 'new' as const,
    submittedAt: createdAtValue,
    imageData: null,
    mediaAssetID: null,
    configuration: nativeIdeaConfiguration(
      idea.category,
      [plan.main, ...plan.children].find(
        (eventPlan) => eventPlan.sourceKey === idea.targetSourceKey
      )?.timeZone ?? plan.main.timeZone
    ),
    invitationVisibility: defaultInvitationVisibility(idea.category),
  }))

  const guides = plan.instructions.map((instruction, sortOrder) => ({
    id: requiredID(manifest.guides, instruction.sourceKey),
    eventID: eventIDFor(instruction.targetSourceKey),
    key: instruction.sourceKey,
    title: instruction.title,
    body: instruction.body,
    sortOrder,
    visibility: instruction.audience === 'planning_only' ? 'planning_only' : 'event_participants',
  }))

  const archive = {
    mainEventID,
    title: plan.main.name,
    mainEventStartsAt: foundationDate(plan.main.startsAt),
    mainEventEndsAt: null,
    mainEventIsAllDay: false,
    mainEventTimeZoneIdentifier: plan.main.timeZone,
    // The native root initializer uses an empty location value when none is
    // configured. Match that representation so a no-op save stays a no-op.
    mainEventLocation: {
      address: '',
      shortAddress: '',
      placeName: '',
      locationName: '',
      addressLine2: '',
    },
    mainEventImageData: null,
    mainEventMediaAssetID: null,
    venueName: '',
    location: '',
    dressCode: '',
    eventMessage: '',
    planningMode: 'openToIdeas',
    members: [member],
    eventParticipations,
    mainEventParticipantIDs: [memberID],
    ideas,
    timeline,
    eventExpenses: [],
    workspaceBudgetCap: null,
    currencyCode: 'USD',
    mainEventBudgetCap: null,
    notes: [],
    ideaResponses: [],
    mainEventStatus: 'draft',
    mainEventResponse: null,
    eventMoments: [],
    guides,
    experienceConfiguration: {
      experienceType: plan.experienceType,
      categoryOrder: plan.categoryOrder,
    },
    isMainEventDeleted: false,
    registry: [],
    isRegistryShared: false,
    isCollaboratorLinkEnabled: false,
    requiresCollaboratorApproval: true,
    defaultCollaboratorPermission: 'contribute',
    isScopedEvent: false,
    scopedEvent: null,
  }

  const entities: BlueprintNativeEntity[] = [
    { entityType: 'workspace', entityId: mainEventID, payload: archive },
    { entityType: 'participant', entityId: memberID, payload: member },
    ...timeline.map((payload) => ({ entityType: 'event', entityId: payload.id, payload })),
    ...eventParticipations.map((payload) => ({
      entityType: 'event_participation',
      entityId: payload.id,
      payload,
    })),
    ...ideas.map((payload) => ({ entityType: 'idea', entityId: payload.id, payload })),
  ]

  return { archive, entities }
}

export type BlueprintNativeProjection = ReturnType<typeof buildBlueprintNativeProjection>

function requiredID(ids: Record<string, string>, key: string) {
  const id = ids[key]
  if (!id) throw new Error(`Blueprint installation manifest is missing an ID for "${key}".`)
  return id
}

function foundationDate(value: Date | string) {
  const milliseconds = value instanceof Date ? value.getTime() : new Date(value).getTime()
  if (!Number.isFinite(milliseconds)) throw new Error('Blueprint plan contains an invalid date.')
  return milliseconds / 1_000 - APPLE_REFERENCE_DATE_OFFSET_SECONDS
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase()
}

function nativeTimelineCategory(category: string) {
  const categories: Record<string, string> = {
    food_tasting: 'foodTasting',
    attire_fitting: 'attireFitting',
    wedding_shower: 'weddingShower',
    bachelor_bachelorette: 'bachelorBachelorette',
  }
  return categories[category] ?? category
}

function defaultInvitationVisibility(category: string) {
  return category === 'attire' ? ('shownToGuests' as const) : ('planningOnly' as const)
}

function nativeIdeaConfiguration(category: string, timeZone: string) {
  const configuration = nativeIdeaConfigurationValue(category, timeZone)
  // Swift's synthesized Codable for an enum with an unlabeled associated
  // value nests that value under `_0`. The no-value standard case does not.
  return Object.fromEntries(
    Object.entries(configuration).map(([key, value]) => [
      key,
      key === 'standard' ? value : { _0: value },
    ])
  )
}

function nativeIdeaConfigurationValue(category: string, timeZone: string) {
  // Portable v1 configuration currently carries only its version marker. Use
  // the same native defaults as PlanningIdea's category initializer.
  switch (category) {
    case 'attire':
      return { attire: { style: 'any', restrictions: '' } }
    case 'venue':
      return { venue: { setting: 'indoor', capacity: null, area: '' } }
    case 'food':
      return { food: { type: 'meal', servings: null, dietaryNotes: '' } }
    case 'flowers':
      return { flowers: { focus: 'bouquet', palette: '' } }
    case 'photography':
      return { photography: { style: 'documentary', coverageHours: null, priorities: '' } }
    case 'decor':
      return { decor: { focus: 'reception', paletteOrMaterials: '' } }
    case 'invitations':
      return { invitations: { format: 'printed', quantity: null, productionNotes: '' } }
    case 'honeymoon':
      return { honeymoon: { style: 'relaxing', destination: '', nights: null } }
    case 'event':
      return {
        event: {
          category: 'other',
          purpose: 'planning',
          audience: 'inherited',
          requiresBudget: false,
          proposedBudget: null,
          proposedDate: null,
          proposedEndDate: null,
          isAllDay: false,
          timeZoneIdentifier: timeZone,
          location: null,
          attireStyle: 'any',
          attireGuidance: '',
        },
      }
    case 'registry':
      return { registry: { category: 'home', price: null, quantity: 1 } }
    default:
      return { standard: {} }
  }
}
