import { createElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) =>
    createElement('a', { href: to }, children),
}))

vi.mock('@/components/ui/sidebar.tsx', () => {
  const passthrough = ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children)
  return {
    Sidebar: passthrough,
    SidebarContent: passthrough,
    SidebarFooter: passthrough,
    SidebarHeader: passthrough,
    SidebarRail: passthrough,
    SidebarMenu: passthrough,
    SidebarMenuItem: passthrough,
    SidebarMenuButton: ({ children }: { children?: ReactNode }) =>
      createElement('button', null, children),
    useSidebar: () => ({ isMobile: false }),
  }
})

vi.mock('@/components/nav-main.tsx', () => ({
  NavMain: ({ items }: { items: { title: string; url: string }[] }) =>
    createElement(
      'nav',
      null,
      items.map((item) => createElement('a', { href: item.url, key: item.url }, item.title))
    ),
}))

vi.mock('@/components/workspace-switcher.tsx', () => ({
  WorkspaceSwitcher: () => createElement('div', null, 'Workspace'),
}))

vi.mock('@/components/ui/dropdown-menu.tsx', () => {
  const passthrough = ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children)
  return {
    DropdownMenu: passthrough,
    DropdownMenuContent: passthrough,
    DropdownMenuGroup: passthrough,
    DropdownMenuLabel: passthrough,
    DropdownMenuSeparator: () => createElement('hr'),
    DropdownMenuTrigger: ({ render, children }: { render?: ReactElement; children?: ReactNode }) =>
      render ? createElement('button', null, children) : createElement('button', null, children),
    DropdownMenuItem: ({
      render,
      children,
    }: {
      render?: ReactElement<{ to?: string }>
      children?: ReactNode
    }) =>
      render
        ? createElement('a', { href: String(render.props.to) }, children)
        : createElement('button', null, children),
  }
})

vi.mock('@/components/auth/theme/theme-toggle-item.tsx', () => ({
  ThemeToggleItem: () => createElement('button', null, 'Theme'),
}))

vi.mock('@/lib/auth-client', () => ({ authClient: { signOut: vi.fn() } }))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'navigation.gatherory': 'Gatherory',
        'navigation.eventDetails': 'Event details',
        'common.allEvents': 'All events',
        'userMenu.account': 'Account settings',
        'userMenu.aiConnections': 'AI connections',
        'userMenu.logOut': 'Log out',
      })[key] ?? key,
  }),
}))

import { AppSidebar } from '@/components/app-sidebar'
import { AccountSidebar } from '@/components/account-sidebar'
import { NavUser } from '@/components/nav-user'

test('main navigation keeps planning destinations while profile menu owns account and AI settings', () => {
  const main = renderToStaticMarkup(
    createElement(AppSidebar, {
      workspace: { id: 'w1', name: 'Wedding', slug: 'wedding', type: 'event', access: 'member' },
      workspaces: [],
      planningTeamName: null,
      user: { name: 'Avery User', email: 'avery@example.test' },
    })
  )
  const mainLinks = main.match(/<nav>(.*?)<\/nav>/)?.[1] ?? ''
  expect(main).toContain('All events')
  expect(main).toContain('Event details')
  expect(mainLinks).not.toContain('Blueprints')
  expect(mainLinks).not.toContain('Account settings')

  const profile = renderToStaticMarkup(
    createElement(NavUser, {
      user: { name: 'Avery User', email: 'avery@example.test', avatar: '' },
    })
  )
  expect(profile).toContain('Account settings')
  expect(profile).toContain('AI connections')
  expect(profile).toContain('href="/account"')
  expect(profile).toContain('href="/mcp/connections"')
})

test('account and event-list sidebar leaves settings in the profile menu', () => {
  const sidebar = renderToStaticMarkup(
    createElement(AccountSidebar, {
      user: { name: 'Avery User', email: 'avery@example.test' },
    })
  )
  const mainLinks = sidebar.match(/<nav>(.*?)<\/nav>/)?.[1] ?? ''
  expect(mainLinks).toContain('href="/workspaces"')
  expect(mainLinks).not.toContain('/blueprints')
  expect(mainLinks).not.toContain('/account')
  expect(sidebar).toContain('href="/account"')
  expect(sidebar).toContain('href="/mcp/connections"')
})
