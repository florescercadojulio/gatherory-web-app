import { beforeAll, describe, expect, test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { createInstance, type i18n as I18nInstance } from 'i18next'

import {
  calculateBudgetUsedPercentage,
  WorkspaceOverviewContent,
} from '@/components/workspaces/workspace-overview-content'
import en from '@/i18n/locales/en'
import type { NativeWorkspaceInsight } from '@/server/sync/contracts/native-insights.contract'

let i18n: I18nInstance

beforeAll(async () => {
  i18n = createInstance()
  await i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: { en: { translation: en } },
    interpolation: { escapeValue: false },
  })
})

function workspace(): NativeWorkspaceInsight {
  return {
    id: 'root-event-id',
    title: 'A very long root event name that must stay readable on the page',
    startsAt: '2026-11-14T12:00:00.000Z',
    endsAt: null,
    isAllDay: false,
    timeZone: 'America/Detroit',
    location: 'A venue with a long location name',
    status: 'ongoing',
    participantCount: 8,
    participants: [{ id: 'host-id', name: 'Sam Host', image: null }],
    scheduledEventCount: 2,
    openIdeaCount: 3,
    approvedIdeaCount: 1,
    budgetCap: null,
    trackedCost: 250,
    updatedAt: '2026-10-25T12:00:00.000Z',
    upcomingEvents: [
      {
        id: 'child-event-id',
        title: 'Dinner at the garden',
        startsAt: '2026-11-01T17:30:00.000Z',
        purpose: 'part_of_event',
        participantCount: 2,
        participants: [{ id: 'guest-id', name: 'Taylor Guest', image: null }],
      },
    ],
  }
}

function renderOverview() {
  return renderToStaticMarkup(
    createElement(
      I18nextProvider,
      { i18n },
      createElement(WorkspaceOverviewContent, {
        workspaces: [workspace()],
        unavailableSnapshotCount: 0,
      })
    )
  )
}

describe('workspace overview server rendering', () => {
  test('calculates budget progress with decimal precision and caps it at full budget', () => {
    expect(calculateBudgetUsedPercentage(1, 3)).toBe(33.333333333333336)
    expect(calculateBudgetUsedPercentage(4, 3)).toBe(100)
    expect(calculateBudgetUsedPercentage(4, 0)).toBeNull()
    expect(calculateBudgetUsedPercentage(4, null)).toBeNull()
  })

  test('empty accounts see event guidance without a misleading upcoming schedule', () => {
    const markup = renderToStaticMarkup(
      createElement(
        I18nextProvider,
        { i18n },
        createElement(WorkspaceOverviewContent, { workspaces: [], unavailableSnapshotCount: 0 })
      )
    )
    expect(markup).toContain('Start on your iPhone')
    expect(markup).not.toContain('coming-up-heading')
    expect(markup).not.toContain('overview-event-frame')
  })

  test('renders event cards before the upcoming list without nesting a main landmark', () => {
    const markup = renderOverview()

    expect(markup).not.toMatch(/<main\b/)
    expect(markup.indexOf('your-events-heading')).toBeLessThan(markup.indexOf('coming-up-heading'))
    expect(markup.indexOf('A very long root event name')).toBeLessThan(
      markup.indexOf('Dinner at the garden')
    )
    expect(markup).toContain('A venue with a long location name')
  })

  test('renders the overview as read-only content without fake actions or navigation', () => {
    const markup = renderOverview()

    expect(markup).not.toMatch(/<(?:a|button|form)\b/)
    expect(markup).toContain('250')
    expect(markup).toContain('3')
  })
})
