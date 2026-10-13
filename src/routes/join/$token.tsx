import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation();
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
          description: t("errors.reference", { id: result.error.errorId }),
        });
        return;
      }
      setAcceptance({ token, role: result.data.role });
      toast.success(t("invitation.acceptedToast"));
    } catch {
      toast.error(t("invitation.acceptFailed"));
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
          {invitation?.title ?? t("invitation.title")}
        </h1>
        {!valid ? (
          <p>{t("invitation.invalid")}</p>
        ) : !session ? (
          <>
            <p className="text-muted-foreground">
              {shared
                ? t("invitation.sharedJoin", { role: roleLabel(t, invitation?.role) })
                : t("invitation.privateJoin")}
            </p>
            {shared &&
              invitation &&
              "startsAt" in invitation &&
              invitation.startsAt && (
                <p>{new Date(invitation.startsAt).toLocaleString(i18n.language)}</p>
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
              {t("invitation.signIn")}
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              to="/auth/$path"
              params={{ path: "sign-up" }}
              search={{ redirectTo: continuation }}
            >
              {t("invitation.createAccount")}
            </Link>
          </>
        ) : !invitation ? (
          <>
            <p className="text-muted-foreground">
              {t("invitation.notLoaded")}
            </p>
            <Link
              className={buttonVariants({ variant: "outline" })}
              to="/auth/$path"
              params={{ path: "sign-out" }}
              search={{ redirectTo: continuation }}
            >
              {t("invitation.switchAccount")}
            </Link>
          </>
        ) : accepted ? (
          <>
            <p>
              {t("invitation.joinedAs", { role: roleLabel(t, acceptance?.token === token ? acceptance.role : invitation.role) })}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("invitation.refreshOnIPhone")}
            </p>
            <Link className={buttonVariants()} to="/workspaces">
              {t("invitation.continue")}
            </Link>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">
              {t("invitation.invitedAs", { role: roleLabel(t, invitation.role), date: new Date(invitation.expiresAt).toLocaleDateString(i18n.language) })}
            </p>
            {shared && invitation.role === "collaborator" && (
              <p>{t("invitation.collaboratorAccess")}</p>
            )}
            <Button
              disabled={pending || !session.user.emailVerified || expired}
              onClick={accept}
            >
              {pending ? t("invitation.accepting") : t("invitation.accept")}
            </Button>
            {expired && (
              <p>{t("invitation.expired")}</p>
            )}
            {!session.user.emailVerified && (
              <p>{t("invitation.verifyEmail")}</p>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function roleLabel(t: (key: string) => string, role: string | undefined) {
  return role ? t(`roles.${role}`) : "";
}
