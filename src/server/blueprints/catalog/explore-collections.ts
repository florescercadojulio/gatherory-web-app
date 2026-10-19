import type { BlueprintDiscovery } from '@/contracts/blueprint-discovery.contracts'
import type { BlueprintDraftContent } from '@/contracts/blueprint-authoring.contracts'

type Activity = [title: string, day: number, time: string, guidance: string]
type Idea = [
  title: string,
  category: BlueprintDraftContent['ideas'][number]['category'],
  notes: string,
  activity: number | null,
]
type Collection = {
  key: string
  name: string
  discovery: BlueprintDiscovery
  activities: Activity[]
  ideas: Idea[]
}

/** Human-authored, portable suggestions. No bookings, access grants, reminders or real personal data. */
export const exploreCollections: Collection[] = [
  {
    key: 'engagement_gathering',
    name: 'An Engagement Worth Celebrating',
    discovery: {
      categories: ['engagements'],
      tags: ['engagement', 'couple', 'celebration', 'toast'],
      summary:
        'A relaxed engagement gathering centered on the couple, a shared meal and time with loved ones.',
    },
    activities: [
      [
        'Set the space',
        0,
        '14:00',
        'Keep seating and walkways comfortable and leave room for guests to mingle.',
      ],
      [
        'Welcome and introductions',
        0,
        '17:00',
        'Introduce people who have not met; do not assume everyone knows the couple’s families.',
      ],
      [
        'Shared supper',
        0,
        '18:00',
        'Confirm dietary needs and let guests know whether the meal is seated or casual.',
      ],
      [
        'Stories and toasts',
        0,
        '19:30',
        'Ask the couple which stories and announcements they want shared.',
      ],
    ],
    ideas: [
      [
        'A favorite-food supper',
        'food',
        'Choose dishes connected to the couple and label dietary alternatives.',
        2,
      ],
      [
        'Alcohol-free welcome drinks',
        'food',
        'Make a festive nonalcoholic option available to everyone.',
        1,
      ],
      [
        'Photo timeline',
        'photography',
        'Use only photos the couple is comfortable displaying.',
        null,
      ],
      [
        'Short, optional toasts',
        'other',
        'Invite a few speakers in advance, with no pressure to participate.',
        3,
      ],
      [
        'Simple seasonal flowers',
        'flowers',
        'Keep table arrangements low enough for conversation.',
        0,
      ],
      [
        'Clear invitation wording',
        'invitations',
        'State the time, meal plan and whether gifts are expected; never assume.',
        null,
      ],
    ],
  },
  {
    key: 'welcome_baby_shower',
    name: 'A Thoughtful Baby Shower',
    discovery: {
      categories: ['showers'],
      tags: ['baby', 'shower', 'parents', 'family', 'welcome'],
      summary:
        'A welcoming shower with flexible activities, practical support and space for the parents’ preferences.',
    },
    activities: [
      [
        'Prepare a comfortable space',
        0,
        '10:00',
        'Provide comfortable seating, a quiet place to rest and an accessible arrival route.',
      ],
      [
        'Welcome brunch',
        0,
        '11:00',
        'Ask about dietary needs and food preferences before choosing the menu.',
      ],
      [
        'Optional shared activities',
        0,
        '12:00',
        'Keep games optional and avoid personal questions or assumptions about family roles.',
      ],
      [
        'Well-wishes and farewell',
        0,
        '13:00',
        'Ask the parents whether they want gifts opened during the event.',
      ],
    ],
    ideas: [
      [
        'A brunch everyone can enjoy',
        'food',
        'Include clearly labeled alternatives and easy-to-eat portions.',
        1,
      ],
      [
        'Advice cards, without pressure',
        'other',
        'Offer blank cards for encouragement rather than unsolicited instructions.',
        2,
      ],
      [
        'A favorite children’s book',
        'other',
        'Invite guests to share a book only if the parents like the idea.',
        null,
      ],
      [
        'A practical support calendar idea',
        'other',
        'Discuss future meal help privately; this does not schedule reminders.',
        null,
      ],
      [
        'Low-key table decor',
        'decor',
        'Use reusable decorations in colors chosen by the parents.',
        0,
      ],
      [
        'Photo preferences',
        'photography',
        'Ask before posting photos or sharing pregnancy or baby details.',
        3,
      ],
    ],
  },
  {
    key: 'friends_celebration_weekend',
    name: 'A Friends-First Celebration Weekend',
    discovery: {
      categories: ['bachelor_parties'],
      tags: ['bachelor', 'bachelorette', 'friends', 'weekend', 'celebration'],
      summary:
        'A bachelor or bachelorette weekend built around shared comfort, clear costs and optional activities.',
    },
    activities: [
      [
        'Arrival and easy dinner',
        0,
        '18:00',
        'Agree on the budget and sleeping arrangements before anyone books.',
      ],
      [
        'Choose-your-pace afternoon',
        1,
        '13:00',
        'Offer a low-cost alternative and make it easy to skip an activity.',
      ],
      [
        'Celebration dinner',
        1,
        '19:00',
        'Confirm the guest of honor’s preferences rather than planning unwanted surprises.',
      ],
      [
        'Brunch and departures',
        2,
        '10:00',
        'Leave enough time for travel and agree how shared costs will be settled.',
      ],
    ],
    ideas: [
      [
        'Cooking class or shared cooking',
        'food',
        'Compare a paid class with a lower-cost meal cooked together.',
        1,
      ],
      ['A scenic walk', 'venue', 'Check route accessibility and provide a seated alternative.', 1],
      [
        'A dinner with a clear price range',
        'food',
        'Share expected costs and dietary options before reserving.',
        2,
      ],
      [
        'A no-pressure evening in',
        'other',
        'Keep games, films or conversation available as an alternative to going out.',
        2,
      ],
      [
        'Travel together where practical',
        'other',
        'Discuss transport without posting private travel documents.',
        0,
      ],
      [
        'Guest-of-honor photo picks',
        'photography',
        'Ask permission before taking or sharing celebration photos.',
        null,
      ],
    ],
  },
  {
    key: 'anniversary_supper',
    name: 'An Anniversary Around the Table',
    discovery: {
      categories: ['anniversaries'],
      tags: ['anniversary', 'couple', 'memories', 'dinner'],
      summary:
        'An intimate anniversary celebration with meaningful food, shared memories and a comfortable pace.',
    },
    activities: [
      [
        'Prepare the table',
        0,
        '15:00',
        'Choose a setting comfortable for the people being celebrated.',
      ],
      ['Welcome and catch up', 0, '17:00', 'Allow unhurried time to reconnect before the meal.'],
      [
        'Dinner and memories',
        0,
        '18:00',
        'Check which stories and photographs the couple wants included.',
      ],
      [
        'Dessert and farewell',
        0,
        '20:00',
        'Keep speeches short and leave time for private conversations.',
      ],
    ],
    ideas: [
      ['Revisit a favorite meal', 'food', 'Adapt a meaningful dish to current dietary needs.', 2],
      [
        'Then-and-now photo display',
        'photography',
        'Use approved photos and avoid revealing personal details.',
        0,
      ],
      [
        'A small memory book',
        'other',
        'Collect optional notes from guests before the gathering.',
        2,
      ],
      [
        'Music from shared milestones',
        'other',
        'Gather song suggestions; no music account or playlist is copied.',
        null,
      ],
      [
        'Flowers with a story',
        'flowers',
        'Choose a simple arrangement connected to a shared memory.',
        0,
      ],
      [
        'A favorite dessert',
        'food',
        'Offer a small selection instead of an elaborate cake if preferred.',
        3,
      ],
    ],
  },
  {
    key: 'graduation_open_house',
    name: 'Graduation Open House',
    discovery: {
      categories: ['graduations'],
      tags: ['graduation', 'school', 'milestone', 'open house'],
      summary:
        'A flexible open house that celebrates the graduate without creating a rigid guest schedule.',
    },
    activities: [
      [
        'Set up the welcome area',
        0,
        '10:00',
        'Confirm arrival instructions, parking and accessible entry.',
      ],
      [
        'First arrivals and lunch',
        0,
        '12:00',
        'Share the drop-in window and keep food available for staggered arrivals.',
      ],
      [
        'A moment for the graduate',
        0,
        '14:00',
        'Agree on any toast or presentation with the graduate first.',
      ],
      [
        'Last visits and cleanup',
        0,
        '16:00',
        'Arrange a small cleanup group so the graduate can enjoy the event.',
      ],
    ],
    ideas: [
      [
        'Easy-to-refill lunch stations',
        'food',
        'Plan safe serving and storage for a longer drop-in gathering.',
        1,
      ],
      [
        'A graduate-approved photo board',
        'photography',
        'Choose photos together rather than using embarrassing surprises.',
        0,
      ],
      [
        'Advice for the next chapter',
        'other',
        'Invite encouraging notes without assuming college, work or another path.',
        2,
      ],
      [
        'Clear drop-in invitations',
        'invitations',
        'Explain that guests can arrive during the stated window.',
        null,
      ],
      [
        'Reusable school-color accents',
        'decor',
        'Use a few simple decorations rather than single-use extras.',
        0,
      ],
      [
        'A quiet conversation corner',
        'venue',
        'Make room for guests who prefer a calmer place to catch up.',
        1,
      ],
    ],
  },
  {
    key: 'family_reunion_weekend',
    name: 'Family Reunion Weekend',
    discovery: {
      categories: ['reunions'],
      tags: ['family', 'reunion', 'generations', 'weekend'],
      summary:
        'A multigenerational reunion with flexible activities, shared meals and time to reconnect.',
    },
    activities: [
      [
        'Welcome supper',
        0,
        '18:00',
        'Share an easy meeting point and introduce relatives who have not met.',
      ],
      [
        'Choose-your-pace outing',
        1,
        '10:00',
        'Offer accessible and low-cost options with no pressure to join everything.',
      ],
      [
        'Family meal and stories',
        1,
        '17:00',
        'Ask permission before recording stories or discussing personal family history.',
      ],
      [
        'Farewell breakfast',
        2,
        '09:00',
        'Plan around departure times and leave room for final visits.',
      ],
    ],
    ideas: [
      [
        'A family recipe table',
        'food',
        'Label ingredients and invite contributions without requiring them.',
        2,
      ],
      ['A park with accessible seating', 'venue', 'Check toilets, shade and step-free routes.', 1],
      [
        'Optional family portraits',
        'photography',
        'Ask who wants to be photographed and how images may be shared.',
        2,
      ],
      [
        'A shared story table',
        'other',
        'Bring copies of photos rather than irreplaceable originals.',
        2,
      ],
      ['Mixed-age lawn games', 'other', 'Offer seated versions and quieter alternatives.', 1],
      [
        'A simple contact handoff',
        'other',
        'Exchange contact information only with each person’s agreement.',
        3,
      ],
    ],
  },
  {
    key: 'seasonal_dinner_party',
    name: 'A Seasonal Dinner with Friends',
    discovery: {
      categories: ['dinner_parties'],
      tags: ['dinner', 'potluck', 'friends', 'supper', 'food'],
      summary:
        'A small dinner party with a manageable menu, dietary alternatives and time for conversation.',
    },
    activities: [
      [
        'Kitchen preparation',
        0,
        '15:00',
        'Choose dishes that can mostly be prepared before guests arrive.',
      ],
      [
        'Welcome drinks',
        0,
        '18:00',
        'Offer water and a festive nonalcoholic option alongside other drinks.',
      ],
      [
        'Dinner together',
        0,
        '19:00',
        'Confirm dietary needs and tell guests what, if anything, to bring.',
      ],
      [
        'Dessert and conversation',
        0,
        '20:30',
        'Keep the end of the evening flexible and unhurried.',
      ],
    ],
    ideas: [
      [
        'One main dish, flexible sides',
        'food',
        'Reduce kitchen work with a simple menu and labeled alternatives.',
        2,
      ],
      ['A shared starter board', 'food', 'Keep allergy-sensitive ingredients separate.', 1],
      [
        'A make-ahead dessert',
        'food',
        'Choose a dessert that needs little attention during dinner.',
        3,
      ],
      [
        'Small table arrangements',
        'flowers',
        'Keep scent and height low enough for comfortable dining.',
        0,
      ],
      [
        'Conversation without icebreakers',
        'other',
        'Leave room for natural conversation rather than mandatory games.',
        2,
      ],
      [
        'A clear contribution plan',
        'invitations',
        'Avoid duplicate dishes by agreeing optional contributions beforehand.',
        null,
      ],
    ],
  },
  {
    key: 'park_picnic',
    name: 'A Low-Key Park Picnic',
    discovery: {
      categories: ['picnics'],
      tags: ['picnic', 'park', 'outdoors', 'summer', 'friends'],
      summary:
        'An easy outdoor gathering with shade, accessible meeting points and a weather alternative.',
    },
    activities: [
      [
        'Meet at the park',
        0,
        '11:00',
        'Choose a clear meeting point near accessible paths and toilets.',
      ],
      ['Picnic lunch', 0, '12:00', 'Agree who brings what and how perishable food will stay cool.'],
      ['Optional games and walks', 0, '13:00', 'Keep a shaded, seated alternative available.'],
      [
        'Pack up together',
        0,
        '15:00',
        'Leave the area clean and check for belongings before leaving.',
      ],
    ],
    ideas: [
      ['A shaded picnic table', 'venue', 'Check booking rules, seating and step-free access.', 0],
      [
        'Packable sandwiches and salads',
        'food',
        'Label ingredients and keep foods at an appropriate temperature.',
        1,
      ],
      [
        'Refillable water station',
        'food',
        'Confirm whether drinking water is available nearby.',
        1,
      ],
      [
        'A short optional nature walk',
        'other',
        'Check the route and keep a seated alternative.',
        2,
      ],
      [
        'Blankets and spare cushions',
        'decor',
        'Bring chairs too; not everyone can comfortably sit on the ground.',
        0,
      ],
      [
        'Indoor weather backup',
        'venue',
        'Agree when and how a location change will be communicated.',
        null,
      ],
    ],
  },
  {
    key: 'welcoming_game_night',
    name: 'Game Night for Every Skill Level',
    discovery: {
      categories: ['game_nights'],
      tags: ['games', 'board games', 'friends', 'indoors', 'casual'],
      summary:
        'A welcoming game night with quick introductions, flexible tables and plenty of breaks.',
    },
    activities: [
      [
        'Arrive and choose a table',
        0,
        '18:00',
        'Ask about experience and preferred pace without putting anyone on the spot.',
      ],
      [
        'A short opening game',
        0,
        '18:30',
        'Teach the rules together and choose a game with an easy first round.',
      ],
      [
        'Snack break and table swap',
        0,
        '19:30',
        'Let people change games or simply spend time talking.',
      ],
      [
        'One final round',
        0,
        '20:30',
        'Agree on an end time and avoid starting a game that runs far beyond it.',
      ],
    ],
    ideas: [
      [
        'Cooperative opener',
        'other',
        'Choose a short game where newcomers can learn with the group.',
        1,
      ],
      [
        'A quiet puzzle table',
        'other',
        'Provide a lower-stimulation alternative to competitive games.',
        0,
      ],
      [
        'Easy-to-read rules',
        'other',
        'Offer a spoken explanation and readable reference cards.',
        1,
      ],
      [
        'Low-mess snack bowls',
        'food',
        'Keep food away from shared game pieces and label allergens.',
        2,
      ],
      [
        'Team games with flexible roles',
        'other',
        'Avoid requiring physical speed, acting or personal disclosure.',
        3,
      ],
      [
        'A bring-one-game invitation',
        'invitations',
        'Keep contributions optional and confirm player counts beforehand.',
        null,
      ],
    ],
  },
  {
    key: 'shared_city_break',
    name: 'A Flexible City Break',
    discovery: {
      categories: ['trips'],
      tags: ['travel', 'trip', 'city', 'weekend', 'itinerary'],
      summary:
        'A shared weekend itinerary with budget choices, free time and a realistic travel pace.',
    },
    activities: [
      [
        'Arrival and neighborhood supper',
        0,
        '18:00',
        'Leave room for delayed arrivals and do not share booking codes in public guidance.',
      ],
      [
        'One main outing',
        1,
        '10:00',
        'Check opening hours, access requirements and costs before making commitments.',
      ],
      [
        'Free time and dinner',
        1,
        '18:00',
        'Let people explore separately and agree on a clear dinner meeting point.',
      ],
      [
        'Breakfast and departures',
        2,
        '09:00',
        'Allow time for checkout, luggage and travel to the next connection.',
      ],
    ],
    ideas: [
      [
        'A walkable home base',
        'venue',
        'Compare travel time, accessible transport and accommodation cost.',
        null,
      ],
      [
        'One advance-booked attraction',
        'event',
        'Keep the itinerary light and confirm cancellation terms before booking.',
        1,
      ],
      [
        'A free neighborhood walk',
        'other',
        'Offer a low-cost alternative and check route accessibility.',
        1,
      ],
      [
        'A shared food market lunch',
        'food',
        'Look for multiple dietary options and places to sit.',
        1,
      ],
      [
        'An optional evening plan',
        'other',
        'Treat nightlife as optional rather than the default group activity.',
        2,
      ],
      [
        'A departure transport plan',
        'other',
        'Keep private tickets and identity documents outside the template.',
        3,
      ],
    ],
  },
  {
    key: 'family_cottage_escape',
    name: 'A Family Cottage Escape',
    discovery: {
      categories: ['cottage_stays'],
      tags: ['cottage', 'cabin', 'lake', 'family', 'stay'],
      summary:
        'A family cottage stay with shared meals, optional outings and a clear arrival and departure handoff.',
    },
    activities: [
      [
        'Arrival and settle in',
        0,
        '16:00',
        'Confirm arrival with the host privately; do not put entry codes in a reusable template.',
      ],
      [
        'A relaxed cottage day',
        1,
        '10:00',
        'Discuss local conditions and choose activities suitable for the group.',
      ],
      [
        'Shared supper and games',
        1,
        '18:00',
        'Keep the evening flexible and respect agreed quiet hours.',
      ],
      [
        'Departure handoff',
        2,
        '10:00',
        'Agree cleanup and key-return arrangements directly with the host.',
      ],
    ],
    ideas: [
      [
        'A first-night pantry meal',
        'food',
        'Choose an easy meal that works if people arrive at different times.',
        0,
      ],
      [
        'A local bakery morning',
        'food',
        'Add a host-approved recommendation once opening times are checked.',
        1,
      ],
      [
        'A gentle lakeside walk',
        'venue',
        'Check access, route conditions and a seated alternative.',
        1,
      ],
      [
        'A rainy-day game shelf',
        'other',
        'Choose options for different ages and attention spans.',
        2,
      ],
      [
        'A shared grocery plan',
        'other',
        'Coordinate quantities and dietary needs without requiring everyone to contribute equally.',
        null,
      ],
      [
        'A departure handoff note',
        'other',
        'Record agreed arrangements as guidance; no automated checklist or reminder is created.',
        3,
      ],
    ],
  },
  {
    key: 'thoughtful_guest_stay',
    name: 'A Welcoming Guest Stay',
    discovery: {
      categories: ['guest_stays'],
      tags: ['guest', 'rental', 'airbnb', 'hosting', 'local guide'],
      summary:
        'A reusable guest experience with local suggestions and a clear handoff, without exposing property access details.',
    },
    activities: [
      [
        'Arrival and orientation',
        0,
        '16:00',
        'Confirm access privately and explain how to contact the host.',
      ],
      [
        'Explore the neighborhood',
        1,
        '10:00',
        'Offer options, not a mandatory itinerary; verify local details before sharing.',
      ],
      [
        'An easy evening nearby',
        1,
        '18:00',
        'Check opening hours and offer options at more than one price point.',
      ],
      [
        'Checkout and onward travel',
        2,
        '10:00',
        'Agree departure timing directly and avoid storing security details in this guide.',
      ],
    ],
    ideas: [
      [
        'A nearby breakfast spot',
        'food',
        'Replace with a verified local recommendation and dietary options.',
        1,
      ],
      [
        'A free self-guided walk',
        'venue',
        'Provide an accessible route and realistic duration.',
        1,
      ],
      [
        'A rainy-day indoor option',
        'venue',
        'Check transport, cost and whether advance booking is needed.',
        1,
      ],
      [
        'Dinner for different budgets',
        'food',
        'Include an affordable take-away option as well as a sit-down meal.',
        2,
      ],
      [
        'A host contact note',
        'other',
        'Share contact and access details privately with confirmed guests, not through the public template.',
        0,
      ],
      [
        'An agreed checkout handoff',
        'other',
        'Describe only general expectations here; confirm property-specific instructions privately.',
        3,
      ],
    ],
  },
  {
    key: 'small_team_retreat',
    name: 'A Focused Team Retreat',
    discovery: {
      categories: ['retreats'],
      tags: ['team', 'retreat', 'workshop', 'offsite', 'planning'],
      summary:
        'A small-team offsite with clear outcomes, real breaks and inclusive optional social time.',
    },
    activities: [
      [
        'Arrival and shared goals',
        0,
        '09:00',
        'State the purpose and let people contribute in writing as well as aloud.',
      ],
      [
        'Focused working session',
        0,
        '10:00',
        'Choose one concrete outcome and build in a real break.',
      ],
      [
        'Lunch and optional outdoor time',
        0,
        '12:30',
        'Make social time optional and provide a comfortable indoor alternative.',
      ],
      [
        'Decisions and next steps',
        0,
        '15:00',
        'Agree owners and next steps privately; do not publish confidential business information.',
      ],
    ],
    ideas: [
      [
        'An accessible meeting space',
        'venue',
        'Check step-free access, hearing needs, lighting and quiet space.',
        0,
      ],
      [
        'A written-first brainstorm',
        'other',
        'Allow silent contributions before group discussion.',
        1,
      ],
      [
        'A simple shared lunch',
        'food',
        'Ask about dietary requirements without publicly listing medical information.',
        2,
      ],
      [
        'An optional short walk',
        'other',
        'Offer a seated alternative with equal participation.',
        2,
      ],
      [
        'A decision summary',
        'other',
        'Record agreed outcomes and owners outside the reusable public template.',
        3,
      ],
      [
        'A clear pre-read',
        'invitations',
        'Share timing and preparation expectations early, with no confidential attachments in the template.',
        null,
      ],
    ],
  },
  {
    key: 'neighborhood_gathering',
    name: 'A Neighborhood Get-Together',
    discovery: {
      categories: ['community', 'events'],
      tags: ['community', 'neighbors', 'volunteer', 'neighborhood', 'gathering'],
      summary:
        'A friendly local gathering with accessible introductions, shared space and a manageable cleanup plan.',
    },
    activities: [
      [
        'Prepare the shared space',
        0,
        '10:00',
        'Confirm venue permission, access, toilets and any local requirements with the organizer.',
      ],
      [
        'Welcome neighbors',
        0,
        '11:00',
        'Offer name tags without requiring people to share personal contact details.',
      ],
      [
        'Food and optional activities',
        0,
        '12:00',
        'Label food contributions and offer a quiet place to sit.',
      ],
      [
        'Community cleanup',
        0,
        '14:00',
        'Assign cleanup tasks in advance and leave the space as agreed.',
      ],
    ],
    ideas: [
      [
        'A shared park or meeting room',
        'venue',
        'Check permission and accessibility before announcing a location.',
        0,
      ],
      [
        'A welcoming name-tag table',
        'decor',
        'Let people choose what name, if any, they want displayed.',
        1,
      ],
      [
        'A clearly labeled potluck',
        'food',
        'Agree safe serving and ingredient labels with contributors.',
        2,
      ],
      [
        'A swap table with simple rules',
        'other',
        'Specify acceptable items and who takes home anything left over.',
        2,
      ],
      [
        'Optional mixed-age games',
        'other',
        'Provide seated and noncompetitive ways to join in.',
        2,
      ],
      [
        'A small cleanup team',
        'other',
        'Arrange bins and supplies without assuming guests can do physical tasks.',
        3,
      ],
    ],
  },
]
