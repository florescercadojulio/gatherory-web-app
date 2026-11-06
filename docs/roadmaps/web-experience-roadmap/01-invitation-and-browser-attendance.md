# 01 — Invitation and browser attendance

**Status:** Core guest RSVP flow verified in the in-app browser and Android API 37 Chrome on November 3, 2026. Physical QR, broader accessibility/localization, and deployment acceptance remain open.
**Priority:** P1 — first end-to-end web slice.
**Depends on:** [UI specification](00a-ui-feel-and-reui-composition.md) and the
current invitation/guest contracts, not completion of a developer console.

## Outcome

The browser guest session, name/RSVP form, confirmation, response editing and
exact-event summary are implemented. Account invitation continuation and
collaborator approval refresh are implemented as well. See the
[implementation and acceptance record](../../development/browser-invitation-rsvp-2026-11-03.md)
for verified behavior and remaining limits. The current-implementation text
below describes the baseline inspected before this slice; target requirements
remain the acceptance specification, not a claim every device check passed.

The [mobile browser acceptance update](../../development/mobile-browser-acceptance-2026-11-03.md)
records five in-app browser viewport checks, Android API 37 Chrome soft-keyboard,
Back, guest RSVP and reopen behavior, unavailable expired/revoked-link display,
and final web/database verification. The Android flow used a browser fixture;
physical camera-based QR scanning, live Spanish UI, Dark mode, and complete
accessibility/recovery coverage remain open.

An Android recipient scans an existing event QR, sees an understandable
invitation, responds as a guest without an account and can return to the event
and change their own RSVP. An invited collaborator signs in, sees the correct
requested permission and receives access only after any required approval.

The existing `/join/$token` preview and authenticated acceptance are the
starting point at baseline inspection. Native guest
registration, invitation acceptance and attendance APIs offer reusable domain
behavior; their credential headers and native persistence are not the browser
implementation.

## Browser guest journey

1. **Open:** resolve the token without enrolling or responding. Show only the
   public preview allowlist, including available event date/location/cover.
   A Guest link offers Respond to invitation; sign-in is an optional secondary
   path for an existing account. Private email invitations preserve recipient
   authentication; this change does not make them public guest links.
2. **Identify and choose:** ask for the guest's display name and Going / Maybe /
   Can't go, mapped to existing `going`, `not_sure`, `not_going` values. Explain
   that the host sees the name and response. Do not require email, signup,
   marketing consent, plus-one details or phone installation.
3. **Submit deliberately:** establish or reuse an authorized browser guest
   identity, acquire the exact-event grant and persist attendance through shared
   domain operations. Record progress so a timeout between those operations
   can retry safely. One submission must not create repeated guest records.
4. **Confirm:** show saved response and event name, then View event and Change
   response. Show real read-after-write state on reload. Enrollment and response
   are distinct server states; an accepted grant with an unsaved RSVP must not
   claim that attendance was saved.
5. **Return:** use a browser-bound scoped session to show the existing guest's
   response. A URL alone, an event UUID or a matching display name cannot read
   or modify an earlier guest's private state. Guest read pages use a dedicated
   guest projection and do not provision an account or workspace.

If an account session is already present, offer the account's own attendance
path with clear identity; switching to another attendee is explicit. Never
silently merge an existing guest with the signed-in account or alter someone
else's response. Verified account claim uses the existing claim boundary.

Show **Responding as [name]** during an established guest session and **[name],
your response is Going/Maybe/Can't go** after saving and on reopening. First-use
name entry starts empty; only a valid session may prefill an existing identity.
Provide a clearly labeled different-person/shared-device action that ends or
switches identity deliberately. It must not overwrite the earlier guest's RSVP.
After session loss, explain that the prior response cannot be recovered merely
by entering the same name; do not claim a new entry is an update to that person.

## Session and recovery design before implementation

Use a same-origin server-managed browser guest session with Secure, HttpOnly
and appropriate SameSite cookies, or an equivalently reviewed browser transport.
Keep raw guest bearer secrets out of URLs, analytics, HTML/loader serialization
and browser localStorage. Add same-origin/CSRF checks at mutation boundaries;
preserve native header-based transport separately. This is a planned adapter,
not a statement that current native APIs already provide cookie authentication.

Before shipping, document the session lifetime, expiry, rotation/invalidation,
shared-device ending/switching, cookies-disabled behavior and rate limits for
registration/acceptance/RSVP. Audit existing guest limits and reuse them where
appropriate. Record any schema need explicitly before adding a migration.

A cleared/expired session cannot be recovered by display-name lookup. Offer
truthful host-assisted or explicitly designed verified recovery rather than
silently reclaiming an existing attendee. Cross-device recovery and account
claim must not be promised until implemented and tested. Do not prompt for an
account merely to replace the accepted first-use accountless path.

Invitations authorize enrollment; an admitted participant has a separate grant.
Determine and test how link revocation, participant removal and reply closure
affect new enrollment, existing event reads and RSVP changes. Do not assume
revoking a reusable link deletes existing attendees. Preserve current domain
policy until a deliberate policy change is documented. New reusable public
links can have no scheduled expiry; expired/private/revoked links retain their
existing behavior and cannot be revived by a UI change.

## Collaborator and private-invitation journey

- Preserve the exact invitation through signup, email verification, social
  callbacks, sign-in failures/retry and account switching. Validate local
  continuation targets and recheck current authorization after authentication.
- Explain view-only versus planning access and whether approval is required.
  Accept invitation and Request to join must reflect the actual policy.
- Display awaiting approval as a durable state, with refresh/reopen recovery.
  Do not reveal planning information or enable writes while waiting.
- Approved users continue to the invited exact event, including child-only
  access, rather than to an unrelated active workspace. Do not auto-grant parent
  access or organization membership to make navigation convenient.
- Keep native opening optional and preserve already distributed event URLs.
  The current iPhone-only success instruction is replaced by useful browser
  continuation. Blueprint Use links remain a separate copy flow, not event joins.

## Screen states and disclosure

| State                               | Visible treatment                                          | Allowed action                                                          |
| ----------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| Loading                             | Stable event/response skeleton; no sample private content. | Wait/back.                                                              |
| Public Guest link                   | Approved invitation details and role-aware explanation.    | Start own guest response; optional sign-in.                             |
| Existing guest                      | Event and that session's own response.                     | View event; change own response if policy permits.                      |
| Invalid/unavailable link            | Calm unavailable message and ask-host/reopen guidance.     | Retry transient errors; no enrollment action for revoked/expired links. |
| Collaborator awaiting approval      | Request state, no planner content.                         | Refresh status or leave.                                                |
| Reply closed / finished / cancelled | Current safe read state, appropriate factual explanation.  | Only actions permitted by audited event policy.                         |
| Save/network/session failure        | Inline error, retained name/selection, honest saved state. | Retry/recover session without duplicate enrollment.                     |

Public response HTML, metadata and hydration data must not leak private email
invitations, participant contacts, roster, budgets, notes or other event data.
Do not infer an expired/revoked distinction when the server intentionally returns
one unavailable result. Do not log raw invitation tokens or guest credentials.

## Architecture and test ownership

Audit `src/server/events/contracts/guest-capability.contracts.ts`,
`src/server/events/handlers/device-guest-api.handler.ts`,
`src/server/events/workflows/event-guest.workflows.live.ts`,
`src/server/events/repos/device-guest.repo.persistence.ts` and shared invitation
acceptance before implementing a browser adapter. Ordinary browser operations
use typed server functions where appropriate, composed Effect workflows and
the shared safe result boundary. New routes do not bypass the existing
guest/event authorization, domain errors, transactions or receipt behavior.

Add focused tests with the implementation rather than treating a REUI preview
or existing native API test as browser acceptance:

| Level                      | Required outcomes                                                                                                                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contract/Effect            | Guest payload bounds, exact-event grants, own attendance only, reply policy, unavailable links, safe errors and session/origin checks.                                                          |
| Disposable DB              | Establish/accept/RSVP success; duplicate submit/retry after partial failure; existing guest reuse; removed grants; child/sibling isolation; collaborator pending/approval and no self-approval. |
| UI interaction             | Name/response entry, focus, submitting state, persistent confirmation, changed response, failed save retaining values, no automatic join during render/preload.                                 |
| Browser journey            | Logged-out scan → RSVP → event → reload/reopen, session loss, account switch and sign-in continuation; actual guest view contains no private planner data.                                      |
| Android Chrome             | Open from QR/camera or messenger, soft keyboard, Back, reload, throttled network/uncertain submit and optional-native-link behavior on a physical device.                                       |
| Accessibility/localization | Keyboard, screen reader, 200% text/reflow, Light/Dark and English/Spanish labels/errors.                                                                                                        |

Run relevant Vitest/Effect tests, contract generation checks and typecheck;
generate routes only for actual route changes. Record device/browser versions,
screenshots and actual remaining limits. No routine production build, shared
database mutation or deployment is required to begin this slice.

## Completion and deferrals

Complete means a person can actually respond and return from an Android browser
without signup, with safe scopes and durable recovery. A styled landing page
that still requires an iPhone, or a backend API without a browser journey, is
incomplete.

Defer guest roster disclosure, plus-ones, event administration, invitation-link
creation/revocation UI, approval-management UI, calendar editing, payments and
developer tooling. Existing host tools may handle approvals while this slice
shows truthful pending/approved states. Those deferrals do not defer the
guest response, confirmation or guest-readable event destination.
