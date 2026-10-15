import {
  createMiddleware,
  executeMiddleware,
  type AnyFunctionMiddleware,
  type AnyRequestMiddleware,
} from '@tanstack/start-client-core'
import { runWithStartContext } from '@tanstack/start-storage-context'
import { Effect, Layer } from 'effect'
import { beforeEach, expect, test, vi } from 'vitest'

const calls = vi.hoisted(() => {
  const workflowNames = [
    'getBlueprintAuthoringContext',
    'listBlueprintTemplates',
    'getBlueprintDraft',
    'getBlueprintStarter',
    'createBlueprintDraft',
    'saveBlueprintDraft',
    'publishBlueprintDraft',
    'retireBlueprintTemplate',
    'deleteBlueprintDraft',
    'previewBlueprintDraft',
    'createBlueprintAuthoringWorkspace',
  ] as const
  const workflows = Object.fromEntries(workflowNames.map((name) => [name, vi.fn()])) as Record<
    (typeof workflowNames)[number],
    ReturnType<typeof vi.fn>
  >
  const definitions: Array<{
    middleware: Array<AnyFunctionMiddleware | AnyRequestMiddleware>
    handler?: (input: { context: Record<string, unknown>; data: unknown }) => unknown
  }> = []
  const createServerFn = vi.fn(() => {
    const definition: (typeof definitions)[number] = { middleware: [] }
    definitions.push(definition)
    const builder = {
      middleware(middleware: Array<AnyFunctionMiddleware | AnyRequestMiddleware>) {
        definition.middleware.push(...middleware)
        return builder
      },
      validator(_schema: unknown) {
        return builder
      },
      handler(handler: (input: { context: Record<string, unknown>; data: unknown }) => unknown) {
        definition.handler = handler
        return vi.fn()
      },
    }
    return builder
  })
  return {
    workflowNames,
    workflows,
    definitions,
    createServerFn,
    getSession: vi.fn(),
    getRequestHeaders: vi.fn(),
    setResponseHeader: vi.fn(),
  }
})

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: calls.getSession } } }))
vi.mock('@tanstack/react-start', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-start')>()),
  createServerFn: calls.createServerFn,
}))
vi.mock('@tanstack/react-start/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-start/server')>()),
  getRequestHeaders: calls.getRequestHeaders,
  setResponseHeader: calls.setResponseHeader,
}))
vi.mock('@/db', () => ({ PgClientLive: Layer.empty }))
vi.mock('@/server/effect', async () => {
  const { Effect: EffectRuntime } = await import('effect')
  return {
    runServerEffect: (program: Effect.Effect<unknown, unknown, never>) =>
      EffectRuntime.runPromise(program),
  }
})
vi.mock('@/server/blueprints/workflows/blueprint-authoring.workflows.live', () => calls.workflows)

const names = calls.workflowNames
const actor = { id: 'session-actor', name: 'Signed in person', email: 'actor@example.test' }
const requestHeaders = new Headers({ cookie: 'test-session' })
let moduleLoaded = false

async function loadHandlers() {
  if (!moduleLoaded) {
    for (const name of names)
      calls.workflows[name].mockImplementation((...args: unknown[]) =>
        Effect.succeed({ name, args })
      )
    await import('@/server/blueprints/handlers/blueprint-authoring.functions')
    moduleLoaded = true
  }
  return calls.definitions
}

async function execute(name: (typeof names)[number], data: unknown = {}) {
  const definitions = await loadHandlers()
  const definition = definitions[names.indexOf(name)]!
  let handlerRuns = 0
  let handlerValue: unknown
  const terminal = createMiddleware({ type: 'function' }).server(
    async ({ context, data: handlerData, next }) => {
      handlerRuns += 1
      handlerValue = await definition.handler!({ context: context ?? {}, data: handlerData })
      return next({ context: { testHandlerValue: handlerValue } })
    }
  )
  const result = await runWithStartContext(
    {
      getRouter: async () => {
        throw new Error('Router is not used by server-function middleware tests')
      },
      request: new Request('https://gatherory.test/authoring-server-function'),
      startOptions: {},
      contextAfterGlobalMiddlewares: {},
      executedRequestMiddlewares: new Set(),
      handlerType: 'serverFn',
    },
    () =>
      executeMiddleware([...definition.middleware, terminal], 'server', {
        method: name.startsWith('get') || name === 'listBlueprintTemplates' ? 'GET' : 'POST',
        data,
        context: {},
        headers: requestHeaders,
        serverFnMeta: { id: `blueprint-authoring-${name}` },
      })
  )
  return { result, handlerRuns, handlerValue }
}

beforeEach(() => {
  vi.clearAllMocks()
  calls.getRequestHeaders.mockReturnValue(requestHeaders)
  calls.getSession.mockResolvedValue({
    session: { id: 'session-1', activeOrganizationId: null },
    user: actor,
  })
  if (moduleLoaded) {
    for (const name of names)
      calls.workflows[name].mockImplementation((...args: unknown[]) =>
        Effect.succeed({ name, args })
      )
  }
})

test.each(names)(
  '%s does not invoke its workflow without an authenticated session',
  async (name) => {
    calls.getSession.mockResolvedValue(null)
    const { result, handlerRuns } = await execute(name, {
      userId: 'spoofed-user',
      actorId: 'spoofed-actor',
      user: { id: 'spoofed-user' },
    })
    expect(result.error).toBeDefined()
    expect(handlerRuns).toBe(0)
    for (const workflow of Object.values(calls.workflows)) expect(workflow).not.toHaveBeenCalled()
  }
)

test.each(names)(
  '%s binds workflow identity to the authenticated session, not client data',
  async (name) => {
    const data = {
      userId: 'spoofed-user',
      actorId: 'spoofed-actor',
      user: { id: 'spoofed-user', name: 'Impersonator' },
      organizationId: 'client-selected-workspace',
    }
    const { result, handlerRuns } = await execute(name, data)
    expect(result.error).toBeUndefined()
    expect(handlerRuns).toBe(1)
    const workflow = calls.workflows[name]
    expect(workflow).toHaveBeenCalledTimes(1)
    const expectedArgs =
      name === 'getBlueprintAuthoringContext'
        ? [actor.id]
        : name === 'createBlueprintAuthoringWorkspace'
          ? [actor]
          : [actor.id, data]
    expect(workflow).toHaveBeenCalledWith(...expectedArgs)
  }
)
