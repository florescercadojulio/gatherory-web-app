import { useDeleteUser } from '@better-auth-ui/react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowRight, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { AccountSidebar } from '@/components/account-sidebar'
import { Appearance } from '@/components/auth/theme/appearance-settings'
import { Frame, FrameDescription, FrameHeader, FramePanel } from '@/components/reui/frame'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/_protected/account/')({
  component: AccountSettingsPage,
})

function AccountSettingsPage() {
  const { t } = useTranslation()
  const { defaultWorkspaceContext } = Route.useRouteContext()
  if (!defaultWorkspaceContext) return null

  const { user } = defaultWorkspaceContext
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <SidebarProvider>
      <AccountSidebar user={user} />
      <SidebarInset>
        <header className="app-toolbar">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex min-w-0 items-center gap-2">
            <UserRound className="size-4 text-brand-ink" />
            <span className="truncate text-sm font-medium">{t('account.title')}</span>
          </div>
        </header>

        <div className="app-page-shell account-settings-page">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-[-0.025em]">{t('account.title')}</h1>
            <p className="text-sm leading-6 text-muted-foreground">{t('account.description')}</p>
          </div>

          <div className="space-y-6">
            <section id="profile" aria-labelledby="account-profile-heading">
              <Frame spacing="lg">
                <FrameHeader>
                  <h2 id="account-profile-heading" className="text-sm font-semibold">
                    {t('account.profile')}
                  </h2>
                  <FrameDescription>{t('account.profileDescription')}</FrameDescription>
                </FrameHeader>
                <FramePanel fit>
                  <div className="account-profile-identity">
                    <Avatar className="size-14">
                      <AvatarImage src={user.image ?? ''} alt={user.name} />
                      <AvatarFallback>{initials || 'G'}</AvatarFallback>
                    </Avatar>
                    <dl className="account-profile-fields">
                      <div>
                        <dt>{t('account.name')}</dt>
                        <dd>{user.name}</dd>
                      </div>
                      <div>
                        <dt>{t('account.email')}</dt>
                        <dd>{user.email}</dd>
                      </div>
                    </dl>
                  </div>
                </FramePanel>
              </Frame>
            </section>

            <section id="appearance" aria-labelledby="account-appearance-heading">
              <Frame spacing="lg">
                <FrameHeader>
                  <h2 id="account-appearance-heading" className="text-sm font-semibold">
                    {t('account.appearance')}
                  </h2>
                  <FrameDescription>{t('account.appearanceDescription')}</FrameDescription>
                </FrameHeader>
                <FramePanel fit>
                  <Appearance showHeading={false} />
                </FramePanel>
              </Frame>
            </section>

            <section id="connections" aria-labelledby="account-connections-heading">
              <Frame spacing="lg">
                <FrameHeader>
                  <h2 id="account-connections-heading" className="text-sm font-semibold">
                    {t('account.connections')}
                  </h2>
                  <FrameDescription>{t('account.connectionsDescription')}</FrameDescription>
                </FrameHeader>
                <FramePanel fit>
                  <div className="account-setting-action">
                    <p className="text-sm text-muted-foreground">{t('account.connectionsHint')}</p>
                    <Link className={buttonVariants({ variant: 'outline' })} to="/mcp/connections">
                      {t('account.manageConnections')}
                      <ArrowRight />
                    </Link>
                  </div>
                </FramePanel>
              </Frame>
            </section>

            <section id="account-actions" aria-labelledby="account-actions-heading">
              <Frame spacing="lg" className="account-danger-frame">
                <FrameHeader>
                  <h2 id="account-actions-heading" className="text-sm font-semibold">
                    {t('account.actions')}
                  </h2>
                  <FrameDescription>{t('account.deletionPermanent')}</FrameDescription>
                </FrameHeader>
                <FramePanel fit>
                  <div className="account-delete-content">
                    <ShieldCheck className="size-5 shrink-0 text-destructive" />
                    <div className="min-w-0 space-y-2">
                      <p className="text-sm font-medium">{t('account.deleteTitle')}</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {t('account.deleteDescription')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end">
                    <DeleteAccountDialog />
                  </div>
                </FramePanel>
              </Frame>
            </section>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function DeleteAccountDialog() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const deletion = useDeleteUser(authClient)
  const canDelete = confirmation.trim().toUpperCase() === 'DELETE'

  async function deleteAccount() {
    try {
      await deletion.mutateAsync({
        callbackURL: '/auth/sign-in?deleted=1',
      })
      window.location.replace('/auth/sign-in?deleted=1')
    } catch (error) {
      const detail = error instanceof Error ? error.message : null
      toast.error(
        detail?.toLowerCase().includes('fresh') || detail?.toLowerCase().includes('session')
          ? t('account.deleteReauth')
          : t('account.deleteFailed')
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setConfirmation('')
          deletion.reset()
        }
      }}
    >
      <DialogTrigger render={<Button variant="destructive" />}>
        <Trash2 className="size-4" />
        {t('account.deleteAccount')}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('account.deleteQuestion')}</DialogTitle>
          <DialogDescription>{t('account.deleteDialogDescription')}</DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>{t('account.deleteWarning')}</AlertTitle>
          <AlertDescription>{t('account.typeToConfirm')}</AlertDescription>
        </Alert>

        <div className="grid gap-2">
          <Label htmlFor="delete-account-confirmation">{t('account.confirmation')}</Label>
          <Input
            id="delete-account-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={t('account.typeDelete')}
            autoComplete="off"
            autoCapitalize="characters"
          />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>{t('account.cancel')}</DialogClose>
          <Button
            variant="destructive"
            disabled={!canDelete || deletion.isPending}
            onClick={() => void deleteAccount()}
          >
            {deletion.isPending ? t('account.deleting') : t('account.deleteAccount')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
