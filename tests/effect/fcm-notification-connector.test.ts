import { generateKeyPairSync } from 'node:crypto'
import { expect, it } from '@effect/vitest'
import { Effect, Exit, Fiber } from 'effect'
import { createFcmNotificationConnector } from '@/server/notifications/connectors/fcm-notification.con.live'

it.effect(
  'exchanges a service JWT and sends only generic copy plus opaque notification IDs',
  () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const key = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
    const requests: Array<{ url: string; init?: RequestInit }> = []
    const fetcher: typeof fetch = async (input, init) => {
      const url = String(input)
      requests.push({ url, init })
      if (url.includes('oauth2.googleapis.com')) {
        return Response.json({ access_token: 'oauth-test-token' })
      }
      return Response.json({ name: 'projects/test/messages/accepted' })
    }
    const connector = createFcmNotificationConnector(
      {
        projectId: 'gatherory-test',
        clientEmail: 'fcm@example.test',
        privateKey: key,
      },
      fetcher,
      () => 1_800_000_000_000
    )

    return Effect.gen(function* () {
      yield* connector.send({
        deliveryId: 'outbox-opaque-id',
        token: 'device-token-secret',
        payload: {
          type: 'event_changed',
          eventId: 'event-opaque',
          entityId: 'entity-opaque',
          recipientKind: 'device_guest',
          recipientId: 'guest-opaque',
          title: 'Gatherory',
          body: 'Event details changed.',
        },
      })
      expect(requests).toHaveLength(2)
      expect(requests[0]?.url).toBe('https://oauth2.googleapis.com/token')
      expect(requests[1]?.init?.headers).toMatchObject({ authorization: 'Bearer oauth-test-token' })
      const body = JSON.parse(String(requests[1]?.init?.body))
      expect(body.message.notification).toEqual({
        title: 'Gatherory',
        body: 'Event details changed.',
      })
      expect(body.message.data).toEqual({
        type: 'event_changed',
        eventId: 'event-opaque',
        entityId: 'entity-opaque',
        recipientKind: 'device_guest',
        recipientId: 'guest-opaque',
        notificationId: 'outbox-opaque-id',
      })
      expect(body.message.apns.headers).toEqual({ 'apns-collapse-id': 'outbox-opaque-id' })
      expect(body.message.android).toEqual({ collapse_key: 'outbox-opaque-id' })
      expect(
        JSON.stringify({ notification: body.message.notification, data: body.message.data })
      ).not.toContain('device-token-secret')
    })
  }
)

it.effect('keeps FCM disabled without attempting network access', () => {
  let requests = 0
  const connector = createFcmNotificationConnector(undefined, async () => {
    requests += 1
    return Response.json({})
  })
  return Effect.gen(function* () {
    const exit = yield* Effect.exit(
      connector.send({
        token: 'token',
        payload: {
          type: 'event_changed',
          eventId: 'event',
          entityId: 'entity',
          recipientKind: 'user',
          recipientId: 'user',
          title: 'Gatherory',
          body: 'Event details changed.',
        },
      })
    )
    expect(Exit.isFailure(exit)).toBe(true)
    expect(requests).toBe(0)
  })
})

it.effect('classifies only confirmed UNREGISTERED as an invalid registration', () => {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const key = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
  const runWithProviderResponse = (status: number, providerBody: unknown) => {
    const fetcher: typeof fetch = async (input) =>
      String(input).includes('oauth2.googleapis.com')
        ? Response.json({ access_token: 'oauth-test-token' })
        : Response.json(providerBody, { status })
    const connector = createFcmNotificationConnector(
      {
        projectId: 'gatherory-test',
        clientEmail: 'fcm@example.test',
        privateKey: key,
      },
      fetcher
    )
    return Effect.runPromiseExit(
      connector.send({
        token: 'token',
        payload: {
          type: 'event_changed',
          eventId: 'event',
          entityId: 'event',
          recipientKind: 'user',
          recipientId: 'user',
          title: 'Gatherory',
          body: 'Event details changed.',
        },
      })
    )
  }
  return Effect.promise(async () => {
    const invalid = await runWithProviderResponse(404, {
      error: { status: 'NOT_FOUND', details: [{ errorCode: 'UNREGISTERED' }] },
    })
    const badPayload = await runWithProviderResponse(400, {
      error: { status: 'INVALID_ARGUMENT', details: [{ errorCode: 'INVALID_ARGUMENT' }] },
    })
    expect(
      Exit.isFailure(invalid) &&
        invalid.cause.reasons.some(
          (reason) =>
            reason._tag === 'Fail' &&
            reason.error instanceof Error &&
            'kind' in reason.error &&
            reason.error.kind === 'invalid_registration'
        )
    ).toBe(true)
    expect(
      Exit.isFailure(badPayload) &&
        badPayload.cause.reasons.some(
          (reason) =>
            reason._tag === 'Fail' &&
            reason.error instanceof Error &&
            'kind' in reason.error &&
            reason.error.kind === 'invalid_payload'
        )
    ).toBe(true)
  })
})

it.effect('classifies rejected credentials separately from provider throttling and outages', () => {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const key = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
  const failureKind = async (status: number) => {
    let fcm = false
    const fetcher: typeof fetch = async (input) => {
      if (!String(input).includes('oauth2.googleapis.com')) {
        fcm = true
        return Response.json({ error: { status: 'UNAVAILABLE' } }, { status })
      }
      return Response.json({ access_token: 'oauth-test-token' })
    }
    const connector = createFcmNotificationConnector(
      { projectId: 'test', clientEmail: 'test@example.test', privateKey: key },
      fetcher
    )
    const exit = await Effect.runPromiseExit(
      connector.send({
        token: 'token',
        payload: {
          type: 'event_changed',
          eventId: 'e',
          entityId: 'e',
          recipientKind: 'user',
          recipientId: 'u',
          title: 'Gatherory',
          body: 'Event details changed.',
        },
      })
    )
    expect(fcm).toBe(true)
    if (!Exit.isFailure(exit)) return 'success'
    const failure = exit.cause.reasons.find((reason) => reason._tag === 'Fail')
    return failure?._tag === 'Fail' && failure.error instanceof Error && 'kind' in failure.error
      ? failure.error.kind
      : 'unknown'
  }
  return Effect.promise(async () => {
    expect(await failureKind(401)).toBe('credentials')
    expect(await failureKind(429)).toBe('transient')
    expect(await failureKind(503)).toBe('transient')
  })
})

it.effect(
  'rejects malformed service credentials before fetching and configures bounded no-redirect requests',
  () => {
    const requests: RequestInit[] = []
    const fetcher: typeof fetch = async (input, init) => {
      requests.push(init ?? {})
      if (!String(input).includes('oauth2.googleapis.com')) {
        return Response.json({ error: { status: 'UNAVAILABLE' } }, { status: 503 })
      }
      return Response.json({ access_token: 'oauth-test-token' })
    }
    const malformed = createFcmNotificationConnector(
      { projectId: 'test', clientEmail: 'test@example.test', privateKey: 'not-a-pem' },
      fetcher
    )
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const validKey = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
    const bounded = createFcmNotificationConnector(
      { projectId: 'test', clientEmail: 'test@example.test', privateKey: validKey },
      fetcher
    )
    return Effect.gen(function* () {
      const malformedExit = yield* Effect.exit(
        malformed.send({
          token: 'token',
          payload: {
            type: 'event_changed',
            eventId: 'e',
            entityId: 'e',
            recipientKind: 'user',
            recipientId: 'u',
            title: 'Gatherory',
            body: 'Event details changed.',
          },
        })
      )
      expect(Exit.isFailure(malformedExit)).toBe(true)
      expect(requests).toHaveLength(0)
      const sendExit = yield* Effect.exit(
        bounded.send({
          token: 'token',
          payload: {
            type: 'event_changed',
            eventId: 'e',
            entityId: 'e',
            recipientKind: 'user',
            recipientId: 'u',
            title: 'Gatherory',
            body: 'Event details changed.',
          },
        })
      )
      expect(Exit.isFailure(sendExit)).toBe(true)
      expect(requests).toHaveLength(2)
      expect(requests.every((request) => request.redirect === 'error')).toBe(true)
      expect(
        requests.every(
          (request) =>
            request.signal !== undefined && request.signal !== null && !request.signal.aborted
        )
      ).toBe(true)
    })
  }
)

it.effect(
  'classifies fetch timeout and redirect rejection as transient without exposing the cause',
  () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const key = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
    const connector = createFcmNotificationConnector(
      { projectId: 'test', clientEmail: 'test@example.test', privateKey: key },
      async () => {
        throw new TypeError('sensitive network detail')
      }
    )
    return Effect.gen(function* () {
      const exit = yield* Effect.exit(
        connector.send({
          token: 'token',
          payload: {
            type: 'event_changed',
            eventId: 'e',
            entityId: 'e',
            recipientKind: 'user',
            recipientId: 'u',
            title: 'Gatherory',
            body: 'Event details changed.',
          },
        })
      )
      expect(Exit.isFailure(exit)).toBe(true)
      if (Exit.isFailure(exit)) {
        const failure = exit.cause.reasons.find((reason) => reason._tag === 'Fail')
        expect(
          failure?._tag === 'Fail' && failure.error instanceof Error ? failure.error.message : ''
        ).toBe('FCM request failed.')
      }
    })
  }
)

const testPayload = {
  type: 'event_changed',
  eventId: 'event',
  entityId: 'entity',
  recipientKind: 'user',
  recipientId: 'recipient',
  title: 'Gatherory',
  body: 'Event details changed.',
} as const

for (const [status, retryAfter, expected] of [
  [429, '7200', 7_200_000],
  [503, 'Wed, 21 Oct 2026 12:02:00 GMT', 120_000],
  [429, undefined, 60_000],
  [503, 'invalid', undefined],
] as const) {
  it.effect(`preserves Retry-After ${retryAfter ?? 'default'} for ${status}`, () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const connector = createFcmNotificationConnector(
      {
        projectId: 'test',
        clientEmail: 'test@example.test',
        privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
      },
      async (input) =>
        String(input).includes('oauth2.googleapis.com')
          ? Response.json({ access_token: 'oauth-token' })
          : Response.json({}, { status, headers: retryAfter ? { 'retry-after': retryAfter } : {} }),
      () => Date.parse('2026-10-21T12:00:00Z')
    )
    return Effect.gen(function* () {
      const failure = yield* Effect.flip(connector.send({ token: 'token', payload: testPayload }))
      expect(failure.kind).toBe('transient')
      expect(failure.retryAfterMs).toBe(expected)
    })
  })
}

for (const phase of ['oauth', 'send'] as const) {
  it.effect(`aborts the active ${phase} fetch when the delivery Effect is interrupted`, () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    let signal: AbortSignal | undefined
    let started!: () => void
    const ready = new Promise<void>((resolve) => {
      started = resolve
    })
    const connector = createFcmNotificationConnector(
      {
        projectId: 'test',
        clientEmail: 'test@example.test',
        privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
      },
      async (input, init) => {
        if (phase === 'send' && String(input).includes('oauth2.googleapis.com')) {
          return Response.json({ access_token: 'oauth-token' })
        }
        signal = init?.signal ?? undefined
        started()
        return new Promise<Response>((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(new Error('private transport detail')), {
            once: true,
          })
        })
      }
    )
    return Effect.gen(function* () {
      const fiber = yield* Effect.forkChild(
        connector.send({ token: 'token', payload: testPayload })
      )
      yield* Effect.promise(() => ready)
      expect(signal?.aborted).toBe(false)
      yield* Fiber.interrupt(fiber)
      expect(signal?.aborted).toBe(true)
    })
  })
}

it.effect('propagates OAuth throttling delays without exposing response secrets', () => {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const connector = createFcmNotificationConnector(
    {
      projectId: 'test',
      clientEmail: 'test@example.test',
      privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    },
    async () =>
      Response.json(
        { secret: 'private OAuth detail' },
        { status: 429, headers: { 'retry-after': '180' } }
      )
  )
  return Effect.gen(function* () {
    const failure = yield* Effect.flip(connector.send({ token: 'token', payload: testPayload }))
    expect(failure).toMatchObject({ kind: 'transient', retryAfterMs: 180_000 })
    expect(failure.message).not.toContain('private OAuth detail')
  })
})
