export type BlueprintCaptureSaveRecovery =
  'unlock' | 'refresh-source-and-preview' | 'retry-same-request'

export function blueprintCaptureSaveRecovery(
  code: string | undefined
): BlueprintCaptureSaveRecovery {
  if (code === 'BLUEPRINT_CAPTURE_SOURCE_MISMATCH') return 'unlock'
  if (code === 'BLUEPRINT_CAPTURE_SOURCE_CHANGED' || code === 'BLUEPRINT_DRAFT_VERSION_CONFLICT') {
    return 'refresh-source-and-preview'
  }
  return 'retry-same-request'
}
