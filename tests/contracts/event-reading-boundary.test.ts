import { beforeEach, expect, test, vi } from 'vitest'
import { Effect, Layer } from 'effect'

const mocks = vi.hoisted(() => ({ read: vi.fn(), header: vi.fn(), middleware: vi.fn() }))
vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    const builder = {
      middleware: (value: unknown) => {
        mocks.middleware(value)
        return builder
      },
      validator: () => builder,
      handler: (fn: unknown) => fn,
    }
    return builder
  },
}))
vi.mock('@tanstack/react-start/server', () => ({ setResponseHeader: mocks.header }))
vi.mock('@/lib/auth.middleware', () => ({ requireSessionMiddleware: 'required-session' }))
vi.mock('@/db', () => ({ PgClientLive: Layer.empty }))
vi.mock('@/server/events/workflows/event-reading.workflows.live', () => ({
  getEventReadingWorkflow: mocks.read,
}))
import { getEventReading } from '@/server/events/handlers/event-reading.handler'

// The mock exposes the server handler so its trusted middleware context can be tested.
const invokeRead = getEventReading as unknown as (input: {
  data: unknown
  context: { user: { id: string } }
}) => Promise<{ ok: boolean }>

const eventId = '970ead59-c37d-4c45-9a96-34514fa08013'
const context = { user: { id: 'session-user' } }
beforeEach(() => {
  mocks.read.mockReset()
  mocks.header.mockClear()
  mocks.read.mockImplementation(() => Effect.succeed({ event: { id: eventId } }))
})

test('private event reads require a session and bind the actor to it', async () => {
  expect(mocks.middleware).toHaveBeenCalledWith(['required-session'])
  const result = await invokeRead({ data: { eventId }, context })
  expect(result.ok).toBe(true)
  expect(mocks.read).toHaveBeenCalledWith({ userId: 'session-user', eventId })
  expect(mocks.header).toHaveBeenCalledWith('Cache-Control', 'private, no-store')
  expect(mocks.header).toHaveBeenCalledWith('Vary', 'Cookie')
})

test('invalid IDs and actor overrides fail safely before private reads', async () => {
  expect((await invokeRead({ data: { eventId: 'invalid' }, context })).ok).toBe(false)
  expect((await invokeRead({ data: { eventId, userId: 'forged' }, context })).ok).toBe(false)
  expect(mocks.read).not.toHaveBeenCalled()
})
