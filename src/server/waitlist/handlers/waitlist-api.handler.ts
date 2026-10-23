import { isIP } from 'node:net'
import { Effect } from 'effect'
import {
  ForbiddenError,
  InvalidInputError,
  runServerResponse,
  type DomainError,
} from '@/server/effect'
import {
  WaitlistPageInput,
  WaitlistSignupInput,
  WaitlistUnsubscribeInput,
} from '../contracts/waitlist.contracts'
import type {
  WaitlistActor,
  WaitlistPage,
  WaitlistPageInput as PageInput,
  WaitlistSignupInput as SignupInput,
} from '../contracts/waitlist.contracts'
import type { WaitlistConfig } from '../waitlist.config'
import { requireWaitlistAdmin } from '../services/waitlist.service'

type Dependencies = {
  config: () => WaitlistConfig
  actor: (request: Request) => Effect.Effect<WaitlistActor, DomainError>
  signup: (
    input: SignupInput,
    config: WaitlistConfig,
    ip?: string
  ) => Effect.Effect<{ accepted: true }, DomainError>
  list: (
    actor: WaitlistActor,
    config: WaitlistConfig,
    input: PageInput
  ) => Effect.Effect<WaitlistPage, DomainError>
  unsubscribe: (
    actor: WaitlistActor,
    config: WaitlistConfig,
    id: string
  ) => Effect.Effect<{ updated: true }, DomainError>
}
const invalid = (status = 400) =>
  new InvalidInputError({
    category: 'validation',
    code: 'WAITLIST_INVALID_INPUT',
    userMessageKey: 'serverErrors.WAITLIST_INVALID_INPUT',
    httpStatus: status,
  })
const untrusted = () =>
  new ForbiddenError({
    category: 'authorization',
    code: 'WAITLIST_UNTRUSTED_ORIGIN',
    userMessageKey: 'serverErrors.WAITLIST_INVALID_INPUT',
  })

/** Bound streamed bodies as well as Content-Length, which is not authoritative. */
function body(request: Request) {
  return Effect.tryPromise({
    try: async () => {
      if (
        request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !==
        'application/json'
      )
        throw invalid(415)
      if (Number(request.headers.get('content-length') ?? 0) > 4096) throw invalid(413)
      const reader = request.body?.getReader()
      if (!reader) throw invalid()
      const chunks: Uint8Array[] = []
      let size = 0
      try {
        while (true) {
          const chunk = await reader.read()
          if (chunk.done) break
          size += chunk.value.byteLength
          if (size > 4096) {
            await reader.cancel()
            throw invalid(413)
          }
          chunks.push(chunk.value)
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
      try {
        return JSON.parse(new TextDecoder().decode(bytes)) as unknown
      } catch {
        throw invalid()
      }
    },
    catch: (error) => (error instanceof InvalidInputError ? error : invalid()),
  })
}

function withCors(response: Response, origin: string | null, config: WaitlistConfig) {
  response.headers.set('Vary', 'Origin')
  response.headers.set('Cache-Control', 'private, no-store')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  if (origin && config.allowedOrigins.has(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept-Language')
  }
  if (response.status === 429) response.headers.set('Retry-After', '600')
  return response
}

export function createWaitlistHandlers(deps: Dependencies) {
  return {
    async signup(request: Request) {
      const config = deps.config()
      const origin = request.headers.get('origin')
      const program = Effect.gen(function* () {
        if (!origin || !config.allowedOrigins.has(origin)) return yield* Effect.fail(untrusted())
        if (request.method === 'OPTIONS') {
          if (request.headers.get('access-control-request-method') !== 'POST')
            return yield* Effect.fail(untrusted())
          const requestedHeaders = (request.headers.get('access-control-request-headers') ?? '')
            .split(',')
            .map((h) => h.trim().toLowerCase())
            .filter(Boolean)
          if (requestedHeaders.some((h) => !['content-type', 'accept-language'].includes(h)))
            return yield* Effect.fail(untrusted())
          return { accepted: true as const }
        }
        const parsed = WaitlistSignupInput.safeParse(yield* body(request))
        if (!parsed.success) return yield* Effect.fail(invalid())
        // Vercel overwrites this trusted proxy header. Ignore arbitrary forwarded IPs elsewhere.
        const proxyIP = config.trustedVercelProxy
          ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim()
          : undefined
        const ip = proxyIP && isIP(proxyIP) ? proxyIP : undefined
        return yield* deps.signup(parsed.data, config, ip)
      })
      return withCors(
        await runServerResponse(program, {
          headers: request.headers,
          operation: 'waitlist_signup',
        }),
        origin,
        config
      )
    },
    async admin(request: Request) {
      const config = deps.config()
      const program = Effect.gen(function* () {
        const actor = yield* deps.actor(request)
        yield* requireWaitlistAdmin(actor, config)
        if (request.method === 'GET') {
          const query = Object.fromEntries(new URL(request.url).searchParams)
          const parsed = WaitlistPageInput.safeParse(query)
          if (!parsed.success) return yield* Effect.fail(invalid())
          return yield* deps.list(actor, config, parsed.data)
        }
        if (request.headers.get('origin') !== new URL(request.url).origin)
          return yield* Effect.fail(untrusted())
        const parsed = WaitlistUnsubscribeInput.safeParse(yield* body(request))
        if (!parsed.success) return yield* Effect.fail(invalid())
        return yield* deps.unsubscribe(actor, config, parsed.data.id)
      })
      const response = await runServerResponse(program, {
        headers: request.headers,
        operation: 'waitlist_admin',
      })
      response.headers.set('X-Content-Type-Options', 'nosniff')
      return response
    },
  }
}
