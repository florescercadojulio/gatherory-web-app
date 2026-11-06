# 00 — Current state and target architecture

**Status:** Preimplementation baseline and target architecture, inspected November 3, 2026.
The first browser guest slice is now implemented locally; see the
[acceptance record](../../development/browser-invitation-rsvp-2026-11-03.md) for
current delivered behavior. The table below preserves the starting gaps.

## Current implementation

| Area                 | Current source                                                                                                                         | Gap for this roadmap                                                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invitation entry     | `src/routes/join/$token.tsx` loads an allowlisted public preview and uses sign-in/signup continuation for authenticated acceptance.    | No accountless browser guest identity or RSVP. Success still mentions iPhone refresh and routes to `/workspaces`.                                                           |
| Shared invitations   | `src/server/events/repos/event-share-link.repo.persistence.ts` maintains exact-event Guest/Collaborator links and configured approval. | Browser needs a useful post-join destination and accessible pending/unavailable/recovery states.                                                                            |
| Native guest support | `device-guest-api.handler.ts`, guest contracts and existing guest workflows support credential-backed native guest operations.         | Browser session transport and lifetime, CSRF protection, identity recovery and claim behavior need explicit design. Native headers are not a browser cookie/session design. |
| Event overview       | `/workspaces` renders account-level summaries and upcoming activities; insights filter to eligible planners.                           | It is not an accountless guest landing page.                                                                                                                                |
| Event read surface   | `/workspaces/$workspaceSlug` renders event information, child schedule and participant/attendance rows.                                | No complete event editor. This broad signed-in projection is not a safe substitute for the narrower guest response.                                                         |
| Shared UI            | `components.json` uses Base Nova and the REUI registry. Local `components/reui/frame.tsx` is used by Account and event summaries.      | Adopt REUI compositions consistently for new user journeys and fill mobile/permission/error states.                                                                         |
| Authoring/settings   | `/blueprints` authoring exists outside the main navigation; Account and AI connections use the profile menu.                           | Preserve these while prioritizing invitation and event use. No developer console is needed.                                                                                 |

Paths are relative to this repository. This is source evidence, not a new live
production audit. See the [existing invitation audit](../../release/mobile-v1-guest-invitation-audit.md)
and [QR roadmap](../event-invitation-qr-roadmap/README.md) for historical checks
and the different public-link/private-email-invitation lifetimes.

## Target product surfaces

1. **Invitation:** an event-centered public preview with an explicit response
   path. No global planning sidebar, no forced signup for a Guest link, no
   automatic enrollment on GET or route preload.
2. **Invited event:** an event-specific browser view backed by an established
   guest grant. Show approved guest information and the guest's own RSVP.
   Signed-out browser guests do not enter the protected workspace shell.
3. **Your events:** authenticated organizers and collaborators keep the existing
   directory and event switching. Direct invitation entry returns to its exact
   event, rather than dropping the person into an unrelated default workspace.
4. **Event planning:** eligible signed-in participants see the same read-first
   layout with authorized planning sections and selected explicit updates.
5. **Blueprint authoring and account:** existing user destinations remain
   separate; broader creator polish follows the event journey. Developer
   infrastructure remains last.

Use customer-facing **Event / Events**. Keep internal workspace identifiers,
canonical data, event roles and authorization separate from that language.
Do not introduce a new ownership model to create a cleaner navigation label.

## Route and identity ownership

Keep the existing `/join/$token` entry URL and already distributed QR links.
Implement its new guest behavior without breaking private email invitations,
existing authenticated acceptance, or optional native opening.

Proposed guest destination: `/invited/events/$eventId`, implemented through
folder-owned TanStack routes. This is a planned URL, not an existing endpoint;
the first slice must finalize its read contract and route structure. An event
UUID is a locator, never a credential. Guest reads and writes still require a
valid scoped browser session. Do not put bearer credentials in the destination
URL, analytics events or rendered loader data.

| Identity                   | Scope and actions                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Anonymous invite visitor   | Only the current token's public allowlisted preview; no roster, personal responses or planning payload.                  |
| Established browser guest  | Only individually granted events and that guest identity's attendance. No organization membership or planning authority. |
| Signed-in guest            | Guest projection and own attendance, independently of workspace membership.                                              |
| Pending collaborator       | Pending state only; no planning grant until the server confirms approval.                                                |
| Approved collaborator/host | Exact-event read/write capabilities checked server-side, including read-only restrictions and current event state.       |

One guest identity may acquire separate invitations, but acquiring one must not
grant parent/sibling access. Clearing a browser session is not proof of identity;
retyping a name must never recover or overwrite somebody else's attendance.
Account claim remains an explicit verified process using the existing identity
rules, rather than matching on name or granting organization membership.

## Server and data responsibilities

- **Contracts:** public invitation preview, guest event read model, own attendance
  input/result and browser-session lifecycle. Validate at every callable boundary.
- **Handlers:** transport/session and same-origin checks, validated input, one
  safe response boundary, and infrastructure composition. Route guards alone
  do not protect callable server functions.
- **Workflows/services:** verify current invitation, exact-event participation,
  attendee identity, reply policy and permitted state transitions. Reuse shared
  domain behavior; do not maintain a second browser attendance implementation.
- **Repositories/connectors:** guest grants, durable attendance/idempotency and
  the existing atomic acceptance boundary. Preserve locks, receipt ordering and
  established native guest/account claim behavior.
- **UI:** REUI composition, TanStack Form state, visible pending/error/success
  and safe revalidation. A button hidden by role is never the server permission.

The browser session adapter may need new transport code or storage; audit first
and document any required schema change. Do not assume a migration is needed,
or copy native raw credentials into browser localStorage. Preserve canonical
event IDs, independently scoped participants and all current sync contracts.
Browser writes must appear in native authorized reads through the same domain
model; no separate browser-only RSVP table or untracked event JSON store.

## Deliberate boundaries

This work prioritizes human attendance and event use over developer tooling.
It does not require a webhook service, API-key UI, new MCP client flow, new
payment product or wholesale event editor. A guest cannot see private notes,
budget, contacts, assignments or a participant directory merely because a REUI
block contains a sample roster. A future guest roster requires a separate
disclosure decision and projection; omit it in the first guest screen.

Read-only is a product default, not a promise that all actions are forbidden:
own RSVP ships first; the selective planner actions in 02 follow only when
their current permissions, conflicts and recovery behavior are proven.
