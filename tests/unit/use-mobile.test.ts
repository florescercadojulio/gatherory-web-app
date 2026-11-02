import { afterEach, expect, test, vi } from 'vitest'

const hookMocks = vi.hoisted(() => ({
  setState: vi.fn(),
  effect: undefined as (() => void | (() => void)) | undefined,
}))

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return {
    ...actual,
    useState: () => [undefined, hookMocks.setState],
    useEffect: (callback: () => void | (() => void)) => {
      hookMocks.effect = callback
    },
  }
})

import { useIsMobile } from '@/hooks/use-mobile'

afterEach(() => {
  vi.unstubAllGlobals()
  hookMocks.setState.mockClear()
  hookMocks.effect = undefined
})

test('uses the CSS 48rem boundary and matchMedia state, then removes its change listener', () => {
  let matches = true
  let onChange: (() => void) | undefined
  const addEventListener = vi.fn((_type: string, listener: () => void) => {
    onChange = listener
  })
  const removeEventListener = vi.fn()
  const matchMedia = vi.fn(
    () =>
      ({
        get matches() {
          return matches
        },
        addEventListener,
        removeEventListener,
      }) as unknown as MediaQueryList
  )

  vi.stubGlobal('window', { innerWidth: 768, matchMedia })

  expect(useIsMobile()).toBe(false)
  expect(hookMocks.effect).toBeDefined()
  const cleanup = hookMocks.effect?.()

  expect(matchMedia).toHaveBeenCalledWith('(width < 48rem)')
  expect(hookMocks.setState).toHaveBeenCalledWith(true)
  expect(addEventListener).toHaveBeenCalledWith('change', onChange)

  hookMocks.setState.mockClear()
  matches = false
  onChange?.()
  expect(hookMocks.setState).toHaveBeenCalledWith(false)

  expect(typeof cleanup).toBe('function')
  cleanup?.()
  expect(removeEventListener).toHaveBeenCalledWith('change', onChange)
})
