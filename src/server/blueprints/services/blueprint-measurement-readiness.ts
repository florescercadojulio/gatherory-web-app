import { ConfirmedInstantSchema } from '@/contracts/date-time.contracts'
import type {
  BlueprintMeasurementReadinessBreakdownRow,
  BlueprintMeasurementReadinessInput,
  BlueprintMeasurementReadinessReport,
} from '../contracts/blueprint-measurement-readiness.contracts'

const DAY_MS = 24 * 60 * 60 * 1000
const OUTCOME_WINDOW_DAYS = 7
const MATURITY_LAG_HOURS = 24
const EXPOSURE_RETENTION_DAYS = 30
const SAFE_VERSION = /^[A-Za-z0-9._-]{1,80}$/
const SHA256 = /^[a-f0-9]{64}$/

export type BlueprintMeasurementReadinessWindow = Pick<
  BlueprintMeasurementReadinessInput,
  'cohortStart' | 'cohortEnd' | 'asOf' | 'readAt'
>

export class BlueprintMeasurementReadinessWindowError extends Error {
  constructor(
    readonly code: 'INVALID_WINDOW' | 'COHORT_TOO_IMMATURE' | 'COHORT_TOO_OLD',
    message: string
  ) {
    super(message)
    this.name = 'BlueprintMeasurementReadinessWindowError'
  }
}

function parseIso(value: string, label: string): number {
  if (!ConfirmedInstantSchema.safeParse(value).success) {
    throw new BlueprintMeasurementReadinessWindowError(
      'INVALID_WINDOW',
      `${label} must be an ISO-8601 datetime with an explicit timezone`
    )
  }
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) {
    throw new BlueprintMeasurementReadinessWindowError(
      'INVALID_WINDOW',
      `${label} is not a valid datetime`
    )
  }
  return parsed
}

export function validateBlueprintMeasurementReadinessWindow(
  window: BlueprintMeasurementReadinessWindow
) {
  const startMs = parseIso(window.cohortStart, 'cohortStart')
  const endMs = parseIso(window.cohortEnd, 'cohortEnd')
  const asOfMs = parseIso(window.asOf, 'asOf')
  const readAtMs = parseIso(window.readAt, 'readAt')
  if (startMs >= endMs || endMs > asOfMs || asOfMs > readAtMs) {
    throw new BlueprintMeasurementReadinessWindowError(
      'INVALID_WINDOW',
      'The cohort must be a non-empty interval; event cutoff asOf must not exceed readAt'
    )
  }
  const requiredMaturity =
    endMs + OUTCOME_WINDOW_DAYS * DAY_MS + MATURITY_LAG_HOURS * 60 * 60 * 1000
  if (asOfMs < requiredMaturity) {
    throw new BlueprintMeasurementReadinessWindowError(
      'COHORT_TOO_IMMATURE',
      'The full seven-day outcome window and 24-hour lag have not elapsed'
    )
  }
  if (readAtMs >= startMs + EXPOSURE_RETENTION_DAYS * DAY_MS) {
    throw new BlueprintMeasurementReadinessWindowError(
      'COHORT_TOO_OLD',
      'The earliest possible cohort exposure has reached the 30-day retention boundary'
    )
  }
  return { startMs, endMs, asOfMs, readAtMs }
}

function rowDate(value: string, label: string, asOfMs: number): number {
  const parsed = parseIso(value, label)
  if (parsed > asOfMs) {
    throw new BlueprintMeasurementReadinessWindowError(
      'INVALID_WINDOW',
      `${label} is later than asOf`
    )
  }
  return parsed
}

function actorSourceKey(actorId: string, catalogKey: string): string {
  return `${actorId}\u0000${catalogKey}`
}

function exposureIsEligible(
  exposure: BlueprintMeasurementReadinessInput['exposures'][number]
): boolean {
  return exposure.actorDisposition === 'eligible' && exposure.consent === 'enabled'
}

function positionBand(rank: number): BlueprintMeasurementReadinessBreakdownRow['positionBand'] {
  if (!Number.isInteger(rank) || rank < 1) return 'unknown'
  if (rank <= 10) return '1-10'
  if (rank <= 20) return '11-20'
  return '21+'
}

type NormalizedPolicy = {
  policyMode: BlueprintMeasurementReadinessBreakdownRow['policyMode']
  algorithmVersion: string | 'unknown'
  configurationVersion: string | 'unknown'
  configurationDigest: string | 'unknown'
  valid: boolean
}

function normalizePolicy(
  context: BlueprintMeasurementReadinessInput['exposures'][number]['rankingContext'],
  options: { allowUnknownDigest?: boolean } = {}
): NormalizedPolicy {
  if (!context) {
    return {
      policyMode: 'unknown',
      algorithmVersion: 'unknown',
      configurationVersion: 'unknown',
      configurationDigest: 'unknown',
      valid: false,
    }
  }
  const validMode = context.mode === 'baseline_v1' || context.mode === 'catalog'
  const safeAlgorithm =
    typeof context.algorithmVersion === 'string' && SAFE_VERSION.test(context.algorithmVersion)
  const safeConfiguration =
    typeof context.configurationVersion === 'string' &&
    SAFE_VERSION.test(context.configurationVersion)
  const safeDigest =
    typeof context.configurationDigest === 'string' &&
    (SHA256.test(context.configurationDigest) ||
      (options.allowUnknownDigest === true && context.configurationDigest === 'unknown'))
  return {
    policyMode: validMode ? context.mode : 'unknown',
    algorithmVersion: safeAlgorithm ? context.algorithmVersion : 'unknown',
    configurationVersion: safeConfiguration ? context.configurationVersion : 'unknown',
    configurationDigest: safeDigest ? context.configurationDigest : 'unknown',
    valid: validMode && safeAlgorithm && safeConfiguration && safeDigest,
  }
}

function breakdownKey(row: BlueprintMeasurementReadinessBreakdownRow): string {
  return [
    row.policyMode,
    row.algorithmVersion,
    row.configurationVersion,
    row.configurationDigest,
    row.surface,
    row.positionBand,
  ].join('\u0000')
}

function outputPolicyDigest(
  rows: BlueprintMeasurementReadinessBreakdownRow[]
): BlueprintMeasurementReadinessReport['policyDigest'] {
  const digests = new Set(
    rows
      .map(({ configurationDigest }) => configurationDigest)
      .filter((digest) => digest !== 'unknown')
  )
  if (digests.size === 0) return 'unknown'
  const hasUnknown = rows.some(({ configurationDigest }) => configurationDigest === 'unknown')
  return digests.size === 1 && !hasUnknown ? [...digests][0]! : 'mixed'
}

/**
 * Build an aggregate-only readiness report from authorized, bounded row projections.
 * IDs are used only for joins and are never copied into the report.
 */
export function buildBlueprintMeasurementReadinessReport(
  input: BlueprintMeasurementReadinessInput
): BlueprintMeasurementReadinessReport {
  const { startMs, endMs, asOfMs, readAtMs } = validateBlueprintMeasurementReadinessWindow(input)
  const checkCoverage = input.coverage
  if (
    input.dataOrigin !== 'synthetic_fixture' &&
    input.dataOrigin !== 'current_retained_database'
  ) {
    throw new Error('Unsupported measurement report data origin')
  }
  if (
    checkCoverage.eligibleSessions !== 'unknown' ||
    checkCoverage.supportedClientVersions !== 'unknown' ||
    checkCoverage.optInDenominator !== 'unknown'
  ) {
    throw new Error(
      'Unsupported measurement coverage values; unavailable denominators must remain unknown'
    )
  }

  const servingRowsByKey = new Map<
    string,
    {
      signalDate: string
      surface: BlueprintMeasurementReadinessInput['servingDiagnostics'][number]['surface']
      policy: NormalizedPolicy
      requestedItemAttempts: number
      eligibleItems: number
      issuedExposures: number
      reusedExposures: number
      quotaDeniedItems: number
      sourceIneligibleItems: number
      actorIds: Set<string>
    }
  >()
  const servingRowKeys = new Set<string>()
  const servingActorIds = new Set<string>()
  const dailyServingDiagnosticsAvailable =
    startMs % DAY_MS === 0 && endMs % DAY_MS === 0 && endMs <= asOfMs
  let invalidServingDiagnosticRows = 0
  const servingTotals = {
    requestedItemAttempts: 0,
    eligibleItems: 0,
    issuedExposures: 0,
    reusedExposures: 0,
    quotaDeniedItems: 0,
    sourceIneligibleItems: 0,
  }
  for (const row of input.servingDiagnostics) {
    if (!dailyServingDiagnosticsAvailable) break
    const date = /^\d{4}-\d{2}-\d{2}$/.test(row.signalDate) ? row.signalDate : null
    const dayStart = date ? Date.parse(`${date}T00:00:00.000Z`) : Number.NaN
    const dayEnd = dayStart + DAY_MS
    const inScope = Number.isFinite(dayStart) && dayStart >= startMs && dayStart < endMs
    if (!inScope) continue
    let lastAcceptedAt: number
    try {
      lastAcceptedAt = rowDate(row.lastAcceptedAt, 'servingDiagnostic.lastAcceptedAt', asOfMs)
    } catch {
      invalidServingDiagnosticRows++
      continue
    }
    const policy = normalizePolicy(
      {
        mode: row.policyMode,
        algorithmVersion: row.algorithmVersion,
        configurationVersion: row.configurationVersion,
        configurationDigest: row.configurationDigest,
      },
      { allowUnknownDigest: true }
    )
    const counters = [
      row.requestedItemAttempts,
      row.eligibleItems,
      row.issuedExposures,
      row.reusedExposures,
      row.quotaDeniedItems,
      row.sourceIneligibleItems,
    ]
    if (row.surface !== 'browse' && row.surface !== 'category' && row.surface !== 'search') {
      invalidServingDiagnosticRows++
      continue
    }
    if (
      !policy.valid ||
      !Number.isFinite(dayStart) ||
      new Date(dayStart).toISOString().slice(0, 10) !== date ||
      lastAcceptedAt < dayStart ||
      lastAcceptedAt >= dayEnd ||
      lastAcceptedAt + EXPOSURE_RETENTION_DAYS * DAY_MS <= readAtMs ||
      counters.some((counter) => !Number.isSafeInteger(counter) || counter < 0) ||
      row.requestedItemAttempts !== row.eligibleItems + row.sourceIneligibleItems ||
      row.eligibleItems !== row.issuedExposures + row.reusedExposures + row.quotaDeniedItems
    ) {
      invalidServingDiagnosticRows++
      continue
    }
    const key = [
      row.actorId,
      row.signalDate,
      row.surface,
      policy.policyMode,
      policy.algorithmVersion,
      policy.configurationVersion,
      policy.configurationDigest,
    ].join('\u0000')
    if (servingRowKeys.has(key)) {
      invalidServingDiagnosticRows++
      continue
    }
    servingRowKeys.add(key)
    const groupKey = [
      row.signalDate,
      row.surface,
      policy.policyMode,
      policy.algorithmVersion,
      policy.configurationVersion,
      policy.configurationDigest,
    ].join('\u0000')
    const aggregate = servingRowsByKey.get(groupKey) ?? {
      signalDate: row.signalDate,
      surface: row.surface,
      policy,
      requestedItemAttempts: 0,
      eligibleItems: 0,
      issuedExposures: 0,
      reusedExposures: 0,
      quotaDeniedItems: 0,
      sourceIneligibleItems: 0,
      actorIds: new Set<string>(),
    }
    const aggregateCounters = [
      aggregate.requestedItemAttempts + row.requestedItemAttempts,
      aggregate.eligibleItems + row.eligibleItems,
      aggregate.issuedExposures + row.issuedExposures,
      aggregate.reusedExposures + row.reusedExposures,
      aggregate.quotaDeniedItems + row.quotaDeniedItems,
      aggregate.sourceIneligibleItems + row.sourceIneligibleItems,
      servingTotals.requestedItemAttempts + row.requestedItemAttempts,
      servingTotals.eligibleItems + row.eligibleItems,
      servingTotals.issuedExposures + row.issuedExposures,
      servingTotals.reusedExposures + row.reusedExposures,
      servingTotals.quotaDeniedItems + row.quotaDeniedItems,
      servingTotals.sourceIneligibleItems + row.sourceIneligibleItems,
    ]
    if (aggregateCounters.some((counter) => !Number.isSafeInteger(counter))) {
      invalidServingDiagnosticRows++
      continue
    }
    aggregate.requestedItemAttempts += row.requestedItemAttempts
    aggregate.eligibleItems += row.eligibleItems
    aggregate.issuedExposures += row.issuedExposures
    aggregate.reusedExposures += row.reusedExposures
    aggregate.quotaDeniedItems += row.quotaDeniedItems
    aggregate.sourceIneligibleItems += row.sourceIneligibleItems
    aggregate.actorIds.add(row.actorId)
    servingActorIds.add(row.actorId)
    servingRowsByKey.set(groupKey, aggregate)
    servingTotals.requestedItemAttempts += row.requestedItemAttempts
    servingTotals.eligibleItems += row.eligibleItems
    servingTotals.issuedExposures += row.issuedExposures
    servingTotals.reusedExposures += row.reusedExposures
    servingTotals.quotaDeniedItems += row.quotaDeniedItems
    servingTotals.sourceIneligibleItems += row.sourceIneligibleItems
  }
  const servingDiagnosticBreakdowns = [...servingRowsByKey.values()]
    .map((row) => ({
      signalDate: row.signalDate,
      surface: row.surface,
      policyMode: row.policy.policyMode as 'baseline_v1' | 'catalog',
      algorithmVersion: row.policy.algorithmVersion,
      configurationVersion: row.policy.configurationVersion,
      configurationDigest: row.policy.configurationDigest,
      requestedItemAttempts: row.requestedItemAttempts,
      eligibleItems: row.eligibleItems,
      issuedExposures: row.issuedExposures,
      reusedExposures: row.reusedExposures,
      quotaDeniedItems: row.quotaDeniedItems,
      sourceIneligibleItems: row.sourceIneligibleItems,
    }))
    .sort((left, right) =>
      [
        left.signalDate,
        left.surface,
        left.policyMode,
        left.algorithmVersion,
        left.configurationVersion,
        left.configurationDigest,
      ].join('\u0000') <
      [
        right.signalDate,
        right.surface,
        right.policyMode,
        right.algorithmVersion,
        right.configurationVersion,
        right.configurationDigest,
      ].join('\u0000')
        ? -1
        : 1
    )

  const exposureById = new Map<string, (typeof input.exposures)[number]>()
  const issuedAtById = new Map<string, number>()
  const expiresAtById = new Map<string, number>()
  for (const exposure of input.exposures) {
    const issuedAt = rowDate(exposure.issuedAt, 'exposure.issuedAt', asOfMs)
    const expiresAt = parseIso(exposure.expiresAt, 'exposure.expiresAt')
    if (expiresAt <= issuedAt || exposure.rank < 1 || !Number.isInteger(exposure.rank))
      throw new Error('Exposure rows must have a positive rank and expiry after issue time')
    if (exposureById.has(exposure.exposureId))
      throw new Error('Exposure IDs in the bounded input must be unique')
    exposureById.set(exposure.exposureId, exposure)
    issuedAtById.set(exposure.exposureId, issuedAt)
    expiresAtById.set(exposure.exposureId, expiresAt)
  }

  const cohortExposureRows = input.exposures.filter((exposure) => {
    const issuedAt = issuedAtById.get(exposure.exposureId)!
    return (
      issuedAt >= startMs &&
      issuedAt < endMs &&
      issuedAt + EXPOSURE_RETENTION_DAYS * DAY_MS > readAtMs
    )
  })
  const excludedActorExposures = cohortExposureRows.filter(
    (exposure) => exposure.actorDisposition !== 'eligible'
  ).length
  const excludedConsentExposures = cohortExposureRows.filter(
    (exposure) => exposure.actorDisposition === 'eligible' && exposure.consent !== 'enabled'
  ).length
  const cohortExposures = cohortExposureRows.filter(exposureIsEligible)
  const cohortExposureById = new Map(cohortExposures.map((row) => [row.exposureId, row]))
  const eligibleExposureIds = new Set(
    input.exposures
      .filter(
        (exposure) =>
          exposureIsEligible(exposure) &&
          issuedAtById.get(exposure.exposureId)! + EXPOSURE_RETENTION_DAYS * DAY_MS > readAtMs
      )
      .map(({ exposureId }) => exposureId)
  )

  const candidates: Array<{
    signal: (typeof input.signals)[number]
    sequence: bigint
  }> = []
  let invalidOrOrphanSignals = 0
  let signalsOutsideExposureWindow = 0
  let duplicateSignalRows = 0
  let duplicateAcceptedSequenceRows = 0
  for (const signal of input.signals) {
    const exposure = exposureById.get(signal.exposureId)
    if (
      !exposure ||
      !eligibleExposureIds.has(signal.exposureId) ||
      exposure.actorId !== signal.actorId ||
      exposure.catalogKey !== signal.catalogKey
    ) {
      invalidOrOrphanSignals++
      continue
    }
    const acceptedAt = rowDate(signal.acceptedAt, 'signal.acceptedAt', asOfMs)
    const issuedAt = issuedAtById.get(signal.exposureId)!
    const expiresAt = expiresAtById.get(signal.exposureId)!
    if (acceptedAt < issuedAt || acceptedAt >= expiresAt) {
      signalsOutsideExposureWindow++
      continue
    }
    if (!/^[1-9]\d*$/.test(signal.acceptedSequence)) {
      invalidOrOrphanSignals++
      continue
    }
    candidates.push({ signal, sequence: BigInt(signal.acceptedSequence) })
  }

  const idsBySignalId = new Map<string, number>()
  const idsBySequence = new Map<string, number>()
  const idsByActorExposureKind = new Map<string, number>()
  for (const { signal, sequence } of candidates) {
    idsBySignalId.set(signal.signalId, (idsBySignalId.get(signal.signalId) ?? 0) + 1)
    const sequenceKey = sequence.toString()
    idsBySequence.set(sequenceKey, (idsBySequence.get(sequenceKey) ?? 0) + 1)
    const eventKey = `${signal.actorId}\u0000${signal.exposureId}\u0000${signal.kind}`
    idsByActorExposureKind.set(eventKey, (idsByActorExposureKind.get(eventKey) ?? 0) + 1)
  }
  const validSignals: typeof input.signals = []
  const sequenceBySignalId = new Map<string, bigint>()
  for (const { signal, sequence } of candidates) {
    const eventKey = `${signal.actorId}\u0000${signal.exposureId}\u0000${signal.kind}`
    const duplicateId = (idsBySignalId.get(signal.signalId) ?? 0) > 1
    const duplicateSequence = (idsBySequence.get(sequence.toString()) ?? 0) > 1
    const duplicateEvent = (idsByActorExposureKind.get(eventKey) ?? 0) > 1
    if (duplicateSequence) duplicateAcceptedSequenceRows++
    if (duplicateId || duplicateEvent) duplicateSignalRows++
    if (duplicateId || duplicateSequence || duplicateEvent) {
      invalidOrOrphanSignals++
      continue
    }
    validSignals.push(signal)
    sequenceBySignalId.set(signal.signalId, sequence)
  }

  const cohortSignals = validSignals.filter((signal) => cohortExposureById.has(signal.exposureId))
  const signalsByExposure = new Map<string, typeof validSignals>()
  for (const signal of cohortSignals) {
    const rows = signalsByExposure.get(signal.exposureId) ?? []
    rows.push(signal)
    signalsByExposure.set(signal.exposureId, rows)
  }

  const breakdownsByKey = new Map<string, BlueprintMeasurementReadinessBreakdownRow>()
  let invalidRankingContexts = 0
  let exposuresWithSourceRevision = 0
  let exposuresWithSourceHash = 0
  for (const exposure of cohortExposures) {
    if (Number.isInteger(exposure.sourceRevision) && exposure.sourceRevision > 0)
      exposuresWithSourceRevision++
    if (SHA256.test(exposure.sourceContentHash)) exposuresWithSourceHash++
    const policy = normalizePolicy(exposure.rankingContext)
    if (!policy.valid) invalidRankingContexts++
    const base = {
      policyMode: policy.policyMode,
      algorithmVersion: policy.algorithmVersion,
      configurationVersion: policy.configurationVersion,
      configurationDigest: policy.configurationDigest,
      surface: exposure.surface,
      positionBand: positionBand(exposure.rank),
      servedExposures: 0,
      creditedImpressions: 0,
      creditedOpens: 0,
      rawOpens: 0,
    } satisfies BlueprintMeasurementReadinessBreakdownRow
    const key = breakdownKey(base)
    const current = breakdownsByKey.get(key) ?? base
    current.servedExposures++
    breakdownsByKey.set(key, current)
  }

  let creditedImpressions = 0
  let creditedOpens = 0
  let rawOpens = 0
  let rawFalseCreditOpens = 0
  let unmatchedOpens = 0
  let invalidImpressionReferences = 0
  let crossActorExposureSourceReferences = 0
  let nonPriorImpressionReferences = 0
  let acceptedTimestampRegressions = 0
  let duplicateImpressionMatches = 0
  let matchedOpens = 0
  const usedImpressionIds = new Set<string>()
  const validSignalById = new Map(validSignals.map((signal) => [signal.signalId, signal]))
  const rawOpenRowsByActorSource = new Map<
    string,
    Array<{ signal: (typeof cohortSignals)[number]; exposure: (typeof cohortExposures)[number] }>
  >()
  const validMatchedOpenIds = new Set<string>()
  for (const exposure of cohortExposures) {
    const rows = signalsByExposure.get(exposure.exposureId) ?? []
    for (const signal of rows) {
      const context = normalizePolicy(exposure.rankingContext)
      const base: BlueprintMeasurementReadinessBreakdownRow = {
        policyMode: context.policyMode,
        algorithmVersion: context.algorithmVersion,
        configurationVersion: context.configurationVersion,
        configurationDigest: context.configurationDigest,
        surface: exposure.surface,
        positionBand: positionBand(exposure.rank),
        servedExposures: 0,
        creditedImpressions: 0,
        creditedOpens: 0,
        rawOpens: 0,
      }
      const key = breakdownKey(base)
      const item = breakdownsByKey.get(key) ?? base
      if (signal.kind === 'impression' && signal.rankEligible) {
        creditedImpressions++
        item.creditedImpressions++
      }
      if (signal.kind === 'open' && signal.rankEligible) {
        creditedOpens++
        item.creditedOpens++
      }
      if (signal.kind === 'open') {
        rawOpens++
        item.rawOpens++
        if (!signal.rankEligible) rawFalseCreditOpens++
        const key = actorSourceKey(exposure.actorId, exposure.catalogKey)
        const rawOpenRows = rawOpenRowsByActorSource.get(key) ?? []
        rawOpenRows.push({ signal, exposure })
        rawOpenRowsByActorSource.set(key, rawOpenRows)
        if (signal.matchedImpressionId === null) {
          unmatchedOpens++
          continue
        }
        const impression = validSignalById.get(signal.matchedImpressionId)
        if (!impression || impression.kind !== 'impression') {
          invalidImpressionReferences++
          continue
        }
        if (
          impression.actorId !== signal.actorId ||
          impression.exposureId !== signal.exposureId ||
          impression.catalogKey !== signal.catalogKey
        ) {
          crossActorExposureSourceReferences++
          continue
        }
        if (
          sequenceBySignalId.get(impression.signalId)! >= sequenceBySignalId.get(signal.signalId)!
        ) {
          nonPriorImpressionReferences++
          continue
        }
        if (usedImpressionIds.has(impression.signalId)) {
          duplicateImpressionMatches++
          continue
        }
        usedImpressionIds.add(impression.signalId)
        validMatchedOpenIds.add(signal.signalId)
        if (Date.parse(signal.acceptedAt) < Date.parse(impression.acceptedAt)) {
          acceptedTimestampRegressions++
        }
        matchedOpens++
      }
      breakdownsByKey.set(key, item)
    }
  }

  const validAcquisitionById = new Map<string, (typeof input.acquisitions)[number]>()
  let acquisitionRowsForCohortSources = 0
  let validAcquisitionChains = 0
  let invalidAcquisitionChains = 0
  const recordedOpenTimesByExposure = new Map<string, number[]>()
  for (const signal of validSignals) {
    if (signal.kind !== 'open') continue
    const times = recordedOpenTimesByExposure.get(signal.exposureId) ?? []
    times.push(Date.parse(signal.acceptedAt))
    recordedOpenTimesByExposure.set(signal.exposureId, times)
  }
  const cohortActorSources = new Set(
    cohortExposures.map((exposure) => actorSourceKey(exposure.actorId, exposure.catalogKey))
  )
  for (const acquisition of input.acquisitions) {
    const exposure = exposureById.get(acquisition.exposureId)
    if (
      exposure &&
      cohortActorSources.has(actorSourceKey(acquisition.actorId, acquisition.sourceCatalogKey))
    ) {
      acquisitionRowsForCohortSources++
    }
    const acquiredAt = rowDate(acquisition.acquiredAt, 'acquisition.acquiredAt', asOfMs)
    const expiresAt = parseIso(acquisition.expiresAt, 'acquisition.expiresAt')
    const valid = Boolean(
      exposure &&
      exposureIsEligible(exposure) &&
      issuedAtById.get(acquisition.exposureId)! + EXPOSURE_RETENTION_DAYS * DAY_MS > readAtMs &&
      exposure.actorId === acquisition.actorId &&
      exposure.catalogKey === acquisition.sourceCatalogKey &&
      exposure.sourceRevision === acquisition.sourceRevision &&
      exposure.sourceContentHash === acquisition.sourceContentHash &&
      SHA256.test(acquisition.copyContentHash) &&
      acquisition.copyRevisionMatchesHash &&
      acquiredAt >= issuedAtById.get(acquisition.exposureId)! &&
      acquiredAt < expiresAtById.get(acquisition.exposureId)! &&
      expiresAt <= issuedAtById.get(acquisition.exposureId)! + EXPOSURE_RETENTION_DAYS * DAY_MS &&
      expiresAt > acquiredAt &&
      expiresAt > readAtMs &&
      (recordedOpenTimesByExposure.get(acquisition.exposureId) ?? []).some(
        (openAt) => openAt <= acquiredAt
      )
    )
    if (!valid || validAcquisitionById.has(acquisition.acquisitionId)) {
      invalidAcquisitionChains++
      continue
    }
    validAcquisitionById.set(acquisition.acquisitionId, acquisition)
    validAcquisitionChains++
  }

  const qualifiedRowsForCohortSources = input.qualifiedAdoptions.filter((adoption) =>
    cohortActorSources.has(actorSourceKey(adoption.actorId, adoption.sourceCatalogKey))
  )
  const validAdoptions: Array<{
    row: (typeof input.qualifiedAdoptions)[number]
    acquisition: (typeof input.acquisitions)[number]
    exposure: (typeof input.exposures)[number]
  }> = []
  let invalidAdoptionChains = 0
  const adoptionActorSourceSeen = new Set<string>()
  const installationIdsSeen = new Set<string>()
  for (const adoption of input.qualifiedAdoptions) {
    const acquisition = validAcquisitionById.get(adoption.acquisitionId)
    const exposure = acquisition ? exposureById.get(acquisition.exposureId) : undefined
    const qualifiedAt = rowDate(adoption.qualifiedAt, 'adoption.qualifiedAt', asOfMs)
    const acquiredAt = acquisition ? Date.parse(acquisition.acquiredAt) : Number.POSITIVE_INFINITY
    const actorSource = actorSourceKey(adoption.actorId, adoption.sourceCatalogKey)
    const duplicate =
      adoptionActorSourceSeen.has(actorSource) || installationIdsSeen.has(adoption.installationId)
    if (
      !acquisition ||
      !exposure ||
      adoption.actorId !== acquisition.actorId ||
      adoption.sourceCatalogKey !== acquisition.sourceCatalogKey ||
      adoption.sourceRevision !== acquisition.sourceRevision ||
      adoption.sourceContentHash !== acquisition.sourceContentHash ||
      adoption.installationStatus !== 'completed' ||
      !adoption.installationMatchesAcquisition ||
      qualifiedAt < acquiredAt ||
      qualifiedAt >= Date.parse(acquisition.expiresAt) ||
      !SHA256.test(adoption.sourceContentHash) ||
      duplicate
    ) {
      invalidAdoptionChains++
      continue
    }
    adoptionActorSourceSeen.add(actorSource)
    installationIdsSeen.add(adoption.installationId)
    validAdoptions.push({ row: adoption, acquisition, exposure })
  }

  const eligibleOpenOpportunities: Array<{
    actorId: string
    catalogKey: string
    signal: (typeof cohortSignals)[number]
    exposure: (typeof cohortExposures)[number]
  }> = []
  let duplicateOpenOpportunities = 0
  const firstRawOpenByActorSource = new Map<
    string,
    { signal: (typeof cohortSignals)[number]; exposure: (typeof cohortExposures)[number] }
  >()
  for (const [key, opens] of rawOpenRowsByActorSource) {
    const first = [...opens].sort((left, right) =>
      sequenceBySignalId.get(left.signal.signalId)! < sequenceBySignalId.get(right.signal.signalId)!
        ? -1
        : sequenceBySignalId.get(left.signal.signalId)! >
            sequenceBySignalId.get(right.signal.signalId)!
          ? 1
          : 0
    )[0]!
    firstRawOpenByActorSource.set(key, first)
  }
  const unmatchedOpenOpportunities = [...firstRawOpenByActorSource.values()].filter(
    ({ signal }) => !validMatchedOpenIds.has(signal.signalId)
  ).length
  let priorCreditedActorSourceCount = 0
  let invalidPriorCreditRows = 0
  const priorCredits = new Map<string, number[]>()
  for (const prior of input.priorCreditedActorSources) {
    const qualifiedAt = rowDate(prior.qualifiedAt, 'priorCredit.qualifiedAt', asOfMs)
    const retentionExpiresAt = parseIso(
      prior.exposureRetentionExpiresAt,
      'priorCredit.exposureRetentionExpiresAt'
    )
    if (!prior.valid) invalidPriorCreditRows++
    if (prior.valid && retentionExpiresAt > readAtMs) {
      const key = actorSourceKey(prior.actorId, prior.catalogKey)
      const qualifiedTimes = priorCredits.get(key) ?? []
      qualifiedTimes.push(qualifiedAt)
      priorCredits.set(key, qualifiedTimes)
    }
  }
  for (const [key, orderedOpens] of rawOpenRowsByActorSource) {
    orderedOpens.sort((left, right) =>
      sequenceBySignalId.get(left.signal.signalId)! < sequenceBySignalId.get(right.signal.signalId)!
        ? -1
        : sequenceBySignalId.get(left.signal.signalId)! >
            sequenceBySignalId.get(right.signal.signalId)!
          ? 1
          : 0
    )
    duplicateOpenOpportunities += Math.max(0, orderedOpens.length - 1)
    // The first accepted raw open defines the opportunity even if its optional impression link is absent or invalid.
    const firstOpportunity = orderedOpens[0]!
    const firstOpportunityAnchor = issuedAtById.get(firstOpportunity.exposure.exposureId)!
    if ((priorCredits.get(key) ?? []).some((qualifiedAt) => qualifiedAt < firstOpportunityAnchor)) {
      priorCreditedActorSourceCount++
      continue
    }
    eligibleOpenOpportunities.push({
      actorId: firstOpportunity.exposure.actorId,
      catalogKey: firstOpportunity.exposure.catalogKey,
      signal: firstOpportunity.signal,
      exposure: firstOpportunity.exposure,
    })
  }

  let adoptionWithinSevenDays = 0
  let adoptionAfterSevenDaysWithinRetention = 0
  let adoptionAfterRetentionWindow = 0
  let adoptionBeforeAcceptedOpen = 0
  let adoptionRevisionChangedFromFirstOpportunity = 0
  let outcomesFromSameExposure = 0
  let outcomesFromAnotherSameActorSourceExposure = 0
  const validAdoptionsByActorSource = new Map<string, (typeof validAdoptions)[number]>()
  for (const adoption of validAdoptions) {
    const key = actorSourceKey(adoption.row.actorId, adoption.row.sourceCatalogKey)
    const previous = validAdoptionsByActorSource.get(key)
    if (!previous || Date.parse(adoption.row.qualifiedAt) < Date.parse(previous.row.qualifiedAt))
      validAdoptionsByActorSource.set(key, adoption)
  }
  for (const opportunity of eligibleOpenOpportunities) {
    const key = actorSourceKey(opportunity.actorId, opportunity.catalogKey)
    const adoption = validAdoptionsByActorSource.get(key)
    if (!adoption) continue
    const anchor = issuedAtById.get(opportunity.exposure.exposureId)!
    const qualifiedAt = Date.parse(adoption.row.qualifiedAt)
    const openAt = Date.parse(opportunity.signal.acceptedAt)
    if (qualifiedAt < openAt) {
      adoptionBeforeAcceptedOpen++
      continue
    }
    if (
      adoption.exposure.sourceRevision !== opportunity.exposure.sourceRevision ||
      adoption.exposure.sourceContentHash !== opportunity.exposure.sourceContentHash
    ) {
      adoptionRevisionChangedFromFirstOpportunity++
      continue
    }
    if (qualifiedAt < anchor + OUTCOME_WINDOW_DAYS * DAY_MS) {
      adoptionWithinSevenDays++
      if (adoption.acquisition.exposureId === opportunity.exposure.exposureId)
        outcomesFromSameExposure++
      else outcomesFromAnotherSameActorSourceExposure++
    } else if (qualifiedAt < anchor + EXPOSURE_RETENTION_DAYS * DAY_MS) {
      adoptionAfterSevenDaysWithinRetention++
    } else {
      adoptionAfterRetentionWindow++
    }
  }

  const compareBreakdown = (
    left: BlueprintMeasurementReadinessBreakdownRow,
    right: BlueprintMeasurementReadinessBreakdownRow
  ) => {
    const leftKey = [
      left.policyMode,
      left.algorithmVersion,
      left.configurationVersion,
      left.configurationDigest,
      left.surface,
      left.positionBand,
    ].join('\u0000')
    const rightKey = [
      right.policyMode,
      right.algorithmVersion,
      right.configurationVersion,
      right.configurationDigest,
      right.surface,
      right.positionBand,
    ].join('\u0000')
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0
  }
  const breakdowns = [...breakdownsByKey.values()].sort(compareBreakdown)
  const policyDigestCounts = breakdowns.reduce<
    BlueprintMeasurementReadinessReport['policyDigestCounts']
  >((rows, row) => {
    const existing = rows.find(
      (item) =>
        item.policyMode === row.policyMode &&
        item.algorithmVersion === row.algorithmVersion &&
        item.configurationVersion === row.configurationVersion &&
        item.configurationDigest === row.configurationDigest
    )
    const exposureCount = row.servedExposures
    if (existing) existing.exposureCount += exposureCount
    else
      rows.push({
        policyMode: row.policyMode,
        algorithmVersion: row.algorithmVersion,
        configurationVersion: row.configurationVersion,
        configurationDigest: row.configurationDigest,
        exposureCount,
      })
    return rows
  }, [])

  return {
    reportVersion: 'blueprint-measurement-readiness-v2',
    dataOrigin: input.dataOrigin,
    window: {
      cohortStart: input.cohortStart,
      cohortEnd: input.cohortEnd,
      asOf: input.asOf,
      readAt: input.readAt,
      cohortInterval:
        '[cohortStart, cohortEnd) by exposure issuedAt; diagnostic signalDate uses full UTC days only',
      outcomeWindow: '[exposure issuedAt, issuedAt + 7 days)',
      maturityLag: '24 hours',
      exposureRetentionBound: 'readAt must precede cohortStart + 30 days',
    },
    policyDigest: outputPolicyDigest(breakdowns),
    policyDigestCounts,
    readinessForRankingWeights: false,
    readinessReasons: [
      'Eligible-session, supported-client and opt-in-denominator coverage are unknown; quota denial counts cover only retained, opted-in page-item attempts in aligned UTC-day scopes.',
      'Open pairing uses an exact prior accepted impression and server acceptedSequence; it does not establish client event chronology.',
      'Acquisition-after-open validation uses server acceptedAt timestamps; it cannot prove client chronology.',
      'Seven-day unchanged-copy adoption is a narrow diagnostic, not overall discovery conversion or a validated planning-cycle outcome.',
      'No randomized assignment, experiment allocation checks, or causal outcome is represented.',
      'Private preference state is intentionally excluded; repeated like/unlike history is not reconstructable.',
    ],
    coverage: input.coverage,
    servingDiagnostics: {
      scope: dailyServingDiagnosticsAvailable
        ? 'measured_full_utc_days'
        : 'unavailable_partial_day',
      unit: 'page-item attempts; retries and reuse are included',
      requestedItemAttempts: dailyServingDiagnosticsAvailable
        ? servingTotals.requestedItemAttempts
        : null,
      eligibleItems: dailyServingDiagnosticsAvailable ? servingTotals.eligibleItems : null,
      issuedExposures: dailyServingDiagnosticsAvailable ? servingTotals.issuedExposures : null,
      reusedExposures: dailyServingDiagnosticsAvailable ? servingTotals.reusedExposures : null,
      quotaDeniedItems: dailyServingDiagnosticsAvailable ? servingTotals.quotaDeniedItems : null,
      sourceIneligibleItems: dailyServingDiagnosticsAvailable
        ? servingTotals.sourceIneligibleItems
        : null,
      contributingActorCount: dailyServingDiagnosticsAvailable ? servingActorIds.size : null,
      invalidRows: invalidServingDiagnosticRows,
      dailySurfacePolicyRows: dailyServingDiagnosticsAvailable ? servingDiagnosticBreakdowns : [],
    },
    counts: {
      servedExposures: cohortExposures.length,
      excludedActorExposures,
      excludedConsentExposures,
      creditedImpressions,
      creditedOpens,
      rawOpens,
      rawFalseCreditOpens,
      invalidOrOrphanSignals,
      signalsOutsideExposureWindow,
      invalidRankingContexts,
    },
    population: {
      eligibleActorCount: new Set(cohortExposures.map(({ actorId }) => actorId)).size,
      exposuresWithSourceRevision,
      exposuresWithSourceHash,
    },
    exactSourceStatusCounts: cohortExposures.reduce(
      (counts, exposure) => {
        counts[exposure.exactSourceStatus]++
        return counts
      },
      { current: 0, withdrawn: 0, missing: 0 }
    ),
    breakdowns,
    openPairing: {
      sameExposureRawOpens: rawOpens,
      matchedOpens,
      unmatchedOpens,
      invalidImpressionReferences,
      crossActorExposureSourceReferences,
      nonPriorImpressionReferences,
      acceptedTimestampRegressions,
      duplicateImpressionMatches,
      duplicateSignalRows,
      duplicateAcceptedSequenceRows,
      orderingField: 'acceptedSequence (server acceptance order)',
      provesClientEventOrder: false,
    },
    adoption: {
      cohortOpenOpportunities: eligibleOpenOpportunities.length,
      priorCreditedActorSourceCount,
      invalidPriorCreditRows,
      duplicateOpenOpportunities,
      unmatchedOpenOpportunities,
      acquisitionRowsForCohortSources,
      validAcquisitionChains,
      qualifiedAdoptionRowsForCohortSources: qualifiedRowsForCohortSources.length,
      validQualifiedAdoptionChains: validAdoptions.length,
      invalidOrOrphanChains: invalidAcquisitionChains + invalidAdoptionChains,
      adoptionWithinSevenDays,
      adoptionAfterSevenDaysWithinRetention,
      adoptionAfterRetentionWindow,
      adoptionBeforeAcceptedOpen,
      adoptionRevisionChangedFromFirstOpportunity,
      outcomesFromSameExposure,
      outcomesFromAnotherSameActorSourceExposure,
      attributionRule:
        'One first valid server-accepted raw open per actor/source in acceptedSequence order; optional exact prior-impression pairing is reported separately. The outcome window anchors to that exposure issuedAt. A verified adoption may use another same-actor/source exposure only when exact source revision/hash match; mismatches are reported separately.',
    },
    limitations: [
      'Counts are aggregate operational diagnostics; no ranking weight, quality score, satisfaction, or uplift is derived.',
      'Serving diagnostics count repeated page-item attempts, including retries and reuse; they are not unique sessions, views, or exact lost exposures. Session, supported-client and opt-in denominators remain unknown, and recorded daily counters cannot prove that client traffic or failed writes are complete. Partial-day scopes report these counters as unavailable.',
      'Opted-out and deleted actors must be absent from the repository input; rerunning after filtering retracts their contributions.',
      'Exact source status is reported only in aggregate; no source key, revision, hash, title, or text is exported.',
      'Bookmarks and likes are private current state, not a reconstructable action history, and are not included.',
      'Qualified adoption means a verified unchanged private copy followed by a completed installation; edited copies and other successful installs are not represented.',
      'The retained history and row-cap behavior are supplied by the repository; incomplete or capped input must fail closed before building this report.',
    ],
  }
}
