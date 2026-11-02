import { Effect } from 'effect'
import { ForbiddenError, InvalidInputError, runServerResponse } from '@/server/effect-utils'
import { McpConnectionPostInputSchema } from './connection.contract'
import type { McpConnectionSessionUser } from './connection-session.con'

const connectionHeaders = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
}

type HandlerDependencies = {
  enabled: boolean
  origin: string
  resourceURL: string
  session: (headers: Headers) => Effect.Effect<McpConnectionSessionUser | null, unknown>
  list: (input: { userId: string; resourceURL: string }) => Effect.Effect<unknown[], unknown>
  reduce: (input: {
    userId: string
    clientId: string
    resourceURL: string
    requestedScopes: string[]
  }) => Effect.Effect<
    | { kind: 'unchanged'; id: string; scopes: string[] }
    | { kind: 'updated'; id: string; scopes: string[]; updatedAt: Date },
    unknown
  >
}

function withConnectionHeaders(response: Response) {
  const headers = new Headers(response.headers)
  for (const [name, value] of Object.entries(connectionHeaders)) headers.set(name, value)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function requestError(code: 'unauthorized' | 'invalid_request') {
  return code === 'unauthorized'
    ? new ForbiddenError({
        category: 'authorization',
        code,
        httpStatus: 401,
        userMessageKey: 'serverErrors.AUTHORIZATION',
      })
    : new InvalidInputError({
        category: 'validation',
        code,
        httpStatus: 400,
        userMessageKey: 'serverErrors.VALIDATION',
      })
}

export function createMcpConnectionHandlers(deps: HandlerDependencies) {
  return {
    GET: async ({ request }: { request: Request }) => {
      if (!deps.enabled)
        return Response.json(
          { enabled: false, user: null, connections: [] },
          { headers: connectionHeaders }
        )
      const program = Effect.gen(function* () {
        const user = yield* deps.session(
          new Headers({ cookie: request.headers.get('cookie') ?? '' })
        )
        const connections = user
          ? yield* deps.list({ userId: user.id, resourceURL: deps.resourceURL })
          : []
        return {
          enabled: true,
          user: user ? { email: user.email, name: user.name, image: user.image } : null,
          connections,
        }
      })
      const response = await runServerResponse(program, {
        headers: request.headers,
        successEnvelope: false,
        legacyErrorCode: true,
        operation: 'mcp_connection_list',
      })
      return withConnectionHeaders(response)
    },

    POST: async ({ request }: { request: Request }) => {
      if (!deps.enabled)
        return Response.json({ error: 'mcp_disabled' }, { status: 404, headers: connectionHeaders })
      const origin = request.headers.get('origin')
      if (origin === null || origin !== deps.origin)
        return Response.json(
          { error: 'invalid_origin' },
          { status: 403, headers: connectionHeaders }
        )

      const program = Effect.gen(function* () {
        const user = yield* deps.session(
          new Headers({ cookie: request.headers.get('cookie') ?? '' })
        )
        if (!user) return yield* Effect.fail(requestError('unauthorized'))

        const body: unknown = yield* Effect.tryPromise({
          try: () => request.json(),
          catch: () => requestError('invalid_request'),
        })

        const parsed = McpConnectionPostInputSchema.safeParse(body)
        if (!parsed.success) return yield* Effect.fail(requestError('invalid_request'))
        const result = yield* deps.reduce({
          userId: user.id,
          clientId: parsed.data.clientId,
          resourceURL: deps.resourceURL,
          requestedScopes: [...new Set(parsed.data.scopes)].sort(),
        })
        return {
          ok: true,
          connection: {
            id: result.id,
            clientId: parsed.data.clientId,
            scopes: result.scopes,
            ...('updatedAt' in result ? { updatedAt: result.updatedAt.toISOString() } : {}),
          },
        }
      })
      const response = await runServerResponse(program, {
        headers: request.headers,
        successEnvelope: false,
        legacyErrorCode: true,
        operation: 'mcp_connection_reduce_scopes',
      })
      return withConnectionHeaders(response)
    },
  }
}
