import {
  draftDefinition,
  type BlueprintDraftContent,
} from '@/contracts/blueprint-authoring.contracts'
import { BlueprintCatalogRevisionSchema } from '@/contracts/blueprint-install.contracts'
import { blueprintHash } from '@/server/blueprints/planning/blueprint-hash'

type Scenario = {
  key: string
  name: string
  type: BlueprintDraftContent['experienceType']
  description: string
  activities: string[]
  ideas: string[]
}

/** Synthetic, public development catalog. Never included in production catalog deployment. */
const scenarios: Scenario[] = [
  {
    key: 'dev_cottage_weekend',
    name: 'Lakeside Cottage Weekend',
    type: 'custom',
    description:
      'A relaxed family cottage stay with swimming, local outings, rainy-day alternatives and departure guidance.',
    activities: [
      'Arrival and porch supper',
      'Farmers market morning',
      'Lake and beach afternoon',
      'Campfire gathering',
      'Rainy-day games',
      'Departure brunch',
    ],
    ideas: [
      'Build-your-own taco supper',
      'Farmers market picnic',
      'Accessible lakeside trail',
      'Paddle around the bay',
      'Sunset family portraits',
      'Campfire storytelling',
      'Rainy-day puzzle table',
      'Local bakery breakfast',
      'Beach picnic blankets',
      'Bring-a-book exchange',
      'Carpool and parking plan',
      'Departure brunch leftovers',
    ],
  },
  {
    key: 'dev_garden_wedding',
    name: 'Garden Wedding Weekend',
    type: 'wedding',
    description:
      'An intimate outdoor wedding with a welcome evening, ceremony, reception and a weather backup plan.',
    activities: [
      'Venue walkthrough',
      'Welcome picnic',
      'Ceremony rehearsal',
      'Garden ceremony',
      'Dinner and dancing',
      'Farewell breakfast',
    ],
    ideas: [
      'Seasonal shared-table dinner',
      'Welcome lemonade station',
      'Greenhouse rain backup',
      'Wildflower aisle arrangements',
      'Golden-hour couple portraits',
      'Acoustic ceremony music',
      'Handwritten place cards',
      'Local berry wedding cake',
      'Shaded ceremony seating',
      'Pressed-flower invitations',
      'Guest shuttle loop',
      'Morning-after coffee cart',
    ],
  },
  {
    key: 'dev_city_wedding',
    name: 'City Hall and Rooftop Celebration',
    type: 'wedding',
    description:
      'A small city wedding with a courthouse ceremony, neighborhood photos and rooftop dinner.',
    activities: [
      'Welcome dinner',
      'Getting ready',
      'City hall ceremony',
      'Neighborhood portraits',
      'Rooftop dinner',
      'Farewell coffee',
    ],
    ideas: [
      'Neighborhood tasting menu',
      'Welcome mocktail flight',
      'Indoor rooftop alternative',
      'Candlelit dinner tables',
      'Street-corner portrait walk',
      'Dinner jazz playlist ideas',
      'Minimalist table numbers',
      'Mini dessert selection',
      'Comfortable ceremony seating',
      'Letterpress announcement',
      'Accessible transit route',
      'Next-morning bagel stop',
    ],
  },
  {
    key: 'dev_backyard_birthday',
    name: 'Backyard Birthday Adventure',
    type: 'birthday',
    description:
      'A playful outdoor birthday with an easy meal, adaptable activities and a quiet corner for breaks.',
    activities: [
      'Set up the garden',
      'Welcome and snacks',
      'Treasure hunt',
      'Craft table',
      'Cake celebration',
      'Wind-down picnic',
    ],
    ideas: [
      'Build-your-own pizza',
      'Fruit and lemonade bar',
      'Indoor weather backup',
      'Reusable bunting',
      'Birthday photo corner',
      'Dance freeze game',
      'Treasure clue cards',
      'Cupcake decorating',
      'Quiet reading corner',
      'Colorful digital invitations',
      'Guest pickup plan',
      'Take-home seed packets',
    ],
  },
  {
    key: 'dev_milestone_dinner',
    name: 'Milestone Birthday Dinner',
    type: 'birthday',
    description:
      'A grown-up birthday gathering with a shared meal, memory sharing and optional late-night plans.',
    activities: [
      'Table setup',
      'Welcome drinks',
      'Shared dinner',
      'Stories and toasts',
      'Dessert gathering',
      'Optional night out',
    ],
    ideas: [
      'Family-style seasonal menu',
      'Alcohol-free cocktail options',
      'Private dining room',
      'Favorite-color flowers',
      'Friends portrait wall',
      'Songs from each decade',
      'Memory prompt cards',
      'Celebration layer cake',
      'Comfortable lounge seating',
      'Photo invitation design',
      'Ride-home coordination',
      'Late-night snack board',
    ],
  },
  {
    key: 'dev_friendsgiving',
    name: 'Cozy Friendsgiving Potluck',
    type: 'holiday',
    description:
      'A flexible autumn gathering with shared dishes, dietary alternatives and room for quiet activities.',
    activities: [
      'Kitchen preparation',
      'Welcome cider',
      'Potluck dinner',
      'Gratitude circle',
      'Board game evening',
      'Leftovers brunch',
    ],
    ideas: [
      'Potluck dish signups',
      'Spiced apple cider',
      'Long-table layout',
      'Seasonal table greenery',
      'Group photo tradition',
      'Low-volume dinner music',
      'Gratitude note cards',
      'Apple crumble bake-off',
      'Quiet conversation area',
      'Autumn invitation palette',
      'Shared ride plan',
      'Reusable leftover containers',
    ],
  },
  {
    key: 'dev_winter_gathering',
    name: 'Winter Holiday Open House',
    type: 'holiday',
    description:
      'A drop-in winter celebration with warm drinks, creative activities and flexible arrival times.',
    activities: [
      'Decorating afternoon',
      'First arrivals',
      'Soup and bread supper',
      'Creative workshop',
      'Dessert swap',
      'Quiet closing hour',
    ],
    ideas: [
      'Soup tasting table',
      'Hot chocolate station',
      'Coat and boot storage',
      'Reusable paper decorations',
      'Winter portrait corner',
      'Gentle holiday music',
      'Handmade card station',
      'Cookie exchange',
      'Cozy seated games',
      'Drop-in invitation wording',
      'Snowy-weather travel backup',
      'Food donation collection',
    ],
  },
  {
    key: 'dev_team_retreat',
    name: 'Creative Team Retreat',
    type: 'custom',
    description:
      'A small team retreat with focused sessions, optional outdoor time and inclusive social activities.',
    activities: [
      'Arrival and introductions',
      'Planning workshop',
      'Shared lunch',
      'Outdoor break',
      'Creative session',
      'Closing reflections',
    ],
    ideas: [
      'Dietary-friendly lunch bowls',
      'Coffee and tea tasting',
      'Step-free meeting space',
      'Reusable workshop signage',
      'Team portrait moment',
      'Quiet focus soundtrack',
      'Brainstorm prompt cards',
      'Afternoon pastry break',
      'Optional nature walk',
      'Clear arrival information',
      'Train station carpool',
      'Take-home reflection cards',
    ],
  },
]

export const developmentBlueprintContents = scenarios.map((scenario) => {
  const children: BlueprintDraftContent['children'] = scenario.activities.map((title, index) => ({
    key: `activity_${index + 1}`,
    title,
    purpose: index === 0 ? 'planning_scouting' : 'part_of_event',
    category: 'other',
    scheduleProposal: {
      anchor: 'main_start',
      dayOffset: Math.floor(index / 3),
      localTime: ['10:00', '14:00', '18:00'][index % 3]!,
    },
  }))
  const categories = [
    'food',
    'food',
    'venue',
    'decor',
    'photography',
    'other',
    'other',
    'food',
    'other',
    'invitations',
    'other',
    'other',
  ] as const
  const content: BlueprintDraftContent = {
    name: scenario.name,
    description: scenario.description,
    experienceType: scenario.type,
    children,
    ideas: scenario.ideas.map((title, index) => ({
      key: `idea_${index + 1}`,
      title,
      category: categories[index % categories.length]!,
      notes:
        index === 0
          ? `${scenario.description} Consider guest preferences, dietary needs and accessibility before confirming this option. Keep an alternative available and use this space to refine the details together.`
          : `An optional suggestion for ${scenario.name.toLowerCase()}. Customize the details or pass on it to suit your group.`,
      target:
        index % 4 === 0
          ? { kind: 'main' }
          : { kind: 'child', key: children[index % children.length]!.key },
      configuration: { version: 1 },
    })),
    instructions: [
      {
        key: 'priorities',
        title: 'Planning priorities',
        body: scenario.description,
        audience: 'planning_only',
        target: { kind: 'main' },
      },
      ...children.map((child) => ({
        key: `guide_${child.key}`,
        title: `${child.title}: good to know`,
        body: 'Confirm the time, meeting point and accessibility details before sharing with participants. Activities are optional; keep a comfortable alternative available.',
        audience: 'event_participants' as const,
        target: { kind: 'child' as const, key: child.key },
      })),
    ],
  }
  return { catalogKey: scenario.key, content }
})

export const developmentBlueprints = developmentBlueprintContents.map(({ catalogKey, content }) => {
  const definition = draftDefinition(content, catalogKey, 1)
  return {
    ...BlueprintCatalogRevisionSchema.parse({
      catalogKey,
      revision: 1,
      definition,
      contentHash: blueprintHash(definition),
    }),
    description: content.description,
  }
})
