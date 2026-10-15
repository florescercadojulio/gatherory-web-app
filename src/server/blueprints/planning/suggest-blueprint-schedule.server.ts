import '@tanstack/react-start/server-only'

import {
  BlueprintCatalogDefinitionSchema,
  BlueprintExperienceTreeModuleSchema,
  type BlueprintCatalogDefinition,
} from '@/contracts/blueprint-install.contracts'
import {
  BlueprintScheduleInputSchema,
  BlueprintScheduleResponseSchema,
  type BlueprintScheduleInput,
  type BlueprintScheduleResponse,
  type BlueprintScheduleSuggestion,
} from '@/contracts/blueprint-schedule.contracts'
import { assertConfirmedSchedule } from './confirmed-schedule.server'

/**
 * Proposes child event start times without persisting, approving, or choosing
 * between repeated local times. Catalog pin verification belongs to the caller.
 */
export function suggestBlueprintSchedule(
  inputValue: BlueprintScheduleInput,
  definitionValue: BlueprintCatalogDefinition
): BlueprintScheduleResponse {
  const input = BlueprintScheduleInputSchema.parse(inputValue)
  const definition = BlueprintCatalogDefinitionSchema.parse(definitionValue)

  try {
    assertConfirmedSchedule(input.mainEvent.startsAt, input.mainEvent.timeZone)
  } catch (cause) {
    throw new Error(
      `The confirmed main event start is invalid for time zone ${input.mainEvent.timeZone}: ${errorMessage(cause)}`,
      { cause }
    )
  }

  const treeModule = definition.modules.find(
    (module) => module.type === 'experience_tree' && module.version === 2
  )
  const treeResult = treeModule ? BlueprintExperienceTreeModuleSchema.safeParse(treeModule) : null
  const children = treeResult?.success ? treeResult.data.config.children : []
  const anchorDate = Temporal.Instant.from(input.mainEvent.startsAt)
    .toZonedDateTimeISO(input.mainEvent.timeZone)
    .toPlainDate()

  const suggestions = children.map((child): BlueprintScheduleSuggestion => {
    const proposal = child.scheduleProposal
    if (!proposal) {
      return { key: child.key, status: 'manual', localDateTime: null, candidates: [] }
    }

    let localDateTime: Temporal.PlainDateTime
    try {
      const localDate = anchorDate.add({ days: proposal.dayOffset }, { overflow: 'reject' })
      if (localDate.year < 0 || localDate.year > 9_999) {
        throw new RangeError(
          'The resulting calendar date is outside the supported four-digit year range.'
        )
      }
      localDateTime = Temporal.PlainDateTime.from(
        `${localDate.toString()}T${proposal.localTime}:00`,
        { overflow: 'reject' }
      )
    } catch (cause) {
      throw new RangeError(
        `Cannot calculate the proposed local date and time for child ${child.key} (${proposal.dayOffset} calendar days from the main event): ${errorMessage(cause)}`,
        { cause }
      )
    }

    const earlier = localDateTime.toZonedDateTime(input.mainEvent.timeZone, {
      disambiguation: 'earlier',
    })
    const later = localDateTime.toZonedDateTime(input.mainEvent.timeZone, {
      disambiguation: 'later',
    })
    const earlierMatches = earlier.toPlainDateTime().equals(localDateTime)
    const laterMatches = later.toPlainDateTime().equals(localDateTime)
    const wireLocalDateTime = localDateTime.toString({ smallestUnit: 'second' })

    if (!earlierMatches && !laterMatches) {
      return {
        key: child.key,
        status: 'nonexistent',
        localDateTime: wireLocalDateTime,
        candidates: [],
      }
    }

    const earlierInstant = earlier.toInstant()
    const laterInstant = later.toInstant()
    if (
      earlierMatches &&
      laterMatches &&
      Temporal.Instant.compare(earlierInstant, laterInstant) !== 0
    ) {
      return {
        key: child.key,
        status: 'ambiguous',
        localDateTime: wireLocalDateTime,
        candidates: [
          earlierInstant.toString({ smallestUnit: 'second' }),
          laterInstant.toString({ smallestUnit: 'second' }),
        ],
      }
    }

    const instant = earlierMatches ? earlierInstant : laterInstant
    return {
      key: child.key,
      status: 'suggested',
      localDateTime: wireLocalDateTime,
      candidates: [instant.toString({ smallestUnit: 'second' })],
    }
  })

  return BlueprintScheduleResponseSchema.parse({
    catalogKey: input.catalogKey,
    revision: input.revision,
    contentHash: input.contentHash,
    mainEvent: input.mainEvent,
    suggestions,
  })
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
