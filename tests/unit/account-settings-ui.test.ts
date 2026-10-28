import { createElement, type ComponentType, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider } from 'react-i18next'
import { expect, test, vi } from 'vitest'
import i18n from '@/i18n'

const mocks = vi.hoisted(() => ({
  context: {
    defaultWorkspaceContext: {
      user: { name: 'Avery Rivera', email: 'avery@example.test', image: null },
    },
  },
  deleteUser: vi.fn(() => ({ mutateAsync: vi.fn(), reset: vi.fn(), isPending: false })),
  setTheme: vi.fn(),
}))
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({ options, useRouteContext: () => mocks.context }),
  Link: ({ to, children, ...props }: { to: string; children?: ReactNode }) =>
    createElement('a', { ...props, href: to }, children),
}))
vi.mock('@/components/account-sidebar', () => ({
  AccountSidebar: () => createElement('aside', null, 'Account navigation'),
}))
vi.mock('@/lib/auth-client', () => ({ authClient: {} }))
vi.mock('@/lib/auth/theme-plugin.ts', () => ({ themePlugin: {} }))
vi.mock('@better-auth-ui/react', () => ({
  useDeleteUser: mocks.deleteUser,
  useAuthPlugin: () => ({
    localization: {
      appearance: 'Appearance',
      theme: 'Theme',
      system: 'System',
      light: 'Light',
      dark: 'Dark',
    },
    useTheme: () => ({
      theme: 'system',
      setTheme: mocks.setTheme,
      themes: ['system', 'light', 'dark'],
    }),
  }),
  ThemePreviewSystem: () => createElement('div', null, 'System preview'),
  ThemePreviewLight: () => createElement('div', null, 'Light preview'),
  ThemePreviewDark: () => createElement('div', null, 'Dark preview'),
}))
import { Route } from '@/routes/_protected/account/index'
import { Appearance } from '@/components/auth/theme/appearance-settings'

function renderAccount() {
  return renderToStaticMarkup(
    createElement(
      I18nextProvider,
      { i18n },
      createElement(Route.options.component as ComponentType)
    )
  )
}

test('account keeps account navigation and concise panels without extra section navigation', () => {
  const markup = renderAccount()
  expect(markup.match(/<main\b/g)).toHaveLength(1)
  expect(markup.match(/data-slot="frame"/g)).toHaveLength(4)
  expect(markup.match(/data-slot="frame-panel"/g)).toHaveLength(4)
  expect(markup).toContain('Account navigation')
  expect(markup).not.toContain('aria-label="Account sections"')
  expect(markup).not.toContain('href="#profile"')
  expect(markup).not.toContain('href="#appearance"')
  expect(markup).not.toContain('href="#connections"')
  expect(markup).not.toContain('href="#account-actions"')
  expect(markup).toContain('Avery Rivera')
  expect(markup).toContain('avery@example.test')
  expect(markup).toContain('href="/mcp/connections"')
  expect(markup).toContain('Manage connections')
  expect(markup).toContain('Delete account')
  expect(mocks.deleteUser).toHaveBeenCalled()
})

test('Better Auth theme controls retain all choices with inert decorative previews', () => {
  const markup = renderToStaticMarkup(createElement(Appearance))
  expect(markup.match(/data-slot="radio-group-item"/g)).toHaveLength(3)
  for (const theme of ['system', 'light', 'dark']) expect(markup).toContain(`-${theme}-label"`)
  expect(markup.match(/aria-hidden="true" inert=""/g)).toHaveLength(3)
  expect(markup).toContain('Appearance')
  const embedded = renderToStaticMarkup(createElement(Appearance, { showHeading: false }))
  expect(embedded).not.toContain('<h2')
  expect(embedded).toContain('aria-labelledby=')
})
