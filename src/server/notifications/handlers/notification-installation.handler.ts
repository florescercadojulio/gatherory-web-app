import { Effect } from 'effect'
import { z } from 'zod'
import { PgClientLive } from '@/db'
import { runServerResponse } from '@/server/effect-utils'
import { ForbiddenError, tryServerOperation } from '@/server/effect-utils'
import { requestJson, validateInput } from '@/server/http-errors'
import { nativeSyncUser } from '@/server/sync/handlers/native-sync-auth.handler'
import { verifyDeviceGuestProfile } from '@/server/events/repos/device-guest.repo.persistence'
import { GuestCredentialSchema } from '@/server/events/contracts/guest-capability.contracts'
import {
  NotificationInstallationDetachSchema,
  NotificationInstallationInputSchema,
} from '../contracts/notification.contracts'
import {
  detachNotificationInstallation,
  registerNotificationInstallation,
} from '../workflows/notification.workflows.live'

function guestIdentity(request: Request) {
  const identity = validateInput(
    z.object({
      guestId: z.uuid(),
      credential: GuestCredentialSchema,
    }),
    {
      guestId: request.headers.get('x-gatherory-guest-id'),
      credential: request.headers.get('x-gatherory-guest-token'),
    }
  )
  return Effect.flatMap(identity, ({ guestId, credential }) =>
    verifyDeviceGuestProfile({ guestId, credential })
  ).pipe(Effect.map((profile) => ({ kind: 'device_guest' as const, id: profile.id })))
}

export function notificationInstallationResponse(request: Request) {
  return runServerResponse(
    Effect.gen(function* () {
      if (request.method === 'DELETE') {
        const input = yield* validateInput(
          NotificationInstallationDetachSchema,
          yield* requestJson(request)
        )
        const result = yield* detachNotificationInstallation({
          id: input.installationId,
          secret: input.installationSecret,
          revision: input.revision,
        })
        return result
      }

      const input = yield* validateInput(
        NotificationInstallationInputSchema,
        yield* requestJson(request)
      )
      const hasGuestProof =
        request.headers.has('x-gatherory-guest-id') ||
        request.headers.has('x-gatherory-guest-token')
      const hasAccountCredential =
        request.headers.has('authorization') ||
        /(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=/.test(
          request.headers.get('cookie') ?? ''
        )
      if (hasGuestProof && hasAccountCredential) {
        return yield* Effect.fail(
          new ForbiddenError({
            category: 'authorization',
            code: 'NOTIFICATION_IDENTITY_AMBIGUOUS',
            userMessageKey: 'serverErrors.AUTHORIZATION',
          })
        )
      }
      const account = yield* tryServerOperation(
        {
          category: 'system',
          code: 'SESSION_LOOKUP_FAILED',
          userMessageKey: 'serverErrors.SESSION_LOOKUP_FAILED',
        },
        () => nativeSyncUser(request)
      )
      if (account && hasGuestProof) {
        return yield* Effect.fail(
          new ForbiddenError({
            category: 'authorization',
            code: 'NOTIFICATION_IDENTITY_AMBIGUOUS',
            userMessageKey: 'serverErrors.AUTHORIZATION',
          })
        )
      }
      if (!account && !hasGuestProof) {
        return yield* Effect.fail(
          new ForbiddenError({
            category: 'authorization',
            code: 'UNAUTHORIZED',
            httpStatus: 401,
            userMessageKey: 'serverErrors.UNAUTHORIZED',
          })
        )
      }
      const recipient = account
        ? { kind: 'user' as const, id: account.id }
        : yield* guestIdentity(request)
      return yield* registerNotificationInstallation({
        id: input.installationId,
        secret: input.installationSecret,
        revision: input.revision,
        recipient,
        platform: input.platform,
        locale: input.locale,
        token: input.token,
        enabled: input.enabled,
      })
    }).pipe(Effect.provide(PgClientLive)),
    {
      headers: request.headers,
      operation: `notifications.installation.${request.method.toLowerCase()}`,
    }
  )
}
