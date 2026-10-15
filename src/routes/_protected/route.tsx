import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { PageUnavailable, ServerErrorToast } from '@/components/route-feedback'
import { ensurePersonalWorkspace } from '@/server/workspaces/handlers/ensure-personal-workspace.handler'
import { ensureSession } from '@/lib/auth.functions'
import { isTemplateAuthoringPath } from '@/lib/protected-route-mode'

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    if (isTemplateAuthoringPath(location.pathname)) {
      const result = await ensureSession()
      return {
        authoringUser: result.ok ? result.data.user : null,
        defaultWorkspaceContext: null,
        defaultWorkspaceError: result.ok ? null : result.error,
      }
    }
    const result = await ensurePersonalWorkspace()

    return {
      defaultWorkspaceContext: result.ok ? result.data : null,
      defaultWorkspaceError: result.ok ? null : result.error,
      authoringUser: null,
    }
  },
  component: ProtectedLayout,
})

function ProtectedLayout() {
  const { t } = useTranslation()
  const { defaultWorkspaceContext, defaultWorkspaceError, authoringUser } = Route.useRouteContext()

  if (!defaultWorkspaceContext && !authoringUser) {
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
