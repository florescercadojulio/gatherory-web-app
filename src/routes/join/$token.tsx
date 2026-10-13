import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ServerErrorToast } from "@/components/route-feedback";
import { getSession } from "@/lib/auth.functions";
import { invitationPath } from "@/lib/event-invitation-links";
import {
  acceptEventInvitation,
  getEventInvitation,
  acceptSharedEventInvitation,
  getSharedEventInvitation,
  getJoinedSharedInvitation,
} from "@/server/events/handlers/event.handlers";

export const Route = createFileRoute("/join/$token")({
  loader: async ({ params }) => {
    if (!z.uuid().safeParse(params.token).success)
      return { shared: false, session: null, invitation: null, error: null };
    const shared = await getSharedEventInvitation({
      data: { token: params.token },
    });
    if (!shared.ok)
      return {
        shared: false,
        session: null,
        invitation: null,
        error: shared.error,
      };
    const session = await getSession();
    if (!session.ok)
      return {
        shared: !!shared.data,
        session: null,
        invitation: shared.data,
        error: session.error,
      };
    if (!session.data)
      return {
        shared: !!shared.data,
        session: null,
        invitation: shared.data,
        error: null,
      };
    const joined = await getJoinedSharedInvitation({
      data: { token: params.token },
    });
    if (!joined.ok)
      return {
        shared: true,
        session: { user: { emailVerified: session.data.user.emailVerified } },
        invitation: null,
        error: joined.error,
      };
    if (joined.ok && joined.data)
      return {
        shared: true,
        session: { user: { emailVerified: session.data.user.emailVerified } },
        invitation: joined.data,
        error: null,
      };
    const invitation = await getEventInvitation({
      data: { token: params.token },
    });
    return {
      shared: false,
      session: { user: { emailVerified: session.data.user.emailVerified } },
      invitation: invitation.ok ? invitation.data : null,
      error: invitation.ok ? null : invitation.error,
    };
  },
  component: JoinInvitation,
  pendingComponent: () => (
    <main className="mx-auto max-w-lg space-y-6 px-6 py-16">
      <Skeleton className="size-14 rounded-2xl" />
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-24 w-full" />
    </main>
  ),
});

function JoinInvitation() {
  const { token } = Route.useParams();
  const { session, invitation, error, shared } = Route.useLoaderData();
  const [pending, setPending] = useState(false);
  const [acceptance, setAcceptance] = useState<{
    token: string;
    role: string;
  } | null>(null);
  const accepted =
    invitation?.status === "accepted" || acceptance?.token === token;
  const valid = z.uuid().safeParse(token).success;
  const continuation = valid ? invitationPath(token) : "/";
  const expired = invitation
    ? new Date(invitation.expiresAt) <= new Date()
    : false;

  async function accept() {
    setPending(true);
    try {
      const result = await (
        shared ? acceptSharedEventInvitation : acceptEventInvitation
      )({ data: { token } });
      if (!result.ok) {
        toast.error(result.error.userMessage, {
          description: `Reference: ${result.error.errorId}`,
        });
        return;
      }
      setAcceptance({ token, role: result.data.role });
      toast.success("Invitation accepted");
    } catch {
      toast.error("Your invitation could not be accepted. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-svh bg-background px-6 py-16 text-foreground">
      <ServerErrorToast error={error} />
      <section className="mx-auto max-w-lg space-y-6">
        <img
          src="/gatherory-icon.png"
          alt="Gatherory"
          className="size-14 rounded-2xl"
        />
        <h1 className="text-3xl font-semibold tracking-tight">
          {invitation?.title ?? "Gatherory invitation"}
        </h1>
        {!valid ? (
          <p>This invitation link is invalid. Ask the host for a new one.</p>
        ) : !session ? (
          <>
            <p className="text-muted-foreground">
              {shared
                ? `Anyone with this link can join as a ${invitation?.role}. Sign in or create an account to accept.`
                : "Sign in or create an account to check this invitation. Email-specific invitations must be accepted by the addressed account."}
            </p>
            {shared &&
              invitation &&
              "startsAt" in invitation &&
              invitation.startsAt && (
                <p>{new Date(invitation.startsAt).toLocaleString()}</p>
              )}
            {shared &&
              invitation &&
              "locationName" in invitation &&
              invitation.locationName && <p>{invitation.locationName}</p>}
            <Link
              className={buttonVariants()}
              to="/auth/$path"
              params={{ path: "sign-in" }}
              search={{ redirectTo: continuation }}
            >
              Sign In
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              to="/auth/$path"
              params={{ path: "sign-up" }}
              search={{ redirectTo: continuation }}
            >
              Create Account
            </Link>
          </>
        ) : !invitation ? (
          <>
            <p className="text-muted-foreground">
              This invitation could not be loaded. Make sure you are using the
              invited email address.
            </p>
            <Link
              className={buttonVariants({ variant: "outline" })}
              to="/auth/$path"
              params={{ path: "sign-out" }}
              search={{ redirectTo: continuation }}
            >
              Switch Account
            </Link>
          </>
        ) : accepted ? (
          <>
            <p>
              You joined as a{" "}
              {acceptance?.token === token ? acceptance.role : invitation.role}.
              Your host can now include you in the event.
            </p>
            <p className="text-sm text-muted-foreground">
              Open Gatherory on your iPhone and refresh to see this event.
              Guests see the invitation; main-event planning collaborators also
              receive planning access.
            </p>
            <Link className={buttonVariants()} to="/workspaces">
              Continue to Gatherory
            </Link>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">
              You are invited as a {invitation.role}. This invitation expires{" "}
              {new Date(invitation.expiresAt).toLocaleDateString()}.
            </p>
            {shared && invitation.role === "collaborator" && (
              <p>
                Accepting grants planning access to this event. Only share this
                link with people you trust.
              </p>
            )}
            <Button
              disabled={pending || !session.user.emailVerified || expired}
              onClick={accept}
            >
              {pending ? "Accepting…" : "Accept Invitation"}
            </Button>
            {expired && (
              <p>This invitation has expired. Ask the host for a new link.</p>
            )}
            {!session.user.emailVerified && (
              <p>Verify your email address, then return to this invitation.</p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
