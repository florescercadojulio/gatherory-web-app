const contentTypeExtensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
} as const

export type SupportedImageContentType = keyof typeof contentTypeExtensions

export function extensionForContentType(contentType: SupportedImageContentType) {
  return contentTypeExtensions[contentType]
}

/** Generates immutable, workspace-scoped keys independent of presentation. */
export const MediaKeys = {
  workspacePrefix: (workspaceId: string) => `workspaces/${workspaceId}/media`,
  original: (input: {
    workspaceId: string
    mediaAssetId: string
    contentType: SupportedImageContentType
  }) =>
    `${MediaKeys.workspacePrefix(input.workspaceId)}/${input.mediaAssetId}/original.${extensionForContentType(input.contentType)}`,
  scopedOriginal: (input: {
    workspaceId: string
    scopeId: string
    mediaAssetId: string
    contentType: SupportedImageContentType
  }) =>
    `${MediaKeys.workspacePrefix(input.workspaceId)}/events/${input.scopeId}/${input.mediaAssetId}/original.${extensionForContentType(input.contentType)}`,
}
