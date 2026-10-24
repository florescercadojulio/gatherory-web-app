import { expect, test } from 'vitest'

import { shouldGateBrowserPath, TESTFLIGHT_BETA_URL } from '@/lib/browser-beta-gate'
import { Route } from '@/routes/__root'

test('the browser app gate sends login and planning pages to the public beta', () => {
  expect(TESTFLIGHT_BETA_URL).toBe('https://testflight.apple.com/join/rUDD4MCY')

  for (const pathname of ['/', '/auth/sign-in', '/auth/sign-up', '/workspaces', '/account']) {
    expect(shouldGateBrowserPath(pathname), pathname).toBe(true)
  }
})

test('public invite and shared template pages stay available in browsers', () => {
  for (const pathname of ['/join/abc123', '/templates/shared/abc123']) {
    expect(shouldGateBrowserPath(pathname), pathname).toBe(false)
  }
})

test('native auth, session, API, and app-association endpoints remain available', () => {
  for (const pathname of [
    '/api/auth/sign-in/social',
    '/api/auth/callback/google',
    '/api/auth/get-session',
    '/api/auth/verify-email',
    '/api/auth/reset-password',
    '/api/auth/apple-token',
    '/.well-known/apple-app-site-association',
  ]) {
    expect(shouldGateBrowserPath(pathname), pathname).toBe(false)
  }
})

test.each([
  ['/auth/sign-in', 'browser sign-in'],
  ['/workspaces', 'already-signed-in planning navigation'],
])('root beforeLoad redirects %s (%s)', (pathname) => {
  const beforeLoad = Route.options.beforeLoad
  expect(beforeLoad).toBeTypeOf('function')

  let thrown: unknown
  try {
    beforeLoad?.({ location: { pathname } } as Parameters<NonNullable<typeof beforeLoad>>[0])
  } catch (error) {
    thrown = error
  }

  expect(thrown).toMatchObject({
    options: { href: TESTFLIGHT_BETA_URL, replace: true },
  })
})

test('the root route forwards legal and support pages to the landing site', () => {
  const beforeLoad = Route.options.beforeLoad

  for (const [pathname, destination] of [
    ['/privacy', 'https://gatherory.com/privacy'],
    ['/terms', 'https://gatherory.com/terms'],
    ['/support', 'https://gatherory.com/support'],
  ]) {
    let thrown: unknown
    try {
      beforeLoad?.({ location: { pathname } } as Parameters<NonNullable<typeof beforeLoad>>[0])
    } catch (error) {
      thrown = error
    }

    expect(thrown).toMatchObject({ options: { href: destination, replace: true } })
  }
})

test('password reset recovery links remain available to browser users', () => {
  const beforeLoad = Route.options.beforeLoad
  for (const pathname of ['/auth/reset-password', '/auth/reset-password/']) {
    expect(shouldGateBrowserPath(pathname)).toBe(false)
    expect(() =>
      beforeLoad?.({ location: { pathname } } as Parameters<NonNullable<typeof beforeLoad>>[0])
    ).not.toThrow()
  }
})

test('root beforeLoad leaves public invitations, shared previews, and API routes available', () => {
  const beforeLoad = Route.options.beforeLoad

  for (const pathname of [
    '/join/abc123',
    '/join/abc123/',
    '/templates/shared/abc123',
    '/templates/shared/abc123/',
    '/api/auth/callback/google',
    '/api/auth/verify-email',
  ]) {
    expect(() =>
      beforeLoad?.({ location: { pathname } } as Parameters<NonNullable<typeof beforeLoad>>[0])
    ).not.toThrow()
  }
})
