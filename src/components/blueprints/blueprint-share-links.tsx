import { useServerFn } from '@tanstack/react-start'
import { Check, Copy, Link2, Plus, RefreshCw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  createBlueprintShareLink,
  listBlueprintShareLinks,
  revokeBlueprintShareLink,
} from '@/server/blueprints/handlers/blueprint-sharing.functions'

type BlueprintShareLink = {
  id: string
  revision: number
  createdAt: string
  revokedAt: string | null
}

type CreatedBlueprintShareLink = BlueprintShareLink & {
  token: string
}

export function BlueprintShareLinks({
  templateId,
  revision,
}: {
  templateId: string
  revision: number | null
}) {
  const { t, i18n } = useTranslation()
  const listLinks = useServerFn(listBlueprintShareLinks)
  const createLink = useServerFn(createBlueprintShareLink)
  const revokeLink = useServerFn(revokeBlueprintShareLink)
  const [links, setLinks] = useState<BlueprintShareLink[]>([])
  const [created, setCreated] = useState<CreatedBlueprintShareLink | null>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const result = await listLinks({ data: { templateId } })
      if (!result.ok) {
        setError(result.error.userMessage)
        return
      }
      setLinks(result.data)
    } catch {
      setError(t('blueprints.shareLinksLoadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // The server function is stable for a mounted template detail page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId])

  async function create() {
    if (revision === null || creating) return
    setCreating(true)
    setError(null)
    setCopyState('idle')
    try {
      const result = await createLink({ data: { templateId, revision } })
      if (!result.ok) {
        setError(result.error.userMessage)
        return
      }
      setCreated(result.data)
      setLinks((current) => [result.data, ...current])
    } catch {
      setError(t('blueprints.shareLinkCreateFailed'))
    } finally {
      setCreating(false)
    }
  }

  async function revoke(linkId: string) {
    if (revokingId) return
    setRevokingId(linkId)
    setError(null)
    try {
      const result = await revokeLink({ data: { templateId, linkId } })
      if (!result.ok) {
        setError(result.error.userMessage)
        return
      }
      const revokedAt = new Date().toISOString()
      setLinks((current) =>
        current.map((link) => (link.id === linkId ? { ...link, revokedAt } : link))
      )
      if (created?.id === linkId) setCreated(null)
    } catch {
      setError(t('blueprints.shareLinkRevokeFailed'))
    } finally {
      setRevokingId(null)
    }
  }

  async function copyCreatedLink() {
    if (!created) return
    const url = `${window.location.origin}/templates/shared/${created.token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'medium' }).format(
      new Date(value)
    )

  return (
    <Card className="ph-no-capture ph-no-record">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 aria-hidden="true" className="size-4" />
          {t('blueprints.shareLinksTitle')}
        </CardTitle>
        <CardDescription>{t('blueprints.shareLinksDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{t('blueprints.shareLinksPrivacy')}</p>
        <Button
          onClick={create}
          disabled={revision === null || creating || loading || revokingId !== null}
        >
          <Plus aria-hidden="true" />
          {creating ? t('blueprints.shareLinkCreating') : t('blueprints.shareLinkCreate')}
        </Button>
        {revision === null ? (
          <p className="text-sm text-muted-foreground">{t('blueprints.shareLinksPublishFirst')}</p>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {created ? (
          <section aria-live="polite" className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start gap-2">
              <Check aria-hidden="true" className="mt-0.5 size-4 text-emerald-600" />
              <div className="min-w-0 space-y-1">
                <p className="font-medium">{t('blueprints.shareLinkCreatedOnce')}</p>
                <p className="break-all font-mono text-xs text-muted-foreground">
                  {`${window.location.origin}/templates/shared/${created.token}`}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={copyCreatedLink}>
              {copyState === 'copied' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copyState === 'copied'
                ? t('blueprints.shareLinkCopied')
                : t('blueprints.shareLinkCopy')}
            </Button>
            {copyState === 'failed' ? (
              <p role="status" className="text-sm text-destructive">
                {t('blueprints.shareLinkCopyFailed')}
              </p>
            ) : null}
          </section>
        ) : null}

        <Separator />
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium">{t('blueprints.shareLinksExisting')}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refresh()}
            disabled={loading || creating || revokingId !== null}
            aria-label={t('blueprints.shareLinksRefresh')}
          >
            <RefreshCw aria-hidden="true" className={loading ? 'animate-spin' : undefined} />
          </Button>
        </div>
        {loading && links.length === 0 ? (
          <p role="status" className="text-sm text-muted-foreground">
            {t('blueprints.shareLinksLoading')}
          </p>
        ) : links.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('blueprints.shareLinksEmpty')}</p>
        ) : (
          <ul className="space-y-3">
            {links.map((link) => (
              <li key={link.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 text-sm">
                  <p className="font-medium">
                    {t('blueprints.shareLinkRevision', { revision: link.revision })}
                  </p>
                  <p className="text-muted-foreground">
                    {link.revokedAt
                      ? t('blueprints.shareLinkRevoked', { date: formatDate(link.revokedAt) })
                      : t('blueprints.shareLinkCreatedDate', { date: formatDate(link.createdAt) })}
                  </p>
                </div>
                {link.revokedAt ? (
                  <span className="text-sm text-muted-foreground">
                    <X aria-hidden="true" className="mr-1 inline size-4" />
                    {t('blueprints.shareLinkInactive')}
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={revokingId !== null || creating || loading}
                    onClick={() => void revoke(link.id)}
                  >
                    <X aria-hidden="true" />
                    {revokingId === link.id
                      ? t('blueprints.shareLinkRevoking')
                      : t('blueprints.shareLinkRevoke')}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
