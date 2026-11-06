import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterContextProvider,
} from '@tanstack/react-router'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { createInstance, type i18n as I18nInstance } from 'i18next'
import { beforeAll, expect, test } from 'vitest'

import { eventDetailsEditorLayout } from '@/components/events/event-details-editor'
import en from '@/i18n/locales/en'
import es from '@/i18n/locales/es'
import {
  EventReadingView,
  eventReadingActionError,
  isVersionConflict,
} from '@/components/events/event-reading-view'
import type { EventReadingData } from '@/server/events/contracts/event-reading.contracts'

let i18n: I18nInstance

const testRootRoute = createRootRoute()
const testEventRoute = createRoute({
  getParentRoute: () => testRootRoute,
  path: '/events/$eventId',
})
const testRouter = createRouter({
  routeTree: testRootRoute.addChildren([testEventRoute]),
  history: createMemoryHistory({ initialEntries: ['/'] }),
})

beforeAll(async () => {
  i18n = createInstance()
  await i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: { en: { translation: en }, es: { translation: es } },
    interpolation: { escapeValue: false },
  })
})

const data: EventReadingData = {
  event: {
    id: 'event-a',
    title: 'Garden dinner',
    description: 'Bring a jacket\nDinner starts at sunset.',
    startsAt: '2026-11-14T20:30:00.000Z',
    endsAt: null,
    timeZone: 'America/Detroit',
    isAllDay: false,
    locationName: 'Riverside garden',
    version: 12,
  },
  attendance: { value: 'going', canRespond: true },
  people: [{ id: 'person-a', name: 'Alex Rivera', role: 'host', attendance: 'going' }],
  schedule: [
    {
      id: 'schedule-a',
      title: 'Welcome and dinner',
      startsAt: '2026-11-14T20:30:00.000Z',
      timeZone: 'America/Detroit',
      purpose: 'part_of_event',
      locationName: 'Garden patio',
    },
  ],
  tasks: [{ id: 'task-a', title: 'Pick up lanterns', isCompleted: false, version: 3 }],
  notes: [
    {
      id: 'note-a',
      text: 'Use the side gate.',
      createdAt: '2026-11-01T16:00:00.000Z',
      authorName: 'Alex Rivera',
    },
  ],
  permissions: {
    canReadSchedule: true,
    canReadPeople: true,
    canReadTasks: true,
    canReadNotes: true,
    canRespond: true,
    canCompleteTasks: true,
    canCreateNotes: true,
    canEditDetails: true,
  },
  isReadOnly: false,
  truncated: { people: false, schedule: false, tasks: false, notes: false },
}

function render(viewData = data) {
  return renderToStaticMarkup(
    createElement(RouterContextProvider, {
      router: testRouter,
      children: createElement(
        I18nextProvider,
        { i18n },
        createElement(EventReadingView, {
          data: viewData,
          locale: 'en-US',
          actions: {
            respond: async () => {},
            completeTask: async () => {},
            createNote: async () => {},
            updateDetails: async () => {},
            reload: async () => {},
          },
        })
      ),
    })
  )
}

test('event reading leads with date, time zone, place, and authorized planning lists', () => {
  const markup = render()
  expect(markup).toContain('Garden dinner')
  expect(markup).toContain('Riverside garden')
  expect(markup).toContain('America/Detroit')
  expect(markup).toContain('Welcome and dinner')
  expect(markup).toContain('href="/events/schedule-a"')
  expect(markup).toContain('Alex Rivera')
  expect(markup).toContain('Pick up lanterns')
  expect(markup).toContain('Use the side gate.')
  expect(markup).toContain('Mark Pick up lanterns complete')
  expect(markup).toContain('Edit details')
})

test('event reading uses a semantic timeline, manageable checklist, and initials roster', () => {
  const markup = render()

  expect(markup).toContain('data-colorway="mint"')
  expect(markup).toMatch(/<time[^>]+datetime="2026-11-14T20:30:00\.000Z"/i)
  expect(markup).toContain('data-slot="timeline"')
  expect(markup).toContain('data-slot="timeline-item"')
  expect(markup).toContain('data-slot="timeline-indicator"')
  expect(markup).toContain('data-slot="timeline-separator"')
  expect(markup).toContain('data-slot="icon-tile"')
  expect(markup).toContain('data-slot="item"')
  expect(markup).toContain('max-sm:h-auto')
  const scheduleLink = markup.match(/<a class="([^"]*)" href="\/events\/schedule-a"/)?.[1]
  expect(scheduleLink).toContain('inline-flex')
  expect(scheduleLink).toContain('min-h-11')
  expect(scheduleLink).toContain('min-w-0')
  expect(markup).toContain('aria-label="Mark Pick up lanterns complete"')
  expect(markup).toContain('min-h-11')
  expect(markup).toContain('aria-hidden="true">AR</span>')

  const scheduleHeading = markup.indexOf('id="event-reading-schedule"')
  const tasksHeading = markup.indexOf('id="event-reading-tasks"')
  const notesHeading = markup.indexOf('id="event-reading-notes"')
  const peopleHeading = markup.indexOf('id="event-reading-people"')
  expect(scheduleHeading).toBeLessThan(tasksHeading)
  expect(tasksHeading).toBeLessThan(notesHeading)
  expect(notesHeading).toBeLessThan(peopleHeading)
})

test('mobile reading order shows own response before schedule, tasks, notes, and people', () => {
  const markup = render()
  const response = markup.indexOf('Your response')
  const schedule = markup.indexOf('Welcome and dinner')
  const tasks = markup.indexOf('Pick up lanterns')
  const notes = markup.indexOf('Use the side gate.')
  const people = markup.indexOf('Alex Rivera')

  expect(response).toBeGreaterThan(-1)
  expect(response).toBeLessThan(schedule)
  expect(schedule).toBeLessThan(tasks)
  expect(tasks).toBeLessThan(notes)
  expect(notes).toBeLessThan(people)
  expect(markup.match(/id="event-reading-response"/g)).toHaveLength(1)
})

test('a legacy long event title keeps the full-width wrapping heading style', () => {
  const longTitle = `Garden ${'A'.repeat(162)}`
  const markup = render({ ...data, event: { ...data.event, title: longTitle } })
  const heading = markup.match(/<h1[^>]*>/)?.[0]

  expect(heading).toContain('w-full')
  expect(heading).toContain('break-words')
  expect(markup).toContain(longTitle)
})

test('long unbroken note content is assigned a wrapping style at narrow widths', () => {
  const longText = 'A'.repeat(320)
  const markup = render({
    ...data,
    notes: [{ ...data.notes[0]!, text: longText }],
  })

  expect(markup).toContain(`whitespace-pre-wrap break-words text-sm leading-6">${longText}</p>`)
})

test('readonly event displays authorized reads and omits all write controls and composers', () => {
  const readonly = {
    ...data,
    isReadOnly: true,
    attendance: { ...data.attendance, canRespond: false },
    permissions: { ...data.permissions, canRespond: false },
  }
  const markup = render(readonly)
  expect(markup).toContain('Garden dinner')
  expect(markup).toContain('Welcome and dinner')
  expect(markup).toContain('Pick up lanterns')
  expect(markup).not.toContain('Mark Pick up lanterns complete')
  expect(markup).not.toContain('Add a note')
  expect(markup).not.toContain('Edit details')
  expect(markup).not.toContain('Can’t go')
})

test('section permissions omit task/note content when those resources are not authorized', () => {
  const restricted = {
    ...data,
    tasks: [],
    notes: [],
    permissions: {
      ...data.permissions,
      canReadTasks: false,
      canReadNotes: false,
      canCompleteTasks: false,
      canCreateNotes: false,
    },
  }
  const markup = render(restricted)
  expect(markup).not.toContain('Pick up lanterns')
  expect(markup).not.toContain('Use the side gate.')
  expect(markup).not.toContain('Add a note')
})

test('event-reading localization catalogs use the same keys', () => {
  expect(Object.keys(es.eventReading).sort()).toEqual(Object.keys(en.eventReading).sort())
})

test('event details dialog caps itself to the viewport and keeps actions outside the scroll region', () => {
  expect(eventDetailsEditorLayout.dialogContent).toContain('max-h-[calc(100dvh_-_1rem)]')
  expect(eventDetailsEditorLayout.form).toContain('grid-rows-[minmax(0,1fr)_auto]')
  expect(eventDetailsEditorLayout.form).toContain('min-h-0')
  expect(eventDetailsEditorLayout.scrollRegion).toContain('overflow-y-auto')
  expect(eventDetailsEditorLayout.scrollRegion).toContain('min-h-0')
})

test('event reading renders the Spanish response label', async () => {
  await i18n.changeLanguage('es')
  const markup = render()
  await i18n.changeLanguage('en')

  expect(markup).toContain('Tu respuesta')
})

test('legacy tasks without a server version remain readable but cannot be completed', () => {
  const legacy = {
    ...data,
    tasks: [
      { id: 'task-legacy', title: 'Confirm the guest count', isCompleted: false, version: 0 },
    ],
  }
  const markup = render(legacy)
  expect(markup).toContain('Confirm the guest count')
  expect(markup).not.toContain('Mark Confirm the guest count complete')
})

test('a view-only participant can respond when attendance permission is open', () => {
  const viewOnly = {
    ...data,
    isReadOnly: true,
    permissions: {
      ...data.permissions,
      canRespond: true,
      canCompleteTasks: false,
      canCreateNotes: false,
      canEditDetails: false,
    },
    attendance: { ...data.attendance, canRespond: true },
  }
  const markup = render(viewOnly)
  expect(markup).toContain('Can’t go')
  expect(markup).not.toContain('Mark Pick up lanterns complete')
  expect(markup).not.toContain('Add a note')
  expect(markup).not.toContain('Edit details')
})

test('schedule links are omitted when the read projection denies schedule access', () => {
  const restricted = {
    ...data,
    permissions: { ...data.permissions, canReadSchedule: false },
  }
  const markup = render(restricted)
  expect(markup).not.toContain('href="/events/schedule-a"')
  expect(markup).not.toContain('Welcome and dinner')
})

test('public safe-result CONFLICT code is recognized as a version conflict', () => {
  const error = eventReadingActionError({
    userMessage: 'This event changed. Reload it and try again.',
    errorId: 'trace-id',
    code: 'CONFLICT',
    messageKey: 'serverErrors.CONFLICT',
  })
  expect(isVersionConflict(error)).toBe(true)
})
