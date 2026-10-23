/** Input rows are authorized, bounded server-side projections. IDs are join-only. */
export type BlueprintMeasurementReadinessRankingContext = {
  mode: 'baseline_v1' | 'catalog'
  algorithmVersion: string
  configurationVersion: string
  configurationDigest: string
}

export type BlueprintMeasurementReadinessExposureRow = {
  actorId: string
  exposureId: string
  catalogKey: string
  sourceRevision: number
  sourceContentHash: string
  surface: 'browse' | 'category' | 'search'
  rank: number
  issuedAt: string
  expiresAt: string
  rankingContext: BlueprintMeasurementReadinessRankingContext | null
  actorDisposition: 'eligible' | 'self' | 'excluded' | 'deleted'
  consent: 'enabled' | 'withdrawn' | 'missing'
  exactSourceStatus: 'current' | 'withdrawn' | 'missing'
}

export type BlueprintMeasurementReadinessSignalRow = {
  signalId: string
  actorId: string
  exposureId: string
  catalogKey: string
  kind: 'impression' | 'open'
  rankEligible: boolean
  acceptedAt: string
  /** PostgreSQL bigserial transported as decimal text to preserve all digits. */
  acceptedSequence: string
  matchedImpressionId: string | null
}

export type BlueprintMeasurementReadinessServingDiagnosticRow = {
  actorId: string
  signalDate: string
  surface: 'browse' | 'category' | 'search'
  policyMode: 'baseline_v1' | 'catalog'
  algorithmVersion: string
  configurationVersion: string
  configurationDigest: string
  requestedItemAttempts: number
  eligibleItems: number
  issuedExposures: number
  reusedExposures: number
  quotaDeniedItems: number
  sourceIneligibleItems: number
  lastAcceptedAt: string
}

export type BlueprintMeasurementReadinessAcquisitionRow = {
  acquisitionId: string
  actorId: string
  exposureId: string
  sourceCatalogKey: string
  sourceRevision: number
  sourceContentHash: string
  copyContentHash: string
  copyRevisionMatchesHash: boolean
  acquiredAt: string
  expiresAt: string
}

export type BlueprintMeasurementReadinessQualifiedAdoptionRow = {
  actorId: string
  acquisitionId: string
  installationId: string
  sourceCatalogKey: string
  sourceRevision: number
  sourceContentHash: string
  installationStatus: 'completed' | 'other'
  installationMatchesAcquisition: boolean
  qualifiedAt: string
}

export type BlueprintMeasurementReadinessPriorCreditRow = {
  actorId: string
  catalogKey: string
  qualifiedAt: string
  /** Derived from exposure.issuedAt + 30 days; distinct from its token expiresAt. */
  exposureRetentionExpiresAt: string
  /** Repository verified the exact actor/source/acquisition/copy/installation chain. */
  valid: boolean
}

export type BlueprintMeasurementReadinessInput = {
  dataOrigin: 'synthetic_fixture' | 'current_retained_database'
  cohortStart: string
  cohortEnd: string
  asOf: string
  /** Captured repeatable-read snapshot time; logical expiry is checked at this instant. */
  readAt: string
  /** These denominators are unavailable; non-consenting traffic is never inferred. */
  coverage: {
    eligibleSessions: 'unknown'
    supportedClientVersions: 'unknown'
    optInDenominator: 'unknown'
  }
  /** Includes retained prior/continuation exposure rows needed for chain validation. */
  exposures: BlueprintMeasurementReadinessExposureRow[]
  signals: BlueprintMeasurementReadinessSignalRow[]
  /** Opt-in-only per-actor/day/surface/policy rows; actor IDs are join-only. */
  servingDiagnostics: BlueprintMeasurementReadinessServingDiagnosticRow[]
  acquisitions: BlueprintMeasurementReadinessAcquisitionRow[]
  qualifiedAdoptions: BlueprintMeasurementReadinessQualifiedAdoptionRow[]
  /** Retained actor/source credits tied to a pre-cohort exposure, through readAt. */
  priorCreditedActorSources: BlueprintMeasurementReadinessPriorCreditRow[]
}

export type BlueprintMeasurementReadinessBreakdownRow = {
  policyMode: 'baseline_v1' | 'catalog' | 'unknown'
  algorithmVersion: string | 'unknown'
  configurationVersion: string | 'unknown'
  configurationDigest: string | 'unknown'
  surface: 'browse' | 'category' | 'search'
  positionBand: '1-10' | '11-20' | '21+' | 'unknown'
  servedExposures: number
  creditedImpressions: number
  creditedOpens: number
  rawOpens: number
}

export type BlueprintMeasurementReadinessReport = {
  reportVersion: 'blueprint-measurement-readiness-v2'
  dataOrigin: BlueprintMeasurementReadinessInput['dataOrigin']
  window: {
    cohortStart: string
    cohortEnd: string
    asOf: string
    readAt: string
    cohortInterval: '[cohortStart, cohortEnd) by exposure issuedAt; diagnostic signalDate uses full UTC days only'
    outcomeWindow: '[exposure issuedAt, issuedAt + 7 days)'
    maturityLag: '24 hours'
    exposureRetentionBound: 'readAt must precede cohortStart + 30 days'
  }
  policyDigest: string | 'mixed' | 'unknown'
  policyDigestCounts: Array<{
    policyMode: 'baseline_v1' | 'catalog' | 'unknown'
    algorithmVersion: string | 'unknown'
    configurationVersion: string | 'unknown'
    configurationDigest: string | 'unknown'
    exposureCount: number
  }>
  readinessForRankingWeights: false
  readinessReasons: string[]
  coverage: BlueprintMeasurementReadinessInput['coverage']
  servingDiagnostics: {
    scope: 'measured_full_utc_days' | 'unavailable_partial_day'
    unit: 'page-item attempts; retries and reuse are included'
    requestedItemAttempts: number | null
    eligibleItems: number | null
    issuedExposures: number | null
    reusedExposures: number | null
    quotaDeniedItems: number | null
    sourceIneligibleItems: number | null
    contributingActorCount: number | null
    invalidRows: number
    dailySurfacePolicyRows: Array<{
      signalDate: string
      surface: 'browse' | 'category' | 'search'
      policyMode: 'baseline_v1' | 'catalog'
      algorithmVersion: string
      configurationVersion: string
      configurationDigest: string
      requestedItemAttempts: number
      eligibleItems: number
      issuedExposures: number
      reusedExposures: number
      quotaDeniedItems: number
      sourceIneligibleItems: number
    }>
  }
  counts: {
    servedExposures: number
    excludedActorExposures: number
    excludedConsentExposures: number
    creditedImpressions: number
    creditedOpens: number
    rawOpens: number
    rawFalseCreditOpens: number
    invalidOrOrphanSignals: number
    signalsOutsideExposureWindow: number
    invalidRankingContexts: number
  }
  population: {
    eligibleActorCount: number
    exposuresWithSourceRevision: number
    exposuresWithSourceHash: number
  }
  exactSourceStatusCounts: {
    current: number
    withdrawn: number
    missing: number
  }
  breakdowns: BlueprintMeasurementReadinessBreakdownRow[]
  openPairing: {
    sameExposureRawOpens: number
    matchedOpens: number
    unmatchedOpens: number
    invalidImpressionReferences: number
    crossActorExposureSourceReferences: number
    nonPriorImpressionReferences: number
    acceptedTimestampRegressions: number
    duplicateImpressionMatches: number
    duplicateSignalRows: number
    duplicateAcceptedSequenceRows: number
    orderingField: 'acceptedSequence (server acceptance order)'
    provesClientEventOrder: false
  }
  adoption: {
    cohortOpenOpportunities: number
    priorCreditedActorSourceCount: number
    invalidPriorCreditRows: number
    duplicateOpenOpportunities: number
    unmatchedOpenOpportunities: number
    acquisitionRowsForCohortSources: number
    validAcquisitionChains: number
    qualifiedAdoptionRowsForCohortSources: number
    validQualifiedAdoptionChains: number
    invalidOrOrphanChains: number
    adoptionWithinSevenDays: number
    adoptionAfterSevenDaysWithinRetention: number
    adoptionAfterRetentionWindow: number
    adoptionBeforeAcceptedOpen: number
    adoptionRevisionChangedFromFirstOpportunity: number
    outcomesFromSameExposure: number
    outcomesFromAnotherSameActorSourceExposure: number
    attributionRule: string
  }
  limitations: string[]
}
