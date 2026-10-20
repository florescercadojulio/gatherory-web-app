import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { LibraryBig } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type {
  BlueprintAuthoringContext,
  BlueprintDraft,
} from '@/contracts/blueprint-authoring.contracts'
import type {
  BlueprintCaptureSelection,
  BlueprintEventCaptureSource,
} from '@/contracts/blueprint-capture.contracts'
import type { ClientError, ServerResult } from '@/server/result'
import { AccountSidebar } from '@/components/account-sidebar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { PageUnavailable, ServerErrorToast } from '@/components/route-feedback'
import { blueprintCaptureSaveRecovery } from '@/components/blueprints/blueprint-capture.utils'
import { createBlueprintAuthoringWorkspace } from '@/server/blueprints/handlers/blueprint-authoring.functions'
import {
  getBlueprintCaptureSource,
  previewBlueprintCapture,
  saveBlueprintCapture,
} from '@/server/blueprints/handlers/blueprint-capture.functions'

export type BlueprintCaptureEvent = { id: string; title: string }
type PreviewResult = {
  content: BlueprintDraft['content']
  conflicts: string[]
  sourceHash: string
  expectedVersion?: number
}
type SaveAttempt = {
  requestId: string
  organizationId: string
  eventId: string
  selection: BlueprintCaptureSelection
  expectedSourceHash: string
  templateId?: string
  expectedVersion?: number
}

export type BlueprintCaptureProps = {
  authoringUser: { name: string; email: string; image?: string | null } | null
  context: ServerResult<BlueprintAuthoringContext>
  events: ServerResult<{ events: BlueprintCaptureEvent[] }>
  draft: ServerResult<BlueprintDraft> | null
  initialEventId?: string
  templateId?: string
}

const blankSelection: BlueprintCaptureSelection = {
  childIds: [],
  ideaIds: [],
  instructionIds: [],
  todoIds: [],
  includeIdeaNotes: false,
}

export function BlueprintCapture({
  authoringUser,
  context,
  events,
  draft: draftResult,
  initialEventId,
  templateId,
}: BlueprintCaptureProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const router = useRouter()
  const getSourceFn = useServerFn(getBlueprintCaptureSource)
  const previewFn = useServerFn(previewBlueprintCapture)
  const saveFn = useServerFn(saveBlueprintCapture)
  const createWorkspaceFn = useServerFn(createBlueprintAuthoringWorkspace)
  const [eventId, setEventId] = useState(initialEventId ?? '')
  const [workspaceId, setWorkspaceId] = useState('')
  const [sourceResult, setSourceResult] = useState<ServerResult<{
    source: BlueprintEventCaptureSource
    sourceHash: string
  }> | null>(null)
  const [sourceLoading, setSourceLoading] = useState(false)
  const [sourceError, setSourceError] = useState('')
  const [selection, setSelection] = useState<BlueprintCaptureSelection>(blankSelection)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)
  const [attempt, setAttempt] = useState<SaveAttempt | null>(null)
  const [attemptStarted, setAttemptStarted] = useState(false)
  const [creatingWorkspace, setCreatingWorkspace] = useState(false)
  const [workspaceError, setWorkspaceError] = useState('')
  const [sourceRefreshToken, setSourceRefreshToken] = useState(0)
  const attemptRef = useRef<SaveAttempt | null>(null)
  const preserveSelectionRef = useRef(false)
  const sourceRequest = useRef(0)

  const workspaces = context.ok ? context.data.workspaces : []
  const availableEvents = events.ok ? events.data.events : []
  const draft = draftResult?.ok ? draftResult.data : null
  const currentSourceResult =
    sourceResult?.ok && sourceResult.data.source.event.id === eventId ? sourceResult : null
  const source = currentSourceResult?.data.source ?? null
  const sourceHash = currentSourceResult?.data.sourceHash ?? ''
  const selectedWorkspaceId =
    workspaceId ||
    (templateId && draft ? draft.organizationId : workspaces.length === 1 ? workspaces[0]!.id : '')
  const editingSource = draft?.source && 'eventId' in draft.source ? draft.source : null
  const locked = attemptStarted

  useEffect(() => {
    if (!initialEventId && !eventId && editingSource?.eventId) setEventId(editingSource.eventId)
  }, [editingSource, eventId, initialEventId])

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }),
    [i18n.language]
  )
  function formatDate(value: string | null, timeZone: string) {
    if (!value) return t('blueprints.captureNoDate')
    try {
      return new Intl.DateTimeFormat(i18n.language, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone,
      }).format(new Date(value))
    } catch {
      return dateFormatter.format(new Date(value))
    }
  }

  useEffect(() => {
    const request = ++sourceRequest.current
    setSourceResult(null)
    setPreview(null)
    setFeedback('')
    setSourceError('')
    if (!eventId) {
      setSourceLoading(false)
      return
    }
    setSourceLoading(true)
    void getSourceFn({ data: { eventId } })
      .then((result) => {
        if (request !== sourceRequest.current) return
        setSourceResult(result)
        if (!result.ok)
          setSourceError(result.error.userMessage || t('blueprints.captureSourceFailed'))
        if (result.ok) {
          if (preserveSelectionRef.current) {
            setSelection((current) => reconcileSelection(current, result.data.source))
          } else if (editingSource?.eventId === eventId) {
            setSelection(reconcileSelection(editingSource.selection, result.data.source))
          } else {
            setSelection(blankSelection)
          }
          preserveSelectionRef.current = false
        }
        setSourceLoading(false)
      })
      .catch(() => {
        if (request !== sourceRequest.current) return
        setSourceError(t('blueprints.captureSourceFailed'))
        setSourceLoading(false)
      })
    return () => {
      sourceRequest.current += 1
    }
  }, [editingSource, eventId, getSourceFn, sourceRefreshToken, t])

  function changeEvent(nextEventId: string) {
    setEventId(nextEventId)
    setSelection(blankSelection)
    setPreview(null)
    setAttempt(null)
    setAttemptStarted(false)
    attemptRef.current = null
    preserveSelectionRef.current = false
  }

  function refreshSource() {
    if (locked || !eventId || sourceLoading) return
    preserveSelectionRef.current = true
    setSourceRefreshToken((current) => current + 1)
  }

  async function createWorkspace() {
    if (creatingWorkspace) return
    setCreatingWorkspace(true)
    setWorkspaceError('')
    try {
      const result = await createWorkspaceFn()
      if (!result.ok) {
        setWorkspaceError(result.error.userMessage || t('blueprints.workspaceCreateFailed'))
        return
      }
      await router.invalidate()
    } catch {
      setWorkspaceError(t('blueprints.workspaceCreateFailed'))
    } finally {
      setCreatingWorkspace(false)
    }
  }

  async function refreshSourceAndPreview(payload: SaveAttempt) {
    const request = ++sourceRequest.current
    setSourceLoading(true)
    setSourceError('')
    setPreview(null)
    setFeedback('')
    try {
      const sourceResponse = await getSourceFn({ data: { eventId: payload.eventId } })
      if (request !== sourceRequest.current) return
      if (!sourceResponse.ok) {
        setSourceError(sourceResponse.error.userMessage || t('blueprints.captureSourceFailed'))
        return
      }
      const nextSelection = reconcileSelection(payload.selection, sourceResponse.data.source)
      setSourceResult(sourceResponse)
      setSelection(nextSelection)
      const previewResponse = await previewFn({
        data: {
          eventId: payload.eventId,
          selection: nextSelection,
          expectedSourceHash: sourceResponse.data.sourceHash,
          ...(payload.templateId ? { templateId: payload.templateId } : {}),
        },
      })
      if (request !== sourceRequest.current) return
      if (!previewResponse.ok) {
        setFeedback(previewResponse.error.userMessage || t('blueprints.capturePreviewFailed'))
        return
      }
      setPreview(previewResponse.data)
    } catch {
      if (request === sourceRequest.current) setFeedback(t('blueprints.capturePreviewFailed'))
    } finally {
      if (request === sourceRequest.current) setSourceLoading(false)
    }
  }

  function releaseAttempt() {
    attemptRef.current = null
    setAttempt(null)
    setAttemptStarted(false)
    setPreview(null)
  }

  function changeSelection(
    update: (current: BlueprintCaptureSelection) => BlueprintCaptureSelection
  ) {
    if (locked || busy) return
    setSelection(update)
    setPreview(null)
    setFeedback('')
  }

  function toggleId(key: 'childIds' | 'ideaIds' | 'instructionIds', id: string, checked: boolean) {
    changeSelection((current) => {
      const ids = checked ? [...current[key], id] : current[key].filter((item) => item !== id)
      if (key !== 'childIds' || checked) return { ...current, [key]: ids }
      const childId = id
      const childIdeaIds = new Set(
        source?.ideas.filter((idea) => idea.eventId === childId).map((idea) => idea.id)
      )
      const childInstructionIds = new Set(
        source?.instructions
          .filter((instruction) => instruction.eventId === childId)
          .map((instruction) => instruction.id)
      )
      return {
        ...current,
        childIds: ids,
        ideaIds: current.ideaIds.filter((ideaId) => !childIdeaIds.has(ideaId)),
        instructionIds: current.instructionIds.filter(
          (instructionId) => !childInstructionIds.has(instructionId)
        ),
        todoIds: current.todoIds.filter(
          (todoId) => !source?.todos.some((todo) => todo.id === todoId && todo.eventId === id)
        ),
      }
    })
  }

  async function createPreview() {
    if (!eventId || !sourceHash || busy || locked) return
    const request = sourceRequest.current
    setBusy(true)
    setFeedback('')
    try {
      const result = await previewFn({
        data: {
          eventId,
          selection,
          expectedSourceHash: sourceHash,
          ...(templateId ? { templateId } : {}),
        },
      })
      if (request !== sourceRequest.current) return
      if (!result.ok) {
        setFeedback(result.error.userMessage || t('blueprints.capturePreviewFailed'))
        return
      }
      setPreview(result.data)
    } catch {
      if (request === sourceRequest.current) setFeedback(t('blueprints.capturePreviewFailed'))
    } finally {
      setBusy(false)
    }
  }

  function getOrCreateAttempt() {
    if (attemptRef.current) return attemptRef.current
    if (!preview || !selectedWorkspaceId || !eventId) return null
    const next: SaveAttempt = {
      requestId: crypto.randomUUID(),
      organizationId: selectedWorkspaceId,
      eventId,
      selection: {
        ...selection,
        childIds: [...selection.childIds],
        ideaIds: [...selection.ideaIds],
        instructionIds: [...selection.instructionIds],
        todoIds: [...selection.todoIds],
      },
      expectedSourceHash: preview.sourceHash,
      ...(templateId ? { templateId } : {}),
      ...(preview.expectedVersion ? { expectedVersion: preview.expectedVersion } : {}),
    }
    attemptRef.current = next
    setAttempt(next)
    setAttemptStarted(true)
    return next
  }

  async function saveCapture() {
    const payload = getOrCreateAttempt()
    if (!payload || busy) return
    setBusy(true)
    setFeedback('')
    try {
      const result = await saveFn({ data: payload })
      if (!result.ok) {
        setFeedback(result.error.userMessage || t('blueprints.captureSaveFailed'))
        const recovery = blueprintCaptureSaveRecovery(result.error.code)
        if (recovery !== 'retry-same-request') {
          releaseAttempt()
          if (recovery === 'refresh-source-and-preview') {
            await refreshSourceAndPreview(payload)
          }
        }
        return
      }
      await navigate({ to: '/blueprints/$blueprintId', params: { blueprintId: result.data.id } })
      try {
        await router.invalidate()
      } catch {
        /* The saved draft remains authoritative. */
      }
    } catch {
      setFeedback(t('blueprints.captureSaveFailed'))
    } finally {
      setBusy(false)
    }
  }

  if (!authoringUser) return null
  if (!context.ok || !events.ok || (templateId && (!draftResult || !draftResult.ok))) {
    const error: ClientError | null = !context.ok
      ? context.error
      : !events.ok
        ? events.error
        : draftResult && !draftResult.ok
          ? draftResult.error
          : null
    return (
      <>
        <ServerErrorToast error={error} />
        <PageUnavailable
          title={t('blueprints.captureTitle')}
          description={error?.userMessage || t('blueprints.captureLoadFailed')}
        />
      </>
    )
  }
  if (!draftResult && templateId)
    return (
      <PageUnavailable
        title={t('blueprints.captureTitle')}
        description={t('blueprints.captureLoadFailed')}
      />
    )

  return (
    <SidebarProvider>
      <AccountSidebar user={authoringUser} />
      <SidebarInset>
        <header className="app-toolbar">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <LibraryBig className="size-4 text-brand-ink" />
            <span className="text-sm font-medium">{t('blueprints.captureTitle')}</span>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 overflow-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              render={
                <Link
                  to={templateId && draft ? '/blueprints/$blueprintId' : '/blueprints'}
                  {...(templateId && draft ? { params: { blueprintId: draft.id } } : {})}
                />
              }
            >
              {t('common.cancel')}
            </Button>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">
              {templateId ? t('blueprints.captureUpdateTitle') : t('blueprints.captureTitle')}
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              {t('blueprints.captureDescription')}
            </p>
            <p className="max-w-3xl text-sm text-muted-foreground">
              {t('blueprints.capturePrivacy')}
            </p>
          </div>

          {workspaces.length === 0 ? (
            <Alert>
              <AlertTitle>{t('blueprints.noWorkspace')}</AlertTitle>
              <AlertDescription>{t('blueprints.captureNoWorkspace')}</AlertDescription>
              <Button onClick={() => void createWorkspace()} disabled={creatingWorkspace}>
                {creatingWorkspace ? t('common.loading') : t('blueprints.createWorkspace')}
              </Button>
              {workspaceError ? <p className="text-sm text-destructive">{workspaceError}</p> : null}
            </Alert>
          ) : null}
          {workspaces.length > 1 ? (
            <div className="max-w-md space-y-2">
              <Label htmlFor="capture-owner">{t('blueprints.ownerWorkspace')}</Label>
              <NativeSelect
                id="capture-owner"
                value={selectedWorkspaceId}
                disabled={Boolean(templateId) || locked || busy || sourceLoading}
                onChange={(event) => setWorkspaceId(event.target.value)}
              >
                <option value="">{t('blueprints.ownerWorkspace')}</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                    {workspace.personal ? ` — ${t('blueprints.personalWorkspace')}` : ''}
                  </option>
                ))}
              </NativeSelect>
              <p className="text-xs text-muted-foreground">{t('blueprints.ownerWorkspaceHelp')}</p>
            </div>
          ) : null}

          <section className="space-y-3" aria-labelledby="capture-source-heading">
            <h2 id="capture-source-heading" className="text-lg font-semibold">
              {t('blueprints.captureChooseEvent')}
            </h2>
            <NativeSelect
              aria-label={t('blueprints.captureChooseEvent')}
              className="max-w-xl"
              value={eventId}
              disabled={Boolean(templateId) || locked || busy || sourceLoading}
              onChange={(event) => changeEvent(event.target.value)}
            >
              <option value="">{t('blueprints.captureSelectEvent')}</option>
              {availableEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
              {eventId && source && !availableEvents.some((event) => event.id === eventId) ? (
                <option value={eventId}>{source.event.title}</option>
              ) : null}
            </NativeSelect>
            {sourceLoading ? (
              <p role="status" className="text-sm text-muted-foreground">
                {t('blueprints.captureLoadingSource')}
              </p>
            ) : null}
            {eventId ? (
              <Button
                variant="outline"
                disabled={locked || busy || sourceLoading}
                onClick={refreshSource}
              >
                {sourceLoading ? t('common.loading') : t('blueprints.captureRefreshSource')}
              </Button>
            ) : null}
            {sourceError ? (
              <p role="alert" className="text-sm text-destructive">
                {sourceError}
              </p>
            ) : null}
          </section>

          {source ? (
            <>
              <section className="space-y-3" aria-labelledby="capture-items-heading">
                <h2 id="capture-items-heading" className="text-lg font-semibold">
                  {t('blueprints.captureChooseItems')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('blueprints.captureDependencies')}
                </p>
                <div className="space-y-3 rounded-lg border p-4">
                  <div>
                    <h3 className="font-medium">{source.event.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(source.event.startsAt, source.event.timeZone)} ·{' '}
                      {source.event.timeZone}
                    </p>
                  </div>
                  <CheckboxList
                    items={source.children}
                    selected={selection.childIds}
                    disabled={locked || busy}
                    label={t('blueprints.activities')}
                    onToggle={(id, checked) => toggleId('childIds', id, checked)}
                  />
                  <CheckboxList
                    items={source.ideas.map((idea) => ({
                      id: idea.id,
                      title: idea.title,
                      eventId: idea.eventId,
                      targetTitle:
                        source.children.find((child) => child.id === idea.eventId)?.title ??
                        source.event.title,
                    }))}
                    selected={selection.ideaIds}
                    disabled={locked || busy}
                    label={t('blueprints.ideas')}
                    onToggle={(id, checked) => toggleId('ideaIds', id, checked)}
                    mainEventId={source.event.id}
                    selectedChildIds={selection.childIds}
                  />
                  <div className="space-y-2">
                    <h3 className="font-medium">{t('blueprints.instructions')}</h3>
                    {source.instructions.map((instruction) => {
                      const requiresChild = instruction.eventId !== source.event.id
                      const childSelected =
                        !requiresChild || selection.childIds.includes(instruction.eventId)
                      return (
                        <label key={instruction.id} className="flex items-start gap-3 text-sm">
                          <Checkbox
                            checked={selection.instructionIds.includes(instruction.id)}
                            disabled={locked || busy || !childSelected}
                            onCheckedChange={(checked) =>
                              toggleId('instructionIds', instruction.id, checked === true)
                            }
                          />
                          <span>
                            <span className="font-medium">{instruction.title}</span>
                            <span className="block text-muted-foreground">
                              {instruction.audience === 'planning_only'
                                ? t('blueprints.audiences.planning_only')
                                : t('blueprints.audiences.event_participants')}{' '}
                              ·{' '}
                              {source.children.find((child) => child.id === instruction.eventId)
                                ?.title ?? source.event.title}
                            </span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                  <label className="flex items-start gap-3 border-t pt-3 text-sm">
                    <Checkbox
                      checked={selection.includeIdeaNotes}
                      disabled={locked || busy}
                      onCheckedChange={(checked) =>
                        changeSelection((current) => ({
                          ...current,
                          includeIdeaNotes: checked === true,
                        }))
                      }
                    />
                    <span>
                      <span className="font-medium">{t('blueprints.captureIncludeNotes')}</span>
                      <span className="block text-muted-foreground">
                        {t('blueprints.captureNotesHelp')}
                      </span>
                    </span>
                  </label>
                </div>
              </section>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => void createPreview()}
                  disabled={busy || locked || !selectedWorkspaceId}
                >
                  {busy ? t('common.loading') : t('blueprints.capturePreview')}
                </Button>
                {locked ? (
                  <p className="text-sm text-muted-foreground">
                    {t('blueprints.captureRetryLocked')}
                  </p>
                ) : null}
              </div>
              {feedback ? (
                <p role="alert" className="text-sm text-destructive">
                  {feedback}
                </p>
              ) : null}
              {preview ? (
                <section
                  className="space-y-4 rounded-lg border p-4"
                  aria-labelledby="capture-preview-heading"
                >
                  <div>
                    <h2 id="capture-preview-heading" className="text-lg font-semibold">
                      {t('blueprints.capturePreviewTitle')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t('blueprints.captureReviewBeforeSave')}
                    </p>
                  </div>
                  {preview.conflicts.length ? (
                    <Alert>
                      <AlertTitle>
                        {t('blueprints.captureConflicts', { count: preview.conflicts.length })}
                      </AlertTitle>
                      <AlertDescription>
                        {preview.conflicts.map((conflict) => (
                          <p key={conflict}>{conflictLabel(conflict, preview.content, t)}</p>
                        ))}
                        {t('blueprints.captureConflictsHelp')}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  <div className="space-y-3">
                    <h3 className="font-medium">{preview.content.name || source.event.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t(`blueprints.experienceTypes.${preview.content.experienceType}`)}
                    </p>
                    <h4 className="font-medium">{t('blueprints.captureSchedule')}</h4>
                    {preview.content.children.length ? (
                      preview.content.children.map((child) => (
                        <div key={child.key} className="border-l-2 pl-3">
                          <p className="font-medium">{child.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {t(`blueprints.purposes.${child.purpose}`)}
                            {child.scheduleProposal
                              ? ` · ${t('blueprints.dayOffset')}: ${child.scheduleProposal.dayOffset} · ${t('blueprints.localTime')}: ${child.scheduleProposal.localTime}`
                              : ` · ${t('blueprints.captureNoSchedule')}`}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t('blueprints.captureNoActivities')}
                      </p>
                    )}
                    <h4 className="font-medium">{t('blueprints.ideas')}</h4>
                    {preview.content.ideas.map((idea) => (
                      <div key={idea.key} className="border-l-2 pl-3">
                        <p className="font-medium">{idea.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {t(`blueprints.ideaCategories.${idea.category}`)} ·{' '}
                          {targetLabel(idea.target, preview.content, source.event.title, t)}
                        </p>
                        {idea.notes ? (
                          <p className="mt-1 whitespace-pre-wrap text-sm">{idea.notes}</p>
                        ) : null}
                      </div>
                    ))}
                    <h4 className="font-medium">{t('blueprints.instructions')}</h4>
                    {preview.content.instructions.map((instruction) => (
                      <div key={instruction.key} className="border-l-2 pl-3">
                        <p className="font-medium">{instruction.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {targetLabel(instruction.target, preview.content, source.event.title, t)}{' '}
                          ·{' '}
                          {instruction.audience === 'planning_only'
                            ? t('blueprints.audiences.planning_only')
                            : t('blueprints.audiences.event_participants')}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{instruction.body}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => void saveCapture()}
                      disabled={busy || workspaces.length === 0}
                    >
                      {busy
                        ? t('blueprints.saving')
                        : attempt
                          ? t('blueprints.captureRetrySave')
                          : templateId
                            ? t('blueprints.captureUpdateSave')
                            : t('blueprints.captureSave')}
                    </Button>
                    {attempt ? (
                      <Button variant="outline" disabled>
                        {t('blueprints.captureAttemptLocked')}
                      </Button>
                    ) : null}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function CheckboxList({
  items,
  selected,
  disabled,
  label,
  onToggle,
  mainEventId,
  selectedChildIds,
}: {
  items: { id: string; title: string; eventId?: string; targetTitle?: string }[]
  selected: string[]
  disabled: boolean
  label: string
  onToggle: (id: string, checked: boolean) => void
  mainEventId?: string
  selectedChildIds?: string[]
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-2">
      <h3 className="font-medium">{label}</h3>
      {items.map((item) => {
        const hasRequiredChild =
          !item.eventId || item.eventId === mainEventId || selectedChildIds?.includes(item.eventId)
        return (
          <label key={item.id} className="flex items-start gap-3 text-sm">
            <Checkbox
              checked={selected.includes(item.id)}
              disabled={disabled || !hasRequiredChild}
              onCheckedChange={(checked) => onToggle(item.id, checked === true)}
            />
            <span>
              <span className="font-medium">{item.title}</span>
              {item.targetTitle ? (
                <span className="block text-muted-foreground">
                  {t('blueprints.targetEvent')}: {item.targetTitle}
                </span>
              ) : null}
            </span>
          </label>
        )
      })}
    </div>
  )
}

function conflictLabel(
  conflict: string,
  content: BlueprintDraft['content'],
  t: ReturnType<typeof useTranslation>['t']
) {
  if (conflict === 'name') return t('blueprints.name')
  if (conflict === 'description') return t('blueprints.descriptionLabel')
  if (conflict === 'experienceType') return t('blueprints.experienceType')
  const child = content.children.find((item) => item.key === conflict)
  const idea = content.ideas.find((item) => item.key === conflict)
  const instruction = content.instructions.find((item) => item.key === conflict)
  return (
    child?.title ?? idea?.title ?? instruction?.title ?? t('blueprints.captureRetainedActivity')
  )
}

function targetLabel(
  target: BlueprintDraft['content']['ideas'][number]['target'],
  content: BlueprintDraft['content'],
  mainTitle: string,
  t: ReturnType<typeof useTranslation>['t']
) {
  if (target.kind === 'main') return mainTitle
  return (
    content.children.find((child) => child.key === target.key)?.title ??
    t('blueprints.captureRetainedActivity')
  )
}

function reconcileSelection(
  selection: BlueprintCaptureSelection,
  source: BlueprintEventCaptureSource
): BlueprintCaptureSelection {
  const childIds = selection.childIds.filter((id) =>
    source.children.some((child) => child.id === id)
  )
  const selectedChildren = new Set(childIds)
  const ideas = new Map(source.ideas.map((idea) => [idea.id, idea]))
  const instructions = new Map(
    source.instructions.map((instruction) => [instruction.id, instruction])
  )
  return {
    childIds,
    ideaIds: selection.ideaIds.filter((id) => {
      const idea = ideas.get(id)
      return idea && (idea.eventId === source.event.id || selectedChildren.has(idea.eventId))
    }),
    instructionIds: selection.instructionIds.filter((id) => {
      const instruction = instructions.get(id)
      return (
        instruction &&
        (instruction.eventId === source.event.id || selectedChildren.has(instruction.eventId))
      )
    }),
    includeIdeaNotes: selection.includeIdeaNotes,
    todoIds: (selection.todoIds ?? []).filter((id) => {
      const todo = source.todos.find((item) => item.id === id)
      return todo && (todo.eventId === source.event.id || selectedChildren.has(todo.eventId))
    }),
  }
}
