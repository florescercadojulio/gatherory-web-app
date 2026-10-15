import { blueprintStarters } from '@/server/blueprints/catalog/starters'
import { BlueprintIdeasModuleSchema } from '@/contracts/blueprint-install.contracts'
import { buildBlueprintCatalog } from '@/server/blueprints/services/blueprint-discovery'
import { suggestBlueprintSchedule } from '@/server/blueprints/planning/suggest-blueprint-schedule.server'
import {
  BLUEPRINT_SERVER_CAPABILITIES,
  expandBlueprintInstallation,
} from '@/server/blueprints/planning/plan-blueprint-installation'
import { buildBlueprintNativeProjection } from '@/server/blueprints/services/blueprint-native-projection'

/** Deterministic wire proof consumed by both Vitest and native Swift tests. */
export function buildCuratedStarterFixtures() {
  const actor = { id: 'curated-starter-host', name: 'Riley Example', email: 'riley@example.test' }
  const samples = blueprintStarters
    .filter((entry) => entry.catalogKey !== 'wedding')
    .map((entry, index) => {
      const mainEvent = {
        name: entry.definition.blueprint.name,
        startsAt: entry.catalogKey === 'birthday' ? '2027-06-15T19:00:00Z' : '2027-10-11T20:00:00Z',
        timeZone: entry.catalogKey === 'birthday' ? 'America/Detroit' : 'America/Toronto',
      }
      const schedule = suggestBlueprintSchedule(
        {
          catalogKey: entry.catalogKey,
          revision: entry.revision,
          contentHash: entry.contentHash,
          mainEvent: { startsAt: mainEvent.startsAt, timeZone: mainEvent.timeZone },
        },
        entry.definition
      )
      const ideas = BlueprintIdeasModuleSchema.parse(
        entry.definition.modules.find((module) => module.type === 'ideas')
      )
      const id = (kind: number, n: number) =>
        `${index + 1}0000000-${kind}000-4000-8000-${String(n + 1).padStart(12, '0')}`
      const input = {
        requestId: id(9, 0),
        catalogKey: entry.catalogKey,
        revision: entry.revision,
        contentHash: entry.contentHash,
        mainEvent,
        selectedChildren: schedule.suggestions.map((suggestion, i) => {
          if (!suggestion.candidates[0])
            throw new Error('Fixture requires a confirmable suggestion')
          return {
            key: suggestion.key,
            // A deliberate user edit must survive preview and native materialization.
            startsAt: Temporal.Instant.from(suggestion.candidates[0])
              .add({ minutes: i === 0 ? 30 : 0 })
              .toString(),
          }
        }),
        selectedIdeaKeys: ideas.config.ideas.map((idea) => idea.key),
        capabilities: [...BLUEPRINT_SERVER_CAPABILITIES],
      }
      const plan = expandBlueprintInstallation(input, entry)
      const manifest = {
        events: Object.fromEntries(
          [plan.main, ...plan.children].map((event, i) => [event.sourceKey, id(1, i)])
        ),
        ideas: Object.fromEntries(plan.ideas.map((idea, i) => [idea.sourceKey, id(2, i)])),
        guides: Object.fromEntries(
          plan.instructions.map((guide, i) => [guide.sourceKey, id(3, i)])
        ),
        personID: id(7, 0),
        participations: Object.fromEntries(
          [plan.main, ...plan.children].map((event, i) => [event.sourceKey, id(8, i)])
        ),
      }
      const { archive } = buildBlueprintNativeProjection({
        plan,
        manifest,
        actor,
        createdAt: new Date('2026-10-15T12:00:00Z'),
      })
      return {
        catalogKey: entry.catalogKey,
        input,
        schedule,
        preview: { plan, contentHash: entry.contentHash },
        archive,
      }
    })
  return { catalog: buildBlueprintCatalog([...blueprintStarters]), samples }
}
