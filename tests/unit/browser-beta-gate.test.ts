import { expect, test } from 'vitest'

import { Route } from '@/routes/__root'

test('the root route allows ordinary web app and native routes through', () => {
  const beforeLoad = Route.options.beforeLoad
  for (const pathname of [
    '/',
    '/auth/sign-in',
    '/auth/sign-up',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/workspaces',
    '/api/auth/sign-in/social',
    '/api/auth/callback/google',
    '/api/auth/get-session',
    '/api/auth/verify-email',
    '/api/auth/reset-password',
    '/api/auth/apple-token',
    '/.well-known/apple-app-site-association',
  ]) {
    expect(() =>
      beforeLoad?.({ location: { pathname } } as Parameters<NonNullable<typeof beforeLoad>>[0])
    ).not.toThrow()
  }
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

test('public invitations, shared previews, and API routes remain available', () => {
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
