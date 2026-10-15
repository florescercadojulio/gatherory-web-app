import { createFileRoute } from '@tanstack/react-router'
import { LibraryBig } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AccountSidebar } from '@/components/account-sidebar'
import { BlueprintEditor } from '@/components/blueprints/blueprint-editor'
import { PageUnavailable, ServerErrorToast } from '@/components/route-feedback'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { getBlueprintDraft } from '@/server/blueprints/handlers/blueprint-authoring.functions'

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
          <BlueprintEditor
            key={result.data.id}
            draft={result.data}
            starterName={result.data.source?.catalogKey}
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
