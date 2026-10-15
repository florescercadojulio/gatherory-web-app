# 03 — Lifecycle, offline safety and rollout

**Status:** Planned. **Priority:** P1. **Depends on:** `01` and `02`.

## Outcome

Complete the Event Pass lifecycle without losing saved work, charging guests,
or confusing a billing hold with revoked event access. This is a paid-launch
requirement, not optional hardening after checkout ships.

## Work and boundaries

- Implement the approved expiry, notice, grace, extension, refund/revocation,
  retention, ownership transfer and sponsor-deletion policies. Stop new paid
  capability use only where policy requires; preserve free operations.
- Define which queued operations can complete across a service boundary using
  evidence the server can trust. Test exact boundaries and partial batches;
  do not trust device clocks or accept all historical-looking writes forever.
- If a write is commercially deferred, retain the local data and stable mutation
  ID, expose a recoverable billing state and resume deliberately on valid
  coverage. Do not map it to `EVENT_SCOPE_FORBIDDEN`, discard it as permanently
  rejected, or continually retry it with no path to resolution.
- Preserve local database/outbox atomicity and receipt/cursor commits. Do not
  erase payload fields, replay acknowledged changes or block unrelated eligible
  scopes because one event's pass ended. A billing hold never overrides a real
  security revocation or makes cached unauthorized data accessible.
- Keep invitation viewing/RSVP and necessary free delivery operational after
  pass expiry. Define media upload versus download/retention separately, with
  notices and export options before any disclosed cloud deletion.
- Provide recovery/reconciliation tooling, audit identifiers and operational
  alerts without logging private plans, receipts or payment credentials.

## Required acceptance matrix

| Scenario                                                      | Required evidence                                                                                    |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Offline edit → expiry → relaunch → reconnect                  | Durable local work retained; approved grace/defer result; no infinite retry or new mutation ID       |
| Billing refresh/purchase finishes after account switch        | No old-account coverage, event data or pending purchase binds into the new account                   |
| Paid root with child-only collaborator                        | Coverage resolves, while parent/siblings and organization administration remain inaccessible         |
| Pass ends while guests RSVP                                   | Free RSVP/invitation delivery continues under ordinary access checks                                 |
| Refund and reordered/replayed provider notifications          | Coverage converges without resurrecting revoked grants or double processing                          |
| Duplicate/overlapping purchase or later annual grant          | Approved conflict/overlap policy; unrelated valid coverage is preserved                              |
| Local plan upgraded with unsynced media/edits                 | Same root/child IDs and pending work, no duplicate event or forced invitation reset                  |
| Legacy client pushes/pulls after enforcement rollout          | Defined compatible outcome; no silent lost edit or unsupported rejection loop                        |
| Sponsor/owner deleted, pass ends, retained cloud data expires | Approved lifecycle policy; local access/export preserved without an indefinite cloud-storage promise |

Run existing native offline/outbox/merge/media/auth tests plus new lifecycle
cases, Vitest/`@effect/vitest` domain tests, wire contracts and disposable DB
failure/concurrency tests. Add sandbox purchase/restore/refund evidence and
separately authorized physical-device release checks. No production charges or
destructive real-account tests are routine verification.

## Rollout gate

Before paid enablement, record approved price/terms/storefronts, exact supported
client versions, existing-user migration/grandfathering, free-cost and paid-cost
limits, restore/refund support procedure, and production reconciliation ownership.
Start with non-enforcing diagnostics and a small explicitly managed cohort.
Rollback must stop offers/enforcement safely without invalidating already-paid
grants or wiping local work. Any capacity restrictions must be disclosed.

Measure setup completion, first useful contribution/decision, invitation
acceptance, paid conversion, repeat hosting, refund/support volume, and cost per
active event, including free guest traffic and media. Use the existing telemetry
privacy controls; do not collect plan content to evaluate monetization.

Only after usable value and acceptable operating economics are demonstrated
should annual coverage move from deferred to an implementation slice. Complete
the remaining blueprint authoring scope independently; neither marketplace nor
professional payments are required for Event Pass launch.
