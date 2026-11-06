import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { createInstance, type i18n as I18nInstance } from 'i18next'
import { beforeAll, expect, test } from 'vitest'
import en from '@/i18n/locales/en'
import es from '@/i18n/locales/es'
import enBrowserInvitation from '@/i18n/locales/en.browser-invitation'
import esBrowserInvitation from '@/i18n/locales/es.browser-invitation'
import { GuestEventView } from '@/components/invitations/guest-event-view'
import { GuestRsvp, type SavedGuestResponse } from '@/components/invitations/guest-rsvp'
import { ApprovalPendingNotice } from '@/components/invitations/approval-pending-notice'
import { InvitationAccessAction } from '@/components/invitations/invitation-access-action'

let i18n: I18nInstance
let spanishI18n: I18nInstance

beforeAll(async () => {
  i18n = createInstance()
  await i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: { en: { translation: en } },
    interpolation: { escapeValue: false },
  })
  spanishI18n = createInstance()
  await spanishI18n.use(initReactI18next).init({
    lng: 'es',
    fallbackLng: 'es',
    resources: { es: { translation: es } },
    interpolation: { escapeValue: false },
  })
})

function renderInvitation(
  existingResponse: SavedGuestResponse | null = null,
  initialName: string | null = null,
  canRespond = true,
  localeInstance = i18n
) {
  return renderToStaticMarkup(
    createElement(
      I18nextProvider,
      { i18n: localeInstance },
      createElement(GuestRsvp, {
        event: {
          id: 'event-id',
          title: 'A long event title that remains the focus',
          startsAt: '2026-11-14T20:30:00.000Z',
          timeZone: 'America/Detroit',
          isAllDay: false,
          locationName: 'The riverside garden',
        },
        locale: 'en-US',
        existingResponse,
        initialName,
        canRespond,
        submitResponse: async () => {},
        switchGuest: async () => {},
        eventHref: '/invited/events/event-id',
        accountContinuation: '/join/invitation-token',
      })
    )
  )
}

test('invitation exposes event context, explicit choices and no account requirement', () => {
  const markup = renderInvitation()
  expect(markup).toContain('A long event title that remains the focus')
  expect(markup).toContain('The riverside garden')
  expect(markup).toContain('America/Detroit')
  expect(markup).toContain('Your name')
  expect(markup).toContain('Going')
  expect(markup).toContain('Maybe')
  expect(markup).toContain('Can’t go')
  expect(markup).toContain('Send response')
  expect(markup).toContain('aria-pressed="false"')
  expect(markup).toContain('min-h-11 text-base')
  expect(markup).toContain('min-h-11 w-full justify-start whitespace-normal text-left')
  expect(markup).toContain('href="/auth/sign-in?redirectTo=%2Fjoin%2Finvitation-token"')
  expect(markup).not.toContain('email')
  expect(markup).not.toContain('Create account')
})

test('a saved response renders identity, confirmation and explicit change action', () => {
  const markup = renderInvitation({ name: 'Alex Rivera', attendance: 'going' })
  expect(markup).toContain('Alex Rivera, your response is Going.')
  expect(markup).toContain('Your response was saved.')
  expect(markup).toContain('View event')
  expect(markup).toContain('Change response')
  expect(markup).toContain('Alex Rivera, your response is Going.')
  expect(markup).toContain('<a href="/invited/events/event-id"')
  expect(markup).not.toMatch(/<a[^>]*type="button"/)
  expect(markup).not.toMatch(/<a[^>]*role="button"/)
  expect(markup).toMatch(/<a href="\/invited\/events\/event-id" role="link" tabindex="0"/)
  expect(markup).not.toContain('<form')
})

test('a returning browser guest sees their name on a second invite without a saved response', () => {
  const markup = renderInvitation(null, 'Jamie Rivera')
  expect(markup).toContain('Responding as Jamie Rivera')
  expect(markup).toContain('readOnly=""')
  expect(markup).toContain('Respond as a different person')
  expect(markup).not.toContain('Jamie Rivera, your response is')
  expect(markup).not.toContain('Your response was saved.')
})

test('a reply-closed invitation disables identity and response controls with a clear status', () => {
  const markup = renderInvitation(null, null, false)
  expect(markup).toContain('Responses are not available for this event.')
  expect(markup).toContain('disabled=""')
  expect(markup).toContain('aria-pressed="false"')
})

test('guest event projection renders only event summary and the guest’s own RSVP', () => {
  const markup = renderToStaticMarkup(
    createElement(
      I18nextProvider,
      { i18n },
      createElement(GuestEventView, {
        locale: 'en-US',
        event: {
          id: 'event-id',
          title: 'Garden dinner',
          startsAt: '2026-11-14T20:30:00.000Z',
          endsAt: null,
          isAllDay: false,
          timeZone: 'America/Detroit',
          locationName: 'The riverside garden',
          attendance: 'not_sure',
          name: 'Alex Rivera',
          canRespond: true,
        },
      })
    )
  )
  expect(markup).toContain('Garden dinner')
  expect(markup).toContain('Maybe')
  expect(markup).toContain('Responding as Alex Rivera')
  expect(markup).toContain('Change response')
  expect(markup).not.toContain('participants')
  expect(markup).not.toContain('notes')
  expect(markup).not.toContain('budget')
})

test('browser invitation English and Spanish catalogs use the same keys', () => {
  expect(Object.keys(esBrowserInvitation.invitation).sort()).toEqual(
    Object.keys(enBrowserInvitation.invitation).sort()
  )
  expect(Object.keys(es.invitation).sort()).toEqual(Object.keys(en.invitation).sort())
})

test('Spanish browser invitation renders localized guest response labels', () => {
  const markup = renderInvitation(null, null, true, spanishI18n)
  expect(markup).toContain('Te invitaron')
  expect(markup).toContain('Tu nombre')
  expect(markup).toContain('¿Podrás asistir?')
  expect(markup).toContain('Sí, asistiré')
  expect(markup).toContain('Tal vez')
  expect(markup).toContain('No podré ir')
  expect(markup).toContain('Enviar respuesta')
  expect(markup).toContain('¿Tienes una cuenta? Inicia sesión para responder con ella.')
})

test('approval pending state gives a user an explicit status refresh action', () => {
  const markup = renderToStaticMarkup(
    createElement(
      I18nextProvider,
      { i18n },
      createElement(ApprovalPendingNotice, { refresh: async () => {} })
    )
  )
  expect(markup).toContain('waiting for host approval')
  expect(markup).toContain('Check approval status')
})

test('a collaborator invitation requiring approval is labeled as a request', () => {
  const markup = renderToStaticMarkup(
    createElement(
      I18nextProvider,
      { i18n },
      createElement(InvitationAccessAction, {
        requiresApproval: true,
        pending: false,
        disabled: false,
        onAccept: async () => {},
      })
    )
  )
  expect(markup).toContain('Request to join')
  expect(markup).not.toContain('Accept invitation')
  expect(en.invitation.requestAccess).toBe('Request to join')
  expect(es.invitation.requestAccess).toBe('Solicitar unirse')
  expect(en.invitation.requestingAccess).toBe('Requesting access…')
  expect(es.invitation.requestingAccess).toBe('Solicitando acceso…')

  const pendingMarkup = renderToStaticMarkup(
    createElement(
      I18nextProvider,
      { i18n },
      createElement(InvitationAccessAction, {
        requiresApproval: true,
        pending: true,
        disabled: true,
        onAccept: async () => {},
      })
    )
  )
  expect(pendingMarkup).toContain('Requesting access…')
  expect(pendingMarkup).not.toContain('Accepting…')
})

test('unresolved invitation copy does not classify a public token as private', () => {
  expect(en.invitation.privateJoin).toContain('unavailable as a public guest link')
  expect(en.invitation.privateJoin).toContain('ask the host')
  expect(es.invitation.privateJoin).toContain('enlace público para invitados')
  expect(es.invitation.privateJoin).toContain('pide al anfitrión')
  expect(en.invitation.privateJoin).not.toContain('private invitation')
})
