import { describe, expect, it } from 'vitest'
import {
  canRecordBlueprintAttribution,
  isBlueprintAttributionWindowActive,
  type BlueprintAttributionCopyEvidence,
} from '@/server/blueprints/services/blueprint-attribution'

const eligibleEvidence: BlueprintAttributionCopyEvidence = {
  actorEligible: true,
  measurementEnabled: true,
  hasExposureReference: true,
  usedBearerLink: false,
  sourceListed: true,
  sourceNotSelfAuthored: true,
  sourceContentMatches: true,
  exposureBoundToActorAndSource: true,
  hasRecordedOpen: true,
  exposureActive: true,
}

describe('verified Blueprint attribution', () => {
  it('accepts only a live opened exposure for an eligible, unedited public copy', () => {
    expect(canRecordBlueprintAttribution(eligibleEvidence)).toBe(true)
    for (const failedCheck of [
      'actorEligible',
      'measurementEnabled',
      'hasExposureReference',
      'sourceListed',
      'sourceNotSelfAuthored',
      'sourceContentMatches',
      'exposureBoundToActorAndSource',
      'hasRecordedOpen',
      'exposureActive',
    ] as const) {
      expect(canRecordBlueprintAttribution({ ...eligibleEvidence, [failedCheck]: false })).toBe(
        false
      )
    }
    expect(canRecordBlueprintAttribution({ ...eligibleEvidence, usedBearerLink: true })).toBe(false)
  })

  it('expires the private acquisition exactly at its 30-day deadline', () => {
    const deadline = new Date('2026-11-21T12:00:00.000Z')
    expect(isBlueprintAttributionWindowActive(deadline, new Date('2026-11-21T11:59:59.999Z'))).toBe(
      true
    )
    expect(isBlueprintAttributionWindowActive(deadline, deadline)).toBe(false)
  })
})
