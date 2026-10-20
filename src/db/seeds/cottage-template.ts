import {
  type BlueprintDraftContent,
  draftDefinition,
} from '@/contracts/blueprint-authoring.contracts'
import { BlueprintCatalogDefinitionSchema } from '@/contracts/blueprint-install.contracts'

/** Content fixture for private cottage authoring and independent-copy testing. */
export const cottageDraftContent: BlueprintDraftContent = {
  todos: [],
  name: 'Family Cottage Stay',
  description:
    'A flexible plan for coordinating a family stay, shared activities, and useful guest guidance.',
  experienceType: 'custom',
  children: [
    {
      key: 'arrival',
      title: 'Arrival and settling in',
      purpose: 'part_of_event',
      category: 'other',
      scheduleProposal: {
        anchor: 'main_start',
        dayOffset: 0,
        localTime: '16:00',
      },
    },
    {
      key: 'shared_day',
      title: 'Shared cottage day',
      purpose: 'part_of_event',
      category: 'other',
      scheduleProposal: {
        anchor: 'main_start',
        dayOffset: 1,
        localTime: '10:00',
      },
    },
    {
      key: 'departure',
      title: 'Departure',
      purpose: 'part_of_event',
      category: 'other',
      scheduleProposal: {
        anchor: 'main_start',
        dayOffset: 3,
        localTime: '10:00',
      },
    },
  ],
  ideas: [
    {
      key: 'meals',
      title: 'Meals and groceries',
      category: 'food',
      notes: 'Collect meal ideas, grocery plans, and dietary considerations.',
      target: { kind: 'main' },
      configuration: { version: 1 },
    },
    {
      key: 'local_outings',
      title: 'Local outings',
      category: 'venue',
      notes: 'Save places and activities the group may want to visit.',
      target: { kind: 'child', key: 'shared_day' },
      configuration: { version: 1 },
    },
    {
      key: 'shared_activities',
      title: 'Things to do together',
      category: 'other',
      notes: 'Gather low-key activities that work for the people staying together.',
      target: { kind: 'main' },
      configuration: { version: 1 },
    },
    {
      key: 'useful_links',
      title: 'Useful links',
      category: 'link',
      notes: 'Keep useful local and travel links with the stay plan.',
      target: { kind: 'main' },
      configuration: { version: 1 },
    },
  ],
  instructions: [
    {
      key: 'host_planning_notes',
      title: 'Host planning notes',
      body: 'Add confirmed arrangements for the stay and keep undecided planning details here until they are ready to share.',
      audience: 'planning_only',
      target: { kind: 'main' },
    },
    {
      key: 'arrival_guide',
      title: 'Arrival guide',
      body: 'Share confirmed arrival timing, directions, and the agreed way to access the cottage with the people staying here.',
      audience: 'event_participants',
      target: { kind: 'child', key: 'arrival' },
    },
    {
      key: 'shared_day_guide',
      title: 'Shared day details',
      body: 'Add the confirmed plan for the day and any details participants need to take part comfortably.',
      audience: 'event_participants',
      target: { kind: 'child', key: 'shared_day' },
    },
    {
      key: 'departure_guide',
      title: 'Departure information',
      body: 'Share confirmed departure timing and any agreed handoff details with the people staying here.',
      audience: 'event_participants',
      target: { kind: 'child', key: 'departure' },
    },
  ],
}

export const cottageBlueprintDefinition = BlueprintCatalogDefinitionSchema.parse(
  draftDefinition(cottageDraftContent, 'cottage', 1)
)
