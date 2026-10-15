import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { LibraryBig } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { AccountSidebar } from '@/components/account-sidebar'
import { BlueprintEditor } from '@/components/blueprints/blueprint-editor'
import { PageUnavailable, ServerErrorToast } from '@/components/route-feedback'
import type { BlueprintAuthoringContext } from '@/contracts/blueprint-authoring.contracts'
import { BlueprintStableKeySchema } from '@/contracts/blueprint-install.contracts'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import {
  createBlueprintAuthoringWorkspace,
  getBlueprintAuthoringContext,
  getBlueprintStarter,
} from '@/server/blueprints/handlers/blueprint-authoring.functions'

const searchSchema = z
  .object({
    catalogKey: BlueprintStableKeySchema.optional(),
    revision: z.coerce.number().int().positive().optional(),
  })
  .superRefine((search, context) => {
    if (Boolean(search.catalogKey) !== Boolean(search.revision)) {
      context.addIssue({
        code: 'custom',
        message: 'Starter key and revision must be supplied together.',
      })
    }
  })

export const Route = createFileRoute('/_protected/blueprints/new/')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const context = await getBlueprintAuthoringContext()
    const starter =
      deps.catalogKey && deps.revision
        ? await getBlueprintStarter({
            data: { catalogKey: deps.catalogKey, revision: deps.revision },
          })
        : null
    return { context, starter }
  },
  component: NewBlueprint,
})

function NewBlueprint() {
  const { t } = useTranslation()
  const router = useRouter()
  const { authoringUser } = Route.useRouteContext()
  const { catalogKey, revision } = Route.useSearch()
  const { context, starter } = Route.useLoaderData()
  const [workspaceId, setWorkspaceId] = useState('')
  const [workspaceError, setWorkspaceError] = useState('')
  const [creatingWorkspace, setCreatingWorkspace] = useState(false)

  if (!authoringUser) return null
  if (!context.ok)
    return (
      <>
        <ServerErrorToast error={context.error} />
        <PageUnavailable
          title={t('blueprints.createTitle')}
          description={context.error.userMessage}
        />
      </>
    )
  if (catalogKey && (!starter || !starter.ok)) {
    const error = starter && !starter.ok ? starter.error : null
    return (
      <>
        <ServerErrorToast error={error} />
        <PageUnavailable
          title={t('blueprints.createTitle')}
          description={error?.userMessage ?? t('blueprints.actionFailed')}
        />
      </>
    )
  }
  const workspaces = context.data.workspaces
  const selectedWorkspaceId = workspaceId || (workspaces.length === 1 ? workspaces[0]!.id : '')

  async function createWorkspace() {
    setCreatingWorkspace(true)
    setWorkspaceError('')
    try {
      const result = await createBlueprintAuthoringWorkspace()
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

  return (
    <SidebarProvider>
      <AccountSidebar user={authoringUser} />
      <SidebarInset>
        <header className="app-toolbar">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <LibraryBig className="size-4 text-brand-ink" />
            <span className="text-sm font-medium">{t('blueprints.createTitle')}</span>
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-auto">
          <div className="mx-auto flex w-full max-w-5xl justify-end px-4 pt-4 sm:px-6 lg:px-8">
            <Button variant="ghost" render={<Link to="/blueprints" />}>
              {t('common.cancel')}
            </Button>
          </div>
          {workspaces.length > 1 ? (
            <div className="mx-auto w-full max-w-5xl space-y-2 px-4 pt-5 sm:px-6 lg:px-8">
              <Label htmlFor="blueprint-owner">{t('blueprints.ownerWorkspace')}</Label>
              <NativeSelect
                id="blueprint-owner"
                className="max-w-md"
                value={selectedWorkspaceId}
                onChange={(event) => setWorkspaceId(event.target.value)}
              >
                <option value="">{t('blueprints.ownerWorkspace')}</option>
                {workspaces.map((workspace: BlueprintAuthoringContext['workspaces'][number]) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                    {workspace.personal ? ` — ${t('blueprints.personalWorkspace')}` : ''}
                  </option>
                ))}
              </NativeSelect>
              <p className="text-xs text-muted-foreground">{t('blueprints.ownerWorkspaceHelp')}</p>
            </div>
          ) : null}
          {workspaces.length === 0 ? (
            <section className="mx-auto w-full max-w-5xl space-y-3 px-4 py-8 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-semibold">{t('blueprints.noWorkspace')}</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {t('blueprints.workspaceCreateFailed')}
              </p>
              <Button onClick={() => void createWorkspace()} disabled={creatingWorkspace}>
                {creatingWorkspace ? t('common.loading') : t('blueprints.createWorkspace')}
              </Button>
              {workspaceError ? (
                <p role="alert" className="text-sm text-destructive">
                  {workspaceError}
                </p>
              ) : null}
            </section>
          ) : (
            <BlueprintEditor
              key={catalogKey && revision ? `${catalogKey}:${revision}` : 'blank'}
              organizationId={selectedWorkspaceId || undefined}
              starterContent={starter?.ok ? starter.data : undefined}
              source={catalogKey && revision ? { catalogKey, revision } : undefined}
              starterName={catalogKey}
            />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
