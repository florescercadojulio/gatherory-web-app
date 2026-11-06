import {
  BlueprintCatalogDefinitionSchema,
  BlueprintCatalogRevisionSchema,
} from '@/contracts/blueprint-install.contracts'
import { blueprintHash } from '../planning/blueprint-hash'

/** Portable source shared with native Movie Night onboarding and preview. */
export const movieNightDefinitionV1 = BlueprintCatalogDefinitionSchema.parse({
  $schema: 'https://gatherory.com/schemas/experience-blueprint-v1.json',
  kind: 'experience_blueprint',
  schemaVersion: 1,
  blueprint: { id: 'movie_night', revision: 1, name: 'Movie Night' },
  experienceDefaults: { type: 'custom' },
  roles: [],
  modules: [
    {
      key: 'event_tree',
      type: 'experience_tree',
      version: 2,
      required: true,
      config: {
        mainEventType: 'custom',
        children: [
          {
            key: 'snacks_catch_up',
            title: 'Snacks & catch-up',
            purpose: 'part_of_event',
            category: 'other',
            scheduleProposal: { anchor: 'main_start', dayOffset: 0, localTime: '17:00' },
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
        categoryOrder: ['event', 'food', 'other'],
        ideas: [
          {
            key: 'watch_movie',
            title: 'Watch the movie',
            category: 'event',
            notes: 'Choose a movie together and decide when to start it.',
            target: { kind: 'main' },
            configuration: { version: 1 },
          },
          {
            key: 'popcorn_bar',
            title: 'Popcorn bar',
            category: 'food',
            notes: 'Pick popcorn toppings and other movie night snacks.',
            target: { kind: 'main' },
            configuration: { version: 1 },
          },
          {
            key: 'pizza',
            title: 'Pizza',
            category: 'food',
            target: { kind: 'main' },
            configuration: { version: 1 },
          },
          {
            key: 'blanket_corner',
            title: 'Blanket corner',
            category: 'other',
            notes: 'Make a cozy spot for settling in.',
            target: { kind: 'main' },
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
      config: { sections: [] },
    },
  ],
})

export const movieNightBlueprintV1 = BlueprintCatalogRevisionSchema.parse({
  catalogKey: 'movie_night',
  revision: 1,
  contentHash: blueprintHash(movieNightDefinitionV1),
  definition: movieNightDefinitionV1,
})
