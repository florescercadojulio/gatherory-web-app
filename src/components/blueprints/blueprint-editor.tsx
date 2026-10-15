import { useEffect, useRef, useState } from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Eye, Save, Send, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useForm, useStore } from '@tanstack/react-form'

import {
  BlueprintDraftContentSchema as DraftSchema,
  type BlueprintDraft,
  type BlueprintDraftContent,
} from '@/contracts/blueprint-authoring.contracts'
import type { BlueprintExpandedPlan } from '@/contracts/blueprint-install.contracts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  createBlueprintDraft,
  deleteBlueprintDraft,
  getBlueprintDraft,
  previewBlueprintDraft,
  publishBlueprintDraft,
  retireBlueprintTemplate,
  saveBlueprintDraft,
} from '@/server/blueprints/handlers/blueprint-authoring.functions'
import { matchesCreateAttempt, type BlueprintCreateAttempt } from './blueprint-authoring.utils'
import { ActivityFields, IdeaFields, InstructionFields } from './blueprint-content-fields'

type PreviewData = {
  plan: BlueprintExpandedPlan
  contentHash: string
  previewOnly: true
  version: number
}

async function refreshBlueprintRouteData(router: ReturnType<typeof useRouter>) {
  try {
    await router.invalidate()
  } catch {
    // A cache refresh failure must not turn a confirmed server mutation into a reported failure.
  }
}

export function BlueprintEditor({
  draft: initialDraft,
  organizationId,
  starterContent,
  source,
  starterName,
}: {
  draft?: BlueprintDraft
  organizationId?: string
  starterContent?: BlueprintDraftContent
  source?: { catalogKey: string; revision: number }
  starterName?: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const router = useRouter()
  const createDraftFn = useServerFn(createBlueprintDraft)
  const saveDraftFn = useServerFn(saveBlueprintDraft)
  const publishDraftFn = useServerFn(publishBlueprintDraft)
  const retireFn = useServerFn(retireBlueprintTemplate)
  const deleteFn = useServerFn(deleteBlueprintDraft)
  const previewFn = useServerFn(previewBlueprintDraft)
  const getDraftFn = useServerFn(getBlueprintDraft)
  const [draft, setDraft] = useState(initialDraft)
  const [savedContent, setSavedContent] = useState<BlueprintDraftContent | null>(
    initialDraft?.content ?? null
  )
  const [feedback, setFeedback] = useState('')
  const [conflict, setConflict] = useState(false)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [pendingAction, setPendingAction] = useState<'retire' | 'delete' | null>(null)
  const [busy, setBusy] = useState(false)
  const createAttemptRef = useRef<BlueprintCreateAttempt | null>(null)
  const [createAttemptChanged, setCreateAttemptChanged] = useState(false)

  const form = useForm({
    defaultValues: initialDraft?.content ?? starterContent ?? emptyContent(),
    onSubmit: async ({ value }) => {
      setFeedback('')
      setConflict(false)
      const parsed = DraftSchema.safeParse(value)
      if (!parsed.success) {
        setFeedback(parsed.error.issues[0]?.message ?? t('blueprints.saveFailed'))
        return
      }
      setBusy(true)
      try {
        if (!draft) {
          if (!organizationId) {
            setFeedback(t('blueprints.noWorkspace'))
            return
          }
          const nextPayload = {
            organizationId,
            content: parsed.data,
            ...(source ? { source } : {}),
          }
          let attempt = createAttemptRef.current
          if (attempt && !matchesCreateAttempt(attempt, nextPayload)) {
            setCreateAttemptChanged(true)
            setFeedback(t('blueprints.createAttemptChanged'))
            return
          }
          if (attempt) setCreateAttemptChanged(false)
          if (!attempt) {
            attempt = { ...nextPayload, requestId: crypto.randomUUID() }
            createAttemptRef.current = attempt
          }
          const result = await createDraftFn({ data: attempt })
          if (!result.ok) {
            setFeedback(result.error.userMessage || t('blueprints.createFailed'))
            return
          }
          createAttemptRef.current = null
          setCreateAttemptChanged(false)
          setDraft(result.data)
          setSavedContent(result.data.content)
          setFeedback(t('blueprints.saved'))
          await refreshBlueprintRouteData(router)
          await navigate({
            to: '/blueprints/$blueprintId',
            params: { blueprintId: result.data.id },
          })
          return
        }
        const result = await saveDraftFn({
          data: { id: draft.id, expectedVersion: draft.draftVersion, content: parsed.data },
        })
        if (!result.ok) {
          setConflict(result.error.code?.toLowerCase().includes('conflict') ?? false)
          setFeedback(result.error.userMessage || t('blueprints.saveFailed'))
          return
        }
        setDraft(result.data)
        setSavedContent(result.data.content)
        setPreview(null)
        form.reset(result.data.content)
        setFeedback(t('blueprints.saved'))
        await refreshBlueprintRouteData(router)
      } catch {
        setFeedback(draft ? t('blueprints.saveFailed') : t('blueprints.createFailed'))
      } finally {
        setBusy(false)
      }
    },
  })

  const values = useStore(form.store, (state) => state.values)
  const hasUnsavedChanges = draft ? JSON.stringify(values) !== JSON.stringify(savedContent) : false
  const isRetired = draft?.retired ?? false

  async function retryPendingCreate() {
    const attempt = createAttemptRef.current
    if (!attempt || busy) return
    setBusy(true)
    setFeedback('')
    try {
      const result = await createDraftFn({ data: attempt })
      if (!result.ok) {
        setFeedback(result.error.userMessage || t('blueprints.createFailed'))
        return
      }
      createAttemptRef.current = null
      setCreateAttemptChanged(false)
      setDraft(result.data)
      setSavedContent(result.data.content)
      setFeedback(t('blueprints.saved'))
      await refreshBlueprintRouteData(router)
      await navigate({
        to: '/blueprints/$blueprintId',
        params: { blueprintId: result.data.id },
      })
    } catch {
      setFeedback(t('blueprints.createFailed'))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (
      initialDraft &&
      draft &&
      initialDraft.id === draft.id &&
      initialDraft.draftVersion > draft.draftVersion
    ) {
      setConflict(true)
      setFeedback(t('blueprints.conflictTitle'))
    }
  }, [draft, initialDraft, t])

  async function previewSavedDraft() {
    if (!draft || hasUnsavedChanges || busy) return
    setBusy(true)
    setFeedback('')
    try {
      const result = await previewFn({
        data: { id: draft.id, expectedVersion: draft.draftVersion },
      })
      if (!result.ok) {
        setFeedback(result.error.userMessage || t('blueprints.previewUnavailable'))
        return
      }
      setPreview({ ...result.data, version: draft.draftVersion })
    } catch {
      setFeedback(t('blueprints.previewUnavailable'))
    } finally {
      setBusy(false)
    }
  }

  async function beginNewCreateAttempt() {
    createAttemptRef.current = null
    setCreateAttemptChanged(false)
    setFeedback('')
    await form.handleSubmit()
  }

  async function publishSavedDraft() {
    if (!draft || hasUnsavedChanges || busy) return
    setBusy(true)
    setFeedback('')
    try {
      const result = await publishDraftFn({
        data: { id: draft.id, expectedVersion: draft.draftVersion },
      })
      if (!result.ok) {
        setConflict(result.error.code?.toLowerCase().includes('conflict') ?? false)
        setFeedback(result.error.userMessage || t('blueprints.publishFailed'))
        return
      }
      setDraft(result.data)
      setSavedContent(result.data.content)
      setFeedback(t('blueprints.published'))
      await refreshBlueprintRouteData(router)
    } catch {
      setFeedback(t('blueprints.publishFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function reloadLatest() {
    if (!draft) return
    setBusy(true)
    try {
      const result = await getDraftFn({ data: { id: draft.id } })
      if (!result.ok) {
        setFeedback(result.error.userMessage || t('blueprints.actionFailed'))
        return
      }
      setDraft(result.data)
      setSavedContent(result.data.content)
      form.reset(result.data.content)
      setPreview(null)
      setConflict(false)
      setFeedback('')
      await refreshBlueprintRouteData(router)
    } catch {
      setFeedback(t('blueprints.reloadFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function confirmAction() {
    if (!draft || !pendingAction) return
    setBusy(true)
    try {
      if (pendingAction === 'delete') {
        const result = await deleteFn({ data: { id: draft.id } })
        if (!result.ok) {
          setFeedback(result.error.userMessage || t('blueprints.actionFailed'))
          return
        }
        await navigate({ to: '/blueprints' })
        await refreshBlueprintRouteData(router)
      } else {
        const result = await retireFn({ data: { id: draft.id } })
        if (!result.ok) {
          setFeedback(result.error.userMessage || t('blueprints.actionFailed'))
          return
        }
        setDraft(result.data)
        setFeedback(t('blueprints.retired'))
        await refreshBlueprintRouteData(router)
      }
    } catch {
      setFeedback(t('blueprints.actionFailed'))
    } finally {
      setBusy(false)
      setPendingAction(null)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <form
        className="mx-auto w-full max-w-5xl space-y-10 px-4 py-6 sm:px-6 lg:px-8"
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {draft ? t('blueprints.editTitle') : t('blueprints.createTitle')}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {values.name || t('blueprints.name')}
            </h1>
            {starterName ? (
              <p className="text-sm text-muted-foreground">
                {t('blueprints.customizeStarter')}{' '}
                <span className="font-medium">{starterName}</span>
              </p>
            ) : null}
            {draft?.source && 'catalogKey' in draft.source ? (
              <p className="text-sm text-muted-foreground">
                {t('blueprints.basedOn', { name: starterName ?? draft.source.catalogKey })}
              </p>
            ) : null}
          </div>
          {draft ? (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{t('blueprints.draftVersion', { version: draft.draftVersion })}</span>
              {draft.publishedRevision ? (
                <span>
                  {t('blueprints.publishedRevision', { revision: draft.publishedRevision })}
                </span>
              ) : null}
            </div>
          ) : null}
        </header>

        {feedback ? (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-md border p-3 text-sm ${conflict ? 'border-destructive/50 text-destructive' : 'text-muted-foreground'}`}
          >
            <p>{conflict ? t('blueprints.conflictTitle') : feedback}</p>
            {conflict ? (
              <>
                <p className="mt-1">{t('blueprints.conflictDescription')}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => void reloadLatest()}
                  disabled={busy}
                >
                  {t('blueprints.reloadLatest')}
                </Button>
              </>
            ) : null}
            {createAttemptChanged ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void retryPendingCreate()}
                  disabled={busy}
                >
                  {t('blueprints.retryPreviousCreateAttempt')}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => void beginNewCreateAttempt()}
                  disabled={busy}
                >
                  {t('blueprints.startNewCreateAttempt')}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <fieldset disabled={busy || isRetired} className="m-0 min-w-0 space-y-10 border-0 p-0">
          <section className="space-y-5" aria-labelledby="blueprint-basics">
            <div className="border-b pb-3">
              <h2 id="blueprint-basics" className="text-xl font-semibold">
                {t('blueprints.basics')}
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <form.Field name="name">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>{t('blueprints.name')}</Label>
                    <Input
                      id={field.name}
                      placeholder={t('blueprints.namePlaceholder')}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="experienceType">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>{t('blueprints.experienceType')}</Label>
                    <NativeSelect
                      id={field.name}
                      value={field.state.value}
                      onChange={(event) =>
                        field.handleChange(
                          event.target.value as BlueprintDraftContent['experienceType']
                        )
                      }
                    >
                      <option value="wedding">{t('blueprints.experienceTypes.wedding')}</option>
                      <option value="birthday">{t('blueprints.experienceTypes.birthday')}</option>
                      <option value="holiday">{t('blueprints.experienceTypes.holiday')}</option>
                      <option value="custom">{t('blueprints.experienceTypes.custom')}</option>
                    </NativeSelect>
                  </div>
                )}
              </form.Field>
            </div>
            <form.Field name="description">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>{t('blueprints.descriptionLabel')}</Label>
                  <Textarea
                    id={field.name}
                    placeholder={t('blueprints.descriptionPlaceholder')}
                    rows={3}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </div>
              )}
            </form.Field>
          </section>

          <ActivityFields
            children={values.children}
            ideas={values.ideas}
            instructions={values.instructions}
            onChildrenChange={(children) => form.setFieldValue('children', children)}
          />
          <IdeaFields
            ideas={values.ideas}
            children={values.children}
            onIdeasChange={(ideas) => form.setFieldValue('ideas', ideas)}
          />
          <InstructionFields
            instructions={values.instructions}
            children={values.children}
            onInstructionsChange={(instructions) =>
              form.setFieldValue('instructions', instructions)
            }
          />
        </fieldset>

        {preview ? <BlueprintPreview preview={preview} t={t} /> : null}
        <footer className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {draft && !isRetired ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void previewSavedDraft()}
                disabled={busy || hasUnsavedChanges}
              >
                <Eye />
                {t('blueprints.preview')}
              </Button>
            ) : null}
            {draft && !isRetired && !draft.publishedRevision ? (
              <Button
                type="button"
                variant="outline"
                className="text-destructive"
                onClick={() => setPendingAction('delete')}
                disabled={busy}
              >
                <Trash2 />
                {t('blueprints.deleteDraft')}
              </Button>
            ) : null}
            {draft && !isRetired ? (
              <Button
                type="button"
                variant="outline"
                className="text-destructive"
                onClick={() => setPendingAction('retire')}
                disabled={busy}
              >
                <Trash2 />
                {t('blueprints.retire')}
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {draft && !isRetired ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void publishSavedDraft()}
                disabled={busy || hasUnsavedChanges}
              >
                <Send />
                {busy ? t('blueprints.publishing') : t('blueprints.publish')}
              </Button>
            ) : null}
            {draft && hasUnsavedChanges ? (
              <span className="self-center text-xs text-muted-foreground">
                {t('blueprints.publishNeedsSave')}
              </span>
            ) : null}
            {!isRetired ? (
              <Button type="submit" disabled={busy || form.state.isSubmitting}>
                <Save />
                {busy ? t('blueprints.saving') : t('blueprints.saveDraft')}
              </Button>
            ) : null}
          </div>
        </footer>
      </form>
      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === 'retire'
                ? t('blueprints.retireQuestion')
                : t('blueprints.deleteQuestion')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === 'retire'
                ? t('blueprints.retireDescription')
                : t('blueprints.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t('blueprints.discard')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                void confirmAction()
              }}
              disabled={busy}
            >
              {t('blueprints.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function emptyContent(): BlueprintDraftContent {
  return {
    name: '',
    description: '',
    experienceType: 'custom' as const,
    children: [],
    ideas: [],
    instructions: [],
  }
}

function BlueprintPreview({
  preview,
  t,
}: {
  preview: PreviewData
  t: (key: string, options?: Record<string, unknown>) => string
}) {
  const plan = preview.plan
  return (
    <section className="space-y-5 border-y py-6" aria-labelledby="blueprint-preview">
      <div>
        <h2 id="blueprint-preview" className="text-xl font-semibold">
          {t('blueprints.preview')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('blueprints.previewReady', { version: preview.version })}
        </p>
        <p className="mt-1 break-all text-xs text-muted-foreground">
          {t('blueprints.previewHash', { hash: preview.contentHash })}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">{t('blueprints.previewFillIn')}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="font-medium">{t('blueprints.previewMainEvent')}</h3>
          <p className="text-sm text-muted-foreground">{plan.main.name}</p>
        </div>
        <div>
          <h3 className="font-medium">
            {t('blueprints.previewActivities', { count: plan.children.length })}
          </h3>
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            {plan.children.map((child) => (
              <li key={child.sourceKey}>{child.name}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium">
            {t('blueprints.previewIdeas', { count: plan.ideas.length })}
          </h3>
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            {plan.ideas.map((idea) => (
              <li key={idea.sourceKey}>{idea.title}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium">
            {t('blueprints.previewInstructions', { count: plan.instructions.length })}
          </h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {plan.instructions.map((instruction) => (
              <li key={instruction.sourceKey}>
                {instruction.title} —{' '}
                {instruction.audience === 'planning_only'
                  ? t('blueprints.audiences.planning_only')
                  : t('blueprints.audiences.event_participants')}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {plan.omissions.length ? (
        <div>
          <h3 className="font-medium">
            {t('blueprints.previewOmissions', { count: plan.omissions.length })}
          </h3>
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            {plan.omissions.map((item) => (
              <li key={`${item.sourceKey}-${item.reason}`}>
                {item.sourceKey}: {item.reason.replaceAll('_', ' ')}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
