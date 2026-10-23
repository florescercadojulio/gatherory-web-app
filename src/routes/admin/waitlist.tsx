import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import type { ServerResult } from '@/server/result'
import type {
  WaitlistPage,
  WaitlistPageInput,
} from '@/server/waitlist/contracts/waitlist.contracts'
import { waitlistAdminCopy } from '@/server/waitlist/contracts/waitlist-admin-copy'
import { waitlistCsv } from '@/server/waitlist/contracts/waitlist-csv'

export const Route = createFileRoute('/admin/waitlist')({
  head: () => ({
    meta: [{ title: 'Waitlist · Gatherory' }, { name: 'robots', content: 'noindex, nofollow' }],
  }),
  component: WaitlistTracker,
})

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, credentials: 'same-origin', cache: 'no-store' })
  const result: ServerResult<T> = await response.json()
  if (!result.ok) throw new Error(result.error.userMessage)
  if (!response.ok) throw new Error('The waitlist request failed.')
  return result.data
}

function WaitlistTracker() {
  const { i18n } = useTranslation()
  const copy = waitlistAdminCopy(i18n.resolvedLanguage)
  const session = authClient.useSession()
  const user = session.data?.user
  const actorKey = user?.emailVerified ? `${user.id}:${user.email}` : ''
  const [status, setStatus] = useState<WaitlistPageInput['status']>('all')
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [loaded, setLoaded] = useState<{ actorKey: string; data: WaitlistPage } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  // Never render retained rows after a sign-out or account switch.
  const data = loaded?.actorKey === actorKey && actorKey ? loaded.data : null
  useEffect(() => {
    setLoaded(null)
    setError(null)
    setConfirmId(null)
    if (!actorKey) return
    const controller = new AbortController()
    setLoading(true)
    void request<WaitlistPage>(`/api/admin/waitlist?status=${status}&page=${page}`, {
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) setLoaded({ actorKey, data })
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : copy.failed)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [actorKey, status, page, revision, copy.failed])

  async function unsubscribe(id: string) {
    setBusy(true)
    setError(null)
    try {
      await request('/api/admin/waitlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setConfirmId(null)
      setRevision((value) => value + 1)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.failed)
    } finally {
      setBusy(false)
    }
  }
  async function signOut() {
    setBusy(true)
    setLoaded(null)
    try {
      const result = await authClient.signOut()
      if (result.error) setError(copy.failed)
    } catch {
      setError(copy.failed)
    } finally {
      setBusy(false)
    }
  }
  function downloadPage() {
    if (!data) return
    const url = URL.createObjectURL(
      new Blob([waitlistCsv(data.entries)], { type: 'text/csv;charset=utf-8' })
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `gatherory-waitlist-page-${page}.csv`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <main className="app-page-shell ph-no-capture ph-no-record max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{copy.title}</h1>
          <p className="mt-2 text-muted-foreground">{copy.description}</p>
        </div>
        {actorKey && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              disabled={loading || busy}
              onClick={() => setRevision((value) => value + 1)}
            >
              {copy.refresh}
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => void signOut()}>
              {copy.signOut}
            </Button>
          </div>
        )}
      </header>
      {session.isPending ? (
        <p role="status">{copy.loading}</p>
      ) : !actorKey ? (
        <div>
          <p>{copy.signInNote}</p>
          <a
            className="mt-4 inline-block text-primary"
            href="/auth/sign-in?redirectTo=%2Fadmin%2Fwaitlist"
          >
            {copy.signIn}
          </a>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{copy.note}</p>
          {data && (
            <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {(
                [
                  [copy.all, data.totals.all],
                  [copy.active, data.totals.active],
                  [copy.unsubscribed, data.totals.unsubscribed],
                  [copy.lastSevenDays, data.totals.lastSevenDays],
                ] as const
              ).map(([label, count]) => (
                <div key={label} className="rounded-xl border p-4">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="mt-2 text-3xl font-semibold">{count}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {(['all', 'active', 'unsubscribed'] as const).map((value) => (
              <Button
                key={value}
                variant={status === value ? 'default' : 'outline'}
                aria-pressed={status === value}
                disabled={busy}
                onClick={() => {
                  setLoaded(null)
                  setStatus(value)
                  setPage(1)
                }}
              >
                {copy[value]}
              </Button>
            ))}
            <Button
              variant="outline"
              disabled={!data?.entries.length || busy || loading}
              onClick={downloadPage}
            >
              {copy.export}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{copy.exportNote}</p>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
          {loading && <p role="status">{copy.loading}</p>}
          {data && (
            <>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-left text-sm">
                  <thead className="border-b">
                    <tr>
                      {[
                        copy.email,
                        copy.language,
                        copy.source,
                        copy.campaign,
                        copy.joined,
                        copy.status,
                      ].map((label) => (
                        <th key={label} className="p-3 font-medium">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.entries.map((entry) => (
                      <tr key={entry.id} className="border-b last:border-0">
                        <td className="p-3">{entry.email}</td>
                        <td className="p-3">{entry.locale}</td>
                        <td className="p-3">{entry.source}</td>
                        <td className="p-3">{entry.campaign ?? '—'}</td>
                        <td className="whitespace-nowrap p-3">
                          <time dateTime={entry.createdAt}>
                            {new Date(entry.createdAt).toLocaleString(i18n.resolvedLanguage)}
                          </time>
                        </td>
                        <td className="p-3">
                          {entry.unsubscribedAt ? (
                            copy.unsubscribed
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={busy || loading}
                              onClick={() => setConfirmId(entry.id)}
                            >
                              {busy ? copy.saving : copy.optOut}
                            </Button>
                          )}
                          {confirmId === entry.id && !entry.unsubscribedAt && (
                            <div
                              className="mt-3 max-w-xs space-y-3"
                              role="group"
                              aria-label={copy.confirmOptOut}
                            >
                              <p className="text-sm">{copy.confirm}</p>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => void unsubscribe(entry.id)}
                                >
                                  {copy.confirmOptOut}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busy}
                                  onClick={() => setConfirmId(null)}
                                >
                                  {copy.cancel}
                                </Button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.entries.length === 0 && <p role="status">{copy.empty}</p>}
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  disabled={page <= 1 || loading || busy}
                  onClick={() => {
                    setLoaded(null)
                    setPage((value) => value - 1)
                  }}
                >
                  {copy.previous}
                </Button>
                <span>
                  {copy.page} {page}
                </span>
                <Button
                  variant="outline"
                  disabled={!data.hasNextPage || loading || busy}
                  onClick={() => {
                    setLoaded(null)
                    setPage((value) => value + 1)
                  }}
                >
                  {copy.next}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </main>
  )
}
