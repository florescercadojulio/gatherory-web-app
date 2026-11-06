import { beforeEach, expect, test, vi } from 'vitest'
import { Effect, Layer } from 'effect'

const mocks = vi.hoisted(() => ({ workflow: vi.fn(), middleware: vi.fn() }))

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    const builder = {
      middleware: (value: unknown) => {
        mocks.middleware(value)
        return builder
      },
      handler: (fn: unknown) => fn,
    }
    return builder
  },
}))
vi.mock('@/lib/auth.middleware', () => ({ requireSessionMiddleware: 'required-session' }))
vi.mock('@/db', () => ({ PgClientLive: Layer.empty }))
vi.mock('@/server/sync/workflows/native-insights.workflows.live', () => ({
  listNativeWorkspaceInsightsWorkflow: mocks.workflow,
}))

import { listNativeWorkspaceInsights } from '@/server/sync/handlers/native-workspace-insights.handler'
import { NativeInsightsServiceLive } from '@/server/sync/services/native-insights.service.live'
import { NativeInsightsRepo } from '@/server/sync/repos/native-insights.repo.api'
import { listNativeWorkspaceInsightsWorkflow as workflow } from '@/server/sync/workflows/native-workspace-insights.workflow'
import { PersistenceError } from '@/lib/domain-errors'

const invoke = listNativeWorkspaceInsights as unknown as (input: {
  context: { user: { id: string } }
}) => Promise<{
  ok: boolean
  data?: { workspaces: Array<{ currencyCode: string | null }> }
  error?: unknown
}>

expect(mocks.middleware).toHaveBeenCalledWith(['required-session'])

const summary = (currencyCode: string | null) => ({
  id: 'main-event',
  title: 'Trip',
  startsAt: '2026-12-01T12:00:00.000Z',
  endsAt: null,
  isAllDay: false,
  timeZone: 'America/Detroit',
  location: null,
  status: 'ongoing',
  participantCount: 1,
  participants: [],
  scheduledEventCount: 0,
  openIdeaCount: 0,
  approvedIdeaCount: 0,
  budgetCap: null,
  currencyCode,
  trackedCost: 0,
  updatedAt: '2026-11-01T12:00:00.000Z',
  upcomingEvents: [],
})

function useRepository(result: {
  workspaces: ReturnType<typeof summary>[]
  unavailableSnapshotCount: number
}) {
  const repoLayer = Layer.succeed(NativeInsightsRepo, {
    listForUser: () => Effect.succeed(result),
  })
  const injectedWorkflow = (...args: Parameters<typeof workflow>) =>
    workflow(...args).pipe(Effect.provide(NativeInsightsServiceLive.pipe(Layer.provide(repoLayer))))
  mocks.workflow.mockImplementation(injectedWorkflow)
}

beforeEach(() => {
  vi.clearAllMocks()
})

test('authenticated overview response serializes each repository currency, including unknown', async () => {
  useRepository({ workspaces: [summary('JPY'), summary(null)], unavailableSnapshotCount: 0 })

  const response = await invoke({ context: { user: { id: 'session-user' } } })

  expect(mocks.workflow).toHaveBeenCalledWith('session-user')
  expect(response).toMatchObject({
    ok: true,
    data: { workspaces: [{ currencyCode: 'JPY' }, { currencyCode: null }] },
  })
  expect(JSON.stringify(response)).toContain('"currencyCode":null')
})

test('overview boundary keeps safe error copy and does not serialize persistence details', async () => {
  const repoLayer = Layer.succeed(NativeInsightsRepo, {
    listForUser: () =>
      Effect.fail(
        new PersistenceError({
          category: 'system',
          code: 'INSIGHTS_READ_FAILED',
          userMessageKey: 'serverErrors.SYSTEM',
          debugMessage: 'private database detail',
        })
      ),
  })
  mocks.workflow.mockImplementation((...args: Parameters<typeof workflow>) =>
    workflow(...args).pipe(Effect.provide(NativeInsightsServiceLive.pipe(Layer.provide(repoLayer))))
  )

  const response = await invoke({ context: { user: { id: 'session-user' } } })

  expect(response.ok).toBe(false)
  expect(JSON.stringify(response)).not.toContain('private database detail')
  expect(JSON.stringify(response)).toContain('"code":"SYSTEM"')
  expect(JSON.stringify(response)).not.toContain('INSIGHTS_READ_FAILED')
})
