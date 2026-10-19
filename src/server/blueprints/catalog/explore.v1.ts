import {
  BlueprintDraftContentSchema,
  draftDefinition,
} from '@/contracts/blueprint-authoring.contracts'
import { BlueprintCatalogRevisionSchema } from '@/contracts/blueprint-install.contracts'
import { blueprintHash } from '../planning/blueprint-hash'
import { exploreCollections } from './explore-collections'

/** Immutable v1 install documents; discovery metadata can evolve independently. */
export const exploreBlueprintStarters = exploreCollections.map((collection) => {
  const children = collection.activities.map(([title, dayOffset, localTime], index) => ({
    key: `activity_${index + 1}`,
    title,
    purpose: 'part_of_event' as const,
    category: 'other' as const,
    scheduleProposal: { anchor: 'main_start' as const, dayOffset, localTime },
  }))
  const content = BlueprintDraftContentSchema.parse({
    name: collection.name,
    description: collection.discovery.summary,
    experienceType: 'custom',
    children,
    ideas: collection.ideas.map(([title, category, notes, activity], index) => ({
      key: `idea_${index + 1}`,
      title,
      category,
      notes,
      target:
        activity === null ? { kind: 'main' } : { kind: 'child', key: children[activity]!.key },
      configuration: { version: 1 },
    })),
    instructions: [
      {
        key: 'priorities',
        title: 'Planning priorities',
        body: collection.discovery.summary,
        audience: 'planning_only',
        target: { kind: 'main' },
      },
      ...collection.activities.map(([, , , body], index) => ({
        key: `guidance_${index + 1}`,
        title: children[index]!.title,
        body,
        audience: 'event_participants',
        target: { kind: 'child', key: children[index]!.key },
      })),
    ],
  })
  const definition = draftDefinition(content, collection.key, 1)
  return BlueprintCatalogRevisionSchema.parse({
    catalogKey: collection.key,
    revision: 1,
    contentHash: blueprintHash(definition),
    definition,
  })
})
