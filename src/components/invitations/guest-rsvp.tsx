import { useForm } from '@tanstack/react-form'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Frame, FramePanel } from '@/components/reui/frame'
import { formatInvitationDate } from '@/lib/event-invitation-date'

export type GuestAttendance = 'going' | 'not_sure' | 'not_going'

export type GuestRsvpEvent = {
  id: string
  title: string
  startsAt: string | null
  timeZone?: string | null
  isAllDay?: boolean
  locationName?: string | null
  imageUrl?: string | null
}

export type SavedGuestResponse = { name: string; attendance: GuestAttendance }

type GuestRsvpProps = {
  event: GuestRsvpEvent
  locale: string
  existingResponse?: SavedGuestResponse | null
  initialName?: string | null
  canRespond?: boolean
  submitResponse: (response: SavedGuestResponse) => Promise<void>
  switchGuest?: () => Promise<void>
  accountContinuation: string
  revalidate?: () => Promise<void>
  eventHref: string
}

const attendanceChoices: GuestAttendance[] = ['going', 'not_sure', 'not_going']

export function GuestRsvp({
  event,
  locale,
  existingResponse = null,
  initialName = null,
  canRespond = true,
  submitResponse,
  switchGuest,
  accountContinuation,
  revalidate,
  eventHref,
}: GuestRsvpProps) {
  const { t } = useTranslation()
  const [savedResponse, setSavedResponse] = useState(existingResponse)
  const [establishedName, setEstablishedName] = useState(
    existingResponse?.name ?? initialName ?? ''
  )
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [switching, setSwitching] = useState(false)
  const errorRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  const form = useForm({
    defaultValues: {
      name: existingResponse?.name ?? initialName ?? '',
      attendance: existingResponse?.attendance ?? ('' as GuestAttendance | ''),
    },
    onSubmit: async ({ value }) => {
      const name = value.name.trim()
      if (!name) {
        setError(t('invitation.nameRequired'))
        return
      }
      if (!attendanceChoices.includes(value.attendance as GuestAttendance)) {
        setError(t('invitation.responseRequired'))
        return
      }

      setError('')
      setSubmitting(true)
      try {
        const next = { name, attendance: value.attendance as GuestAttendance }
        await submitResponse(next)
        setSavedResponse(next)
        setEstablishedName(next.name)
        void revalidate?.().catch(() => {})
      } catch (cause) {
        setError(
          cause instanceof Error && cause.message
            ? cause.message
            : t('invitation.responseSaveFailed')
        )
      } finally {
        setSubmitting(false)
      }
    },
  })

  const date = event.startsAt
    ? formatInvitationDate({
        startsAt: event.startsAt,
        timeZone: event.timeZone,
        isAllDay: event.isAllDay,
        locale,
      })
    : null

  async function changePerson() {
    if (!switchGuest) return
    setError('')
    setSwitching(true)
    try {
      await switchGuest()
    } catch {
      setError(t('invitation.identitySwitchFailed'))
    } finally {
      setSwitching(false)
    }
  }

  return (
    <main className="ph-no-capture ph-no-record min-h-svh bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.72fr)] lg:items-start lg:gap-12">
        <section aria-labelledby="invitation-title" className="min-w-0 space-y-6">
          <img src="/gatherory-icon.png" alt="Gatherory" className="size-11 rounded-xl" />
          {event.imageUrl ? (
            <img src={event.imageUrl} alt="" className="max-h-64 w-full rounded-2xl object-cover" />
          ) : null}
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">{t('invitation.guestGreeting')}</p>
            <h1
              id="invitation-title"
              className="break-words text-2xl font-semibold tracking-tight sm:text-4xl"
            >
              {event.title}
            </h1>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {date && (
              <div>
                <dt className="font-medium">{t('invitation.eventDate')}</dt>
                <dd className="mt-1 text-muted-foreground">{date}</dd>
                {event.timeZone && !event.isAllDay && (
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
          <p className="text-sm text-muted-foreground">{t('invitation.guestRole')}</p>
        </section>

        <section aria-labelledby="response-title" className="min-w-0">
          {savedResponse ? (
            <Frame spacing="sm">
              <FramePanel className="space-y-5">
                <div>
                  <h2 id="response-title" className="text-lg font-semibold">
                    {t('invitation.yourResponse')}
                  </h2>
                  <p className="mt-2 break-words text-sm text-muted-foreground">
                    {t('invitation.savedAs', {
                      name: savedResponse.name,
                      response: attendanceLabel(t, savedResponse.attendance),
                    })}
                  </p>
                  <p role="status" className="mt-2 text-sm font-medium text-primary">
                    {t('invitation.responseSaved')}
                  </p>
                  {!canRespond && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t('invitation.repliesClosed')}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    nativeButton={false}
                    render={<a href={eventHref} role="link" />}
                    className="min-h-11 flex-1"
                  >
                    {t('invitation.viewEvent')}
                  </Button>
                  {canRespond && (
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11"
                      onClick={() => {
                        setSavedResponse(null)
                        setError('')
                      }}
                    >
                      {t('invitation.changeResponse')}
                    </Button>
                  )}
                </div>
                {switchGuest && (
                  <div className="space-y-2 border-t pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11"
                      disabled={switching}
                      onClick={() => void changePerson()}
                    >
                      {switching
                        ? t('invitation.switchingPerson')
                        : t('invitation.differentPerson')}
                    </Button>
                    {(savedResponse || existingResponse) && (
                      <p className="text-xs text-muted-foreground">
                        {t('invitation.previousResponseRemains')}
                      </p>
                    )}
                  </div>
                )}
              </FramePanel>
            </Frame>
          ) : (
            <Frame spacing="sm">
              <FramePanel>
                <form
                  className="space-y-6"
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    void form.handleSubmit()
                  }}
                >
                  <div className="space-y-1">
                    <h2 id="response-title" className="text-lg font-semibold">
                      {t('invitation.respond')}
                    </h2>
                    <p className="break-words text-sm text-muted-foreground">
                      {establishedName
                        ? t('invitation.respondingAs', { name: establishedName })
                        : t('invitation.hostSeesResponse')}
                    </p>
                  </div>

                  {!canRespond && (
                    <p className="text-sm text-muted-foreground" role="status">
                      {t('invitation.repliesClosed')}
                    </p>
                  )}

                  <form.Field name="name">
                    {(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>{t('invitation.nameLabel')}</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          autoComplete="name"
                          maxLength={80}
                          className="min-h-11 text-base"
                          placeholder={t('invitation.namePlaceholder')}
                          readOnly={Boolean(establishedName)}
                          disabled={!canRespond}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                        />
                      </div>
                    )}
                  </form.Field>

                  <fieldset className="space-y-3">
                    <legend className="text-sm font-medium">{t('invitation.responseLabel')}</legend>
                    <form.Field name="attendance">
                      {(field) => (
                        <div className="grid gap-2">
                          {attendanceChoices.map((choice) => (
                            <Button
                              key={choice}
                              type="button"
                              variant={field.state.value === choice ? 'default' : 'outline'}
                              aria-pressed={field.state.value === choice}
                              disabled={submitting || !canRespond}
                              onClick={() => field.handleChange(choice)}
                              className="min-h-11 w-full justify-start whitespace-normal text-left"
                            >
                              {attendanceLabel(t, choice)}
                            </Button>
                          ))}
                        </div>
                      )}
                    </form.Field>
                  </fieldset>

                  {error && (
                    <p
                      ref={errorRef}
                      role="alert"
                      tabIndex={-1}
                      className="text-sm text-destructive"
                    >
                      {error}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="min-h-11 w-full"
                    disabled={submitting || !canRespond}
                    aria-busy={submitting}
                  >
                    {submitting ? t('invitation.savingResponse') : t('invitation.sendResponse')}
                  </Button>
                  {switchGuest && establishedName && (
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-11 w-full"
                        disabled={switching || submitting}
                        onClick={() => void changePerson()}
                      >
                        {switching
                          ? t('invitation.switchingPerson')
                          : t('invitation.differentPerson')}
                      </Button>
                      {(savedResponse || existingResponse) && (
                        <p className="text-xs text-muted-foreground">
                          {t('invitation.previousResponseRemains')}
                        </p>
                      )}
                    </div>
                  )}
                  <p className="text-center text-sm text-muted-foreground">
                    <a
                      href={`/auth/sign-in?redirectTo=${encodeURIComponent(accountContinuation)}`}
                      className="inline-flex min-h-11 items-center px-2 underline underline-offset-4"
                    >
                      {t('invitation.signInWithAccount')}
                    </a>
                  </p>
                </form>
              </FramePanel>
            </Frame>
          )}
        </section>
      </div>
    </main>
  )
}

function attendanceLabel(t: (key: string) => string, value: GuestAttendance) {
  const keys = {
    going: 'invitation.going',
    not_sure: 'invitation.maybe',
    not_going: 'invitation.notGoing',
  } as const
  return t(keys[value])
}
