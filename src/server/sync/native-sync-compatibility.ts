import { ConflictError } from '@/server/effect-utils'

export const BLUEPRINT_GUIDES_CAPABILITY = 'blueprint-guides-v1'
export const BLUEPRINT_UPGRADE_REQUIRED_CODE = 'blueprint_client_upgrade_required'

export function hasBlueprintGuidesCapability(headers: Headers): boolean {
  return (headers.get('x-gatherory-capabilities') ?? '')
    .split(',')
    .map((capability) => capability.trim())
    .includes(BLUEPRINT_GUIDES_CAPABILITY)
}

export function blueprintUpgradeRequired(scopeIds: string[]) {
  return new ConflictError({
    category: 'conflict',
    code: BLUEPRINT_UPGRADE_REQUIRED_CODE,
    userMessage: 'Update Gatherory to sync this blueprint experience.',
    httpStatus: 426,
    messageParams: {
      requiredCapabilities: BLUEPRINT_GUIDES_CAPABILITY,
      recoverable: 'true',
      scopeIDs: [...new Set(scopeIds)].join(','),
    },
    debugMessage: `Blueprint sync requires ${BLUEPRINT_GUIDES_CAPABILITY}; scopes=${[...new Set(scopeIds)].join(',')}`,
  })
}
