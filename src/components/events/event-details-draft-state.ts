export type EventDetailsDraftBaseline = { version: number }

export type EventDetailsDraft<TValues> = {
  baseline: EventDetailsDraftBaseline
  values: TValues
}

export function captureEventDetailsDraft<TValues>(
  version: number,
  values: TValues
): EventDetailsDraft<TValues> {
  return { baseline: { version }, values }
}

export function isEventDetailsDraftStale<TValues>(
  draft: EventDetailsDraft<TValues>,
  currentVersion: number
) {
  return draft.baseline.version !== currentVersion
}

/** Adopts a reviewed server version while keeping the user's draft values intact. */
export function adoptRefreshedEventDetailsDraft<TValues>(
  draft: EventDetailsDraft<TValues>,
  currentVersion: number
): EventDetailsDraft<TValues> {
  return { ...draft, baseline: { version: currentVersion } }
}

export function isDetailsVersionReviewed(reviewedVersion: number | null, currentVersion: number) {
  return reviewedVersion === currentVersion
}

export function eventDetailsRecoveryView(input: {
  open: boolean
  baselineVersion: number | null
  currentVersion: number
  conflict: boolean
  reviewedVersion: number | null
}): 'hidden' | 'reload-required' | 'comparison' {
  if (!input.open) return 'hidden'

  const stale = input.baselineVersion !== null && input.baselineVersion !== input.currentVersion
  const currentVersionReviewed = input.reviewedVersion === input.currentVersion

  if ((stale || input.conflict) && !currentVersionReviewed) return 'reload-required'
  if (currentVersionReviewed) return 'comparison'
  return 'hidden'
}
