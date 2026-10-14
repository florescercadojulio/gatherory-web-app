import { ideaResponseID } from '@/server/sync/contracts/idea-response'

/**
 * A real, iOS-compatible workspace for local App Review testing.
 *
 * The iPhone app bootstraps from `native_workspace_snapshot`, while the web
 * companion reads normalized tables. Keeping this fixture in one place makes
 * the seed populate both representations with the same wedding workspace.
 */
export const reviewWorkspaceIds = {
  events: {
    main: '10000000-0000-4000-8000-000000000001',
    venueTour: '10000000-0000-4000-8000-000000000002',
    tasting: '10000000-0000-4000-8000-000000000003',
    rehearsal: '10000000-0000-4000-8000-000000000004',
    ceremony: '10000000-0000-4000-8000-000000000005',
    reception: '10000000-0000-4000-8000-000000000006',
    afterParty: '10000000-0000-4000-8000-000000000007',
  },
  planning: {
    venueIdea: '20000000-0000-4000-8000-000000000001',
    musicIdea: '20000000-0000-4000-8000-000000000002',
    attireIdea: '20000000-0000-4000-8000-000000000003',
    registryIdea: '20000000-0000-4000-8000-000000000004',
    linkIdea: '20000000-0000-4000-8000-000000000005',
    eventIdea: '20000000-0000-4000-8000-000000000006',
    flowersIdea: '20000000-0000-4000-8000-000000000007',
    foodIdea: '20000000-0000-4000-8000-000000000008',
    photographyIdea: '20000000-0000-4000-8000-000000000009',
    decorIdea: '20000000-0000-4000-8000-000000000010',
    invitationsIdea: '20000000-0000-4000-8000-000000000011',
    honeymoonIdea: '20000000-0000-4000-8000-000000000012',
    otherIdea: '20000000-0000-4000-8000-000000000013',
    musicTrack: '30000000-0000-4000-8000-000000000001',
    venueExpense: '40000000-0000-4000-8000-000000000001',
    receptionExpense: '40000000-0000-4000-8000-000000000002',
    receptionEstimate: '40000000-0000-4000-8000-000000000003',
    eventNote: '50000000-0000-4000-8000-000000000001',
    latestNote: '50000000-0000-4000-8000-000000000002',
    receptionNote: '50000000-0000-4000-8000-000000000003',
    latestReceptionNote: '50000000-0000-4000-8000-000000000004',
    registryItem: '60000000-0000-4000-8000-000000000001',
  },
  people: {
    alex: '70000000-0000-4000-8000-000000000001',
    jordan: '70000000-0000-4000-8000-000000000002',
    maya: '70000000-0000-4000-8000-000000000003',
    sam: '70000000-0000-4000-8000-000000000004',
    pendingGuest: '70000000-0000-4000-8000-000000000005',
    appReview: '70000000-0000-4000-8000-000000000006',
    receptionPlanner: '70000000-0000-4000-8000-000000000007',
    goingGuest: '70000000-0000-4000-8000-000000000008',
    declinedGuest: '70000000-0000-4000-8000-000000000009',
  },
} as const

export type ReviewFixtureUser = {
  id: string
  name: string
  email: string
}

export type ReviewFixtureUsers = readonly [
  ReviewFixtureUser,
  ReviewFixtureUser,
  ReviewFixtureUser,
  ReviewFixtureUser,
  ReviewFixtureUser,
]

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
    addressLine2: '',
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
  users: ReviewFixtureUsers
  receptionPlanner?: ReviewFixtureUser
}) {
  const [alex, jordan, maya, sam, reviewer] = input.users
  const { events, planning, people } = reviewWorkspaceIds
  const users = [
    {
      id: people.alex,
      account: alex,
      initials: 'AM',
      role: 'host',
      permission: 'manage',
      attendance: 'going',
    },
    {
      id: people.jordan,
      account: jordan,
      initials: 'JL',
      role: 'host',
      permission: 'manage',
      attendance: 'going',
    },
    {
      id: people.maya,
      account: maya,
      initials: 'MC',
      role: 'collaborator',
      permission: 'contribute',
      attendance: 'going',
    },
    {
      id: people.sam,
      account: sam,
      initials: 'SR',
      role: 'guest',
      permission: 'viewOnly',
      attendance: 'maybe',
    },
    {
      id: people.appReview,
      account: reviewer,
      initials: 'AR',
      role: 'host',
      permission: 'manage',
      attendance: 'going',
    },
  ] as const
  const createdAt = foundationDate('2026-10-12T12:00:00.000Z')

  const members = users.map((person) => ({
    id: person.id as string,
    userID: person.account.id as string | null,
    name: person.account.name,
    participantRole: person.role as string,
    initials: person.initials as string,
    attendance: person.attendance as string,
    email: person.account.email,
    profileImageAssetName: null,
    profileImageURL: null,
    planningPermission: person.permission as string,
    invitationStatus: 'active',
  }))

  // Contacts can RSVP without an account. Only the invited contact receives an
  // email invitation; neither contacts nor guests receive native scope grants.
  const guestContacts = [
    {
      id: people.pendingGuest,
      name: 'Invited Family',
      email: 'family@gatherory.test',
      attendance: 'invited',
    },
    {
      id: people.goingGuest,
      name: 'Jamie Park',
      email: 'jamie@gatherory.test',
      attendance: 'going',
    },
    {
      id: people.declinedGuest,
      name: 'Drew Ellis',
      email: 'drew@gatherory.test',
      attendance: 'declined',
    },
  ]
  for (const guest of guestContacts) {
    members.push({
      ...guest,
      userID: null,
      participantRole: 'guest',
      initials: guest.name
        .split(' ')
        .map((part) => part[0])
        .join(''),
      profileImageAssetName: null,
      profileImageURL: null,
      planningPermission: 'viewOnly',
      invitationStatus: guest.attendance === 'invited' ? 'invited' : 'active',
    })
  }
  const mainParticipantIDs = members.map((person) => person.id)

  const eventParticipations = Object.values(events).flatMap((eventID, eventIndex) =>
    users.map((person, index) => ({
      // Stable UUIDs make a second seed produce the exact same snapshot.
      id: `80000000-0000-4000-8000-${String(eventIndex * 10 + index + 1).padStart(12, '0')}`,
      eventID: eventID as string,
      memberID: person.id as string,
      role: person.role as string,
      planningPermission: person.permission as string,
      attendance: person.attendance as string,
      invitationStatus: 'active',
      createdAt,
      updatedAt: createdAt,
    }))
  )

  for (const [eventIndex, eventID] of [events.main, events.ceremony, events.reception].entries()) {
    guestContacts.forEach((person, index) => {
      eventParticipations.push({
        id: `81000000-0000-4000-8000-${String(eventIndex * 10 + index + 1).padStart(12, '0')}`,
        eventID,
        memberID: person.id,
        role: 'guest',
        planningPermission: 'viewOnly',
        attendance: person.attendance,
        invitationStatus: person.attendance === 'invited' ? 'invited' : 'active',
        createdAt,
        updatedAt: createdAt,
      })
    })
  }

  if (input.receptionPlanner) {
    const planner = input.receptionPlanner
    members.push({
      id: people.receptionPlanner,
      userID: planner.id,
      name: planner.name,
      email: planner.email,
      initials: 'TB',
      participantRole: 'collaborator',
      planningPermission: 'contribute',
      attendance: 'going',
      invitationStatus: 'active',
      profileImageAssetName: null,
      profileImageURL: null,
    })
    eventParticipations.push({
      id: '82000000-0000-4000-8000-000000000001',
      eventID: events.reception,
      memberID: people.receptionPlanner,
      role: 'collaborator',
      planningPermission: 'contribute',
      attendance: 'going',
      invitationStatus: 'active',
      createdAt,
      updatedAt: createdAt,
    })
  }

  const eventDetails = [
    [
      events.venueTour,
      'Final venue walkthrough',
      'venue',
      'planning',
      '2027-01-16T16:00:00.000Z',
      '2027-01-16T17:30:00.000Z',
      'Willow & Stone Estate',
      'Ann Arbor, Michigan',
      'Confirm the ceremony layout and rain plan.',
      1500,
    ],
    [
      events.tasting,
      'Menu tasting',
      'foodTasting',
      'planning',
      '2027-03-20T22:00:00.000Z',
      '2027-03-21T00:00:00.000Z',
      'Juniper Kitchen',
      'Detroit, Michigan',
      'Choose the dinner menu and late-night snack.',
      800,
    ],
    [
      events.rehearsal,
      'Rehearsal dinner',
      'rehearsal',
      'eventExperience',
      '2027-06-12T22:30:00.000Z',
      '2027-06-13T01:00:00.000Z',
      'The Common Table',
      'Ann Arbor, Michigan',
      'Dinner with the wedding party and immediate family.',
      3500,
    ],
    [
      events.ceremony,
      'Ceremony',
      'ceremony',
      'eventExperience',
      '2027-06-13T20:00:00.000Z',
      '2027-06-13T20:45:00.000Z',
      'Willow & Stone Estate',
      'Ann Arbor, Michigan',
      'The moment we make it official.',
      null,
    ],
    [
      events.reception,
      'Dinner & reception',
      'reception',
      'eventExperience',
      '2027-06-13T21:30:00.000Z',
      '2027-06-14T03:30:00.000Z',
      'Willow & Stone Estate',
      'Ann Arbor, Michigan',
      'Dinner, toasts, and dancing under the trees.',
      12000,
    ],
    [
      events.afterParty,
      'After-party',
      'reception',
      'eventExperience',
      '2027-06-14T04:00:00.000Z',
      '2027-06-14T06:00:00.000Z',
      'The Last Word',
      'Ann Arbor, Michigan',
      'One last round for anyone still dancing.',
      2000,
    ],
  ] as const

  return {
    mainEventID: events.main,
    title: "Alex & Jordan's Wedding",
    mainEventStartsAt: foundationDate('2027-06-13T20:00:00.000Z'),
    mainEventEndsAt: foundationDate('2027-06-14T05:00:00.000Z'),
    mainEventIsAllDay: false,
    mainEventTimeZoneIdentifier: 'America/Detroit',
    mainEventLocation: location('Willow & Stone Estate', 'Ann Arbor, Michigan'),
    mainEventImageData: null,
    mainEventMediaAssetID: null,
    venueName: 'Willow & Stone Estate',
    location: 'Ann Arbor, Michigan',
    dressCode: 'Garden formal',
    eventMessage:
      'A garden ceremony, dinner under the trees, and a full weekend with our favorite people.',
    planningMode: 'openToIdeas',
    members,
    eventParticipations,
    mainEventParticipantIDs: mainParticipantIDs,
    ideas: [
      {
        id: planning.venueIdea,
        eventID: events.main,
        title: 'Willow & Stone Estate',
        note: 'Garden ceremony, dinner under the trees, and a weather-ready indoor space.',
        category: 'venue',
        submittedBy: alex.name,
        submittedByUserID: alex.id,
        estimatedCost: 8500,
        status: 'chosen',
        submittedAt: createdAt,
        imageData: null,
        mediaAssetID: null,
        configuration: {
          venue: { _0: { setting: 'both', capacity: 140, area: 'Ann Arbor' } },
        },
        invitationVisibility: 'planningOnly',
      },
      {
        id: planning.musicIdea,
        eventID: events.main,
        title: 'First dance song',
        note: 'A warm, easy song for the first dance.',
        category: 'music',
        submittedBy: jordan.name,
        submittedByUserID: jordan.id,
        estimatedCost: null,
        status: 'shortlisted',
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
                  providerID: 'apple-music',
                  catalogID: 'i.4YBN1YWf2a62bq9',
                  title: 'BABYDOLL (Speed)',
                  artistName: 'Ari Abdul',
                  albumTitle: 'BABYDOLL (Speed) - Single',
                  artworkURL:
                    'musicKit://artwork/library/4B2C9115-D692-4636-BDB7-31676E1FB4AB/600x600?aat=Music126%2Fv4%2F23%2F73%2F2f%2F23732f5f%2D181f%2D2bbd%2Dfeb5%2D3ab42eb958ff%2F196589059925%2Ejpg&at=item&id=316369963290033991&lid=4B2C9115%2DD692%2D4636%2DBDB7%2D31676E1FB4AB&mt=music',
                  previewURL: null,
                  externalURL: null,
                  isrc: null,
                  duration: 156.651,
                },
              ],
            },
          },
        },
        invitationVisibility: 'shownToGuests',
      },
      {
        id: planning.attireIdea,
        eventID: events.main,
        title: 'Garden formal attire',
        note: 'Comfortable shoes encouraged for the lawn.',
        category: 'attire',
        submittedBy: maya.name,
        submittedByUserID: maya.id,
        estimatedCost: null,
        status: 'maybe',
        submittedAt: createdAt,
        imageData: null,
        mediaAssetID: null,
        configuration: {
          attire: {
            _0: { style: 'garden', restrictions: 'Avoid white and ivory.' },
          },
        },
        invitationVisibility: 'shownToGuests',
      },
      {
        id: planning.registryIdea,
        eventID: events.main,
        title: 'Weekend getaway fund',
        note: 'Help us plan a quiet first trip after the wedding.',
        category: 'registry',
        submittedBy: alex.name,
        submittedByUserID: alex.id,
        estimatedCost: 1500,
        status: 'chosen',
        submittedAt: createdAt,
        imageData: null,
        mediaAssetID: null,
        configuration: {
          registry: { _0: { category: 'cashFund', price: 1500, quantity: 1 } },
        },
        invitationVisibility: 'planningOnly',
      },
      {
        id: planning.linkIdea,
        eventID: events.main,
        title: 'Wedding weekend guide',
        note: 'A single place for travel notes, arrival details, and our favorite Ann Arbor stops.',
        category: 'link',
        submittedBy: jordan.name,
        submittedByUserID: jordan.id,
        estimatedCost: null,
        status: 'shortlisted',
        submittedAt: createdAt,
        imageData: null,
        mediaAssetID: null,
        configuration: { link: { _0: { url: 'https://example.com/wedding-weekend' } } },
        invitationVisibility: 'shownToGuests',
      },
      {
        id: planning.eventIdea,
        eventID: events.main,
        title: 'Welcome drinks',
        note: 'An easy Friday evening gathering for everyone arriving early.',
        category: 'event',
        submittedBy: maya.name,
        submittedByUserID: maya.id,
        estimatedCost: 850,
        status: 'maybe',
        submittedAt: createdAt,
        imageData: null,
        mediaAssetID: null,
        configuration: {
          event: {
            _0: {
              category: 'reception',
              purpose: 'eventExperience',
              audience: 'inherited',
              requiresBudget: true,
              proposedBudget: 850,
              proposedDate: null,
              proposedEndDate: null,
              isAllDay: false,
              timeZoneIdentifier: 'America/Detroit',
              location: null,
              attireStyle: 'any',
              attireGuidance: '',
            },
          },
        },
        invitationVisibility: 'planningOnly',
      },
      {
        id: planning.flowersIdea,
        eventID: events.main,
        title: 'Garden rose arrangements',
        note: 'Loose roses, olive branches, and soft seasonal greens for the tables.',
        category: 'flowers',
        submittedBy: alex.name,
        submittedByUserID: alex.id,
        estimatedCost: 2800,
        status: 'shortlisted',
        submittedAt: createdAt,
        imageData: null,
        mediaAssetID: null,
        configuration: { flowers: { _0: { focus: 'tables', palette: 'Roses and soft greens' } } },
        invitationVisibility: 'planningOnly',
      },
      {
        id: planning.foodIdea,
        eventID: events.main,
        title: 'Family-style dinner',
        note: 'A seasonal dinner with vegetarian and gluten-free options for every guest.',
        category: 'food',
        submittedBy: maya.name,
        submittedByUserID: maya.id,
        estimatedCost: 7200,
        status: 'maybe',
        submittedAt: createdAt,
        imageData: null,
        mediaAssetID: null,
        configuration: {
          food: {
            _0: { type: 'meal', servings: 140, dietaryNotes: 'Vegetarian and gluten-free options' },
          },
        },
        invitationVisibility: 'planningOnly',
      },
      {
        id: planning.photographyIdea,
        eventID: events.main,
        title: 'Golden-hour portraits',
        note: 'Reserve a few quiet minutes before dinner for portraits in the garden.',
        category: 'photography',
        submittedBy: maya.name,
        submittedByUserID: maya.id,
        estimatedCost: 1200,
        status: 'chosen',
        submittedAt: createdAt,
        imageData: null,
        mediaAssetID: null,
        configuration: {
          photography: {
            _0: { style: 'documentary', coverageHours: 4, priorities: 'Golden-hour portraits' },
          },
        },
        invitationVisibility: 'planningOnly',
      },
      {
        id: planning.decorIdea,
        eventID: events.reception,
        title: 'Candlelit reception tables',
        note: 'Layered glass votives and low arrangements to keep every conversation open.',
        category: 'decor',
        submittedBy: jordan.name,
        submittedByUserID: jordan.id,
        estimatedCost: 950,
        status: 'shortlisted',
        submittedAt: createdAt,
        imageData: null,
        mediaAssetID: null,
        configuration: {
          decor: {
            _0: { focus: 'tables', paletteOrMaterials: 'Glass votives and seasonal greens' },
          },
        },
        invitationVisibility: 'planningOnly',
      },
      {
        id: planning.invitationsIdea,
        eventID: events.main,
        title: 'Watercolor invitations',
        note: 'Soft botanical stationery that carries the garden setting into every invitation.',
        category: 'invitations',
        submittedBy: alex.name,
        submittedByUserID: alex.id,
        estimatedCost: 650,
        status: 'chosen',
        submittedAt: createdAt,
        imageData: null,
        mediaAssetID: null,
        configuration: {
          invitations: {
            _0: {
              format: 'printed',
              quantity: 80,
              productionNotes: 'Botanical watercolor stationery',
            },
          },
        },
        invitationVisibility: 'shownToGuests',
      },
      {
        id: planning.honeymoonIdea,
        eventID: events.main,
        title: 'Amalfi coast escape',
        note: 'A slow, sunlit first trip after the celebration.',
        category: 'honeymoon',
        submittedBy: jordan.name,
        submittedByUserID: jordan.id,
        estimatedCost: 6000,
        status: 'maybe',
        submittedAt: createdAt,
        imageData: null,
        mediaAssetID: null,
        configuration: {
          honeymoon: { _0: { style: 'relaxing', destination: 'Amalfi coast', nights: 5 } },
        },
        invitationVisibility: 'planningOnly',
      },
      {
        id: planning.otherIdea,
        eventID: events.main,
        title: 'Late-night coffee bar',
        note: 'An espresso cart and small treats for the last dance set.',
        category: 'other',
        submittedBy: jordan.name,
        submittedByUserID: jordan.id,
        estimatedCost: 500,
        status: 'new',
        submittedAt: createdAt,
        imageData: null,
        mediaAssetID: null,
        configuration: { standard: {} },
        invitationVisibility: 'planningOnly',
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
        schedulingState: 'scheduled',
        endsAt: foundationDate(endsAt),
        isAllDay: false,
        timeZoneIdentifier: 'America/Detroit',
        eventLocation: location(place, address),
        participantIDs: eventParticipations
          .filter((item) => item.eventID === id)
          .map((item) => item.memberID),
        parentEventID: events.main,
        status: 'approved',
        completionStatus: 'upcoming',
        response: null,
        linkedIdeaID: null,
        imageData: null,
        mediaAssetID: null,
        eventDescription,
        dressCode: 'Garden formal',
        budgetCap,
      })
    ),
    ideaResponses: [
      {
        id: ideaResponseID(planning.musicIdea, alex.id),
        ideaID: planning.musicIdea,
        userID: alex.id,
        choice: 'love',
      },
      {
        id: ideaResponseID(planning.musicIdea, maya.id),
        ideaID: planning.musicIdea,
        userID: maya.id,
        choice: 'maybe',
      },
    ],
    eventExpenses: [
      {
        id: planning.venueExpense,
        eventID: events.main,
        sourceIdeaID: planning.venueIdea,
        title: 'Venue deposit',
        amount: 3500,
        category: 'venue',
        status: 'committed',
        createdByUserID: alex.id,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: planning.receptionExpense,
        eventID: events.reception,
        sourceIdeaID: null,
        title: 'Catering deposit',
        amount: 2400,
        category: 'foodAndDrink',
        status: 'paid',
        createdByUserID: alex.id,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: planning.receptionEstimate,
        eventID: events.reception,
        sourceIdeaID: planning.decorIdea,
        title: 'Table decor estimate',
        amount: 950,
        category: 'decor',
        status: 'estimated',
        createdByUserID: jordan.id,
        createdAt,
        updatedAt: createdAt,
      },
    ],
    workspaceBudgetCap: 30000,
    currencyCode: 'USD',
    mainEventBudgetCap: 10000,
    notes: [
      {
        id: planning.eventNote,
        eventID: events.main,
        authorUserID: alex.id,
        body: 'The venue walkthrough is confirmed. Meet at the garden entrance.',
        sentAt: createdAt,
      },
      {
        id: planning.latestNote,
        eventID: events.main,
        authorUserID: jordan.id,
        body: 'Please share your travel plans before Friday so we can arrange rides. Comfortable shoes are recommended for the garden paths, and we will share the rain plan after the venue walkthrough.',
        sentAt: createdAt + 3600,
      },
      {
        id: planning.receptionNote,
        eventID: events.reception,
        authorUserID: alex.id,
        body: 'The caterer has confirmed vegetarian options for dinner.',
        sentAt: createdAt,
      },
      {
        id: planning.latestReceptionNote,
        eventID: events.reception,
        authorUserID: jordan.id,
        body: 'Table setup starts at four. Please meet by the reception entrance.',
        sentAt: createdAt + 7200,
      },
    ],
    mainEventStatus: 'draft',
    mainEventResponse: 'going',
    eventMoments: [],
    isMainEventDeleted: false,
    registry: [
      {
        id: planning.registryItem,
        eventID: events.main,
        sourceIdeaID: planning.registryIdea,
        title: 'Weekend getaway fund',
        note: 'A quiet first trip after the wedding.',
        category: 'cashFund',
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
    defaultCollaboratorPermission: 'contribute',
    isScopedEvent: false,
    scopedEvent: null,
  }
}

export function encodeNativeWorkspaceSnapshot(
  archive: ReturnType<typeof createReviewWorkspaceArchive>
) {
  return Buffer.from(JSON.stringify(archive)).toString('base64')
}
