import { afterEach, expect, test, vi } from 'vitest'
import { runInBackground } from '@/lib/background-tasks'

const requestContext = Symbol.for('@vercel/request-context')

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

test('registers pending callback work with the Vercel request lifetime', async () => {
  const task = Promise.withResolvers<void>()
  const waitUntil = vi.fn<(promise: Promise<unknown>) => void>()
  vi.stubGlobal(requestContext, { get: () => ({ waitUntil }) })

  expect(runInBackground(task.promise)).toBeUndefined()
  expect(waitUntil).toHaveBeenCalledOnce()
  task.resolve()
  await expect(waitUntil.mock.calls[0][0]).resolves.toBeUndefined()
})

test('observes delivery failures without rejecting Vercel background work', async () => {
  const task = Promise.withResolvers<void>()
  const waitUntil = vi.fn<(promise: Promise<unknown>) => void>()
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.stubGlobal(requestContext, { get: () => ({ waitUntil }) })

  runInBackground(task.promise)
  const error = new Error('Provider unavailable')
  task.reject(error)
  await expect(waitUntil.mock.calls[0][0]).resolves.toBeUndefined()
  expect(log).toHaveBeenCalledExactlyOnceWith('Background task failed', error)
})

test('still completes and observes failures outside a Vercel request', async () => {
  vi.stubGlobal(requestContext, undefined)
  const completed = vi.fn()
  const success = Promise.resolve().then(completed)
  expect(() => runInBackground(success)).not.toThrow()
  await success
  expect(completed).toHaveBeenCalledOnce()

  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  const failure = Promise.withResolvers<void>()
  runInBackground(failure.promise)
  failure.reject(new Error('Local provider unavailable'))
  await Promise.resolve()
  expect(log).toHaveBeenCalledOnce()
})
