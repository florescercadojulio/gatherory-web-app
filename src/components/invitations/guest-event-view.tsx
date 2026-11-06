import { useForm } from '@tanstack/react-form'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Frame, FramePanel } from '@/components/reui/frame'
import { formatInvitationDate } from '@/lib/event-invitation-date'
import type { GuestAttendance } from './guest-rsvp'

export type GuestEventProjection = {
  id: string
  title: string
  startsAt: string | null
  endsAt?: string | null
  isAllDay: boolean
  timeZone: string
  locationName: string | null
  attendance: GuestAttendance | 'pending'
  name?: string
  canRespond?: boolean
}

export function GuestEventView({
  event,
  locale,
  submitResponse = async () => {},
}: {
  event: GuestEventProjection
  locale: string
  submitResponse?: (attendance: GuestAttendance) => Promise<void>
}) {
  const { t } = useTranslation()
  const [attendance, setAttendance] = useState(event.attendance)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const errorRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])
  const form = useForm({
    defaultValues: { attendance: event.attendance === 'pending' ? '' : event.attendance },
    onSubmit: async ({ value }) => {
      if (!isGuestAttendance(value.attendance)) {
        setError(t('invitation.responseRequired'))
        return
      }
      setSaving(true)
      setError('')
      try {
        await submitResponse(value.attendance)
        setAttendance(value.attendance)
        form.setFieldValue('attendance', value.attendance)
        setEditing(false)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : t('invitation.responseSaveFailed'))
      } finally {
        setSaving(false)
      }
    },
  })
  useEffect(() => {
    setAttendance(event.attendance)
    form.setFieldValue('attendance', event.attendance === 'pending' ? '' : event.attendance)
  }, [event.attendance])
  const date = formatInvitationDate({
    startsAt: event.startsAt,
    timeZone: event.timeZone,
    isAllDay: event.isAllDay,
    locale,
  })
  const responseKey = {
    going: 'invitation.going',
    not_sure: 'invitation.maybe',
    not_going: 'invitation.notGoing',
    pending: 'invitation.responsePending',
  }[attendance]

  return (
    <main className="ph-no-capture ph-no-record min-h-svh bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <article className="mx-auto w-full max-w-3xl space-y-8">
        <header className="space-y-4">
          <img src="/gatherory-icon.png" alt="Gatherory" className="size-11 rounded-xl" />
          <p className="text-sm font-medium text-primary">{t('invitation.guestEventTitle')}</p>
          <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-4xl">
            {event.title}
          </h1>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {date && (
              <div>
                <dt className="font-medium">{t('invitation.eventDate')}</dt>
                <dd className="mt-1 text-muted-foreground">{date}</dd>
                {!event.isAllDay && (
                  <dd className="mt-1 break-words text-xs text-muted-foreground">
                    {event.timeZone}
                  </dd>
                )}
              </div>
            )}
            {event.locationName && (
              <div>
                <dt className="font-medium">{t('invitation.eventLocation')}</dt>
                <dd className="mt-1 break-words text-muted-foreground">{event.locationName}</dd>
              </div>
            )}
          </dl>
        </header>

        <Frame spacing="sm">
          <FramePanel>
            <h2 className="text-lg font-semibold">{t('invitation.yourResponse')}</h2>
            {event.name && (
              <p className="mt-1 text-sm text-muted-foreground">
                {t('invitation.respondingAs', { name: event.name })}
              </p>
            )}
            <p role="status" aria-live="polite" className="mt-2 text-sm text-muted-foreground">
              {t(responseKey)}
            </p>
            {event.canRespond === false ? (
              <p className="mt-3 text-sm text-muted-foreground">{t('invitation.repliesClosed')}</p>
            ) : editing ? (
              <form
                className="mt-4 space-y-4"
                noValidate
                onSubmit={(submitEvent) => {
                  submitEvent.preventDefault()
                  submitEvent.stopPropagation()
                  void form.handleSubmit()
                }}
              >
                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium">{t('invitation.responseLabel')}</legend>
                  <form.Field name="attendance">
                    {(field) => (
                      <div className="grid gap-2">
                        {(['going', 'not_sure', 'not_going'] as const).map((choice) => (
                          <Button
                            key={choice}
                            type="button"
                            variant={field.state.value === choice ? 'default' : 'outline'}
                            aria-pressed={field.state.value === choice}
                            disabled={saving}
                            onClick={() => field.handleChange(choice)}
                            className="min-h-11 w-full justify-start whitespace-normal text-left"
                          >
                            {t(attendanceLabelKey(choice))}
                          </Button>
                        ))}
                      </div>
                    )}
                  </form.Field>
                </fieldset>
                {error && (
                  <p ref={errorRef} role="alert" tabIndex={-1} className="text-sm text-destructive">
                    {error}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={saving} aria-busy={saving} className="min-h-11">
                    {saving ? t('invitation.savingResponse') : t('invitation.sendResponse')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={saving}
                    onClick={() => {
                      setEditing(false)
                      setError('')
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="mt-4 min-h-11"
                onClick={() => setEditing(true)}
              >
                {attendance === 'pending'
                  ? t('invitation.respond')
                  : t('invitation.changeResponse')}
              </Button>
            )}
          </FramePanel>
        </Frame>
      </article>
    </main>
  )
}

function isGuestAttendance(value: string): value is GuestAttendance {
  return value === 'going' || value === 'not_sure' || value === 'not_going'
}

function attendanceLabelKey(value: GuestAttendance) {
  return {
    going: 'invitation.going',
    not_sure: 'invitation.maybe',
    not_going: 'invitation.notGoing',
  }[value]
}
