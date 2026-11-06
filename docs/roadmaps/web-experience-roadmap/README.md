# Web experience: invitations, event reading, and selected updates

**Status:** Broader planner UI and event-detail editing are shelved. The active event-planning browser surface is the read-only main-event overview; guest invitations and own RSVP remain available. Existing Blueprint tools, account settings, and server/native/MCP capabilities are outside this UI rollback.
**Priority:** P1 — user journeys first; developer tools last.
**Decision date:** November 3, 2026.
**Owner:** Web app, invitation/guest access, event projections and shared UI.

## User outcome and accepted direction

A person scans an event invitation on an Android phone, opens the browser,
understands the event and responds without needing an iPhone or a Gatherory
account. Returning guests can read their invited event and change their own
response. Signed-in planners can read more and make a small set of authorized
updates. Desktop provides more room for the same tasks.

The product owner explicitly selected **guest RSVP without account creation**
for the first browser invitation flow. Collaborator access continues to require
sign-in and any configured approval. Scanning or opening a URL never joins an
event or submits attendance by itself.

REUI is the default starting point for layouts, blocks and components. Adapt
its composition to Gatherory's existing Base Nova stack and product tokens.
The first release is a usable event companion, with reading as the default and
deliberate writes where useful. Existing MCP access is sufficient for current
integration needs; an API-key portal, webhook console and developer navigation
are deferred until after the user journeys. This decision does not enable MCP
in any deployment or change its separate rollout requirements.

## Current position and stopping point

The latest product decision supersedes the planner UI direction below: keep
main-event summaries at `/workspaces`, with no event-detail links or write
controls. Planner `/events/$eventId` and legacy workspace planning URLs return
to the overview. Guest invitation entry, invited-event summaries, and own RSVP
remain available for both browser guests and signed-in guests. Planner
collaborator invitation continuation returns to the overview.

The implementation and prior acceptance records below remain historical
evidence. Shelved event-reading components and server workflows are retained
for future work; their presence does not mean those planner screens are active.
See the [overview-only follow-up](../../development/overview-only-2026-11-03.md)
for this change and its actual verification.

The accountless browser invitation-to-RSVP slice is implemented locally:
REUI-based name/response entry, a scoped encrypted guest cookie, persistent
confirmation, own-response changes and an exact-event summary page. Returning
identities persist across invitations; different-person switching is explicit.
Account acceptance and collaborator approval remain separate, with exact-event
continuation and a check-status action. Existing Blueprint/Explore work was
preserved. No schema migration, new dependency or production rollout occurred.

The November 3 mobile browser pass verified the guest flow at five in-app
browser widths, including Android API 37 Chrome keyboard and Back behavior.
At 320×400, the planner details editor, long-description save/reopen, child task
completion/undo, and note creation were also checked. The Android software
keyboard now resizes the viewport so editor actions remain visible. Physical
QR scanning, Dark mode, live Spanish UI, broader authorization boundaries,
and full accessibility coverage remain open. The full web suite passed with
1,088 tests across 185 files (76 opt-in tests across 48 files skipped); the
two opt-in event-reading and browser-guest database tests also passed.

The [November 3 implementation and acceptance record](../../development/browser-invitation-rsvp-2026-11-03.md)
owns actual behavior, test/browser evidence, session rules and remaining limits.
The [event reading and selected updates record](../../development/event-reading-selected-updates-2026-11-03.md)
now records slice 02: exact-event planner reading, authorized child schedule,
tasks/notes and narrow versioned updates. Guest access stays scoped to 01.
The [mobile browser acceptance record](../../development/mobile-browser-acceptance-2026-11-03.md)
captures the verified viewport, keyboard, RSVP, task, note and editor behavior,
the disposable fixture, and remaining checks.
The [event experience redesign record](../../development/event-experience-redesign-2026-11-03.md)
documents the subsequent overview and planner-event visual refinement, ReUI
registry/CLI provenance, responsive desktop and narrow-browser checks, host and
view-only acceptance, and remaining state/accessibility limits. Its final full
suite passed 1,091 tests across 185 files (76 opt-in tests across 48 files
skipped); the two disposable event-reading and browser-guest database tests
also passed.

## Implementation order

| Step                 | Document                                                                                             | Deliverable                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Baseline             | [00 — Current state and target architecture](00-current-state-and-target-architecture.md)            | Current capabilities, identity boundaries, route ownership and gaps.                                         |
| Visual specification | [00a — UI feel and REUI composition](00a-ui-feel-and-reui-composition.md)                            | Screen layouts, responsive behavior, verified block candidates and state inventory.                          |
| First vertical slice | [01 — Invitation and browser attendance](01-invitation-and-browser-attendance.md)                    | Android scan → guest identity → own RSVP → useful event read view, plus signed-in collaborator continuation. |
| Shelved UI           | [02 — Event reading and selected updates](02-event-reading-and-selected-updates.md)                  | Retained implementation; planner reading and editing screens are inactive.                                   |
| Later user work      | Existing [Blueprint authoring roadmap](../blueprints-roadmap/02-private-authoring-and-publishing.md) | Improve creator workflows after invitation and event use; retain existing authoring routes meanwhile.        |
| Deferred             | Developer console                                                                                    | No API keys, webhook delivery UI, code samples or developer dashboard in the first slices.                   |

Build one complete journey before adding tabs or write controls for another.
An attractive shell alone does not complete slice 01.

## Immediate next work

Keep the overview read-only and fix only concrete defects. Do not resume the
broader visual redesign or planner detail/update UI without a new product
decision. Guest RSVP remains the explicit event-write exception in the browser.
The overview's hardcoded USD display is fixed: each summary carries its
canonical budget currency, uses locale/currency-specific display digits, and
shows an unavailable notice for missing metadata. Decimal.js calculations and
the existing server architecture remain in place.

Complete physical Android QR, Dark mode, live Spanish UI, and full
accessibility/recovery acceptance for 01. Verify remaining planner role
boundaries. The full suite and focused disposable database regressions have
passed; continue recording targeted results for later changes. Before a production rollout, validate deployment proxy/header
behavior and distributed abuse controls; current rate limiting is bounded and
per process. The implemented guest cookie has a 30-day absolute lifetime.
Session loss cannot reclaim identity by name; reply availability follows current
event lifecycle policy, with no independent host reply-closure control added.

The small planner-write set in 02 now has strict per-action contracts,
permission checks, conflict recovery and native consistency coverage. Broader
mutations remain outside this slice. Pro block entitlement/availability should be checked when selecting
a block; free-component compositions keep the journey buildable.

## Acceptance and continuation

Each implemented slice must include focused behavior and permission tests,
actual browser acceptance, and its remaining limits. Slice 01 now has an
Android API 37 Chrome browser RSVP/reopen result; a physical camera-based QR
scan remains unverified. Follow the detailed acceptance matrix in 01 and the
mobile acceptance record for current evidence.

Keep documentation formatting and local links valid. For runtime acceptance,
use focused tests, typecheck and disposable database/browser fixtures; record
actual evidence. Do not run routine builds or mutate shared data for acceptance.

Preserve the [server architecture](../../architecture/server-architecture.md),
[implementation guide](../../development/server-implementation-guide.md) and
[page standard](../../development/page-creation.md). Web reads/writes use scoped
contracts and Effect workflows; UI block demos never own authorization or data.
No native offline engine rewrite or production rollout is part of this roadmap.

When continuing, read this README, the active slice, current Git state and the
latest onboarding decisions. Update the stopping point with the actual files,
test results, browser evidence and remaining decisions after each slice.
