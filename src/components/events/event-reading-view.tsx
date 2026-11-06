import { useForm } from '@tanstack/react-form'
import { Link } from '@tanstack/react-router'
import {
  CalendarDays,
  Check,
  Circle,
  Heart,
  MapPin,
  ListChecks,
  NotebookPen,
  Sparkles,
  Users,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Frame, FramePanel } from '@/components/reui/frame'
import { IconTile } from '@/components/reui/icon-tile'
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@/components/reui/timeline'
import { Button } from '@/components/ui/button'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { eventColorway } from '@/components/events/event-colorway'
import { formatInvitationDate } from '@/lib/event-invitation-date'
import type { EventReadingData } from '@/server/events/contracts/event-reading.contracts'
import type { ClientError } from '@/server/result'
import { EventDetailsEditor } from './event-details-editor'

export type EventAttendance = Exclude<EventReadingData['attendance']['value'], 'pending'>

export class EventReadingActionError extends Error {
  constructor(
    readonly code: string | undefined,
    message: string
  ) {
    super(message)
    this.name = 'EventReadingActionError'
  }
}

export function eventReadingActionError(error: ClientError) {
  return new EventReadingActionError(error.code, error.userMessage)
}

export type EventReadingActions = {
  respond?: (attendance: EventAttendance) => Promise<void>
  completeTask?: (input: {
    todoId: string
    isCompleted: boolean
    expectedVersion: number
  }) => Promise<void>
  createNote?: (input: { idempotencyKey: string; body: string }) => Promise<void>
  updateDetails?: (input: {
    expectedVersion: number
    changes: { title?: string; description?: string | null; locationName?: string | null }
  }) => Promise<void>
  reload: () => Promise<void>
}

export function EventReadingView({
  data,
  locale,
  actions,
}: {
  data: EventReadingData
  locale: string
  actions: EventReadingActions
}) {
  const { t } = useTranslation()
  const [attendance, setAttendance] = useState(data.attendance.value)
  const [attendanceError, setAttendanceError] = useState('')
  const [attendanceSaving, setAttendanceSaving] = useState(false)
  const [taskErrors, setTaskErrors] = useState<Record<string, string>>({})
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)
  const [refreshError, setRefreshError] = useState('')
  const [refreshNotice, setRefreshNotice] = useState(false)
  const canWrite = !data.isReadOnly
  useEffect(() => {
    setAttendance(data.attendance.value)
  }, [data.event.id, data.attendance.value])

  useEffect(() => {
    setTaskErrors({})
    setRefreshError('')
    setRefreshNotice(false)
  }, [data.event.id])

  const date = formatInvitationDate({
    startsAt: data.event.startsAt,
    timeZone: data.event.timeZone,
    isAllDay: data.event.isAllDay,
    locale,
  })

  async function respond(nextAttendance: EventAttendance) {
    if (!actions.respond) return
    setAttendanceError('')
    setAttendanceSaving(true)
    try {
      await actions.respond(nextAttendance)
      setAttendance(nextAttendance)
      await refreshAfterWrite()
    } catch (error) {
      setAttendanceError(errorMessage(error, t('eventReading.saveFailed')))
    } finally {
      setAttendanceSaving(false)
    }
  }

  async function changeTask(taskId: string, isCompleted: boolean, expectedVersion: number) {
    if (!actions.completeTask) return
    setPendingTaskId(taskId)
    setTaskErrors((current) => ({ ...current, [taskId]: '' }))
    try {
      await actions.completeTask({ todoId: taskId, isCompleted, expectedVersion })
      await refreshAfterWrite()
    } catch (error) {
      setTaskErrors((current) => ({
        ...current,
        [taskId]: isVersionConflict(error)
          ? t('eventReading.conflictReload')
          : errorMessage(error, t('eventReading.saveFailed')),
      }))
    } finally {
      setPendingTaskId(null)
    }
  }

  async function reload() {
    setRefreshError('')
    setRefreshNotice(false)
    try {
      await actions.reload()
      setRefreshNotice(true)
    } catch {
      setRefreshError(t('eventReading.reloadFailed'))
    }
  }

  async function refreshAfterWrite() {
    setRefreshError('')
    setRefreshNotice(false)
    try {
      await actions.reload()
      setRefreshNotice(true)
    } catch {
      setRefreshError(t('eventReading.savedButRefreshFailed'))
    }
  }

  return (
    <div className="app-page-shell min-w-0">
      <div
        className="event-colorway mx-auto grid w-full max-w-6xl min-w-0 gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.58fr)] lg:items-start lg:gap-10"
        data-colorway={eventColorway(data.event.id)}
      >
        <Frame spacing="default" className="min-w-0 lg:col-span-2">
          <FramePanel className="border-[var(--event-outline)] bg-[var(--event-soft)]">
            <header className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <IconTile
                    variant="soft"
                    size="lg"
                    className="text-[var(--event-accent)]"
                    aria-hidden="true"
                  >
                    <Sparkles />
                  </IconTile>
                  <p className="text-sm font-medium text-[var(--event-accent)]">
                    {t('eventReading.eyebrow')}
                  </p>
                </div>
                {data.permissions.canEditDetails && canWrite && actions.updateDetails ? (
                  <EventDetailsEditor
                    data={data}
                    save={actions.updateDetails}
                    reload={actions.reload}
                    afterWrite={refreshAfterWrite}
                  />
                ) : null}
              </div>
              <h1 className="w-full break-words text-3xl font-semibold tracking-tight sm:text-4xl">
                {data.event.title}
              </h1>
              <dl className="grid min-w-0 gap-4 text-sm sm:grid-cols-2">
                {date ? (
                  <div className="flex min-w-0 items-start gap-3">
                    <CalendarDays
                      className="mt-0.5 size-4 shrink-0 text-[var(--event-accent)]"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <dt className="font-medium">{t('eventReading.when')}</dt>
                      <dd className="mt-1 break-words leading-6">
                        {date}
                        {data.event.endsAt ? (
                          <>
                            {' '}
                            {t('eventReading.until')}{' '}
                            {formatDateTime(
                              data.event.endsAt,
                              data.event.timeZone,
                              locale,
                              data.event.isAllDay
                            )}
                          </>
                        ) : null}
                      </dd>
                      {!data.event.isAllDay ? (
                        <dd className="mt-1 break-words text-xs text-muted-foreground">
                          {data.event.timeZone}
                        </dd>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {data.event.locationName ? (
                  <div className="flex min-w-0 items-start gap-3">
                    <MapPin
                      className="mt-0.5 size-4 shrink-0 text-[var(--event-accent)]"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <dt className="font-medium">{t('eventReading.where')}</dt>
                      <dd className="mt-1 break-words leading-6">{data.event.locationName}</dd>
                    </div>
                  </div>
                ) : null}
              </dl>
              {data.event.description ? (
                <p className="max-w-3xl whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                  {data.event.description}
                </p>
              ) : null}
            </header>
          </FramePanel>
        </Frame>

        <aside className="min-w-0 lg:col-start-2 lg:row-start-2">
          <section aria-labelledby="event-reading-response">
            <Frame spacing="default">
              <FramePanel className="flex flex-col gap-4">
                <SectionHeading id="event-reading-response" icon={<Heart />} tone="rose">
                  {t('eventReading.yourResponse')}
                </SectionHeading>
                <p role="status" className="text-sm font-semibold">
                  {t(attendanceLabel(attendance))}
                </p>
                {data.permissions.canRespond && data.attendance.canRespond && actions.respond ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    {(['going', 'not_sure', 'not_going'] as const).map((choice) => (
                      <Button
                        key={choice}
                        type="button"
                        variant={attendance === choice ? 'default' : 'outline'}
                        size="sm"
                        className="min-h-11 whitespace-normal"
                        disabled={attendanceSaving}
                        aria-pressed={attendance === choice}
                        onClick={() => void respond(choice)}
                      >
                        {t(attendanceLabel(choice))}
                      </Button>
                    ))}
                  </div>
                ) : null}
                {attendanceError ? (
                  <p role="alert" className="text-sm text-destructive">
                    {attendanceError}
                  </p>
                ) : null}
              </FramePanel>
            </Frame>
          </section>
          <div className="mt-4 flex flex-col items-start gap-2">
            {refreshError ? (
              <p role="alert" className="text-sm text-destructive">
                {refreshError}
              </p>
            ) : null}
            {refreshNotice ? (
              <p role="status" className="text-sm text-muted-foreground">
                {t('eventReading.refreshed')}
              </p>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              className="min-h-11"
              onClick={() => void reload()}
            >
              {t('eventReading.reload')}
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-8 lg:col-start-1 lg:row-start-2">
          {data.permissions.canReadSchedule ? (
            <section aria-labelledby="event-reading-schedule" className="flex flex-col gap-4">
              <SectionHeading id="event-reading-schedule" icon={<CalendarDays />} tone="amber">
                {t('eventReading.schedule')}
              </SectionHeading>
              {data.truncated.schedule ? (
                <p className="text-xs text-muted-foreground">{t('eventReading.scheduleLimited')}</p>
              ) : null}
              {data.schedule.length ? (
                <Frame spacing="default">
                  <FramePanel>
                    <Timeline
                      value={0}
                      className="gap-0"
                      render={<ol aria-label={t('eventReading.schedule')} />}
                    >
                      {data.schedule.map((item, index) => (
                        <TimelineItem
                          key={item.id}
                          step={index + 1}
                          render={<li />}
                          className="min-w-0"
                        >
                          <TimelineIndicator className="border-[var(--event-accent)] bg-card" />
                          <TimelineSeparator className="bg-[var(--event-outline)]" />
                          <TimelineHeader className="min-w-0 gap-1">
                            {item.startsAt ? (
                              <TimelineDate
                                dateTime={item.startsAt}
                                className="h-auto max-sm:h-auto break-words text-[var(--event-accent)]"
                              >
                                {formatDateTime(item.startsAt, item.timeZone, locale)}
                              </TimelineDate>
                            ) : null}
                            <TimelineTitle className="w-full break-words font-semibold">
                              <Link
                                to="/events/$eventId"
                                params={{ eventId: item.id }}
                                className="inline-flex min-h-11 w-full min-w-0 items-center break-words outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <span className="min-w-0 break-words">{item.title}</span>
                              </Link>
                            </TimelineTitle>
                          </TimelineHeader>
                          <TimelineContent className="flex min-w-0 flex-wrap items-center gap-2">
                            <span>
                              {t(
                                item.purpose === 'planning_scouting'
                                  ? 'eventReading.planning'
                                  : item.purpose === 'part_of_event'
                                    ? 'eventReading.forGuests'
                                    : 'eventReading.activity'
                              )}
                            </span>
                            {item.locationName ? (
                              <>
                                <span
                                  aria-hidden="true"
                                  className="size-1 shrink-0 rounded-full bg-muted-foreground/40"
                                />
                                <span className="break-words">{item.locationName}</span>
                              </>
                            ) : null}
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  </FramePanel>
                </Frame>
              ) : (
                <Frame spacing="default">
                  <FramePanel fit>
                    <p className="text-sm text-muted-foreground">{t('eventReading.noSchedule')}</p>
                  </FramePanel>
                </Frame>
              )}
            </section>
          ) : null}

          {data.permissions.canReadTasks && data.tasks.length ? (
            <section aria-labelledby="event-reading-tasks" className="flex flex-col gap-4">
              <SectionHeading id="event-reading-tasks" icon={<ListChecks />} tone="emerald">
                {t('eventReading.tasks')}
              </SectionHeading>
              {data.truncated.tasks ? (
                <p className="text-xs text-muted-foreground">{t('eventReading.tasksLimited')}</p>
              ) : null}
              <Frame spacing="default">
                <FramePanel>
                  <ul className="flex flex-col gap-2">
                    {data.tasks.map((task) => (
                      <Item
                        key={task.id}
                        render={<li />}
                        variant="outline"
                        className="min-w-0 items-start"
                      >
                        <ItemMedia variant="icon" className="mt-0.5 text-muted-foreground">
                          {task.isCompleted ? (
                            <Check aria-hidden="true" />
                          ) : (
                            <Circle aria-hidden="true" />
                          )}
                        </ItemMedia>
                        <ItemContent className="min-w-0">
                          <ItemTitle
                            className={`line-clamp-none w-full whitespace-normal break-words ${task.isCompleted ? 'text-muted-foreground line-through' : ''}`}
                          >
                            {task.title}
                          </ItemTitle>
                          {taskErrors[task.id] ? (
                            <p className="text-sm text-destructive" role="alert">
                              {taskErrors[task.id]}
                            </p>
                          ) : null}
                        </ItemContent>
                        {data.permissions.canCompleteTasks &&
                        canWrite &&
                        task.version >= 1 &&
                        actions.completeTask ? (
                          <Button
                            type="button"
                            size="sm"
                            variant={task.isCompleted ? 'ghost' : 'outline'}
                            className="min-h-11 shrink-0 whitespace-normal"
                            disabled={pendingTaskId !== null}
                            aria-label={t(
                              task.isCompleted
                                ? 'eventReading.undoTask'
                                : 'eventReading.completeTask',
                              { title: task.title }
                            )}
                            onClick={() =>
                              void changeTask(task.id, !task.isCompleted, task.version)
                            }
                          >
                            {t(task.isCompleted ? 'eventReading.undo' : 'eventReading.complete')}
                          </Button>
                        ) : null}
                      </Item>
                    ))}
                  </ul>
                </FramePanel>
              </Frame>
            </section>
          ) : null}

          {data.permissions.canReadNotes ||
          (data.permissions.canCreateNotes && canWrite && actions.createNote) ? (
            <section aria-labelledby="event-reading-notes" className="flex flex-col gap-4">
              <SectionHeading id="event-reading-notes" icon={<NotebookPen />} tone="violet">
                {t('eventReading.notes')}
              </SectionHeading>
              {data.truncated.notes ? (
                <p className="text-xs text-muted-foreground">{t('eventReading.notesLimited')}</p>
              ) : null}
              <Frame spacing="default">
                <FramePanel className="flex flex-col gap-4">
                  {data.permissions.canCreateNotes && canWrite && actions.createNote ? (
                    <NoteComposer save={actions.createNote} afterWrite={refreshAfterWrite} />
                  ) : null}
                  {data.permissions.canReadNotes && data.notes.length ? (
                    <ol className="flex flex-col gap-2">
                      {data.notes.map((note) => (
                        <Item key={note.id} render={<li />} variant="outline" className="min-w-0">
                          <ItemContent className="min-w-0">
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {note.text}
                            </p>
                            <ItemDescription className="line-clamp-none break-words">
                              {t('eventReading.noteByline', {
                                name: note.authorName ?? t('eventReading.unknownAuthor'),
                                date: formatDateTime(note.createdAt, data.event.timeZone, locale),
                              })}
                            </ItemDescription>
                          </ItemContent>
                        </Item>
                      ))}
                    </ol>
                  ) : null}
                </FramePanel>
              </Frame>
            </section>
          ) : null}

          {data.permissions.canReadPeople ? (
            <section aria-labelledby="event-reading-people" className="flex flex-col gap-4">
              <SectionHeading id="event-reading-people" icon={<Users />} tone="sky">
                {t('eventReading.people')}
              </SectionHeading>
              {data.truncated.people ? (
                <p className="text-xs text-muted-foreground">{t('eventReading.peopleLimited')}</p>
              ) : null}
              {data.people.length ? (
                <Frame spacing="default">
                  <FramePanel>
                    <ul className="flex flex-col gap-2 sm:grid sm:grid-cols-2">
                      {data.people.map((person) => (
                        <Item key={person.id} render={<li />} variant="outline" className="min-w-0">
                          <IconTile
                            variant="soft"
                            size="sm"
                            radius="full"
                            className="text-[var(--event-accent)]"
                            aria-hidden="true"
                          >
                            {personInitials(person.name)}
                          </IconTile>
                          <ItemContent className="min-w-0">
                            <ItemTitle className="line-clamp-none w-full whitespace-normal break-words">
                              {person.name}
                            </ItemTitle>
                            <ItemDescription className="line-clamp-none break-words">
                              {t(`roles.${person.role}`)}
                            </ItemDescription>
                          </ItemContent>
                          <span className="max-w-24 break-words text-right text-xs text-muted-foreground">
                            {t(attendanceLabel(person.attendance))}
                          </span>
                        </Item>
                      ))}
                    </ul>
                  </FramePanel>
                </Frame>
              ) : (
                <Frame spacing="default">
                  <FramePanel fit>
                    <p className="text-sm text-muted-foreground">{t('eventReading.noPeople')}</p>
                  </FramePanel>
                </Frame>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function NoteComposer({
  save,
  afterWrite,
}: {
  save: NonNullable<EventReadingActions['createNote']>
  afterWrite: () => Promise<void>
}) {
  const { t } = useTranslation()
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const pendingRequest = useRef<{ body: string; idempotencyKey: string } | null>(null)
  const [uncertainRequest, setUncertainRequest] = useState(false)
  const form = useForm({
    defaultValues: { text: '' },
    onSubmit: async ({ value }) => {
      const text = value.text.trim()
      if (!text) {
        setError(t('eventReading.noteRequired'))
        return
      }
      setError('')
      setSaved(false)
      try {
        const request = pendingRequest.current ?? {
          body: text,
          idempotencyKey: crypto.randomUUID(),
        }
        pendingRequest.current = request
        await save({ idempotencyKey: request.idempotencyKey, body: request.body })
        pendingRequest.current = null
        setUncertainRequest(false)
        form.reset()
        setSaved(true)
        await afterWrite()
      } catch (cause) {
        setUncertainRequest(true)
        setError(
          isVersionConflict(cause)
            ? t('eventReading.conflictReload')
            : cause instanceof EventReadingActionError
              ? cause.message
              : t('eventReading.noteOutcomeUncertain')
        )
      }
    },
  })

  return (
    <section aria-labelledby="event-reading-add-note" className="flex flex-col gap-3">
      <SectionHeading id="event-reading-add-note" level="3">
        {t('eventReading.addNote')}
      </SectionHeading>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <form.Field name="text">
          {(field) => (
            <div className="flex flex-col gap-2">
              <Label htmlFor={field.name}>{t('eventReading.noteLabel')}</Label>
              <Textarea
                id={field.name}
                className="text-base md:text-base"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                rows={4}
                maxLength={750}
                disabled={uncertainRequest}
              />
            </div>
          )}
        </form.Field>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p role="status" className="text-sm text-muted-foreground">
            {t('eventReading.noteSaved')}
          </p>
        ) : null}
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" className="min-h-11" disabled={isSubmitting}>
              {isSubmitting
                ? t('eventReading.savingNote')
                : uncertainRequest
                  ? t('eventReading.retryNote')
                  : t('eventReading.saveNote')}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </section>
  )
}

function SectionHeading({
  id,
  icon,
  tone,
  level = '2',
  children,
}: {
  id: string
  icon?: React.ReactNode
  tone?: 'rose' | 'amber' | 'emerald' | 'violet' | 'sky'
  level?: '2' | '3'
  children: React.ReactNode
}) {
  const Heading = `h${level}` as const
  const toneClass = {
    rose: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:border-rose-300/25 dark:bg-rose-300/15 dark:text-rose-300',
    amber:
      'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-300/25 dark:bg-amber-300/15 dark:text-amber-300',
    emerald:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-300/15 dark:text-emerald-300',
    violet:
      'border-violet-500/20 bg-violet-500/10 text-violet-700 dark:border-violet-300/25 dark:bg-violet-300/15 dark:text-violet-300',
    sky: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:border-sky-300/25 dark:bg-sky-300/15 dark:text-sky-300',
  } as const
  return (
    <Heading
      id={id}
      className={`flex items-center gap-2 font-semibold tracking-tight ${level === '2' ? 'text-lg' : 'text-sm'}`}
    >
      {icon ? (
        <IconTile
          variant="soft"
          size="xs"
          className={tone ? toneClass[tone] : 'text-[var(--event-accent)]'}
          aria-hidden="true"
        >
          {icon}
        </IconTile>
      ) : null}
      {children}
    </Heading>
  )
}

function attendanceLabel(attendance: EventAttendance | 'pending') {
  return (
    {
      going: 'eventReading.going',
      not_sure: 'eventReading.maybe',
      not_going: 'eventReading.notGoing',
      pending: 'eventReading.noResponse',
    } as const
  )[attendance]
}

function personInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase())
    .join('')
  return initials || '?'
}

function formatDateTime(value: string, timeZone: string, locale: string, dateOnly = false) {
  const options: Intl.DateTimeFormatOptions = dateOnly
    ? { dateStyle: 'full', timeZone }
    : { dateStyle: 'medium', timeStyle: 'short', timeZone }
  return new Intl.DateTimeFormat(locale, options).format(new Date(value))
}

export function isVersionConflict(error: unknown) {
  return (
    error instanceof EventReadingActionError &&
    (error.code === 'CONFLICT' || error.code === 'SERVER_VERSION_CONFLICT')
  )
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}
