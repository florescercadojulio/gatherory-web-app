import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ServerResult } from '@/server/result'
import { moderatorAccess } from '@/server/moderation/handlers/moderator-access.handler'
import { reportStatuses } from '@/server/moderation/contracts/moderation.contracts'

type Status = (typeof reportStatuses)[number]
type Report = {
  id: string
  mediaAssetId: string | null
  reason: string
  detail: string
  status: Status
  createdAt: string
  imageHidden: string | null
}

export const Route = createFileRoute('/admin/reports')({
  beforeLoad: () => moderatorAccess(),
  component: ReportsPage,
})

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, credentials: 'same-origin', cache: 'no-store' })
  const result: ServerResult<T> = await response.json()
  if (!result.ok) throw new Error(result.error.userMessage)
  if (!response.ok) throw new Error('The moderation request failed.')
  return result.data
}

function ReportsPage() {
  const access = Route.useRouteContext()
  const { t } = useTranslation()
  if (!access.ok)
    return (
      <main className="app-page-shell max-w-3xl">
        <h1 className="text-2xl font-semibold">{t('moderation.title')}</h1>
        <p className="mt-4" role="alert">
          {access.error.userMessage}
        </p>
        <a className="mt-6 inline-block text-primary" href="/auth/sign-in">
          {t('moderation.signIn')}
        </a>
      </main>
    )
  return <ReportQueue />
}

function ReportQueue() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<Status>('open')
  const [revision, setRevision] = useState(0)
  const [reports, setReports] = useState<Report[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setReports([])
    void request<Report[]>(`/api/admin/reports?status=${status}`)
      .then((items) => {
        if (active) setReports(items)
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : t('moderation.loadFailed'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [status, revision, t])
  return (
    <main className="app-page-shell max-w-4xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{t('moderation.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('moderation.description')}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setRevision((value) => value + 1)}
          disabled={loading}
        >
          {t('common.refresh')}
        </Button>
      </header>
      <div className="my-6 flex flex-wrap gap-2" aria-label={t('moderation.statusFilter')}>
        {reportStatuses.map((value) => (
          <Button
            key={value}
            variant={value === status ? 'default' : 'outline'}
            aria-pressed={value === status}
            onClick={() => setStatus(value)}
          >
            {t(`moderation.status.${value}`)}
          </Button>
        ))}
      </div>
      <div role="status" aria-live="polite">
        {loading
          ? t('common.loading')
          : !error && reports.length === 0
            ? t('moderation.empty')
            : null}
      </div>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <div className="divide-y">
        {reports.map((report) => (
          <ReportRow
            key={`${report.id}:${report.status}`}
            report={report}
            refresh={() => setRevision((value) => value + 1)}
          />
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        {t('moderation.contact')}{' '}
        <a className="text-primary" href="mailto:info@gatherory.com">
          info@gatherory.com
        </a>
      </p>
    </main>
  )
}

function ReportRow({ report, refresh }: { report: Report; refresh: () => void }) {
  const { t } = useTranslation()
  const [imageURL, setImageURL] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isOpen = report.status === 'open' || report.status === 'in_review'
  async function perform(operation: 'preview' | 'start_review' | 'hide_image' | 'dismiss') {
    setBusy(true)
    setError(null)
    try {
      if (operation === 'preview') {
        const result = await request<{ url: string }>(
          `/api/admin/report-image?reportId=${report.id}`
        )
        setImageURL(result.url)
      } else {
        await request('/api/admin/reports', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportId: report.id,
            expectedStatus: report.status,
            action: operation,
            note,
          }),
        })
        toast.success(t('moderation.saved'))
        refresh()
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('moderation.loadFailed'))
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="space-y-4 py-6" aria-labelledby={`report-${report.id}`}>
      <div className="flex flex-wrap justify-between gap-3">
        <h2 id={`report-${report.id}`} className="font-semibold">
          {t(`moderation.reason.${report.reason}`)}
        </h2>
        <time dateTime={report.createdAt} className="text-sm text-muted-foreground">
          {new Date(report.createdAt).toLocaleString()}
        </time>
      </div>
      {report.detail && <p className="whitespace-pre-wrap break-words">{report.detail}</p>}
      <p className="text-xs text-muted-foreground">{t('moderation.reportId', { id: report.id })}</p>
      {report.imageHidden && <p className="text-sm">{t('moderation.imageHidden')}</p>}
      {report.mediaAssetId ? (
        imageURL ? (
          <>
            <img
              src={imageURL}
              alt={t('moderation.evidenceAlt')}
              className="max-h-80 max-w-full rounded-lg object-contain"
              referrerPolicy="no-referrer"
              onError={() => {
                setImageURL(null)
                setError(t('moderation.previewExpired'))
              }}
            />
            <Button variant="outline" onClick={() => setImageURL(null)}>
              {t('moderation.concealEvidence')}
            </Button>
          </>
        ) : (
          <Button variant="outline" disabled={busy} onClick={() => void perform('preview')}>
            {t('moderation.revealEvidence')}
          </Button>
        )
      ) : (
        <p>{t('moderation.deletedImage')}</p>
      )}
      {isOpen && (
        <>
          <Label htmlFor={`note-${report.id}`}>{t('moderation.reviewNote')}</Label>
          <Textarea
            id={`note-${report.id}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={2000}
            disabled={busy}
          />
          <div className="flex flex-wrap gap-2">
            {report.status === 'open' && (
              <Button
                variant="outline"
                disabled={busy || note.trim().length < 5}
                onClick={() => void perform('start_review')}
              >
                {t('moderation.startReview')}
              </Button>
            )}
            <Button
              variant="destructive"
              disabled={busy || note.trim().length < 5 || !report.mediaAssetId}
              onClick={() => void perform('hide_image')}
            >
              {t('moderation.hideEveryone')}
            </Button>
            <Button
              variant="outline"
              disabled={busy || note.trim().length < 5}
              onClick={() => void perform('dismiss')}
            >
              {t('moderation.dismiss')}
            </Button>
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}
