import { pruneExpiredBlueprintAttribution } from '../repos/blueprint-attribution.repo'

/** Maintenance entry point; callers supply PostgreSQL through the standard server boundary. */
export const pruneExpiredBlueprintAttributionWorkflow = (now?: Date) =>
  pruneExpiredBlueprintAttribution(now)
