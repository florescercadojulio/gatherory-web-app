import { useDeleteUser } from "@better-auth-ui/react"
import { createFileRoute } from "@tanstack/react-router"
import { AlertTriangle, ShieldCheck, Trash2, UserRound } from "lucide-react"
import { useState } from "react"

import { AccountSidebar } from "@/components/account-sidebar"
import { Appearance } from "@/components/auth/theme/appearance"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/_protected/account/")({
  component: AccountSettingsPage,
})

function AccountSettingsPage() {
  const { defaultWorkspaceContext } = Route.useRouteContext()
  const { user } = defaultWorkspaceContext
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

  return (
    <SidebarProvider>
      <AccountSidebar user={user} />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex min-w-0 items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" />
            <span className="truncate text-sm font-medium">Account</span>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-4 md:p-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Account</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Manage your Gatherory account.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Your name and email come from your Gatherory sign-in account.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar className="size-14">
                <AvatarImage src={user.image ?? ""} alt={user.name} />
                <AvatarFallback>{initials || "G"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </CardContent>
          </Card>

          <Appearance />

          <Card className="ring-destructive/35">
            <CardHeader>
              <CardTitle className="text-destructive">Danger zone</CardTitle>
              <CardDescription>
                Account deletion is permanent and cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-4">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-destructive" />
                <div className="space-y-1">
                  <p className="font-medium">Delete your Gatherory account</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Private events you solely own will be deleted. In shared
                    events, another member becomes the owner and your personal
                    participation, decisions, and uploaded media are removed.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <DeleteAccountDialog />
            </CardFooter>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function DeleteAccountDialog() {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const deletion = useDeleteUser(authClient)
  const canDelete = confirmation.trim().toUpperCase() === "DELETE"

  async function deleteAccount() {
    setErrorMessage(null)

    try {
      await deletion.mutateAsync({
        callbackURL: "/auth/sign-in?deleted=1",
      })
      window.location.replace("/auth/sign-in?deleted=1")
    } catch (error) {
      const detail = error instanceof Error ? error.message : null
      setErrorMessage(
        detail?.toLowerCase().includes("fresh") ||
          detail?.toLowerCase().includes("session")
          ? "For security, sign out and sign in again before deleting your account."
          : detail || "Your account could not be deleted. Try again.",
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setConfirmation("")
          setErrorMessage(null)
          deletion.reset()
        }
      }}
    >
      <DialogTrigger render={<Button variant="destructive" />}>
        <Trash2 className="size-4" />
        Delete account
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogDescription>
            This permanently removes your Gatherory identity and personal data.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>This is permanent</AlertTitle>
          <AlertDescription>
            Type DELETE below to confirm. Gatherory may ask you to sign in again
            if your current session is no longer recent.
          </AlertDescription>
        </Alert>

        <div className="grid gap-2">
          <Label htmlFor="delete-account-confirmation">Confirmation</Label>
          <Input
            id="delete-account-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="Type DELETE"
            autoComplete="off"
            autoCapitalize="characters"
          />
        </div>

        {errorMessage ? (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            variant="destructive"
            disabled={!canDelete || deletion.isPending}
            onClick={() => void deleteAccount()}
          >
            {deletion.isPending ? "Deleting…" : "Delete account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
