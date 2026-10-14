import { Effect } from 'effect'
import { z } from 'zod'
import { PgClientLive } from '@/db'
import {
  ForbiddenError,
  InvalidInputError,
  runServerResponse,
  tryServerOperation,
} from '@/server/effect'
import { nativeSyncUser } from '@/server/sync/native-sync-auth'
import {
  BlockPersonInput,
  HideImageInput,
  ReportImageInput,
  ReviewReportInput,
  isTrustedModerationMutation,
  reportStatuses,
} from './contracts'
import { blockPerson, listBlockedPeople, unblockPerson } from './user-block.repo'
import {
  hiddenImageIDs,
  hideImage,
  listAbuseReports,
  reportImage,
  reportImagePreview,
  reviewAbuseReport,
} from './moderation.repo'

type Operation =
  'report' | 'hide' | 'hidden' | 'list' | 'review' | 'preview' | 'blocks' | 'block' | 'unblock'
export async function moderationResponse(request: Request, operation: Operation) {
  const program = Effect.gen(function* () {
    const actor = yield* tryServerOperation(
      {
        category: 'system',
        code: 'SESSION_LOOKUP_FAILED',
        userMessageKey: 'serverErrors.SESSION_LOOKUP_FAILED',
      },
      () => nativeSyncUser(request)
    )
    if (!actor?.emailVerified) {
      return yield* Effect.fail(
        new ForbiddenError({
          category: 'authorization',
          code: 'MODERATION_SESSION_REQUIRED',
          userMessageKey: 'serverErrors.MODERATION_SESSION_REQUIRED',
          httpStatus: actor ? 403 : 401,
        })
      )
    }
    if (operation === 'hidden') return yield* hiddenImageIDs(actor.id)
    if (operation === 'blocks') return yield* listBlockedPeople(actor.id)
    if (operation === 'list') {
      const input = z
        .enum(reportStatuses)
        .safeParse(new URL(request.url).searchParams.get('status') ?? 'open')
      if (!input.success)
        return yield* Effect.fail(
          new InvalidInputError({
            category: 'validation',
            code: 'INVALID_REPORT_STATUS',
            userMessageKey: 'serverErrors.INVALID_REPORT_STATUS',
          })
        )
      return yield* listAbuseReports(actor.id, input.data)
    }
    if (operation === 'preview') {
      const input = z.uuid().safeParse(new URL(request.url).searchParams.get('reportId'))
      if (!input.success)
        return yield* Effect.fail(
          new InvalidInputError({
            category: 'validation',
            code: 'INVALID_REPORT_ID',
            userMessageKey: 'serverErrors.INVALID_REPORT_ID',
          })
        )
      return yield* reportImagePreview(actor.id, input.data)
    }
    if (!isTrustedModerationMutation(request, process.env.BETTER_AUTH_URL))
      return yield* Effect.fail(
        new ForbiddenError({
          category: 'authorization',
          code: 'UNTRUSTED_MODERATION_REQUEST',
          userMessageKey: 'serverErrors.UNTRUSTED_MODERATION_REQUEST',
        })
      )
    const body = yield* Effect.tryPromise({
      try: () => request.json(),
      catch: (cause) =>
        new InvalidInputError({
          category: 'validation',
          code: 'INVALID_REPORT_JSON',
          userMessageKey: 'serverErrors.INVALID_REPORT_JSON',
          cause,
        }),
    })
    if (operation === 'block' || operation === 'unblock') {
      const input = BlockPersonInput.safeParse(body)
      if (input.success)
        return yield* operation === 'block'
          ? blockPerson(actor.id, input.data.blockedUserId)
          : unblockPerson(actor.id, input.data.blockedUserId)
    } else if (operation === 'report') {
      const input = ReportImageInput.safeParse(body)
      if (input.success) return yield* reportImage(actor.id, input.data)
    } else if (operation === 'hide') {
      const input = HideImageInput.safeParse(body)
      if (input.success) return yield* hideImage(actor.id, input.data.mediaAssetId)
    } else {
      const input = ReviewReportInput.safeParse(body)
      if (input.success) return yield* reviewAbuseReport(actor.id, input.data)
    }
    return yield* Effect.fail(
      new InvalidInputError({
        category: 'validation',
        code: 'INVALID_REPORT_INPUT',
        userMessageKey: 'serverErrors.INVALID_REPORT_INPUT',
      })
    )
  }).pipe(Effect.provide(PgClientLive))
  return runServerResponse(program, { headers: request.headers })
}
