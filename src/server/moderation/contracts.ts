import { z } from 'zod'

export const reportStatuses = ['open', 'in_review', 'resolved', 'dismissed'] as const
export const ReportImageInput = z
  .object({
    mediaAssetId: z.uuid(),
    reason: z.enum(['inappropriate', 'harassment', 'privacy', 'other']),
    detail: z.string().trim().max(2000).default(''),
  })
  .strict()
export const HideImageInput = z.object({ mediaAssetId: z.uuid() }).strict()
export const BlockPersonInput = z
  .object({ blockedUserId: z.string().trim().min(1).max(255) })
  .strict()
export const ReviewReportInput = z
  .object({
    reportId: z.uuid(),
    expectedStatus: z.enum(reportStatuses),
    action: z.enum(['start_review', 'hide_image', 'dismiss']),
    note: z.string().trim().min(5).max(2000),
  })
  .strict()

/** Closed decisions cannot be accidentally overwritten by a stale browser. */
export function nextReportStatus(
  status: (typeof reportStatuses)[number],
  action: z.infer<typeof ReviewReportInput>['action']
) {
  if (status !== 'open' && status !== 'in_review') return null
  if (action === 'start_review') return status === 'open' ? ('in_review' as const) : null
  return action === 'hide_image' ? ('resolved' as const) : ('dismissed' as const)
}

/** Cookie mutations require same-origin; native bearer requests need no cookies.
 * Authentication still verifies the bearer token, never just its presence. */
export function isTrustedModerationMutation(request: Request, applicationURL: string | undefined) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))
    return false
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      return !!applicationURL && origin === new URL(applicationURL).origin
    } catch {
      return false
    }
  }
  return /^Bearer \S+$/i.test(request.headers.get('authorization') ?? '')
}
