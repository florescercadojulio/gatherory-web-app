import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import {
  consumeAndroidAppleVerification,
  createAndroidAppleVerification,
  deleteAndroidAppleVerification,
  findActiveAndroidAppleSession,
} from '@/server/auth/repos/android-apple-sign-in.repo.persistence'
import {
  androidAppleBetterAuthUrl,
  androidAppleSignInEnabled,
  getAndroidAppleSession,
  runAndroidAppleBetterAuth,
} from './android-apple-sign-in.adapter'

const HANDOFF_TTL_MS = 5 * 60 * 1000
const START_TTL_MS = 5 * 60 * 1000
const CODE_BYTES = 32
const APP_CALLBACK = 'gatherory://auth/apple/callback'
const START_COOKIE = 'gatherory_android_apple_start'
const CHALLENGE_PATTERN = /^[A-Za-z0-9_-]{43}$/
const STATE_PATTERN = /^[A-Za-z0-9_-]{43}$/
const VERIFIER_PATTERN = /^[A-Za-z0-9._~-]{43,128}$/

type Handoff = {
  challenge: string
  clientState: string
  userId: string
  sessionId: string
}

type StartTransaction = {
  challenge: string
  clientState: string
  callbackNonce: string
}

function disabledResponse(): Response {
  return Response.json(
    { error: 'APPLE_SIGN_IN_UNAVAILABLE' },
    {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    }
  )
}

function errorResponse(status: number, error: string): Response {
  return Response.json(
    { error },
    {
      status,
      headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
    }
  )
}

function redirectResponse(location: string, cookies: string[] = []): Response {
  const headers = new Headers({
    Location: location,
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
  })
  for (const cookie of cookies) headers.append('Set-Cookie', cookie)
  return new Response(null, { status: 303, headers })
}

function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

export function androidAppleHandoffRecordId(code: string): string {
  return `android-apple-${hash(code)}`
}

export function androidAppleStartRecordId(nonce: string): string {
  return `android-apple-start-${hash(nonce)}`
}

function digestChallenge(verifier: string): Buffer {
  return createHash('sha256').update(verifier, 'ascii').digest()
}

function sameSecret(left: string, right: string): boolean {
  const a = Buffer.from(left, 'ascii')
  const b = Buffer.from(right, 'ascii')
  return a.length === b.length && timingSafeEqual(a, b)
}

function startCookieValue(request: Request): string | null {
  const cookies = request.headers.get('cookie') ?? ''
  for (const item of cookies.split(';')) {
    const [name, ...rest] = item.trim().split('=')
    if (name === START_COOKIE) return rest.join('=') || null
  }
  return null
}

function startCookie(value: string, clear = false): string {
  return `${START_COOKIE}=${clear ? '' : value}; Path=/api/auth/android/apple; Max-Age=${clear ? 0 : START_TTL_MS / 1000}; HttpOnly; Secure; SameSite=Lax`
}

async function readBoundedText(request: Request, maxBytes: number): Promise<string | null> {
  if (!request.body) return ''
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) {
        await reader.cancel()
        return null
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(bytes)
}

/** Begin Apple OAuth from a browser without sending any native bearer token to it. */
export async function handleAndroidAppleStart(
  request: Request,
  dependencies: {
    enabled?: boolean
    runAuth?: (request: Request) => Promise<Response>
  } = {}
): Promise<Response> {
  if (!(dependencies.enabled ?? androidAppleSignInEnabled())) return disabledResponse()

  const url = new URL(request.url)
  const challenge = url.searchParams.get('challenge') ?? ''
  const clientState = url.searchParams.get('state') ?? ''
  const requestSignUp = url.searchParams.get('requestSignUp') === 'true'
  if (!CHALLENGE_PATTERN.test(challenge) || !STATE_PATTERN.test(clientState)) {
    return errorResponse(400, 'INVALID_APPLE_HANDOFF')
  }

  const startNonce = randomBytes(CODE_BYTES).toString('base64url')
  const callbackNonce = randomBytes(CODE_BYTES).toString('base64url')
  const now = new Date()
  const start: StartTransaction = { challenge, clientState, callbackNonce }
  await createAndroidAppleVerification({
    id: androidAppleStartRecordId(startNonce),
    identifier: 'android-apple-start',
    value: JSON.stringify(start),
    expiresAt: new Date(now.getTime() + START_TTL_MS),
    createdAt: now,
    updatedAt: now,
  })

  const deleteStart = () => deleteAndroidAppleVerification(androidAppleStartRecordId(startNonce))
  try {
    const callbackURL = new URL('/api/auth/android/apple/complete', androidAppleBetterAuthUrl())
    callbackURL.searchParams.set('challenge', challenge)
    callbackURL.searchParams.set('state', clientState)
    callbackURL.searchParams.set('bridge', callbackNonce)
    const authURL = new URL('/api/auth/sign-in/social', androidAppleBetterAuthUrl())
    const authRequest = new Request(authURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: new URL(androidAppleBetterAuthUrl()).origin,
        'User-Agent': request.headers.get('user-agent') ?? 'Gatherory Android',
      },
      body: JSON.stringify({
        provider: 'apple',
        callbackURL: callbackURL.toString(),
        errorCallbackURL: callbackURL.toString(),
        requestSignUp,
        disableRedirect: true,
      }),
    })
    const authResponse = dependencies.runAuth
      ? await dependencies.runAuth(authRequest)
      : await runAndroidAppleBetterAuth(authRequest)

    if (!authResponse.ok) {
      await deleteStart()
      return errorResponse(503, 'APPLE_SIGN_IN_UNAVAILABLE')
    }
    const result = (await authResponse.json()) as { url?: unknown }
    if (typeof result.url !== 'string') {
      await deleteStart()
      return errorResponse(503, 'APPLE_SIGN_IN_UNAVAILABLE')
    }

    const appleURL = new URL(result.url)
    if (appleURL.protocol !== 'https:' || appleURL.hostname !== 'appleid.apple.com') {
      await deleteStart()
      return errorResponse(503, 'APPLE_SIGN_IN_UNAVAILABLE')
    }
    const responseHeaders = authResponse.headers as Headers & { getSetCookie?: () => string[] }
    const cookies =
      responseHeaders.getSetCookie?.() ??
      [authResponse.headers.get('set-cookie')].filter((value): value is string => Boolean(value))
    cookies.push(startCookie(startNonce))
    return redirectResponse(appleURL.toString(), cookies)
  } catch {
    await deleteStart()
    return errorResponse(503, 'APPLE_SIGN_IN_UNAVAILABLE')
  }
}

/** Finish Better Auth's regular callback and hand Android a short-lived opaque code. */
export async function handleAndroidAppleComplete(request: Request): Promise<Response> {
  if (!androidAppleSignInEnabled()) return disabledResponse()

  const url = new URL(request.url)
  const challenge = url.searchParams.get('challenge') ?? ''
  const clientState = url.searchParams.get('state') ?? ''
  const callbackNonce = url.searchParams.get('bridge') ?? ''
  const startNonce = startCookieValue(request)
  const clearStartCookie = [startCookie('', true)]
  if (
    !startNonce ||
    !CHALLENGE_PATTERN.test(challenge) ||
    !STATE_PATTERN.test(clientState) ||
    !CHALLENGE_PATTERN.test(callbackNonce)
  ) {
    return redirectResponse(`${APP_CALLBACK}?error=sign_in_failed`, clearStartCookie)
  }

  const startedAt = new Date()
  const consumedStart = await consumeAndroidAppleVerification(androidAppleStartRecordId(startNonce))
  if (!consumedStart || consumedStart.expiresAt <= startedAt) {
    return redirectResponse(`${APP_CALLBACK}?error=sign_in_failed`, clearStartCookie)
  }
  let start: StartTransaction
  try {
    const parsed = JSON.parse(consumedStart.value) as Partial<StartTransaction>
    if (
      typeof parsed.challenge !== 'string' ||
      typeof parsed.clientState !== 'string' ||
      typeof parsed.callbackNonce !== 'string'
    ) {
      return redirectResponse(`${APP_CALLBACK}?error=sign_in_failed`, clearStartCookie)
    }
    start = parsed as StartTransaction
  } catch {
    return redirectResponse(`${APP_CALLBACK}?error=sign_in_failed`, clearStartCookie)
  }
  if (
    !sameSecret(start.challenge, challenge) ||
    !sameSecret(start.clientState, clientState) ||
    !sameSecret(start.callbackNonce, callbackNonce)
  ) {
    return redirectResponse(`${APP_CALLBACK}?error=sign_in_failed`, clearStartCookie)
  }
  // Better Auth's errorCallbackURL preserves the same bridge parameters. Only
  // after verifying this browser's one-use start transaction do we bind a
  // cancellation result to the native flow's state.
  if (url.searchParams.has('error')) {
    const appURL = new URL(APP_CALLBACK)
    appURL.searchParams.set('error', 'sign_in_failed')
    appURL.searchParams.set('state', start.clientState)
    return redirectResponse(appURL.toString(), clearStartCookie)
  }

  const result = await getAndroidAppleSession(request.headers)
  const sessionId = result?.session.id
  const userId = result?.user.id
  if (!sessionId || !userId)
    return redirectResponse(`${APP_CALLBACK}?error=sign_in_failed`, clearStartCookie)

  const code = randomBytes(CODE_BYTES).toString('base64url')
  const now = new Date()
  const handoff: Handoff = { challenge, clientState, userId, sessionId }
  try {
    await createAndroidAppleVerification({
      id: androidAppleHandoffRecordId(code),
      identifier: 'android-apple-handoff',
      value: JSON.stringify(handoff),
      expiresAt: new Date(now.getTime() + HANDOFF_TTL_MS),
      createdAt: now,
      updatedAt: now,
    })
  } catch {
    return redirectResponse(`${APP_CALLBACK}?error=sign_in_failed`, clearStartCookie)
  }

  const appURL = new URL(APP_CALLBACK)
  appURL.searchParams.set('code', code)
  appURL.searchParams.set('state', clientState)
  return redirectResponse(appURL.toString(), clearStartCookie)
}

/** Atomically redeem a handoff code once, proving possession of its PKCE verifier. */
export async function handleAndroidAppleExchange(request: Request): Promise<Response> {
  if (!androidAppleSignInEnabled()) return disabledResponse()
  const length = Number(request.headers.get('content-length') ?? 0)
  if (length > 2048) return errorResponse(400, 'INVALID_APPLE_HANDOFF')

  let input: unknown
  try {
    const body = await readBoundedText(request, 2048)
    if (body === null) return errorResponse(400, 'INVALID_APPLE_HANDOFF')
    input = JSON.parse(body)
  } catch {
    return errorResponse(400, 'INVALID_APPLE_HANDOFF')
  }
  if (!input || typeof input !== 'object') return errorResponse(400, 'INVALID_APPLE_HANDOFF')
  const code = (input as Record<string, unknown>).code
  const verifier = (input as Record<string, unknown>).verifier
  const clientState = (input as Record<string, unknown>).state
  if (
    typeof code !== 'string' ||
    !/^[A-Za-z0-9_-]{43}$/.test(code) ||
    typeof verifier !== 'string' ||
    !VERIFIER_PATTERN.test(verifier) ||
    typeof clientState !== 'string' ||
    !STATE_PATTERN.test(clientState)
  ) {
    return errorResponse(400, 'INVALID_APPLE_HANDOFF')
  }

  const exchangeNow = new Date()
  const consumed = await consumeAndroidAppleVerification(androidAppleHandoffRecordId(code))
  if (!consumed || consumed.expiresAt <= exchangeNow)
    return errorResponse(401, 'INVALID_APPLE_HANDOFF')

  let handoff: Handoff
  try {
    const parsed = JSON.parse(consumed.value) as Partial<Handoff>
    if (
      typeof parsed.challenge !== 'string' ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.sessionId !== 'string' ||
      typeof parsed.clientState !== 'string'
    ) {
      return errorResponse(401, 'INVALID_APPLE_HANDOFF')
    }
    handoff = parsed as Handoff
  } catch {
    return errorResponse(401, 'INVALID_APPLE_HANDOFF')
  }

  const actual = digestChallenge(verifier)
  const expected = Buffer.from(handoff.challenge, 'base64url')
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return errorResponse(401, 'INVALID_APPLE_HANDOFF')
  }
  const expectedState = Buffer.from(handoff.clientState, 'ascii')
  const actualState = Buffer.from(clientState, 'ascii')
  if (expectedState.length !== actualState.length || !timingSafeEqual(expectedState, actualState)) {
    return errorResponse(401, 'INVALID_APPLE_HANDOFF')
  }

  const active = await findActiveAndroidAppleSession(handoff.sessionId, handoff.userId, exchangeNow)
  if (!active) return errorResponse(401, 'INVALID_APPLE_HANDOFF')

  return Response.json(
    { token: active.token, user: active.user },
    {
      headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
    }
  )
}

export const androidAppleSignInContract = {
  appCallback: APP_CALLBACK,
  challengePattern: CHALLENGE_PATTERN,
  statePattern: STATE_PATTERN,
  verifierPattern: VERIFIER_PATTERN,
  handoffTtlMs: HANDOFF_TTL_MS,
} as const
