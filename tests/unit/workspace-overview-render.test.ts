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
import es from '@/i18n/locales/es'
import type { NativeWorkspaceInsight } from '@/server/sync/contracts/native-insights.contract'

let i18n: I18nInstance

beforeAll(async () => {
  i18n = createInstance()
  await i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: { en: { translation: en }, es: { translation: es } },
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
    currencyCode: 'USD',
    budgetCap: 300,
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

function renderOverview(workspaces = [workspace()], unavailableSnapshotCount = 0) {
  return renderToStaticMarkup(
    createElement(
      I18nextProvider,
      { i18n },
      createElement(WorkspaceOverviewContent, { workspaces, unavailableSnapshotCount })
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
    const markup = renderOverview([], 0)
    expect(markup).toContain('Start on your iPhone')
    expect(markup).not.toContain('coming-up-heading')
    expect(markup).not.toContain('overview-event-frame')
  })

  test('renders read-only event summaries before a plain upcoming-activities list', () => {
    const markup = renderOverview()

    expect(markup).not.toMatch(/<main\b/)
    expect(markup.indexOf('your-events-heading')).toBeLessThan(markup.indexOf('coming-up-heading'))
    expect(markup.indexOf('A very long root event name')).toBeLessThan(
      markup.indexOf('Dinner at the garden')
    )
    expect(markup).toContain('A venue with a long location name')
    expect(markup).toContain('<ul')
    expect(markup).not.toContain('data-slot="timeline"')
    expect(markup).not.toContain('data-slot="timeline-indicator"')
    expect(markup).not.toContain('data-colorway=')
    expect(markup).not.toContain('PartyPopper')
    expect(markup).toContain('A very long root event name that must stay readable on the page')
    expect(markup).toContain('dateTime="2026-11-14T12:00:00.000Z"')
    expect(markup).toContain('November 14, 2026')
    expect(markup).not.toContain('7:00 AM')
    expect(markup).toContain('Activity times are shown in your local time zone.')
    expect(markup).toContain('2 people')
    expect(markup).toContain('Part of the experience')
  })

  test('shows labeled read-only summary values without overview navigation or write actions', () => {
    const markup = renderOverview()

    expect(markup).not.toMatch(/<(?:a|button|form)\b/)
    expect(markup).toContain('This is a read-only snapshot of your saved events.')
    expect(markup).toContain('People')
    expect(markup).toContain('Scheduled activities')
    expect(markup).toContain('Ideas to decide')
    expect(markup).toContain('Planned spending')
    expect(markup).toContain('250')
    expect(markup).toContain('3')
    expect(markup).toContain('$300')
    expect(markup).toContain('83% used')
  })

  test('keeps the People count visible beside avatars at narrow widths', () => {
    const markup = renderOverview([{ ...workspace(), participantCount: 12 }])

    expect(markup).toContain('12 people')
    expect(markup).toContain('flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1')
  })

  test('omits labels for unrecognized activity purposes instead of assigning a guest meaning', () => {
    const source = workspace()
    const markup = renderOverview(
      [{ ...source, upcomingEvents: [{ ...source.upcomingEvents[0], purpose: 'future_value' }] }],
      0
    )

    expect(markup).toContain('Dinner at the garden')
    expect(markup).not.toContain('For guests')
    expect(markup).not.toContain('future_value')
  })

  test('keeps older-snapshot and no-upcoming states visible with summaries', () => {
    const markup = renderOverview([{ ...workspace(), upcomingEvents: [] }], 2)

    expect(markup).toContain('2 older events')
    expect(markup).toContain('No upcoming activities are planned.')
    expect(markup).not.toMatch(/<(?:a|button|form)\b/)
  })

  test('formats cents in tracked spending and the budget cap', () => {
    const markup = renderOverview([{ ...workspace(), trackedCost: 12.75, budgetCap: 20.5 }])

    expect(markup).toContain('$12.75')
    expect(markup).toContain('$20.50')
  })

  test('formats each event in its own currency with currency-specific decimal digits', async () => {
    await i18n.changeLanguage('en')
    const base = workspace()
    const markup = renderOverview([
      {
        ...base,
        id: 'usd',
        title: 'USD event',
        currencyCode: 'USD',
        trackedCost: 12.75,
        budgetCap: 20.5,
      },
      {
        ...base,
        id: 'jpy',
        title: 'JPY event',
        currencyCode: 'JPY',
        trackedCost: 12.75,
        budgetCap: 20.5,
      },
      {
        ...base,
        id: 'kwd',
        title: 'KWD event',
        currencyCode: 'KWD',
        trackedCost: 12.75,
        budgetCap: 20.5,
      },
    ])

    expect(markup).toContain('$12.75')
    expect(markup).toContain('¥13')
    expect(markup).toContain('¥21')
    expect(markup).toContain('KWD 12.750')
    expect(markup).toContain('KWD 20.500')
    expect(markup.match(/Currency unavailable/g)).toBeNull()
    expect(markup).not.toMatch(/<(?:a|button|form)\b/)
  })

  test('formats currencies using the active locale', async () => {
    const base = workspace()
    await i18n.changeLanguage('en')
    expect(renderOverview([{ ...base, currencyCode: 'EUR', trackedCost: 12.5 }])).toContain(
      '€12.50'
    )
    await i18n.changeLanguage('es')
    const markup = renderOverview([{ ...base, currencyCode: 'EUR', trackedCost: 12.5 }])
    expect(markup).toContain('12,50 €')
    expect(markup).toContain('Gastos previstos')
    await i18n.changeLanguage('en')
  })

  test('shows neutral decimal amounts and one localized notice for missing or invalid currency', async () => {
    const base = workspace()
    await i18n.changeLanguage('en')
    const markup = renderOverview([
      { ...base, id: 'missing', currencyCode: null, trackedCost: 12.345, budgetCap: 20 },
      { ...base, id: 'invalid', currencyCode: 'not-a-currency', trackedCost: 3, budgetCap: 4 },
    ])
    expect(markup).toContain('12.35')
    expect(markup.match(/Currency unavailable/g)).toHaveLength(2)
    expect(markup).not.toContain('$12')
    await i18n.changeLanguage('es')
    const spanishMarkup = renderOverview([{ ...base, currencyCode: null, trackedCost: 12.345 }])
    expect(spanishMarkup).toContain('Moneda no disponible')
    expect(spanishMarkup).toContain('12,35')
    await i18n.changeLanguage('en')
  })
})
