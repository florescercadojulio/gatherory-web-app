# Mobile V1 notification policy

October 21, 2026. This refines the existing mobile notification triggers. It does
not add browser push, personal reminders, delivery receipts or scheduled retries.
The user has confirmed receiving pushes on an iPhone; acceptance of each trigger
and audience remains separate from that successful transport test.

## When to notify

| Action | Notification |
| --- | --- |
| Explicitly Send Update | Notify the selected permitted All, Planning or Guests audience, excluding the sender. |
| Assign an unfinished to-do to another eligible planner | Notify the new assignee only. Taking a to-do yourself, unchanged assignments and completion stay quiet. |
| Edit a Draft event's schedule or location | Save normally, without an automatic change alert. |
| Change a main event from Draft to Ongoing, or approve a sub-event | Save normally, without replaying earlier draft edits or sending a readiness alert. |
| Change an eligible event's date/time or location | Send one classified change alert to its exact participants, excluding the editor. |
| Cancel an eligible event | Send a cancellation alert; cancellation takes priority over schedule/location edits in the same mutation. |
| Reopen a cancelled event into an eligible state | Send a reopening alert; completed events remain quiet. |
| Save notes, ideas, budget edits or blueprint changes | No push from those ordinary saves. Explicit Send Update remains separate. |

The existing statuses define eligibility; there is no new publication setting.
A main event must be **Ongoing** and incomplete both before and after an ordinary
detail edit. A sub-event must be **Approved** and incomplete, with its exact main
event Ongoing and incomplete in both snapshots. An approved sub-event under a
Draft main event stays quiet. This applies to approved planning visits as well as
celebration activities; it grants no new attendance or planning access.

Cancellation requires prior eligibility. Main-event Ongoing → Cancelled and
eligible sub-event Approved → Cancelled produce the cancellation classification.
Draft cancellation is quiet. Reopening is Cancelled → Ongoing for a main event
or Cancelled → Approved for a sub-event with an eligible main event. Finished,
archived, rejected, uncertain, completed and unknown states do not produce
ordinary change alerts. A main-event lifecycle change never fans alerts into
sibling or child rosters.

These classifications do not add restoration controls or relax closed-event
write guards. A normal edit within a cancelled sub-event remains rejected and
sends nothing. The existing authorized host root-event update path can restore
the main event; changing a root archive never overwrites a child's canonical
state or manufactures a child reopening.

Draft suppression applies to automatic event-change alerts. Assignments and
explicit announcements retain their existing permission and lifecycle policies;
this pass does not silently suppress an explicitly sent message.

## Clear alerts with private details kept in the app

The server stores only an opaque event/entity reference and a generic change
classification. It never copies a title, address, task text, note or sender name
into the notification record or push content. English and Spanish alerts say:

| Change | English | Spanish |
| --- | --- | --- |
| Date, time, all-day, time zone or scheduling state | Event date or time changed. | Cambió la fecha o la hora del evento. |
| Location | Event location changed. | Cambió la ubicación del evento. |
| Both | Event schedule and location changed. | Cambiaron el horario y la ubicación del evento. |
| Cancellation | Event cancelled. | Evento cancelado. |
| Reopening | Event is back on. | El evento vuelve a estar en pie. |

The push type remains `event_changed`, so existing iPhone routing still opens the
event only through the active account/device-guest and current access checks.
Old records without a classification retain the generic detail-change wording;
they do not bypass the new current-state checks or get replayed automatically.

## Permissions, transactions and delivery

The pure policy is shared by capture and delivery. Capture compares canonical
before/after state inside the existing authorized sync transaction. A rejected,
conflicting or rolled-back edit creates no alert. Schedule and location changes
in one event mutation use one classification and the existing deduplication key
per recipient. Replayed mutation receipts do not create new notifications.

Claim and per-installation checks revalidate current event/main-event status,
participation, departures, retired device-guest identities, installation binding
and consent. A queued cancellation is ineligible after reopening; an ordinary
alert is ineligible after the event or its main event becomes Draft or terminal.
Assignment and announcement audience checks remain intact. Notification taps
still reauthorize before displaying protected content.

Delivery remains [one bounded best-effort attempt after commit](04-best-effort-delivery.md).
No cron, worker, catch-up replay or retry infrastructure is enabled.

## Migration and acceptance

`drizzle/20261021194933_rare_union_jack/migration.sql` adds nullable
`native_notification_outbox.event_change_kind` and a constraint on its allowed
values. Existing rows keep NULL; there is no backfill or content retention change.
Apply the additive migration before deploying this server revision. It has only
been applied to a new disposable local test database in this pass; existing
databases, live provider configuration and app Release flags are untouched.

Physical-device acceptance should use two accounts plus a device guest:

1. Edit a Draft main event and a Draft sub-event, then change their statuses.
   Confirm saved data and silence, including after reconnecting.
2. On an Ongoing main event and an Approved sub-event, change date/time, location,
   and both together. Confirm one appropriate alert per receiving installation,
   no self-alert and no parent/sibling roster leakage.
3. Cancel and reopen an eligible event. Verify the distinct wording in English
   and Spanish, foreground/background/terminated delivery, and a tap into the
   currently authorized event.
4. Exercise departure, guest-to-account claim, account switching, permission
   denial and revoked access while delivery or opening the event is in flight.
5. Confirm explicit Updates and assignments still work, while local notes,
   routine edits and self-claimed/completed to-dos stay quiet.

## Verified locally

- `pnpm test`: **627 passed / 44 environment-gated skips**, including portable
  contract freshness. The enabled database checks below run separately.
- Four enabled database files: **14 passed** on a new disposable PostgreSQL 18
  container. This includes native capture, dispatch/lease fencing, installation
  registry and announcement audience/guest privacy regressions. All checked-in
  migrations, including the new classification column, applied successfully to
  that empty database; the container was removed after verification.
- `pnpm typecheck`, targeted Prettier and `git diff --check`: passed on Node
  **24.22.1** with pnpm **12.9.1**.
- iPhone `NotificationControllerTests` and `NotificationNavigationTests`:
  **12 non-UI tests in 2 suites passed**. Native payload routing remains
  unchanged; the new body classifications do not grant account or guest access.
- Native localization coverage: **1,523 English/Spanish strings passed**, with
  the existing dynamic AppCopy extraction warning. Server tests separately cover
  every new push body in both languages, legacy fallback and payload field
  allowlisting. No new native catalog entries were needed.

The integration regression caught missing main-event context for child-scoped
edits; capture now resolves the same-organization owning root before comparing
states. The tests retain child-only recipients, actor exclusion, quiet readiness
transitions, rejection/conflict/replay behavior and transactional rollback.
They also verify that a cancelled child's normal edit remains rejected, that an
authorized root cancellation/reopen notifies only the root roster, and that
root archives do not overwrite canonical child state. Lease/TTL test setup uses
database-clock anchors to avoid host/container clock skew at test boundaries.

Logs:
`/tmp/gatherory-notification-policy-tests-final.log`,
`/tmp/gatherory-notification-policy-database-final-pass.log`,
`/tmp/gatherory-notification-policy-typecheck-final-pass.log`,
`/tmp/gatherory-notification-policy-format-check.log`,
`/tmp/gatherory-notification-policy-native.log`, and
`/tmp/gatherory-notification-policy-localizations.log`.

No UI tests, live push sends, commits, deployments or existing-database migrations
were performed. The physical-device trigger/audience checks above remain open.
