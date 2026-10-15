import { createFileRoute, Link } from '@tanstack/react-router'
import { LibraryBig } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AccountSidebar } from '@/components/account-sidebar'
import { BlueprintEditor } from '@/components/blueprints/blueprint-editor'
import { BlueprintShareLinks } from '@/components/blueprints/blueprint-share-links'
import { PageUnavailable, ServerErrorToast } from '@/components/route-feedback'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { getBlueprintDraft } from '@/server/blueprints/handlers/blueprint-authoring.functions'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_protected/blueprints/$blueprintId/')({
  staleTime: 0,
  loader: ({ params }) => getBlueprintDraft({ data: { id: params.blueprintId } }),
  component: BlueprintDetail,
})

function BlueprintDetail() {
  const { t } = useTranslation()
  const { authoringUser } = Route.useRouteContext()
  const result = Route.useLoaderData()
  if (!authoringUser) return null
  if (!result.ok)
    return (
      <>
        <ServerErrorToast error={result.error} />
        <PageUnavailable
          title={t('blueprints.notFound')}
          description={result.error.userMessage || t('blueprints.unauthorized')}
        />
      </>
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
            <span className="text-sm font-medium">
              {result.data.content.name || t('blueprints.editTitle')}
            </span>
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col">
          {result.data.source && 'eventId' in result.data.source ? (
            <div className="mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6 lg:px-8">
              <Button
                variant="outline"
                render={
                  <Link
                    to="/blueprints/capture"
                    search={{ eventId: result.data.source.eventId, templateId: result.data.id }}
                  />
                }
              >
                {t('blueprints.captureUpdate')}
              </Button>
            </div>
          ) : null}
          {result.data.publishedRevision !== null ? (
            <div className="mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6 lg:px-8">
              <BlueprintShareLinks
                key={result.data.id}
                templateId={result.data.id}
                revision={result.data.publishedRevision}
              />
            </div>
          ) : null}
          <BlueprintEditor
            key={result.data.id}
            draft={result.data}
            starterName={
              result.data.source && 'catalogKey' in result.data.source
                ? result.data.source.catalogKey
                : undefined
            }
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
