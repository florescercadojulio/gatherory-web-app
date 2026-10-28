import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, CircleAlert, PlugZap, Shield, SlidersHorizontal } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { SignIn } from '@/components/auth/sign-in'
import { AccountSidebar } from '@/components/account-sidebar'
import {
  mcpAuthorizationResumeURL,
  mcpConnectionRequest,
  mcpMergeUpdatedConnection,
  mcpPasswordSignInDestination,
  mcpReadOnlyScopes,
  mcpSocialSignInOptions,
  oauthResponseRedirect,
} from '@/lib/mcp-connection'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Link } from '@tanstack/react-router'

type ConnectedApp = {
  id: string
  clientId: string
  name: string
  icon: string | null
  scopes: string[]
  updatedAt: string
}
type ConnectionState = {
  enabled: boolean
  user: { email: string; name: string; image?: string | null } | null
  connections?: ConnectedApp[]
}

function Frame({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <main className="ph-no-record flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
      <section
        className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} space-y-6 rounded-2xl border bg-card p-6 shadow-sm`}
      >
        <img src="/gatherory-icon.png" alt="Gatherory" className="size-12 rounded-xl" />
        {children}
      </section>
    </main>
  )
}

function ConnectionsLayout({
  children,
  user,
}: {
  children: ReactNode
  user: { email: string; name: string; image?: string | null }
}) {
  const { t } = useTranslation('mcp')
  return (
    <SidebarProvider className="ph-no-record">
      <AccountSidebar
        user={{ name: user.name || user.email, email: user.email, image: user.image }}
      />
      <SidebarInset>
        <header className="app-toolbar">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <PlugZap className="size-4 text-brand-ink" />
          <span className="truncate text-sm font-medium">{t('connections')}</span>
          <Link
            to="/account"
            className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {t('backToAccount')}
          </Link>
        </header>
        <div className="app-page-shell w-full max-w-3xl">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function McpConnectionPage({ mode }: { mode: 'connect' | 'consent' | 'connections' }) {
  const { t } = useTranslation('mcp')
  const [state, setState] = useState<ConnectionState | null>(null)
  const [search, setSearch] = useState('')
  const [clientName, setClientName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [connections, setConnections] = useState<ConnectedApp[] | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [readOnly, setReadOnly] = useState(false)
  const [connectionError, setConnectionError] = useState<'load' | 'save' | 'reconnect' | null>(null)
  const [failedSave, setFailedSave] = useState<ConnectedApp | null>(null)
  const request = mcpConnectionRequest(search)
  const resumeURL = mcpAuthorizationResumeURL(search)

  useEffect(() => {
    const abort = new AbortController()
    setSearch(window.location.search)
    fetch('/api/mcp/connection', { signal: abort.signal, cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error()
        const data: ConnectionState = await response.json()
        setState(data)
        if (mode === 'connections') setConnections(data.connections ?? [])
        if (data.enabled && data.user && mode === 'consent') {
          const connection = mcpConnectionRequest(window.location.search)
          if (connection) {
            const result = await authClient.oauth2.publicClient({
              query: { client_id: connection.clientId },
            })
            if (result.error || !result.data) throw new Error()
            setClientName(result.data.client_name ?? connection.clientId)
          }
        }
      })
      .catch((cause) => {
        if (cause?.name !== 'AbortError') setError(true)
      })
    return () => abort.abort()
  }, [mode])

  async function perform(operation: () => Promise<unknown>) {
    setBusy(true)
    setError(false)
    try {
      const result = await operation()
      if (result && typeof result === 'object' && 'error' in result && result.error)
        throw new Error()
      const data = result && typeof result === 'object' && 'data' in result ? result.data : result
      const destination = oauthResponseRedirect(data)
      if (!destination) throw new Error()
      window.location.assign(destination)
    } catch {
      setError(true)
      setBusy(false)
    }
  }

  const socialCallback = mcpSocialSignInOptions('google', search).callbackURL

  async function savePermissions(connection: ConnectedApp) {
    setBusy(true)
    setConnectionError(null)
    try {
      const scopes = mcpReadOnlyScopes(connection.scopes)
      const response = await fetch('/api/mcp/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ clientId: connection.clientId, scopes }),
      })
      if (response.status === 409) {
        setConnectionError('reconnect')
        return
      }
      if (!response.ok) throw new Error()
      const result: { ok: true; connection: ConnectedApp } = await response.json()
      setConnections((items) =>
        items ? mcpMergeUpdatedConnection(items, result.connection) : [result.connection]
      )
      setFailedSave(null)
      setEditing(null)
    } catch {
      setConnectionError('save')
      setFailedSave(connection)
    } finally {
      setBusy(false)
    }
  }

  async function retryConnections() {
    setConnectionError(null)
    try {
      const response = await fetch('/api/mcp/connection', {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      if (!response.ok) throw new Error()
      const data: ConnectionState = await response.json()
      setState(data)
      setConnections(data.connections ?? [])
    } catch {
      setConnectionError('load')
    }
  }

  if (error && !state)
    return (
      <Frame>
        <p role="alert">{t('failure')}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t('retry')}
        </Button>
      </Frame>
    )
  if (!state)
    return (
      <Frame>
        <p role="status">{t('loading')}</p>
      </Frame>
    )
  if (!state.enabled)
    return (
      <Frame>
        <p>{t('unavailable')}</p>
      </Frame>
    )
  if (mode !== 'connections' && !request)
    return (
      <Frame>
        <p role="alert">{t('invalid')}</p>
      </Frame>
    )
  if ((mode === 'consent' || mode === 'connections') && !state.user)
    return (
      <Frame>
        <p>{t('signInRequired')}</p>
        {mode === 'connections' && (
          <Link
            to="/auth/$path"
            params={{ path: 'sign-in' }}
            search={{ redirectTo: '/mcp/connections' }}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t('signIn')}
          </Link>
        )}
      </Frame>
    )

  const page = (
    <>
      <h1 className="text-2xl font-semibold">
        {t(mode === 'consent' ? 'consentTitle' : mode === 'connections' ? 'connections' : 'title')}
      </h1>
      {state.user && (
        <p className="text-sm text-muted-foreground">
          {t('signedIn', { email: state.user.email })}
        </p>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {t('failure')}
        </p>
      )}
      {mode === 'connections' && connectionError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          <div className="flex-1">
            <p>
              {t(
                connectionError === 'load'
                  ? 'loadFailed'
                  : connectionError === 'reconnect'
                    ? 'reconnectRequired'
                    : 'saveFailed'
              )}
            </p>
            {connectionError !== 'reconnect' && (
              <Button
                variant="link"
                className="h-auto p-0 text-destructive"
                onClick={() =>
                  void (connectionError === 'load'
                    ? retryConnections()
                    : failedSave
                      ? savePermissions(failedSave)
                      : undefined)
                }
              >
                {t('retry')}
              </Button>
            )}
          </div>
        </div>
      )}
      {mode === 'connect' && (
        <>
          <p>{t('intro')}</p>
          {state.user && request && resumeURL && (
            <Button
              className="w-full"
              disabled={busy}
              onClick={() => window.location.assign(resumeURL)}
            >
              {t('continueAs', { email: state.user.email })}
            </Button>
          )}
          <SignIn
            hideSecondaryActions
            callbackURL={`${window.location.origin}${socialCallback}`}
            errorCallbackURL={`${window.location.origin}${socialCallback}`}
            continuationRedirectTo={socialCallback}
            onSignInSuccess={(data) => {
              const destination = mcpPasswordSignInDestination(search, data)
              if (destination) window.location.assign(destination)
              else {
                setError(true)
                throw new Error(t('failure'))
              }
            }}
          />
        </>
      )}
      {mode === 'consent' && request && (
        <>
          <p>{t('requesting', { client: clientName || request.clientId })}</p>
          <ul className="list-disc space-y-2 pl-5">
            {request.scopes.map((scope) => (
              <li key={scope}>
                {t(
                  scope === 'gatherory:write'
                    ? 'write'
                    : scope === 'offline_access'
                      ? 'offline'
                      : 'read'
                )}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">{t('permissionNote')}</p>
          <div className="flex gap-3">
            <Button
              disabled={busy || !clientName}
              onClick={() =>
                perform(() =>
                  authClient.oauth2.consent({ accept: true, scope: request.scopes.join(' ') })
                )
              }
            >
              {t(busy ? 'working' : 'allow')}
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => perform(() => authClient.oauth2.consent({ accept: false }))}
            >
              {t('deny')}
            </Button>
          </div>
          <a href="/mcp/connections" className="block text-sm underline">
            {t('connections')}
          </a>
        </>
      )}
      {mode === 'connections' && (
        <section aria-labelledby="connected-apps-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="connected-apps-heading" className="text-lg font-semibold">
                {t('connectedApps')}
              </h2>
              <p className="text-sm text-muted-foreground">{t('connectionsDescription')}</p>
            </div>
            <Badge variant="secondary">{t('connected')}</Badge>
          </div>
          {connections === null ? (
            <p role="status">{t('loading')}</p>
          ) : connections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <PlugZap className="size-8 text-muted-foreground" />
                <p className="font-medium">{t('empty')}</p>
                <p className="max-w-sm text-sm text-muted-foreground">{t('emptyDescription')}</p>
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-3">
              {connections.map((connection) => {
                const hasWrite = connection.scopes.includes('gatherory:write')
                const isEditing = editing === connection.id
                return (
                  <li key={connection.id}>
                    <Card>
                      <CardHeader className="flex items-center gap-3 space-y-0">
                        <div className="flex size-10 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                          {connection.icon ? (
                            <img
                              src={connection.icon}
                              alt=""
                              className="size-full object-contain p-1"
                            />
                          ) : (
                            <PlugZap className="size-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="truncate">
                            {connection.name || connection.clientId}
                          </CardTitle>
                          <CardDescription className="truncate">
                            {connection.clientId}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="gap-1">
                          <Check />
                          {t('connected')}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {!isEditing ? (
                          <>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">{t('readAccess')}</Badge>
                              {hasWrite && <Badge variant="secondary">{t('writeAccess')}</Badge>}
                              {connection.scopes.includes('offline_access') && (
                                <Badge variant="outline">{t('persistentAccess')}</Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                variant="outline"
                                disabled={busy}
                                onClick={() => {
                                  setEditing(connection.id)
                                  setReadOnly(!hasWrite)
                                  setConnectionError(null)
                                }}
                              >
                                <SlidersHorizontal />
                                {t('configure')}
                              </Button>
                              <Button
                                variant="outline"
                                disabled={busy}
                                onClick={async () => {
                                  setBusy(true)
                                  setError(false)
                                  try {
                                    const result = await authClient.oauth2.deleteConsent({
                                      id: connection.id,
                                    })
                                    if (result.error) throw new Error()
                                    setConnections(
                                      (items) =>
                                        items?.filter((item) => item.id !== connection.id) ?? []
                                    )
                                  } catch {
                                    setError(true)
                                  } finally {
                                    setBusy(false)
                                  }
                                }}
                              >
                                {t('revoke')}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="rounded-lg border p-4">
                              <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                                <Shield className="size-4" />
                                {t('permissionSummary')}
                              </p>
                              <ul className="space-y-2 text-sm text-muted-foreground">
                                <li>{t('read')}</li>
                                {hasWrite && !readOnly && <li>{t('write')}</li>}
                                {connection.scopes.includes('offline_access') && (
                                  <li>{t('offline')}</li>
                                )}
                              </ul>
                              <div className="mt-4 flex items-center justify-between gap-4 border-t pt-4">
                                <div>
                                  <p className="text-sm font-medium">{t('readOnly')}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {t('readOnlyDescription')}
                                  </p>
                                </div>
                                <Switch
                                  aria-label={t('readOnly')}
                                  checked={readOnly}
                                  disabled={!hasWrite || busy}
                                  onCheckedChange={setReadOnly}
                                />
                              </div>
                            </div>
                            {!hasWrite && (
                              <p className="text-xs text-muted-foreground">
                                {t('reconnectForWrite')}
                              </p>
                            )}
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                disabled={busy}
                                onClick={() => {
                                  setEditing(null)
                                  setConnectionError(null)
                                }}
                              >
                                {t('cancel')}
                              </Button>
                              <Button
                                disabled={busy || !readOnly || !hasWrite}
                                onClick={() => void savePermissions(connection)}
                              >
                                {busy ? t('working') : t('save')}
                              </Button>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </>
  )
  if (mode === 'connections' && state.user)
    return <ConnectionsLayout user={state.user}>{page}</ConnectionsLayout>
  return <Frame>{page}</Frame>
}
