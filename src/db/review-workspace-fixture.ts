/**
 * A real, iOS-compatible workspace for local App Review testing.
 *
 * The iPhone app bootstraps from `native_workspace_snapshot`, while the web
 * companion reads normalized tables. Keeping this fixture in one place makes
 * the seed populate both representations with the same wedding workspace.
 */
export const reviewWorkspaceIds = {
  events: {
    main: "10000000-0000-4000-8000-000000000001",
    venueTour: "10000000-0000-4000-8000-000000000002",
    tasting: "10000000-0000-4000-8000-000000000003",
    rehearsal: "10000000-0000-4000-8000-000000000004",
    ceremony: "10000000-0000-4000-8000-000000000005",
    reception: "10000000-0000-4000-8000-000000000006",
    afterParty: "10000000-0000-4000-8000-000000000007",
  },
  planning: {
    venueIdea: "20000000-0000-4000-8000-000000000001",
    musicIdea: "20000000-0000-4000-8000-000000000002",
    attireIdea: "20000000-0000-4000-8000-000000000003",
    registryIdea: "20000000-0000-4000-8000-000000000004",
    musicTrack: "30000000-0000-4000-8000-000000000001",
    venueExpense: "40000000-0000-4000-8000-000000000001",
    eventNote: "50000000-0000-4000-8000-000000000001",
    registryItem: "60000000-0000-4000-8000-000000000001",
  },
  people: {
    alex: "70000000-0000-4000-8000-000000000001",
    jordan: "70000000-0000-4000-8000-000000000002",
    maya: "70000000-0000-4000-8000-000000000003",
    sam: "70000000-0000-4000-8000-000000000004",
    pendingGuest: "70000000-0000-4000-8000-000000000005",
    appReview: "70000000-0000-4000-8000-000000000006",
  },
} as const

export type ReviewFixtureUser = {
  id: string
  name: string
  email: string
}

const appleReferenceDateOffsetSeconds = 978_307_200

function foundationDate(value: string) {
  return new Date(value).getTime() / 1_000 - appleReferenceDateOffsetSeconds
}

function location(placeName: string, address: string) {
  return {
    address,
    shortAddress: address,
    placeName,
    locationName: placeName,
    addressLine2: "",
    latitude: null,
    longitude: null,
    mapItemIdentifier: null,
  }
}

/**
 * Produces the JSON representation emitted by Foundation's default
 * `JSONEncoder` for `WorkspaceArchiveV1`. Dates deliberately use Apple's
 * 2001 reference-date seconds, not JavaScript ISO strings.
 */
export function createReviewWorkspaceArchive(input: {
  users: readonly [
    ReviewFixtureUser,
    ReviewFixtureUser,
    ReviewFixtureUser,
    ReviewFixtureUser,
    ReviewFixtureUser,
  ]
}) {
  const [alex, jordan, maya, sam, reviewer] = input.users
  const { events, planning, people } = reviewWorkspaceIds
  const mainParticipantIDs = [
    people.alex,
    people.jordan,
    people.maya,
    people.sam,
    people.appReview,
  ]
  const users = [
    {
      id: people.alex,
      account: alex,
      initials: "AM",
      role: "host",
      permission: "manage",
      attendance: "going",
    },
    {
      id: people.jordan,
      account: jordan,
      initials: "JL",
      role: "host",
      permission: "manage",
      attendance: "going",
    },
    {
      id: people.maya,
      account: maya,
      initials: "MC",
      role: "collaborator",
      permission: "contribute",
      attendance: "going",
    },
    {
      id: people.sam,
      account: sam,
      initials: "SR",
      role: "guest",
      permission: "viewOnly",
      attendance: "maybe",
    },
    {
      id: people.appReview,
      account: reviewer,
      initials: "AR",
      role: "host",
      permission: "manage",
      attendance: "going",
    },
  ] as const
  const createdAt = foundationDate("2026-10-12T12:00:00.000Z")

  const members = users.map((person) => ({
    id: person.id,
    userID: person.account.id,
    name: person.account.name,
    participantRole: person.role,
    initials: person.initials,
    attendance: person.attendance,
    email: person.account.email,
    profileImageAssetName: null,
    profileImageURL: null,
    planningPermission: person.permission,
    invitationStatus: "active",
  }))

  const eventParticipations = Object.values(events).flatMap(
    (eventID, eventIndex) =>
      users.map((person, index) => ({
        // Stable UUIDs make a second seed produce the exact same snapshot.
        id: `80000000-0000-4000-8000-${String(eventIndex * 10 + index + 1).padStart(12, "0")}`,
        eventID,
        memberID: person.id,
        role: person.role,
        planningPermission: person.permission,
        attendance: person.attendance,
        invitationStatus: "active",
        createdAt,
        updatedAt: createdAt,
      })),
  )

  const eventDetails = [
    [
      events.venueTour,
      "Final venue walkthrough",
      "venue",
      "planning",
      "2027-01-16T16:00:00.000Z",
      "2027-01-16T17:30:00.000Z",
      "Willow & Stone Estate",
      "Ann Arbor, Michigan",
      "Confirm the ceremony layout and rain plan.",
      1500,
    ],
    [
      events.tasting,
      "Menu tasting",
      "foodTasting",
      "planning",
      "2027-03-20T22:00:00.000Z",
      "2027-03-21T00:00:00.000Z",
      "Juniper Kitchen",
      "Detroit, Michigan",
      "Choose the dinner menu and late-night snack.",
      800,
    ],
    [
      events.rehearsal,
      "Rehearsal dinner",
      "rehearsal",
      "eventExperience",
      "2027-06-12T22:30:00.000Z",
      "2027-06-13T01:00:00.000Z",
      "The Common Table",
      "Ann Arbor, Michigan",
      "Dinner with the wedding party and immediate family.",
      3500,
    ],
    [
      events.ceremony,
      "Ceremony",
      "ceremony",
      "eventExperience",
      "2027-06-13T20:00:00.000Z",
      "2027-06-13T20:45:00.000Z",
      "Willow & Stone Estate",
      "Ann Arbor, Michigan",
      "The moment we make it official.",
      null,
    ],
    [
      events.reception,
      "Dinner & reception",
      "reception",
      "eventExperience",
      "2027-06-13T21:30:00.000Z",
      "2027-06-14T03:30:00.000Z",
      "Willow & Stone Estate",
      "Ann Arbor, Michigan",
      "Dinner, toasts, and dancing under the trees.",
      12000,
    ],
    [
      events.afterParty,
      "After-party",
      "reception",
      "eventExperience",
      "2027-06-14T04:00:00.000Z",
      "2027-06-14T06:00:00.000Z",
      "The Last Word",
      "Ann Arbor, Michigan",
      "One last round for anyone still dancing.",
      2000,
    ],
  ] as const

  return {
    mainEventID: events.main,
    title: "Alex & Jordan's Wedding",
    weddingDate: foundationDate("2027-06-13T20:00:00.000Z"),
    mainEventEndsAt: foundationDate("2027-06-14T05:00:00.000Z"),
    mainEventIsAllDay: false,
    mainEventTimeZoneIdentifier: "America/Detroit",
    mainEventLocation: location("Willow & Stone Estate", "Ann Arbor, Michigan"),
    mainEventImageData: null,
    mainEventMediaAssetID: null,
    venueName: "Willow & Stone Estate",
    location: "Ann Arbor, Michigan",
    dressCode: "Garden formal",
    eventMessage:
      "A garden ceremony, dinner under the trees, and a full weekend with our favorite people.",
    planningMode: "openToIdeas",
    members,
    eventParticipations,
    mainEventParticipantIDs: mainParticipantIDs,
    ideas: [
      {
        id: planning.venueIdea,
        eventID: events.main,
        title: "Willow & Stone Estate",
        note: "Garden ceremony, dinner under the trees, and a weather-ready indoor space.",
        category: "venue",
        submittedBy: alex.name,
        submittedByUserID: alex.id,
        estimatedCost: 14500,
        status: "chosen",
        submittedAt: createdAt,
        imageData: null,
        mediaAssetID: null,
        configuration: {
          venue: { _0: { setting: "both", capacity: 140, area: "Ann Arbor" } },
        },
        invitationVisibility: "planningOnly",
      },
      {
        id: planning.musicIdea,
        eventID: events.main,
        title: "First dance song",
        note: "A warm, easy song for the first dance.",
        category: "music",
        submittedBy: jordan.name,
        submittedByUserID: jordan.id,
        estimatedCost: null,
        status: "shortlisted",
        submittedAt: createdAt,
        imageData: null,
        mediaAssetID: null,
        configuration: {
          music: {
            _0: {
              tracks: [
                {
                  // `MusicProviderID` is RawRepresentable, so Foundation
                  // serializes it as its raw string rather than an object.
                  providerID: "apple-music",
                  catalogID: "i.4YBN1YWf2a62bq9",
                  title: "BABYDOLL (Speed)",
                  artistName: "Ari Abdul",
                  albumTitle: "BABYDOLL (Speed) - Single",
                  artworkURL: "musicKit://artwork/library/4B2C9115-D692-4636-BDB7-31676E1FB4AB/600x600?aat=Music126%2Fv4%2F23%2F73%2F2f%2F23732f5f%2D181f%2D2bbd%2Dfeb5%2D3ab42eb958ff%2F196589059925%2Ejpg&at=item&id=316369963290033991&lid=4B2C9115%2DD692%2D4636%2DBDB7%2D31676E1FB4AB&mt=music",
                  previewURL: null,
                  externalURL: null,
                  isrc: null,
                  duration: 156.651,
                },
              ],
            },
          },
        },
        invitationVisibility: "shownToGuests",
      },
      {
        id: planning.attireIdea,
        eventID: events.main,
        title: "Garden formal attire",
        note: "Comfortable shoes encouraged for the lawn.",
        category: "attire",
        submittedBy: maya.name,
        submittedByUserID: maya.id,
        estimatedCost: null,
        status: "maybe",
        submittedAt: createdAt,
        imageData: null,
        mediaAssetID: null,
        configuration: {
          attire: {
            _0: { style: "garden", restrictions: "Avoid white and ivory." },
          },
        },
        invitationVisibility: "shownToGuests",
      },
      {
        id: planning.registryIdea,
        eventID: events.main,
        title: "Weekend getaway fund",
        note: "Help us plan a quiet first trip after the wedding.",
        category: "registry",
        submittedBy: alex.name,
        submittedByUserID: alex.id,
        estimatedCost: 1500,
        status: "chosen",
        submittedAt: createdAt,
        imageData: null,
        mediaAssetID: null,
        configuration: {
          registry: { _0: { category: "cashFund", price: 1500, quantity: 1 } },
        },
        invitationVisibility: "planningOnly",
      },
    ],
    timeline: eventDetails.map(
      ([
        id,
        title,
        category,
        purpose,
        startsAt,
        endsAt,
        place,
        address,
        eventDescription,
        budgetCap,
      ]) => ({
        id,
        title,
        category,
        purpose,
        scheduledAt: foundationDate(startsAt),
        schedulingState: "scheduled",
        endsAt: foundationDate(endsAt),
        isAllDay: false,
        timeZoneIdentifier: "America/Detroit",
        eventLocation: location(place, address),
        participantIDs: mainParticipantIDs,
        parentEventID: events.main,
        status: "approved",
        completionStatus: "upcoming",
        response: null,
        linkedIdeaID: null,
        imageData: null,
        mediaAssetID: null,
        eventDescription,
        dressCode: "Garden formal",
        budgetCap,
      }),
    ),
    eventExpenses: [
      {
        id: planning.venueExpense,
        eventID: events.main,
        sourceIdeaID: planning.venueIdea,
        title: "Venue deposit",
        amount: 3500,
        category: "venue",
        status: "committed",
        createdByUserID: alex.id,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    workspaceBudgetCap: 30000,
    currencyCode: "USD",
    mainEventBudgetCap: 30000,
    notes: [
      {
        id: planning.eventNote,
        eventID: events.main,
        authorUserID: alex.id,
        body: "The venue walkthrough is confirmed. Meet at the garden entrance.",
        sentAt: createdAt,
      },
    ],
    mainEventStatus: "draft",
    mainEventResponse: "going",
    eventMoments: [],
    isMainEventDeleted: false,
    registry: [
      {
        id: planning.registryItem,
        eventID: events.main,
        sourceIdeaID: planning.registryIdea,
        title: "Weekend getaway fund",
        note: "A quiet first trip after the wedding.",
        category: "cashFund",
        price: 1500,
        quantity: 1,
        committedCount: 0,
        imageData: null,
        mediaAssetID: null,
      },
    ],
    isRegistryShared: true,
    isCollaboratorLinkEnabled: true,
    requiresCollaboratorApproval: true,
    defaultCollaboratorPermission: "contribute",
    collaboratorInviteURL: "https://gatherory.com/join/review-wedding",
  }
}

export function encodeNativeWorkspaceSnapshot(
  archive: ReturnType<typeof createReviewWorkspaceArchive>,
) {
  return Buffer.from(JSON.stringify(archive)).toString("base64")
}
