# Simple to-dos and reminders

**Status:** Shared event To-dos implemented locally; reminders remain planned.
**Requested:** October 20, 2026.

**Updated direction:** Personal reminders are deferred by the user's October 20
decision. The next authorized notification slice is
[mobile collaboration updates through FCM](../notifications-roadmap/01-fcm-proof-of-concept.md)
for assignment and event changes. The personal-reminder designs below are
historical proposals, not current V1 requirements.
**Owner areas:** Native event Manage/Home, event-scoped persistence and sync;
personal notification delivery on iPhone.

## Outcome

Help an ordinary person remember what needs doing for their event, check it off,
and optionally ask their own phone for a reminder. One feature, one familiar list:
**To-dos**, with an optional **Remind me** setting on an item.

The first slice implements the shared list below. Optional
[blueprint To-dos](02-blueprint-to-dos.md) are implemented locally as a follow-up.
Personal reminders and the Home preview remain future work. Neither slice
requests notification permission or schedules notifications.

## The everyday flow

1. Open an event's **Manage → To-dos**.
2. Tap **Add a To-do**, type “Confirm the cake,” and save. Only a title is required.
3. Optionally add a website or assign it to an eligible planner. Anyone who can
   edit may take an unassigned item. Manage prioritizes your assigned unfinished
   work, then offers an unassigned item you can take. Each group orders by due
   date, falling back to the newest unfinished item.
4. Tap its checkbox when it is done. Anyone with permission to edit the event's
   planning content sees the shared completion state after sync.
5. If useful, tap the item to set or remove a **Due date**. A due date never schedules a
   notification. **Remind me** is a later slice.

Adding a title and checking a box must remain quick. Dates and reminders belong
inside the item's short editor, not in a setup wizard or a form everyone must
fill out. Opening an editor, event, blueprint or QR preview creates no reminder.
Checking or unchecking never asks for confirmation. Deleting uses one short
confirmation. Keep the Manage entry available when the list is empty; show the
Home preview only when there is something useful to display.

## What the first complete version includes

| Area       | Proposed behavior                                                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List       | One shared list per event; main events and sub-events have separate lists.                                                                                |
| Add/edit   | Title required; optional due date; edit or delete an item. Duplicate titles are allowed.                                                                  |
| Completion | Local **Upcoming / Completed** segments; stable creation order within each. Upcoming includes overdue unfinished items. Uncheck a completed item to undo. |
| Due date   | Optional calendar date in the event's time zone. No mandatory deadline, priority score or automatic alert.                                                |
| Website    | Optional HTTP(S) link, opened only when tapped.                                                                                                           |
| Assignment | Optional eligible planner; planning writers can assign/reassign/clear or take an unassigned item. No extra role or permission grants.                     |
| Reminder   | One optional, one-off date/time, for the person who enables it on that device. Label it **Remind me on this device** in the editor.                       |
| Offline    | Add, edit and complete locally; preserve edits through relaunch and sync using existing account/event boundaries.                                         |
| Navigation | A To-dos entry in Manage with local Upcoming / Completed segments. A compact Home preview is later work; no additional app-wide tab.                      |

The list screen should look approximately like this; this is a content sketch,
not a rendered or accessibility-verified design:

```text
To-dos                         +
Alex & Jordan's Wedding

[ Upcoming | Completed ]

○ Confirm the cake
○ Pick up decorations
  Due Friday · Reminder tomorrow at 5:00 PM

```

Use normal text, checkboxes and native date/time controls. Make titles readable
with large text; give the checkbox its own accessible action and label. Color
must not be the only indication of completion. No completion percentages,
productivity charts, status dashboards or red overdue counters in the first cut.

## Who can do what

- Hosts and collaborators see the list for events they can plan. Read-only
  collaborators can read but cannot change shared items. Existing planning-write
  permission allows adding, editing, completing and deleting; add no new role UI.
- Guests do not see this planner list in the first version. A recipient who
  creates their own workspace from a blueprint is the planner of that copy.
- Any planner who can read the item may choose their own reminder. They cannot
  enable reminders for another person, and other planners cannot see that choice.
- Access applies to the exact event. Being in the same workspace or having access
  to one child event does not reveal parent/sibling lists.

## Reminders without notification overload

- Reminders start off. Ask for system notification permission only when the
  person first chooses to enable one. Refusing permission does not prevent saving
  or completing a to-do. Reuse the existing permission-primer presentation when
  needed, with truthful reminder-specific copy, rather than a second onboarding.
- Show the chosen date/time before saving. Use the event time zone, make it
  visible when it differs from the phone, and require a valid future time.
- A reminder is independent of the due date. Moving an event or due date does
  not silently move an already confirmed reminder; its actual time stays visible
  in the editor. Choose a new reminder time explicitly when needed.
- Completing or deleting the item, turning its reminder off, leaving its event,
  or signing out cancels applicable pending reminders on that device when the
  change is known locally. Unchecking a completed item does not re-enable an old
  reminder. Choose a new time to remind again.
- No repeats, overdue nagging, automatic re-arming, group alerts or notification
  badges counting unfinished tasks. Opening a notification opens that item only
  after checking the active account and event access.
- Use privacy-safe notification text by default; do not put arbitrary task/event
  titles or private notes on the lock screen. The item itself opens after access
  checks. Detailed notification previews can be considered separately.

**First-version delivery tradeoff:** Reminders are local to the iPhone where
enabled, not an account-wide delivery promise. A completion or permission change
on another device cannot cancel a pending local alert until that change reaches
this phone. An offline phone can therefore show an outdated reminder. Do not
promise exact delivery or instant remote cancellation. Account-wide delivery
would require a separate server/push slice and should not be implied by the UI.

## Build order

1. **Shared to-dos:** List, title, optional due date, completion, editing/deletion,
   exact-event permissions, durable offline sync and recovery. Manage is the first
   entry point. Ship/test a useful list without a bell or permission prompt.
2. **Personal reminders:** Add the optional reminder editor, contextual permission,
   local scheduling, cancellation, account isolation and notification routing.
   This completes the proposed first product version. Add the small Home preview
   once the underlying list and reminder state are reliable.
3. **Reusable blueprint to-dos:** Subsequently prioritized and implemented locally:
   include item definitions explicitly in a blueprint and create fresh, unchecked
   items in the recipient's copy. See [implementation](02-blueprint-to-dos.md).
   Never copy completion, people or active notifications; copying must not opt
   anyone into reminders. Date-relative arrival/departure automation is separate.

Do not block useful manual to-dos on blueprint schema/installation work. Keep
the current QR/sharing release's device/deployment checks tracked separately.

## Deliberate deferrals

Multiple named lists, categories, priorities, subtasks, dependencies,
approvals, comments, attachments, recurring reminders, “notify everyone,” email
or SMS, server push, cross-device reminder handoff, Apple Reminders/calendar
integration, AI-generated tasks, billing, and a generic automation engine.
Add any of these only in response to a concrete need after the simple list works.

## Current position and continuation

Shared event To-dos now have a native Manage list and next-item preview, optional
website links and planner assignment/self-claim, canonical server storage,
exact-event permissions and transactional offline sync. The additive migration
and app/backend changes are included in the October 20 checkpoint; nothing has
been deployed.
See [shared To-dos implementation and release checks](01-shared-event-to-dos.md)
for verification and remaining device/deployment work. The next product slice
is optional personal reminders, followed by a small Home preview. There is no
reminder store or scheduler yet. The user subsequently prioritized
[optional blueprint To-dos](02-blueprint-to-dos.md), implemented locally with
default-off capture and independent unfinished task copies.

See [current state and implementation boundaries](00-current-state-and-target-architecture.md),
[host-authored experiences](../blueprints-roadmap/10-host-authored-experiences.md),
and [QR release acceptance](../blueprints-roadmap/22-qr-distribution-handoff.md).
