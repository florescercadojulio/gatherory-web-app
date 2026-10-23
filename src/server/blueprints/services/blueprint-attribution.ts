/** Conservative policy for awarding private-copy acquisition credit. */
export type BlueprintAttributionCopyEvidence = {
  actorEligible: boolean
  measurementEnabled: boolean
  hasExposureReference: boolean
  usedBearerLink: boolean
  sourceListed: boolean
  sourceNotSelfAuthored: boolean
  sourceContentMatches: boolean
  exposureBoundToActorAndSource: boolean
  hasRecordedOpen: boolean
  exposureActive: boolean
}

export function canRecordBlueprintAttribution(evidence: BlueprintAttributionCopyEvidence) {
  const {
    actorEligible,
    measurementEnabled,
    hasExposureReference,
    sourceListed,
    sourceNotSelfAuthored,
    sourceContentMatches,
    exposureBoundToActorAndSource,
    hasRecordedOpen,
    exposureActive,
    usedBearerLink,
  } = evidence
  return (
    actorEligible &&
    measurementEnabled &&
    hasExposureReference &&
    !usedBearerLink &&
    sourceListed &&
    sourceNotSelfAuthored &&
    sourceContentMatches &&
    exposureBoundToActorAndSource &&
    hasRecordedOpen &&
    exposureActive
  )
}

export function isBlueprintAttributionWindowActive(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() > now.getTime()
}
