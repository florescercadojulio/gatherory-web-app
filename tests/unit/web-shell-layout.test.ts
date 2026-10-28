import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  loaderData: null as unknown,
  routeContext: null as unknown,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'overview.eyebrow': 'Works with Gatherory on iPhone',
        'overview.title': 'Your plans, at a glance.',
        'overview.description': 'A read-only view of saved plans.',
        'overview.upToDate': 'Up to date',
        'overview.latestPlans': 'Your latest plans are here',
        'overview.events': 'Events',
        'overview.yourEvents': 'Your events',
        'overview.allTogether': 'Everything important, gathered in one place.',
        'overview.useIPhoneToChange': 'Use the iPhone app to make changes.',
        'overview.comingUp': 'Coming up',
        'overview.planned': 'planned',
        'overview.forGuests': 'For guests',
        'overview.planning': 'Planning',
        'event.schedule': 'Schedule',
        'common.people': 'People',
        'event.approved': 'Approved',
        'ui.planningOverview': 'Planning overview',
      })[key] ?? key,
    i18n: { language: 'en' },
  }),
}))
vi.mock('@/hooks/use-mobile.ts', () => ({ useIsMobile: () => false }))
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: unknown) => ({
    options,
    useLoaderData: () => mocks.loaderData,
    useRouteContext: () => mocks.routeContext,
  }),
}))
vi.mock('@/server/sync/handlers/native-workspace-insights.handler', () => ({
  listNativeWorkspaceInsights: vi.fn(),
}))
vi.mock('@/components/account-sidebar', async () => {
  const { createElement } = await import('react')
  const { Sidebar } = await import('@/components/ui/sidebar')
  return {
    AccountSidebar: () =>
      createElement(Sidebar, { collapsible: 'icon' }, createElement('nav', null, 'Events')),
  }
})
vi.mock('@/components/participant-avatars', () => ({ ParticipantAvatars: () => null }))
vi.mock('@/components/route-feedback', () => ({ ServerErrorToast: () => null }))

import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Route as WorkspaceListRoute } from '@/routes/_protected/workspaces/index'
import type { NativeWorkspaceInsight } from '@/server/sync/contracts/native-insights.contract'

test('workspace shell keeps the sidebar width in the flex row and content shrinkable', () => {
  const markup = renderToStaticMarkup(
    createElement(
      SidebarProvider,
      null,
      createElement(
        Sidebar,
        { collapsible: 'icon' },
        createElement('nav', null, 'Planning navigation')
      ),
      createElement(
        SidebarInset,
        null,
        createElement('header', null, 'Workspace toolbar'),
        createElement('div', { 'data-testid': 'route-content' }, 'Workspace page')
      )
    )
  )

  const wrapperIndex = markup.indexOf('data-slot="sidebar-wrapper"')
  const gapIndex = markup.indexOf('data-slot="sidebar-gap"')
  const insetIndex = markup.indexOf('data-slot="sidebar-inset"')
  expect(wrapperIndex).toBeGreaterThanOrEqual(0)
  expect(gapIndex).toBeGreaterThan(wrapperIndex)
  expect(insetIndex).toBeGreaterThan(gapIndex)
  expect(markup.match(/data-slot="sidebar-gap"/g)).toHaveLength(1)
  expect(markup).toContain('flex min-h-svh w-full')
  expect(markup).toContain('relative w-(--sidebar-width) bg-transparent')
  expect(markup).toContain('relative flex min-w-0 flex-1 flex-col')
  expect(markup).toContain('data-testid="route-content"')
  expect(markup.match(/<main\b/g)).toHaveLength(1)
})

test('conference overview retains long schedule titles inside one shrinkable main landmark', () => {
  const longScheduleTitle =
    'TechXchange 2026: International Community Leadership, Research, and Innovation Conference Welcome Reception and Collaborative Planning Session'
  const conference = {
    id: 'conference-1',
    title: 'TechXchange 2026 Conference',
    startsAt: '2026-11-12T17:00:00.000Z',
    endsAt: null,
    isAllDay: false,
    timeZone: 'America/Detroit',
    location: 'Detroit, Michigan',
    status: 'confirmed',
    participantCount: 2,
    participants: [],
    scheduledEventCount: 1,
    openIdeaCount: 3,
    approvedIdeaCount: 1,
    budgetCap: 5000,
    trackedCost: 1250,
    updatedAt: '2026-10-25T12:00:00.000Z',
    upcomingEvents: [
      {
        id: 'conference-reception',
        title: longScheduleTitle,
        startsAt: '2026-11-12T17:00:00.000Z',
        purpose: 'planning',
        participantCount: 2,
        participants: [],
      },
    ],
  } satisfies NativeWorkspaceInsight

  mocks.loaderData = { ok: true, data: { workspaces: [conference], unavailableSnapshotCount: 0 } }
  mocks.routeContext = {
    defaultWorkspaceContext: { user: { name: 'Avery', email: 'avery@example.test' } },
  }

  const component = (
    WorkspaceListRoute as unknown as {
      options: { component: () => React.ReactNode }
    }
  ).options.component
  const markup = renderToStaticMarkup(createElement(component))

  expect(markup.match(/<main\b/g)).toHaveLength(1)
  expect(markup).toContain('class="app-page-shell overview-layout"')
  expect(markup).toContain('overview-events')
  expect(markup).toContain('overview-upcoming')
  expect(markup.indexOf('overview-events')).toBeLessThan(markup.indexOf('overview-upcoming'))
  expect(markup).toContain('TechXchange 2026 Conference')
  expect(markup).toContain(longScheduleTitle)
  expect(markup).toContain('Coming up')
  expect(markup).toContain('Use the iPhone app to make changes.')
})
