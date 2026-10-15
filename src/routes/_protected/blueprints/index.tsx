import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { LibraryBig, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AccountSidebar } from '@/components/account-sidebar'
import { EntityTablePage, type EntityTableColumnDef } from '@/components/entity-table-page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/native-select'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { PageUnavailable, ServerErrorToast } from '@/components/route-feedback'
import type { BlueprintAuthoringRow } from '@/contracts/blueprint-authoring.contracts'
import {
  getBlueprintAuthoringContext,
  listBlueprintTemplates,
} from '@/server/blueprints/handlers/blueprint-authoring.functions'

export const Route = createFileRoute('/_protected/blueprints/')({
  loader: () => getBlueprintAuthoringContext(),
  component: BlueprintLibrary,
})

function BlueprintLibrary() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { authoringUser } = Route.useRouteContext()
  const context = Route.useLoaderData()
  const [source, setSource] = useState<'all' | 'curated' | 'private'>('all')
  const [status, setStatus] = useState<'all' | 'draft' | 'published' | 'retired'>('all')
  const columns = [
    { accessorKey: 'name', header: t('blueprints.name') },
    {
      accessorKey: 'description',
      header: t('blueprints.descriptionLabel'),
      cell: ({ row }) => (
        <span className="block max-w-lg truncate">{row.original.description.slice(0, 500)}</span>
      ),
    },
    {
      accessorKey: 'source',
      header: t('blueprints.source'),
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.source === 'curated'
            ? t('blueprints.sourceCurated')
            : t('blueprints.sourcePrivate')}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: t('blueprints.status'),
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'published' ? 'secondary' : 'outline'}>
          {t(`blueprints.status${capitalize(row.original.status)}`)}
        </Badge>
      ),
    },
    {
      id: 'action',
      header: '',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-brand-ink">
          {row.original.source === 'curated'
            ? t('blueprints.customize')
            : t('blueprints.openTemplate')}
        </span>
      ),
    },
  ] satisfies readonly EntityTableColumnDef<BlueprintAuthoringRow>[]

  if (!authoringUser) return null
  return (
    <SidebarProvider>
      <ServerErrorToast error={context.ok ? null : context.error} />
      <AccountSidebar user={authoringUser} />
      <SidebarInset>
        <header className="app-toolbar">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <LibraryBig className="size-4 text-brand-ink" />
            <span className="text-sm font-medium">{t('blueprints.title')}</span>
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">
          {!context.ok ? (
            <PageUnavailable
              title={t('blueprints.title')}
              description={context.error.userMessage}
            />
          ) : (
            <EntityTablePage
              config={{
                serverFn: listBlueprintTemplates,
                request: { source, status },
                columns,
                getRowId: (row) => row.id,
                onRowClick: (row) => {
                  if (row.source === 'curated') {
                    if (row.revision)
                      void navigate({
                        to: '/blueprints/new',
                        search: { catalogKey: row.catalogKey, revision: row.revision },
                      })
                  } else {
                    void navigate({
                      to: '/blueprints/$blueprintId',
                      params: { blueprintId: row.id },
                    })
                  }
                },
                search: {
                  placeholder: t('blueprints.title'),
                  filters: (
                    <>
                      <NativeSelect
                        aria-label={t('blueprints.source')}
                        className="min-w-36"
                        value={source}
                        onChange={(event) => setSource(event.target.value as typeof source)}
                      >
                        <option value="all">{t('blueprints.sources.all')}</option>
                        <option value="curated">{t('blueprints.sources.curated')}</option>
                        <option value="private">{t('blueprints.sources.private')}</option>
                      </NativeSelect>
                      <NativeSelect
                        aria-label={t('blueprints.status')}
                        className="min-w-36"
                        value={status}
                        onChange={(event) => setStatus(event.target.value as typeof status)}
                      >
                        <option value="all">{t('blueprints.statuses.all')}</option>
                        <option value="draft">{t('blueprints.statuses.draft')}</option>
                        <option value="published">{t('blueprints.statuses.published')}</option>
                        <option value="retired">{t('blueprints.statuses.retired')}</option>
                      </NativeSelect>
                    </>
                  ),
                },
                resourceControls: (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" render={<Link to="/blueprints/capture" />}>
                      {t('blueprints.captureCreate')}
                    </Button>
                    <Button render={<Link to="/blueprints/new" />}>
                      <Plus />
                      {t('blueprints.newTemplate')}
                    </Button>
                  </div>
                ),
                paginationResetKey: `${source}:${status}`,
                pagination: { initialPageSize: 20, pageSizeOptions: [20, 50, 100] },
              }}
              emptyMessage={t('blueprints.empty')}
            />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
