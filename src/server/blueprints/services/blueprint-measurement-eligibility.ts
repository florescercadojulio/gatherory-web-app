/** Exact account IDs explicitly excluded by deployment configuration. */
export function isBlueprintDiscoveryAccountEligible(actorUserId: string): boolean {
  const excluded = (process.env.BLUEPRINT_DISCOVERY_EXCLUDED_ACCOUNT_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  return !excluded.includes(actorUserId)
}
