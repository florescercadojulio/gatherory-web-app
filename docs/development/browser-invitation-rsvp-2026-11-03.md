# Browser invitation and RSVP — November 3, 2026

**Status:** Implemented first slice locally. No deployment or schema change.
Physical Android/device and broader visual acceptance remain open.

## Delivered behavior

Public Guest invitations at `/join/$token` now offer accountless attendance.
The visitor enters a display name, chooses Going / Maybe / Can't go and submits
explicitly. Opening or preloading the URL does not register a guest, join an
event or submit a response. The REUI-based screen uses the existing owned
Frame, Base UI controls, Gatherory tokens and TanStack Form; no Pro block or
additional component dependency was installed.

After a successful response, confirmation names the attendee and choice.
`/invited/events/$eventId` shows the exact invited event's title, date/time zone,
location and the attendee's own response. The guest can change it and reload to
read the persisted value. The screen deliberately excludes participant rosters,
private descriptions, addresses, notes, budgets and parent/sibling details.
This is a summary and attendance surface, not the complete schedule/planning UI
described in the later roadmap slice.

An existing guest identity is retained across new invitations with its name
prefilled and read-only. An explicit different-person action clears the browser
guest cookie without deleting earlier attendance. Browser joins reject an
implicit name change rather than rename the attendee in previous events.
Signing in uses the account's own event participation and never silently claims
or merges the browser guest. Private email invitation identity/verification and
collaborator approval rules remain in force. Accepted account invitations now
continue to the exact invited event. Pending collaborators can check approval
status and proceed once approved.

## Session and server boundaries

The browser guest uses an encrypted `__Host-browser-guest` cookie with Secure,
HttpOnly, SameSite=Lax, path `/`, a 30-day maximum age and an absolute issue-time
check. The framework's alternate session header transport is disabled. No raw
guest ID/credential is returned by session preparation or serialized as an
authentication token into page data, URLs or browser localStorage.

The first explicit submission prepares the cookie in a separate completed
request **before** registration/join/attendance writes. Retry therefore reuses
the same identity if later work fails or its response is lost. Enrollment and
attendance remain separate durable states; the UI reports success only after
the attendance write succeeds. Missing-cookie failures offer localized cookie
and reload guidance. Malformed, expired and future-issued sessions recover as
anonymous. Lost-browser/cross-device identity cannot be recovered by retyping
a name; no new cross-device recovery or account-claim UI is included.

POST handlers require the configured origin. Their bounded in-memory limiter
is per process, not a distributed abuse-control guarantee. Before a multi-instance
production rollout, validate trusted proxy headers and shared/edge limiting.
The handlers revalidate inputs inside the shared safe Effect result boundary;
the UI's route guards and hidden controls are not authorization.

New pure workflows depend on `BrowserGuestRepo`. Its live repository reuses the
existing native guest registration, verification, acceptance and response
operations, and adds an exact-event allowlisted read. SQL read errors use a
tagged `PersistenceError`. Production workflow bindings leave only `PgClient`
unresolved; handlers supply infrastructure and execute once. Signed-in
continuation uses the existing authorized guest/invitation domain and likewise
returns only the narrow event summary. Native transaction engines, sync payloads
and role grants were not rewritten. No monetary arithmetic was introduced.

Current policy is preserved: link revocation blocks new enrollment but does not
remove an already admitted guest; participant removal ends the guest's grant.
Finished/cancelled/completed lifecycle state prevents attendance writes. There
is no independent reply-closure setting added by this slice.

Invitation/guest pages are excluded from PostHog capture; invitation tokens are
also redacted from referral and encoded continuation URLs on later pages. The
routes set no-referrer metadata and private guest reads use `private, no-store`.

## Code and regression coverage

- `src/server/events/contracts/browser-guest.contracts.ts`: validated inputs and
  allowlisted event/identity display types.
- `src/server/events/repos/browser-guest.repo{,.live}.ts`: injectable guest port
  and exact-event persistence adapter.
- `src/server/events/workflows/browser-guest-invitation.workflow.ts` and live
  binding: guest identity, invitation, attendance and read orchestration.
- `src/server/events/handlers/browser-guest-invitation.handler.ts` and
  `browser-guest-session.adapter.ts`: browser transport, session lifecycle and
  safe callable operations.
- `account-invited-event` workflow/binding/handler: exact-event account reads
  and own attendance using the existing domain policy.
- `src/components/invitations/`, join and invited-event routes: REUI composition,
  form recovery, persistent confirmation, identity switching and approval refresh.
- `tests/contracts/browser-guest-boundary.test.ts`, Effect tests, session/origin
  tests and `browser-invitation-ui.test.ts`: no-join preview, prepared-cookie
  requirement, safe input/errors, response identity, display states and EN/ES.
- `tests/integration/browser-guest-invitation.database.test.ts`: live workflow
  registration/join/retry, private-field omission, own RSVP, child/sibling
  isolation, unavailable links, revoked-link recovery, lifecycle and removal.

## Acceptance record

Validation used a new loopback-only PostgreSQL 18 container initialized with all
26 checked-in migrations. Existing local/shared databases were not reset or
seeded. Browser fixtures and test accounts were synthetic and local to it.

- Disposable database regression: **3 tests across 3 files passed**, covering
  the browser flow, native device-guest capability and invitation acceptance.
- `pnpm typecheck`: passed, including both new live-workflow requirement checks.
- `pnpm test`: **1,050 tests passed**, 75 opt-in tests skipped, across 176
  passing and 47 skipped files. Generated-contract freshness passed.
- Invitation source/test formatting and whitespace checks: passed.

The actual in-app browser exercised anonymous name/Going submission; exact-event
entry; full reload; changing to Maybe and rereading it; guest-cookie ending;
a second attendee with the first preserved; account sign-in continuation,
account acceptance/RSVP and sign-out without merging guest identities; and a
returning guest on another invitation with the established name retained.
Collaborator pending status became accepted after host approval was simulated
in the disposable fixture, and the explicit refresh opened the accepted state.
The domain approval rules are separately covered by database tests.

Revoking the fixture link preserved an admitted guest's own response on reopen;
ending that guest session then removed that access for a new visitor. The UI
uses truthful unavailable-or-email-invitation copy rather than claiming a
revoked public link is a private invitation.

Phone-size 390px and desktop 1440px Dark layouts had one main landmark and no
horizontal overflow. Screenshots: `/tmp/gatherory-browser-invitation-mobile-20261103.jpg`,
`/tmp/gatherory-browser-rsvp-mobile-20261103.jpg` and
`/tmp/gatherory-browser-rsvp-desktop-20261103.jpg`.
This is browser viewport acceptance, not physical Android Chrome or QR camera
acceptance. Light mode, full screen-reader/keyboard/zoom matrix, throttled mobile
network and deployed-provider acceptance remain open.

An initial combined run timed out in existing five-second tooling/DB tests
while other checks and the dev server were active; those checks were rerun
sequentially after stopping the dev server. An initial legacy native HTTP/R2
test also pointed at its default existing dev server rather than the disposable
database server and failed at session lookup before provider writes. It is not
counted as accepted here; live R2 upload/provider testing remains separate.

Logs: `/tmp/gatherory-browser-guest-full-acceptance-20261103.log`,
`/tmp/gatherory-browser-guest-types-final-20261103.log`, and
`/tmp/gatherory-browser-guest-db-acceptance-20261103.log`.

Continue from the [web roadmap](../roadmaps/web-experience-roadmap/README.md).
