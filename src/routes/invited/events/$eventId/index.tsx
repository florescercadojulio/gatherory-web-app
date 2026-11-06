import { createFileRoute, Link, redirect, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { GuestEventView } from '@/components/invitations/guest-event-view'
import {
  getBrowserGuestEvent,
  respondAsBrowserGuest,
} from '@/server/events/handlers/browser-guest-invitation.handler'
import {
  getAccountInvitedEvent,
  respondAsInvitedAccount,
} from '@/server/events/handlers/account-invited-event.handler'
import { getSession } from '@/lib/auth.functions'

export const Route = createFileRoute('/invited/events/$eventId/')({
  head: () => ({ meta: [{ name: 'referrer', content: 'no-referrer' }] }),
  loader: async ({ params }) => {
    if (!z.uuid().safeParse(params.eventId).success)
      return { event: null, account: false, loadError: null }
    const session = await getSession()
    if (!session.ok) return { event: null, account: false, loadError: session.error.userMessage }
    const account = Boolean(session.data)
    if (account) {
      const result = await getAccountInvitedEvent({ data: { eventId: params.eventId } })
      if (!result.ok) return { event: null, account, loadError: result.error.userMessage }
      if (result.data.planningEventId) {
        throw redirect({ to: '/workspaces' })
      }
      return { event: result.data.event, account, loadError: null }
    }
    const result = await getBrowserGuestEvent({ data: { eventId: params.eventId } })
    if (!result.ok) return { event: null, account, loadError: result.error.userMessage }
    return { event: result.data.event, account, loadError: null }
  },
  component: InvitedGuestEvent,
})

function InvitedGuestEvent() {
  const { i18n, t } = useTranslation()
  const router = useRouter()
  const { eventId } = Route.useParams()
  const { event, account, loadError } = Route.useLoaderData()
  if (!event) {
    return (
      <main className="ph-no-capture ph-no-record min-h-svh bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
        <section className="mx-auto max-w-lg space-y-4" role="status">
          {loadError ? (
            <>
              <h1 className="text-2xl font-semibold">{t('invitation.eventLoadFailed')}</h1>
              <p className="text-sm text-muted-foreground">{loadError}</p>
              <Link
                to="/invited/events/$eventId"
                params={{ eventId }}
                className="inline-flex min-h-11 max-w-full items-center break-words underline underline-offset-4"
              >
                {t('common.tryAgain')}
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold">{t('invitation.eventUnavailable')}</h1>
              <p className="text-sm text-muted-foreground">{t('invitation.unavailableRecovery')}</p>
            </>
          )}
        </section>
      </main>
    )
  }
  return (
    <GuestEventView
      key={event.id}
      event={event}
      locale={i18n.language}
      submitResponse={async (attendance) => {
        const result = account
          ? await respondAsInvitedAccount({ data: { eventId: event.id, attendance } })
          : await respondAsBrowserGuest({ data: { eventId: event.id, attendance } })
        if (!result.ok) throw new Error(result.error.userMessage)
        void router.invalidate().catch(() => {})
      }}
    />
  )
}
