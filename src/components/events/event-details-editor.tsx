import { useForm } from '@tanstack/react-form'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { isVersionConflict, type EventReadingActions } from './event-reading-view'
import type { EventReadingData } from '@/server/events/contracts/event-reading.contracts'
import {
  adoptRefreshedEventDetailsDraft,
  captureEventDetailsDraft,
  isEventDetailsDraftStale,
  eventDetailsRecoveryView,
  type EventDetailsDraft,
} from './event-details-draft-state'

export const eventDetailsEditorLayout = {
  dialogContent:
    'grid-rows-[auto_minmax(0,1fr)] max-h-[calc(100dvh_-_1rem)] overflow-hidden sm:max-h-[calc(100dvh_-_2rem)] [&>[data-slot=dialog-close]]:size-11',
  form: 'grid min-h-0 grid-rows-[minmax(0,1fr)_auto] overflow-hidden',
  scrollRegion: 'min-h-0 space-y-4 overflow-y-auto overscroll-contain py-1',
} as const

export function EventDetailsEditor({
  data,
  save,
  reload,
  afterWrite,
}: {
  data: EventReadingData
  save: NonNullable<EventReadingActions['updateDetails']>
  reload: EventReadingActions['reload']
  afterWrite: () => Promise<void>
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const [reloadError, setReloadError] = useState('')
  const [refreshedVersion, setRefreshedVersion] = useState<number | null>(null)
  const latestEventVersion = useRef(data.event.version)
  latestEventVersion.current = data.event.version
  const [adoptedRefreshedVersion, setAdoptedRefreshedVersion] = useState(false)
  const [draft, setDraft] = useState<EventDetailsDraft<{
    title: string
    description: string
    locationName: string
  }> | null>(null)
  const stale = draft !== null && isEventDetailsDraftStale(draft, data.event.version)
  const recoveryView = eventDetailsRecoveryView({
    open,
    baselineVersion: draft?.baseline.version ?? null,
    currentVersion: data.event.version,
    conflict,
    reviewedVersion: refreshedVersion,
  })
  const form = useForm({
    defaultValues: {
      title: data.event.title,
      description: data.event.description ?? '',
      locationName: data.event.locationName ?? '',
    },
    onSubmit: async ({ value }) => {
      if (!value.title.trim()) {
        setError(t('eventReading.titleRequired'))
        return
      }
      setError('')
      if (draft === null || conflict || isEventDetailsDraftStale(draft, data.event.version)) {
        setError(t('eventReading.conflictReload'))
        return
      }
      try {
        await save({
          expectedVersion: draft.baseline.version,
          changes: {
            title: value.title.trim(),
            description: value.description.trim() || null,
            locationName: value.locationName.trim() || null,
          },
        })
        setOpen(false)
        void afterWrite()
      } catch (cause) {
        const isConflict = isVersionConflict(cause)
        setConflict(isConflict)
        if (isConflict) {
          setRefreshedVersion(null)
          setAdoptedRefreshedVersion(false)
        }
        setError(
          isConflict
            ? t('eventReading.conflictReload')
            : cause instanceof Error && cause.message
              ? cause.message
              : t('eventReading.saveFailed')
        )
      }
    },
  })

  async function refresh() {
    setReloadError('')
    try {
      setRefreshedVersion(null)
      await reload()
      setRefreshedVersion(latestEventVersion.current)
    } catch {
      setReloadError(t('eventReading.reloadFailed'))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          form.setFieldValue('title', data.event.title)
          form.setFieldValue('description', data.event.description ?? '')
          form.setFieldValue('locationName', data.event.locationName ?? '')
          setError('')
          setConflict(false)
          setRefreshedVersion(null)
          setAdoptedRefreshedVersion(false)
          setReloadError('')
          setDraft(
            captureEventDetailsDraft(data.event.version, {
              title: data.event.title,
              description: data.event.description ?? '',
              locationName: data.event.locationName ?? '',
            })
          )
        }
      }}
    >
      <DialogTrigger render={<Button type="button" variant="outline" className="min-h-11" />}>
        {t('eventReading.editDetails')}
      </DialogTrigger>
      <DialogContent className={eventDetailsEditorLayout.dialogContent}>
        <DialogHeader className="pr-12">
          <DialogTitle>{t('eventReading.editDetails')}</DialogTitle>
          <DialogDescription>{t('eventReading.editDetailsHelp')}</DialogDescription>
        </DialogHeader>
        <form
          className={eventDetailsEditorLayout.form}
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          <div className={eventDetailsEditorLayout.scrollRegion}>
            <form.Field name="title">
              {(field) => (
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="event-title">{t('eventReading.titleLabel')}</Label>
                  <Input
                    id="event-title"
                    className="h-11 min-h-11 text-base md:text-base"
                    value={field.state.value}
                    maxLength={120}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="description">
              {(field) => (
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="event-description">{t('eventReading.descriptionLabel')}</Label>
                  <Textarea
                    id="event-description"
                    className="min-h-28 text-base md:text-base"
                    value={field.state.value}
                    maxLength={2000}
                    rows={4}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="locationName">
              {(field) => (
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="event-location">{t('eventReading.locationLabel')}</Label>
                  <Input
                    id="event-location"
                    className="h-11 min-h-11 text-base md:text-base"
                    value={field.state.value}
                    maxLength={160}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </div>
              )}
            </form.Field>
            {recoveryView === 'comparison' ? (
              <div className="rounded-md border bg-muted/40 p-3 text-sm" role="status">
                <p className="font-medium">
                  {stale
                    ? t('eventReading.latestEventValues')
                    : adoptedRefreshedVersion
                      ? t('eventReading.adoptedRefreshedVersion')
                      : t('eventReading.refreshed')}
                </p>
                <dl className="mt-2 space-y-1 text-muted-foreground">
                  <div>
                    <dt className="inline font-medium">{t('eventReading.titleLabel')}: </dt>
                    <dd className="inline break-words">{data.event.title}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">{t('eventReading.descriptionLabel')}: </dt>
                    <dd className="inline break-words">
                      {data.event.description || t('eventReading.emptyValue')}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">{t('eventReading.locationLabel')}: </dt>
                    <dd className="inline break-words">
                      {data.event.locationName || t('eventReading.emptyValue')}
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 text-muted-foreground">
                  {t('eventReading.unsavedChangesRemain')}
                </p>
                {(stale || conflict) && recoveryView === 'comparison' ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 min-h-11 whitespace-normal break-words"
                    onClick={() => {
                      if (!draft) return
                      const rebased = adoptRefreshedEventDetailsDraft(
                        { ...draft, values: form.state.values },
                        data.event.version
                      )
                      setDraft(rebased)
                      form.setFieldValue('title', rebased.values.title)
                      form.setFieldValue('description', rebased.values.description)
                      form.setFieldValue('locationName', rebased.values.locationName)
                      setError('')
                      setConflict(false)
                      setAdoptedRefreshedVersion(true)
                    }}
                  >
                    {t('eventReading.useRefreshedEvent')}
                  </Button>
                ) : null}
              </div>
            ) : null}
            {recoveryView === 'reload-required' ? (
              <div className="space-y-2" role="alert">
                <p className="text-sm text-destructive">{t('eventReading.conflictReload')}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => void refresh()}
                >
                  {t('eventReading.reload')}
                </Button>
                {reloadError ? <p className="text-sm text-destructive">{reloadError}</p> : null}
              </div>
            ) : null}
            {open && error && !stale && !conflict ? (
              <div className="space-y-2" role="alert">
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => void refresh()}
                >
                  {t('eventReading.reload')}
                </Button>
                {reloadError ? <p className="text-sm text-destructive">{reloadError}</p> : null}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" className="min-h-11" />}>
              {t('common.cancel')}
            </DialogClose>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  className="min-h-11 whitespace-normal"
                  disabled={isSubmitting || draft === null || stale || conflict}
                >
                  {isSubmitting ? t('eventReading.savingDetails') : t('eventReading.saveDetails')}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
