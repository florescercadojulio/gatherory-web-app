import { describe, expect, it } from 'vitest'
import {
  BlueprintMeasurementReadinessWindowError,
  buildBlueprintMeasurementReadinessReport,
  validateBlueprintMeasurementReadinessWindow,
} from '@/server/blueprints/services/blueprint-measurement-readiness'
import { blueprintMeasurementReadinessFixtureInput } from '../fixtures/blueprint-measurement-readiness'

const fixture = () => structuredClone(blueprintMeasurementReadinessFixtureInput())

describe('blueprint measurement readiness', () => {
  it('rejects calendar rollovers and ambiguous or sub-millisecond instants', () => {
    const input = fixture()
    for (const cohortStart of [
      '2026-02-31T00:00:00.000Z',
      '2026-01-01T24:00:00.000Z',
      '2026-01-01T00:00:00.000-00:00',
      '2026-01-01T00:00:00.0001Z',
    ]) {
      expect(() =>
        validateBlueprintMeasurementReadinessWindow({ ...input, cohortStart })
      ).toThrowError(BlueprintMeasurementReadinessWindowError)
    }
    expect(
      validateBlueprintMeasurementReadinessWindow({
        ...input,
        cohortStart: '2026-01-01T02:00:00.000+02:00',
      }).startMs
    ).toBe(Date.parse(input.cohortStart))
  })

  it('keeps maturity and retention boundaries explicit and half-open', () => {
    const valid = {
      cohortStart: '2026-01-01T00:00:00.000Z',
      cohortEnd: '2026-01-02T00:00:00.000Z',
      asOf: '2026-01-10T00:00:00.000Z',
      readAt: '2026-01-10T00:00:00.000Z',
    }
    expect(validateBlueprintMeasurementReadinessWindow(valid).endMs).toBe(
      Date.parse(valid.cohortEnd)
    )
    expect(() =>
      validateBlueprintMeasurementReadinessWindow({
        ...valid,
        asOf: '2026-01-09T23:59:59.999Z',
        readAt: '2026-01-10T00:00:00.000Z',
      })
    ).toThrowError(BlueprintMeasurementReadinessWindowError)
    expect(() =>
      validateBlueprintMeasurementReadinessWindow({
        ...valid,
        cohortEnd: valid.cohortStart,
      })
    ).toThrowError(/non-empty/)
    expect(() =>
      validateBlueprintMeasurementReadinessWindow({
        ...valid,
        cohortStart: '2026-01-01',
      })
    ).toThrowError(/explicit timezone/)
    expect(() =>
      validateBlueprintMeasurementReadinessWindow({
        ...valid,
        readAt: '2026-01-31T00:00:00.000Z',
      })
    ).toThrowError(BlueprintMeasurementReadinessWindowError)
  })

  it('reconciles exposure, consent, exact-source and accepted-impression diagnostics', () => {
    const input = fixture()
    expect(Date.parse(input.exposures[0]!.expiresAt)).toBeLessThan(Date.parse(input.readAt))
    const report = buildBlueprintMeasurementReadinessReport(input)
    expect(report.dataOrigin).toBe('synthetic_fixture')
    expect(report.counts.servedExposures).toBe(12)
    expect(report.counts.excludedActorExposures).toBe(1)
    expect(report.counts.excludedConsentExposures).toBe(1)
    expect(report.exactSourceStatusCounts).toEqual({ current: 10, withdrawn: 1, missing: 1 })
    expect(report.counts.creditedOpens).toBe(7)
    expect(report.counts.rawOpens).toBe(11)
    expect(report.counts.rawFalseCreditOpens).toBe(4)
    expect(report.openPairing).toMatchObject({
      sameExposureRawOpens: 11,
      matchedOpens: 9,
      unmatchedOpens: 1,
      invalidImpressionReferences: 0,
      crossActorExposureSourceReferences: 0,
      nonPriorImpressionReferences: 1,
      acceptedTimestampRegressions: 0,
      duplicateImpressionMatches: 0,
      duplicateSignalRows: 0,
      duplicateAcceptedSequenceRows: 0,
      orderingField: 'acceptedSequence (server acceptance order)',
      provesClientEventOrder: false,
    })
    expect(report.coverage).toEqual({
      eligibleSessions: 'unknown',
      supportedClientVersions: 'unknown',
      optInDenominator: 'unknown',
    })
    expect(report.servingDiagnostics).toMatchObject({
      scope: 'measured_full_utc_days',
      unit: 'page-item attempts; retries and reuse are included',
      requestedItemAttempts: 16,
      eligibleItems: 11,
      issuedExposures: 6,
      reusedExposures: 2,
      quotaDeniedItems: 3,
      sourceIneligibleItems: 5,
      contributingActorCount: 3,
      invalidRows: 0,
    })
    expect(report.readinessForRankingWeights).toBe(false)
  })

  it('counts one actor/source opportunity and excludes retained prior credit only before its first cohort anchor', () => {
    const input = fixture()
    input.priorCreditedActorSources.push({
      actorId: 'actor-a',
      catalogKey: 'source-a',
      qualifiedAt: '2026-01-01T23:59:49.000Z',
      exposureRetentionExpiresAt: '2026-01-20T00:00:00.000Z',
      valid: true,
    })
    const report = buildBlueprintMeasurementReadinessReport(input)
    expect(report.adoption.priorCreditedActorSourceCount).toBe(2)
    expect(report.adoption.cohortOpenOpportunities).toBe(6)
    expect(report.adoption.duplicateOpenOpportunities).toBe(3)
  })

  it('orders opportunities by acceptedSequence when server timestamps are equal', () => {
    const input = fixture()
    const firstExposureOpen = input.signals.find(
      (row) => row.exposureId === 'exposure-a-first' && row.kind === 'open'
    )!
    const laterExposureOpen = input.signals.find(
      (row) => row.exposureId === 'exposure-a-later' && row.kind === 'open'
    )!
    firstExposureOpen.acceptedAt = '2026-01-02T00:02:01.000Z'
    laterExposureOpen.acceptedAt = '2026-01-02T00:02:01.000Z'
    const beforePrior = buildBlueprintMeasurementReadinessReport(input)
    input.priorCreditedActorSources.push({
      actorId: 'actor-a',
      catalogKey: 'source-a',
      qualifiedAt: '2026-01-01T23:59:49.000Z',
      exposureRetentionExpiresAt: '2026-01-20T00:00:00.000Z',
      valid: true,
    })

    const report = buildBlueprintMeasurementReadinessReport(input)
    expect(report.adoption.priorCreditedActorSourceCount).toBe(2)
    expect(report.adoption.cohortOpenOpportunities).toBe(
      beforePrior.adoption.cohortOpenOpportunities - 1
    )
  })

  it('keeps sequence-valid open pairs when accepted timestamps regress', () => {
    const input = fixture()
    const impression = input.signals.find((row) => row.signalId === 'signal-a-first-impression')!
    const open = input.signals.find((row) => row.signalId === 'signal-a-first-open')!
    open.acceptedAt = '2026-01-02T00:00:00.500Z'
    const report = buildBlueprintMeasurementReadinessReport(input)
    expect(report.openPairing.matchedOpens).toBe(9)
    expect(report.openPairing.acceptedTimestampRegressions).toBe(1)
    expect(BigInt(open.acceptedSequence)).toBeGreaterThan(BigInt(impression.acceptedSequence))
  })

  it('qualifies acquisition and adoption from a fast raw open without an impression match', () => {
    const input = fixture()
    const baseAcquisition = input.acquisitions.find((row) => row.acquisitionId === 'acquisition-a')!
    const baseAdoption = input.qualifiedAdoptions.find(
      (row) => row.acquisitionId === 'acquisition-a'
    )!
    const fastOpen = input.signals.find((row) => row.signalId === 'signal-d-unmatched-open')!
    input.exposures = input.exposures.filter((row) => row.exposureId === fastOpen.exposureId)
    input.signals = [{ ...fastOpen, matchedImpressionId: null }]
    input.acquisitions = [
      {
        ...baseAcquisition,
        acquisitionId: 'fast-open-acquisition',
        actorId: fastOpen.actorId,
        exposureId: fastOpen.exposureId,
        sourceCatalogKey: fastOpen.catalogKey,
        acquiredAt: '2026-01-01T21:05:00.000Z',
        expiresAt: '2026-01-31T21:00:00.000Z',
      },
    ]
    input.qualifiedAdoptions = [
      {
        ...baseAdoption,
        actorId: fastOpen.actorId,
        acquisitionId: 'fast-open-acquisition',
        installationId: 'fast-open-installation',
        sourceCatalogKey: fastOpen.catalogKey,
        qualifiedAt: '2026-01-03T00:00:00.000Z',
      },
    ]
    input.priorCreditedActorSources = []

    const report = buildBlueprintMeasurementReadinessReport(input)
    expect(report.openPairing.matchedOpens).toBe(0)
    expect(report.adoption.unmatchedOpenOpportunities).toBe(1)
    expect(report.adoption.validAcquisitionChains).toBe(1)
    expect(report.adoption.validQualifiedAdoptionChains).toBe(1)
    expect(report.adoption.adoptionWithinSevenDays).toBe(1)
  })

  it('rejects daily serving rows that violate counter conservation', () => {
    const input = fixture()
    input.servingDiagnostics[0]!.quotaDeniedItems++
    const report = buildBlueprintMeasurementReadinessReport(input)
    expect(report.servingDiagnostics.invalidRows).toBe(1)
    expect(report.servingDiagnostics.quotaDeniedItems).toBe(1)
  })

  it('does not retroactively pair unmatched opens and rejects cross-source or corrupt matches', () => {
    const input = fixture()
    const unpairedOpen = input.signals.find((row) => row.signalId === 'signal-d-unmatched-open')!
    const lateImpression = {
      signalId: 'signal-d-late-impression',
      actorId: unpairedOpen.actorId,
      exposureId: unpairedOpen.exposureId,
      catalogKey: unpairedOpen.catalogKey,
      kind: 'impression' as const,
      rankEligible: false,
      acceptedAt: '2026-01-01T21:00:03.000Z',
      acceptedSequence: '80',
      matchedImpressionId: null,
    }
    input.signals.push(lateImpression)
    unpairedOpen.matchedImpressionId = lateImpression.signalId
    const crossSource = input.signals.find((row) => row.signalId === 'signal-a-later-open')!
    crossSource.matchedImpressionId = 'signal-b-impression'
    const duplicateSequence = input.signals.find(
      (row) => row.signalId === 'signal-a-first-impression'
    )!
    duplicateSequence.acceptedSequence = input.signals.find(
      (row) => row.signalId === 'signal-c-impression'
    )!.acceptedSequence
    const report = buildBlueprintMeasurementReadinessReport(input)
    expect(report.openPairing).toMatchObject({
      unmatchedOpens: 0,
      crossActorExposureSourceReferences: 1,
      invalidImpressionReferences: 2,
      duplicateSignalRows: 0,
      duplicateAcceptedSequenceRows: 2,
      provesClientEventOrder: false,
    })
  })

  it('marks daily quota counters unavailable for partial-day cohorts', () => {
    const input = fixture()
    input.cohortStart = '2026-01-01T00:30:00.000Z'
    input.cohortEnd = '2026-01-02T00:30:00.000Z'
    input.asOf = '2026-01-11T00:30:00.000Z'
    input.readAt = '2026-01-11T00:30:00.000Z'
    const report = buildBlueprintMeasurementReadinessReport(input)
    expect(report.servingDiagnostics).toMatchObject({
      scope: 'unavailable_partial_day',
      requestedItemAttempts: null,
      eligibleItems: null,
      issuedExposures: null,
      reusedExposures: null,
      quotaDeniedItems: null,
      sourceIneligibleItems: null,
      contributingActorCount: null,
      dailySurfacePolicyRows: [],
    })
  })

  it('does not count a prior credit whose source exposure has logically expired', () => {
    const input = fixture()
    const prior = input.priorCreditedActorSources[0]!
    prior.exposureRetentionExpiresAt = '2026-01-09T23:59:59.999Z'
    const report = buildBlueprintMeasurementReadinessReport(input)
    expect(report.adoption.priorCreditedActorSourceCount).toBe(0)
  })

  it('does not suppress an opportunity with an unverified prior adoption row', () => {
    const input = fixture()
    input.priorCreditedActorSources[0]!.valid = false
    const report = buildBlueprintMeasurementReadinessReport(input)
    expect(report.adoption.invalidPriorCreditRows).toBe(1)
    expect(report.adoption.priorCreditedActorSourceCount).toBe(0)
  })

  it('allows a verified private-copy hash to differ from the public source hash', () => {
    const input = fixture()
    const chain = input.acquisitions.find((row) => row.acquisitionId === 'acquisition-a')!
    expect(chain.copyContentHash).not.toBe(chain.sourceContentHash)
    expect(buildBlueprintMeasurementReadinessReport(input).adoption.validAcquisitionChains).toBe(2)
  })

  it('requires actor/source/open proof for acquisition and exact installation proof for adoption', () => {
    const invalidActor = fixture()
    invalidActor.acquisitions.find((row) => row.acquisitionId === 'acquisition-a')!.actorId =
      'other-actor'
    expect(
      buildBlueprintMeasurementReadinessReport(invalidActor).adoption.validAcquisitionChains
    ).toBe(1)

    const invalidSource = fixture()
    invalidSource.acquisitions.find(
      (row) => row.acquisitionId === 'acquisition-a'
    )!.sourceCatalogKey = 'other-source'
    expect(
      buildBlueprintMeasurementReadinessReport(invalidSource).adoption.validAcquisitionChains
    ).toBe(1)

    const openAfterAcquisition = fixture()
    openAfterAcquisition.acquisitions.find(
      (row) => row.acquisitionId === 'acquisition-a'
    )!.acquiredAt = '2026-01-02T00:01:00.000Z'
    expect(
      buildBlueprintMeasurementReadinessReport(openAfterAcquisition).adoption.validAcquisitionChains
    ).toBe(1)

    const invalidInstallation = fixture()
    invalidInstallation.qualifiedAdoptions.find(
      (row) => row.acquisitionId === 'acquisition-a'
    )!.installationMatchesAcquisition = false
    expect(
      buildBlueprintMeasurementReadinessReport(invalidInstallation).adoption
        .validQualifiedAdoptionChains
    ).toBe(1)
  })

  it('treats the exact seven-day boundary as late, and empties safely without readiness', () => {
    const input = fixture()
    input.qualifiedAdoptions.find((row) => row.acquisitionId === 'acquisition-a')!.qualifiedAt =
      '2026-01-08T23:59:50.000Z'
    const boundary = buildBlueprintMeasurementReadinessReport(input)
    expect(boundary.adoption.adoptionWithinSevenDays).toBe(0)
    expect(boundary.adoption.adoptionAfterSevenDaysWithinRetention).toBe(2)

    const empty = fixture()
    empty.cohortStart = '2026-01-20T00:00:00.000Z'
    empty.cohortEnd = '2026-01-21T00:00:00.000Z'
    empty.asOf = '2026-01-29T00:00:00.000Z'
    empty.readAt = '2026-01-29T00:00:00.000Z'
    const emptyReport = buildBlueprintMeasurementReadinessReport(empty)
    expect(emptyReport.counts.servedExposures).toBe(0)
    expect(emptyReport.population.eligibleActorCount).toBe(0)
    expect(emptyReport.coverage.eligibleSessions).toBe('unknown')
    expect(emptyReport.adoption.cohortOpenOpportunities).toBe(0)
    expect(emptyReport.readinessForRankingWeights).toBe(false)
  })

  it('does not transfer an adoption across a changed public source revision', () => {
    const input = fixture()
    const continuation = input.exposures.find((row) => row.exposureId === 'exposure-a-later')!
    continuation.sourceRevision = 2
    continuation.sourceContentHash = 'd'.repeat(64)
    const acquisition = input.acquisitions.find((row) => row.acquisitionId === 'acquisition-a')!
    acquisition.exposureId = continuation.exposureId
    acquisition.sourceRevision = continuation.sourceRevision
    acquisition.sourceContentHash = continuation.sourceContentHash
    const adoption = input.qualifiedAdoptions.find((row) => row.acquisitionId === 'acquisition-a')!
    adoption.sourceRevision = continuation.sourceRevision
    adoption.sourceContentHash = continuation.sourceContentHash

    const report = buildBlueprintMeasurementReadinessReport(input)
    expect(report.adoption.validAcquisitionChains).toBe(2)
    expect(report.adoption.validQualifiedAdoptionChains).toBe(2)
    expect(report.adoption.adoptionRevisionChangedFromFirstOpportunity).toBe(1)
    expect(report.adoption.adoptionWithinSevenDays).toBe(0)
  })

  it('retracts filtered consent rows, ignores logically expired continuation rows, and leaks no join identifiers', () => {
    const input = fixture()
    const complete = buildBlueprintMeasurementReadinessReport(input)
    const filtered = structuredClone(input)
    filtered.exposures.find((row) => row.actorId === 'actor-b')!.consent = 'withdrawn'
    const retracted = buildBlueprintMeasurementReadinessReport(filtered)
    expect(retracted.counts.servedExposures).toBe(complete.counts.servedExposures - 1)
    expect(retracted.counts.rawOpens).toBe(complete.counts.rawOpens - 1)
    const serialized = JSON.stringify(complete)
    for (const privateValue of [
      'actor-a',
      'exposure-a-first',
      'acquisition-a',
      'installation-a',
      'source-a',
      'sourceContentHash',
      'copyContentHash',
    ])
      expect(serialized).not.toContain(privateValue)

    const actorRemoved = structuredClone(input)
    actorRemoved.exposures = actorRemoved.exposures.filter((row) => row.actorId !== 'actor-a')
    actorRemoved.signals = actorRemoved.signals.filter((row) => row.actorId !== 'actor-a')
    actorRemoved.acquisitions = actorRemoved.acquisitions.filter((row) => row.actorId !== 'actor-a')
    actorRemoved.qualifiedAdoptions = actorRemoved.qualifiedAdoptions.filter(
      (row) => row.actorId !== 'actor-a'
    )
    const afterRemoval = buildBlueprintMeasurementReadinessReport(actorRemoved)
    expect(afterRemoval.adoption.validQualifiedAdoptionChains).toBe(
      complete.adoption.validQualifiedAdoptionChains - 1
    )
    expect(afterRemoval.adoption.adoptionWithinSevenDays).toBe(0)
  })

  it('sanitizes malformed legacy context instead of exporting its values', () => {
    const input = fixture()
    input.exposures[0]!.rankingContext = {
      mode: '<private>' as 'baseline_v1',
      algorithmVersion: 'private value <unsafe>',
      configurationVersion: 'cfg',
      configurationDigest: 'not-a-digest',
    }
    const report = buildBlueprintMeasurementReadinessReport(input)
    expect(report.counts.invalidRankingContexts).toBe(1)
    expect(JSON.stringify(report)).not.toContain('<private>')
    expect(JSON.stringify(report)).not.toContain('private value')
    expect(report.breakdowns.some((row) => row.policyMode === 'unknown')).toBe(true)
  })
})
