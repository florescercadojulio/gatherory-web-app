import {
  BlueprintCatalogDefinitionSchema,
  BlueprintCatalogRevisionSchema,
} from '@/contracts/blueprint-install.contracts'
import { blueprintHash } from '../planning/blueprint-hash'

const definition = BlueprintCatalogDefinitionSchema.parse({
  $schema: 'https://gatherory.com/schemas/experience-blueprint-v1.json',
  kind: 'experience_blueprint',
  schemaVersion: 1,
  blueprint: { id: 'thanksgiving', revision: 1, name: 'Thanksgiving' },
  experienceDefaults: { type: 'holiday' },
  roles: [],
  modules: [
    {
      key: 'event_tree',
      type: 'experience_tree',
      version: 2,
      required: true,
      config: {
        mainEventType: 'holiday',
        children: [
          {
            key: 'gathering_preparation',
            title: 'Gathering preparation',
            purpose: 'planning_scouting',
            category: 'other',
            scheduleProposal: { anchor: 'main_start', dayOffset: -1, localTime: '16:00' },
          },
          {
            key: 'thanksgiving_gathering',
            title: 'Time together',
            purpose: 'part_of_event',
            category: 'other',
            scheduleProposal: { anchor: 'main_start', dayOffset: 0, localTime: '13:00' },
          },
          {
            key: 'shared_meal',
            title: 'Shared meal',
            purpose: 'part_of_event',
            category: 'other',
            scheduleProposal: { anchor: 'main_start', dayOffset: 0, localTime: '16:00' },
          },
        ],
      },
    },
    {
      key: 'starter_ideas',
      type: 'ideas',
      version: 2,
      required: true,
      config: {
        categoryOrder: ['event', 'food', 'invitations', 'other', 'decor'],
        ideas: [
          {
            key: 'gathering_plans',
            title: 'Gathering plans',
            category: 'event',
            notes: 'Collect ideas for how you would like to spend time together.',
            target: { kind: 'main' },
            configuration: { version: 1 },
          },
          {
            key: 'food_and_drinks',
            title: 'Food and drinks',
            category: 'food',
            notes: 'Explore dishes and drinks while accounting for preferences and dietary needs.',
            target: { kind: 'main' },
            configuration: { version: 1 },
          },
          {
            key: 'invitations',
            title: 'Invitations',
            category: 'invitations',
            notes:
              'Gather invitation ideas and share timing or location after those details are confirmed.',
            target: { kind: 'main' },
            configuration: { version: 1 },
          },
          {
            key: 'shared_activities',
            title: 'Activities',
            category: 'other',
            notes: 'Collect optional ways to spend time together across ages and interests.',
            target: { kind: 'child', key: 'thanksgiving_gathering' },
            configuration: { version: 1 },
          },
          {
            key: 'table_and_space',
            title: 'Table and shared space',
            category: 'decor',
            notes: 'Save optional ideas for making the shared space comfortable and welcoming.',
            target: { kind: 'child', key: 'shared_meal' },
            configuration: { version: 1 },
          },
        ],
      },
    },
    {
      key: 'guest_guidance',
      type: 'instructions',
      version: 1,
      required: true,
      config: {
        sections: [
          {
            key: 'planning_priorities',
            title: 'Planning priorities',
            body: 'Choose the date that works for your group; this template does not assume a national holiday date. Collect menu ideas, dietary needs, and possible contributions without assigning anyone a task until they agree.',
            audience: 'planning_only',
            target: { kind: 'main' },
          },
          {
            key: 'gathering_details',
            title: 'Gathering details',
            body: 'Share confirmed timing, arrival, and accessibility information here when it is ready for participants.',
            audience: 'event_participants',
            target: { kind: 'child', key: 'thanksgiving_gathering' },
          },
        ],
      },
    },
  ],
})

/** Immutable catalog row shape; contentHash is over the typed envelope document. */
export const thanksgivingBlueprintV1 = BlueprintCatalogRevisionSchema.parse({
  catalogKey: 'thanksgiving',
  revision: 1,
  contentHash: blueprintHash(definition),
  definition,
})
