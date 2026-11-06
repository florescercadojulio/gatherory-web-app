# 00a — UI feel and REUI composition

**Status:** Planned visual specification, November 3, 2026.
**Scope:** Web only. REUI guidance does not apply to native interfaces.

## Look and feel

The first screen should feel like an invitation from a person. Lead with the
event name, optional authorized cover, when/where and a clear response action.
Keep a calm neutral background, generous readable spacing, Gatherory's existing
blue accents, Inter typography, existing radius tokens and Light/Dark themes.
Use short labels and factual event details. Avoid administrative counters,
analytics tiles, promotional banners or a navigation drawer above the invitation.

Build from REUI blocks and examples before inventing new page compositions.
Adapt the block structure, typography rhythm, rows, forms and state treatments
to the real task. Strip demo data and unimplemented controls. Reuse existing
owned primitives rather than copying a second Button, Sidebar or Dialog.

## Screen composition

| Screen          | Mobile, starting at 360px                                                                                                                             | Desktop, 1024–1440px                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Invitation      | Small brand/back affordance; optional bounded cover; event title; date/time zone and location; invitation role; one response area. No sidebar.        | A centered readable invitation, with event context beside a response panel only when the available width supports it. |
| Guest response  | Name plus Going / Maybe / Can't go, explicit submit, inline error and persistent confirmation. Reopening shows the saved choice with Change response. | Same fields and order; no extra dashboard modules.                                                                    |
| Guest event     | Event header, Your response, approved invitation information and an ordered authorized schedule. No people directory or planner tabs.                 | Wider reading column; response may occupy a narrow side column, preserving logical reading order.                     |
| Planner event   | Event header first; Overview and Schedule plus only genuinely implemented authorized sections; account navigation stays secondary.                    | Existing single global sidebar and event switcher; broad content with optional contextual side column.                |
| Selected update | Labeled short form with Save and Cancel; use a full route for substantial content.                                                                    | A compact REUI-style section or accessible dialog when the edit is truly small.                                       |
| Account         | Existing one-column profile/settings sections, reached from profile menu.                                                                             | Same single content column; retain the shared global sidebar rather than adding settings navigation.                  |

The labels are proposed English UI copy; add equivalent Spanish strings before
shipping. **Accept invitation**, **Request to join** and **RSVP** have different
meanings. A collaborator's access request must not be presented as an attendance
response, and a guest's Going choice must not imply planning access.

Conceptual mobile sequence, not a rendered prototype:

```text
Event invitation              Your response              Invited event
----------------              -------------              -------------
Event title                   Your name                  Event title
When · time zone              Going / Maybe / Can't go   Your response: Going
Where                         [Send response]            [Change response]
Short invitation information                             Event information
[Respond to invitation]       Saved confirmation         Schedule
                              [View event]
```

On an active browser session, replace new-guest enrollment with its existing
response. Avoid duplicate buttons that both appear to submit attendance.
Keep **Responding as [name]** and the event title visible near the response
controls; reopening shows the saved identity and choice. Distinguish changing
that response from responding as a different person on a shared device.

## Verified REUI starting points

Official sources checked November 3, 2026. These are candidates to adapt, not
a claim that an exact Gatherory invitation block exists or has been installed.

| Need                             | Official source                                                                         | Availability and use                                                                                                                                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Event summary plus RSVP          | [Schedule 7 — Webinar RSVP](https://reui.io/blocks/application/schedule/schedule-7)     | Pro block. Useful event/response composition; replace webinar language, demo state and response semantics with Gatherory contracts. A bespoke guest layout assembled from free primitives remains the fallback. |
| Bounded information and settings | [Frame](https://reui.io/components/frame)                                               | Free component, already owned locally. Use for meaningful event/response or settings boundaries, not nested boxes around every paragraph.                                                                       |
| Readable ordered agenda          | [Base UI Timeline](https://reui.io/docs/components/base/timeline)                       | Free component; compose a vertical schedule with semantic time and event labels. No drag/reschedule interactions in guest view.                                                                                 |
| Authorized list rows             | [Item](https://reui.io/components/item) and [Avatar](https://reui.io/components/avatar) | Free component examples for planner people/task/event rows. An example avatar/name is not permission to disclose a roster to guests.                                                                            |
| Optional richer schedule later   | [Schedule 1](https://reui.io/blocks/application/schedule/schedule-1)                    | Pro calendar/day-agenda candidate. Not required for the first mobile invite; do not add month navigation when a short agenda answers the user need.                                                             |
| Basic event settings later       | [Settings 3 — General Settings](https://reui.io/blocks/application/settings/settings-3) | Pro block candidate for selected planner edits. Preserve the existing one-column settings hierarchy and field-specific permissions.                                                                             |
| Dialogs, states and shell        | [REUI blocks catalog](https://reui.io/blocks)                                           | Review App Shell, Form, Sheet, Dialog and Empty State categories when building the relevant screen. These are category references, not preselected or installed registry IDs.                                   |

Keep the current `base-nova` configuration and Base UI primitives. The
[getting-started guide](https://reui.io/docs/get-started) and
[registry documentation](https://reui.io/docs/registry) distinguish free
components/examples from premium blocks. Review Pro entitlement and compatible
Base Nova output when adopting a block; if unavailable, compose the same user
journey with free components. No purchase, registry installation or license
configuration is authorized or necessary for this documentation slice.

For each implemented screen, record the exact selected REUI source, whether
free or Pro, imported local primitives, changes from the sample and browser
acceptance. Do not carry sample API keys, sample users or local-only success
states into the product. Form behavior remains owned by TanStack Form and
typed handlers, even when a source block demonstrates another form library.

## Interaction and state rules

- Keep reading first. Show write actions near the content they change and only
  for the permitted actor. Prefer explicit Save/Cancel over new autosave behavior.
- Display human event dates in the event's time zone, with a label when useful;
  preserve all-day dates and undetermined times. Never hardcode Detroit or infer
  an event's zone from the scanning phone.
- Provide loading skeletons with stable layout, honest empty states, unavailable
  invitation recovery, pending collaborator approval, reply-closed read state,
  and retryable network/save errors. A toast supplements persistent status.
- Keep entered values after failed saves. Announce success only after durable
  server confirmation; retry uncertain submissions without duplicate attendance.
- Existing permissions are authoritative. An expired session offers recovery;
  removed access does not leave stale private content visible after revalidation.
- Public previews contain only approved public information. Covers are optional;
  missing or expired image URLs cannot obscure event text or the response action.

## Responsive and accessibility acceptance

Test 360/390px phones, 768px intermediate layout and 1024/1440px desktop in
Light/Dark. Require no horizontal overflow at 320 CSS px / reflow testing,
readable 200% text, visible keyboard focus, labeled inputs, screen-reader
headings and status announcements, and roughly 44px touch targets.

The page has one main landmark and logical focus order. Dialogs restore focus;
opening a keyboard never hides Save/Cancel. Long names, event titles and Spanish
labels wrap. A chosen response uses text/state semantics as well as color.
Android Chrome Back, reload, soft keyboard and scanning from an external camera
are acceptance behaviors, not desktop CSS assumptions. Avoid sticky controls
until they are proven not to cover content or keyboard-focused fields.

The [November 3 mobile browser acceptance record](../../development/mobile-browser-acceptance-2026-11-03.md)
verifies no horizontal overflow and one main landmark at the recorded in-app
browser widths, a 320×400 details editor, 320×568 task/note interactions, and
Android API 37 Chrome keyboard resizing. Physical QR entry, Dark mode, live
Spanish UI, 200% text, screen-reader interaction and saved Android editor text
remain unverified; this partial pass does not complete the broader layout and
accessibility specification.

Retain ordinary browser navigation and zoom. Do not make an install prompt,
native deep-link attempt, sidebar or login wall a prerequisite for guest RSVP.
