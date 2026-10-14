import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { PageUnavailable, ServerErrorToast } from '@/components/route-feedback'
import { ensurePersonalWorkspace } from '@/server/workspaces/handlers/workspace.handlers'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async () => {
    const result = await ensurePersonalWorkspace()

    return {
      defaultWorkspaceContext: result.ok ? result.data : null,
      defaultWorkspaceError: result.ok ? null : result.error,
    }
  },
  component: ProtectedLayout,
})

function ProtectedLayout() {
  const { t } = useTranslation()
  const { defaultWorkspaceContext, defaultWorkspaceError } = Route.useRouteContext()

  if (!defaultWorkspaceContext) {
    return (
      <>
        <ServerErrorToast error={defaultWorkspaceError} />
        <PageUnavailable
          title={t('feedback.workspacePrepareTitle')}
          description={t('feedback.workspacePrepareDescription')}
        />
      </>
    )
  }

  return <Outlet />
}
