import {
  BlueprintCatalogDefinitionSchema,
  BlueprintCatalogRevisionSchema,
} from '@/contracts/blueprint-install.contracts'
import { blueprintHash } from '../planning/blueprint-hash'

const definition = BlueprintCatalogDefinitionSchema.parse({
  $schema: 'https://gatherory.com/schemas/experience-blueprint-v1.json',
  kind: 'experience_blueprint',
  schemaVersion: 1,
  blueprint: { id: 'birthday', revision: 1, name: 'Birthday Party' },
  experienceDefaults: { type: 'birthday' },
  roles: [],
  modules: [
    {
      key: 'event_tree',
      type: 'experience_tree',
      version: 2,
      required: true,
      config: {
        mainEventType: 'birthday',
        children: [
          {
            key: 'gathering_setup',
            title: 'Gathering setup',
            purpose: 'planning_scouting',
            category: 'other',
            scheduleProposal: { anchor: 'main_start', dayOffset: 0, localTime: '10:00' },
          },
          {
            key: 'birthday_gathering',
            title: 'Games and activities',
            purpose: 'part_of_event',
            category: 'other',
            scheduleProposal: { anchor: 'main_start', dayOffset: 0, localTime: '14:00' },
          },
          {
            key: 'shared_food',
            title: 'Cake and treats',
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
        categoryOrder: ['event', 'food', 'invitations', 'decor', 'other'],
        ideas: [
          {
            key: 'gathering_plans',
            title: 'Gathering plans',
            category: 'event',
            notes: 'Collect ideas for the kind of birthday gathering that feels right.',
            target: { kind: 'main' },
            configuration: { version: 1 },
          },
          {
            key: 'food_and_drinks',
            title: 'Food and drinks',
            category: 'food',
            notes: 'Explore options that work for guests’ preferences and dietary needs.',
            target: { kind: 'main' },
            configuration: { version: 1 },
          },
          {
            key: 'invitations',
            title: 'Invitations',
            category: 'invitations',
            notes: 'Gather invitation ideas and add timing or location details once confirmed.',
            target: { kind: 'main' },
            configuration: { version: 1 },
          },
          {
            key: 'decor_and_setup',
            title: 'Decor and setup',
            category: 'decor',
            notes: 'Collect optional decor and setup ideas that suit the gathering.',
            target: { kind: 'child', key: 'gathering_setup' },
            configuration: { version: 1 },
          },
          {
            key: 'activities',
            title: 'Activities',
            category: 'other',
            notes: 'Share activity ideas for different ages, interests, and ways to take part.',
            target: { kind: 'child', key: 'birthday_gathering' },
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
            body: 'Collect ideas and decide together which details matter for this gathering. Keep options open until plans are confirmed.',
            audience: 'planning_only',
            target: { kind: 'main' },
          },
          {
            key: 'gathering_details',
            title: 'Activity details',
            body: 'Add confirmed timing, arrival, and accessibility information here when it is ready to share with participants.',
            audience: 'event_participants',
            target: { kind: 'child', key: 'birthday_gathering' },
          },
        ],
      },
    },
  ],
})

/** Immutable catalog row shape; contentHash is over the typed envelope document. */
export const birthdayBlueprintV1 = BlueprintCatalogRevisionSchema.parse({
  catalogKey: 'birthday',
  revision: 1,
  contentHash: blueprintHash(definition),
  definition,
})
