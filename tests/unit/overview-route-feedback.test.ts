import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, test, vi } from 'vitest'

const state = vi.hoisted(() => ({ data: null as unknown }))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({
    options,
    useLoaderData: () => state.data,
    useRouteContext: () => ({
      defaultWorkspaceContext: { user: { name: 'Fixture', email: 'fixture@example.test' } },
    }),
  }),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('@/server/sync/handlers/native-workspace-insights.handler', () => ({
  listNativeWorkspaceInsights: vi.fn(),
}))
vi.mock('@/components/route-feedback', () => ({ ServerErrorToast: () => null }))
vi.mock('@/components/account-sidebar', () => ({
  AccountSidebar: ({ summaryLabel }: { summaryLabel?: string }) =>
    createElement('nav', null, summaryLabel ?? 'Your events'),
}))
vi.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => children,
  SidebarInset: ({ children }: { children: React.ReactNode }) =>
    createElement('main', null, children),
  SidebarTrigger: () => null,
}))
vi.mock('@/components/workspaces/workspace-overview-content', () => ({
  WorkspaceOverviewContent: () => createElement('section', null, 'Loaded event summaries'),
}))

import { Route } from '@/routes/_protected/workspaces/index'

function renderRoute() {
  const component = (Route as unknown as { options: { component: () => React.ReactNode } }).options
    .component
  return renderToStaticMarkup(createElement(component))
}

beforeEach(() => {
  state.data = { ok: true, data: { workspaces: [], unavailableSnapshotCount: 0 } }
})

test('failed overview reads show the error and a retry instead of an empty account', () => {
  state.data = {
    ok: false,
    error: { userMessage: 'Event summaries could not be loaded.', errorId: 'fixture-error' },
  }
  const markup = renderRoute()

  expect(markup).toContain('role="alert"')
  expect(markup).toContain('Event summaries could not be loaded.')
  expect(markup).toContain('common.tryAgain</button>')
  expect(markup).not.toContain('Loaded event summaries')
  expect(markup).not.toContain('common.events')
  expect(markup).not.toContain('overview.firstEvent')
  expect(markup.match(/<main\b/g)).toHaveLength(1)
})

test('a successful empty overview keeps the real empty-account guidance', () => {
  const markup = renderRoute()

  expect(markup).toContain('Loaded event summaries')
  expect(markup).toContain('common.events')
  expect(markup).not.toContain('role="alert"')
  expect(markup).not.toContain('common.tryAgain')
})
