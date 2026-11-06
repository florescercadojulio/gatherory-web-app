import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { cn } from 'cn'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ServerErrorToast } from '@/components/route-feedback'
import { getSession } from '@/lib/auth.functions'
import { invitationPath } from '@/lib/event-invitation-links'
import { formatInvitationDate } from '@/lib/event-invitation-date'
import { acceptEventInvitation } from '@/server/events/handlers/accept-event-invitation.handler'
import { getEventInvitation } from '@/server/events/handlers/get-event-invitation.handler'
import { acceptSharedEventInvitation } from '@/server/events/handlers/accept-shared-event-invitation.handler'
import { getSharedEventInvitation } from '@/server/events/handlers/get-shared-event-invitation.handler'
import { getJoinedSharedInvitation } from '@/server/events/handlers/get-joined-shared-invitation.handler'
import {
  getBrowserGuestInvitationStatus,
  joinBrowserGuestInvitation,
  prepareBrowserGuestSession,
  respondAsBrowserGuest,
  endBrowserGuestSession,
} from '@/server/events/handlers/browser-guest-invitation.handler'
import {
  GuestRsvp,
  type GuestAttendance,
  type GuestRsvpEvent,
  type SavedGuestResponse,
} from '@/components/invitations/guest-rsvp'
import { ApprovalPendingNotice } from '@/components/invitations/approval-pending-notice'
import { InvitationAccessAction } from '@/components/invitations/invitation-access-action'
import {
  getInvitationDisplayState,
  getLocalInvitationPostStatus,
  getSignedOutInvitationCopy,
} from '@/lib/event-invitation-presentation'

export const Route = createFileRoute('/join/$token')({
  head: () => ({ meta: [{ name: 'referrer', content: 'no-referrer' }] }),
  loader: async ({ params }) => {
    if (!z.uuid().safeParse(params.token).success)
      return { shared: false, session: null, invitation: null, error: null, browserGuest: null }
    const shared = await getSharedEventInvitation({
      data: { token: params.token },
    })
    if (!shared.ok)
      return {
        shared: false,
        session: null,
        invitation: null,
        error: shared.error,
        browserGuest: null,
      }
    const session = await getSession()
    if (!session.ok)
      return {
        shared: !!shared.data,
        session: null,
        invitation: shared.data,
        error: session.error,
        browserGuest: null,
      }
    if (!session.data) {
      const browserGuest = await getBrowserGuestInvitationStatus({ data: { token: params.token } })
      return {
        shared: !!shared.data,
        session: null,
        invitation: shared.data,
        error: browserGuest && !browserGuest.ok ? browserGuest.error : null,
        browserGuest: browserGuest?.ok ? browserGuest.data : null,
      }
    }
    const joined = await getJoinedSharedInvitation({
      data: { token: params.token },
    })
    if (!joined.ok)
      return {
        shared: true,
        session: {
          user: {
            emailVerified: session.data.user.emailVerified,
            email: session.data.user.email,
          },
        },
        invitation: null,
        error: joined.error,
        browserGuest: null,
      }
    if (joined.ok && joined.data)
      return {
        shared: true,
        session: {
          user: {
            emailVerified: session.data.user.emailVerified,
            email: session.data.user.email,
          },
        },
        invitation: joined.data,
        error: null,
        browserGuest: null,
      }
    if (shared.data)
      return {
        shared: true,
        session: {
          user: {
            emailVerified: session.data.user.emailVerified,
            email: session.data.user.email,
          },
        },
        invitation: shared.data,
        error: null,
        browserGuest: null,
      }
    const invitation = await getEventInvitation({
      data: { token: params.token },
    })
    return {
      shared: false,
      session: {
        user: {
          emailVerified: session.data.user.emailVerified,
          email: session.data.user.email,
        },
      },
      invitation: invitation.ok ? invitation.data : null,
      error: invitation.ok ? null : invitation.error,
      browserGuest: null,
    }
  },
  component: JoinInvitation,
  pendingComponent: () => (
    <main className="mx-auto max-w-lg space-y-6 px-6 py-16">
      <Skeleton className="size-14 rounded-2xl" />
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-24 w-full" />
    </main>
  ),
})

function JoinInvitation() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const router = useRouter()
  const { token } = Route.useParams()
  const { session, invitation, error, shared, browserGuest } = Route.useLoaderData()
  const [pending, setPending] = useState(false)
  const [acceptance, setAcceptance] = useState<{
    token: string
    role: string
    status: string
    eventId: string | null
  } | null>(null)
  const acceptedEventId = acceptance?.token === token ? acceptance.eventId : null
  const localAcceptanceStatus = acceptance?.token === token ? acceptance.status : null
  const invitationState = getInvitationDisplayState(invitation?.status, localAcceptanceStatus)
  const valid = z.uuid().safeParse(token).success
  const continuation = valid ? invitationPath(token) : '/'
  const expired = invitation?.expiresAt ? new Date(invitation.expiresAt) <= new Date() : false
  const requiresApproval =
    !!invitation && 'requiresApproval' in invitation && invitation.requiresApproval === true
  const planningPermission =
    invitation && 'planningPermission' in invitation ? invitation.planningPermission : 'view_only'
  const signedOutCopy = getSignedOutInvitationCopy({
    shared,
    role: invitation?.role,
    planningPermission,
    requiresApproval,
  })
  const invitationDate =
    shared && invitation && 'startsAt' in invitation
      ? formatInvitationDate({
          startsAt: invitation.startsAt,
          timeZone: 'timeZone' in invitation ? invitation.timeZone : undefined,
          isAllDay: 'isAllDay' in invitation ? invitation.isAllDay : false,
          locale: i18n.language,
        })
      : null

  if (
    !session &&
    (browserGuest?.invitation?.role === 'guest' || (shared && invitation?.role === 'guest'))
  ) {
    const publicInvitation = browserGuest?.invitation
    if (!publicInvitation) {
      return (
        <main className="ph-no-capture ph-no-record min-h-svh bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
          <ServerErrorToast error={error} />
          <section className="mx-auto max-w-lg space-y-4" role="status">
            <h1 className="text-2xl font-semibold">{t('invitation.eventUnavailable')}</h1>
            <p className="text-sm text-muted-foreground">{t('invitation.unavailableRecovery')}</p>
            <Link
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'min-h-11 whitespace-normal text-left'
              )}
              to="/join/$token"
              params={{ token }}
            >
              {t('common.tryAgain')}
            </Link>
          </section>
        </main>
      )
    }
    const browserStatus = browserGuest?.guest ?? null
    const event = {
      id: publicInvitation.eventId,
      title: publicInvitation.title,
      startsAt: publicInvitation.startsAt,
      timeZone: publicInvitation.timeZone,
      isAllDay: publicInvitation.isAllDay,
      locationName: publicInvitation.locationName,
    } satisfies GuestRsvpEvent
    const existingResponse: SavedGuestResponse | null =
      browserStatus && browserStatus.attendance !== 'pending'
        ? { name: browserStatus.name, attendance: browserStatus.attendance as GuestAttendance }
        : null
    return (
      <>
        <ServerErrorToast error={error} />
        <GuestRsvp
          key={event.id}
          event={event}
          locale={i18n.language}
          initialName={browserStatus?.name ?? browserGuest?.identityName}
          existingResponse={existingResponse}
          canRespond={browserStatus?.canRespond ?? true}
          eventHref={`/invited/events/${encodeURIComponent(publicInvitation.eventId)}`}
          accountContinuation={continuation}
          revalidate={() => router.invalidate()}
          switchGuest={async () => {
            const result = await endBrowserGuestSession({ data: {} })
            if (!result.ok) throw new Error(result.error.userMessage)
            window.location.reload()
          }}
          submitResponse={async ({ name, attendance }) => {
            let eventId = browserStatus?.eventId
            if (!eventId) {
              const prepared = await prepareBrowserGuestSession({ data: {} })
              if (!prepared.ok) throw new Error(prepared.error.userMessage)
              const joined = await joinBrowserGuestInvitation({ data: { token, name } })
              if (!joined.ok) throw new Error(joined.error.userMessage)
              eventId = joined.data.eventId
            }
            const response = await respondAsBrowserGuest({ data: { eventId, attendance } })
            if (!response.ok) throw new Error(response.error.userMessage)
          }}
        />
      </>
    )
  }

  async function accept(): Promise<string | null> {
    setPending(true)
    try {
      const result = await (shared ? acceptSharedEventInvitation : acceptEventInvitation)({
        data: { token },
      })
      if (!result.ok) {
        toast.error(result.error.userMessage, {
          description: t('errors.reference', { id: result.error.errorId }),
        })
        return null
      }
      const status = getLocalInvitationPostStatus(
        'status' in result.data ? result.data.status : undefined
      )
      const eventId = 'eventId' in result.data ? result.data.eventId : null
      setAcceptance({ token, role: result.data.role, status, eventId })
      if (status === 'pending') {
        toast.error(t('invitation.acceptFailed'))
        return null
      }
      toast.success(
        status === 'awaiting_approval'
          ? t('invitation.requestSentToast')
          : t('invitation.acceptedToast')
      )
      return status === 'accepted' ? eventId : null
    } catch {
      toast.error(t('invitation.acceptFailed'))
      return null
    } finally {
      setPending(false)
    }
  }

  async function continueToEvent() {
    const eventId = acceptedEventId ?? (await accept())
    if (!eventId) return
    await navigate({ to: '/invited/events/$eventId', params: { eventId } })
  }

  return (
    <main className="ph-no-capture ph-no-record min-h-svh bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <ServerErrorToast error={error} />
      <section className="mx-auto w-full max-w-lg min-w-0 space-y-6">
        <img src="/gatherory-icon.png" alt="Gatherory" className="size-14 rounded-2xl" />
        <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
          {invitation?.title ?? t('invitation.title')}
        </h1>
        {session && invitationState !== 'accepted' && (
          <p className="break-words text-sm text-muted-foreground">
            {t('invitation.signedInAs', { email: session.user.email })}
          </p>
        )}
        {!valid ? (
          <p>{t('invitation.invalid')}</p>
        ) : !session ? (
          <>
            <p className="text-muted-foreground">
              {signedOutCopy.interpolateRole
                ? t(signedOutCopy.descriptionKey, { role: roleLabel(t, invitation?.role) })
                : t(signedOutCopy.descriptionKey)}
            </p>
            {invitationDate && <p className="break-words">{invitationDate}</p>}
            {shared && invitation && 'locationName' in invitation && invitation.locationName && (
              <p className="break-words">{invitation.locationName}</p>
            )}
            <Link
              className={cn(
                buttonVariants(),
                'min-h-11 w-full whitespace-normal text-left sm:w-auto'
              )}
              to="/auth/$path"
              params={{ path: 'sign-in' }}
              search={{ redirectTo: continuation }}
            >
              {t(signedOutCopy.signInKey)}
            </Link>
            <Link
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'min-h-11 w-full whitespace-normal text-left sm:w-auto'
              )}
              to="/auth/$path"
              params={{ path: 'sign-up' }}
              search={{ redirectTo: continuation }}
            >
              {t(signedOutCopy.createAccountKey)}
            </Link>
          </>
        ) : !invitation ? (
          <>
            <p className="text-muted-foreground">{t('invitation.notLoaded')}</p>
            <Link
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'min-h-11 whitespace-normal text-left'
              )}
              to="/auth/$path"
              params={{ path: 'sign-out' }}
              search={{ redirectTo: continuation }}
            >
              {t('invitation.switchAccount')}
            </Link>
          </>
        ) : invitationState === 'accepted' ? (
          <>
            <p>
              {t('invitation.joinedAs', {
                role: roleLabel(t, acceptance?.token === token ? acceptance.role : invitation.role),
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('invitation.acceptedAccountNotice', { email: session.user.email })}
            </p>
            <Button
              className="min-h-11 whitespace-normal"
              disabled={pending}
              onClick={() => void continueToEvent()}
            >
              {t('invitation.viewInvitedEvent')}
            </Button>
          </>
        ) : invitationState === 'awaitingApproval' ? (
          <ApprovalPendingNotice
            refresh={async () => {
              await router.invalidate()
              setAcceptance(null)
            }}
          />
        ) : (
          <>
            <p className="text-muted-foreground">
              {invitation.expiresAt
                ? t('invitation.invitedAs', {
                    role: roleLabel(t, invitation.role),
                    date: new Date(invitation.expiresAt).toLocaleDateString(i18n.language),
                  })
                : t('invitation.invitedAsNoExpiry', {
                    role: roleLabel(t, invitation.role),
                  })}
            </p>
            {shared && invitation.role === 'collaborator' && (
              <p>
                {t(
                  planningPermission === 'view_only'
                    ? requiresApproval
                      ? 'invitation.collaboratorViewOnlyApproval'
                      : 'invitation.collaboratorViewOnly'
                    : requiresApproval
                      ? 'invitation.collaboratorPlanningApproval'
                      : 'invitation.collaboratorPlanning'
                )}
              </p>
            )}
            <InvitationAccessAction
              requiresApproval={shared && invitation.role === 'collaborator' && requiresApproval}
              pending={pending}
              disabled={pending || !session.user.emailVerified || expired}
              onAccept={accept}
            />
            {expired && <p>{t('invitation.expired')}</p>}
            {!session.user.emailVerified && <p>{t('invitation.verifyEmail')}</p>}
          </>
        )}
      </section>
    </main>
  )
}

function roleLabel(t: (key: string) => string, role: string | undefined) {
  return role ? t(`roles.${role}`) : ''
}
