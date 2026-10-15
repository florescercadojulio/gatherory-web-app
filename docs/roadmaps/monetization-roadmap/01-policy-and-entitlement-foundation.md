# 01 — Policy and entitlement foundation

**Status:** Planned. **Priority:** P1. **Depends on:** `00`, product policy
decisions, and the blueprint experience gate before production billing.

## Outcome

Make the free/paid boundary understandable and testable without charging users
or accidentally restricting their current plans.

## Work

1. Resolve and version the open policies in the [model](../../architecture/monetization-model.md):
   activation/duration, free hosting, storage, retention, offline grace,
   refunds/transfer, existing-user treatment and personal backup/recovery.
   Accountless planning is not implied by a zero price.
2. Define the exact operation matrix. Keep personal planning, guest RSVP,
   invitation viewing, local access and export outside the paid gate. Bound
   free abuse/hosting separately without turning RSVP into a purchase flow.
3. Deliver user-facing export/restore and document its media/unsynced-data
   limitations before any paywall depends on it. Internal archives alone do not
   satisfy this requirement. Restoration must not duplicate IDs or leak accounts.
4. Add grant/receipt/binding persistence, capability DTOs and a provider-neutral
   resolver. Proposed lifecycle outcomes distinguish pending verification,
   covered, grace, ended and revoked; finalize names/semantics in contracts.
5. Add a read-only, authorized coverage projection for native and web, with
   policy version, server evaluation time and validity information. Cache it
   per account/event, invalidate it on account changes and reconcile on resume.
6. Initially evaluate in tests/shadow mode only: no live denial, checkout or
   requirement to purchase. Define compatibility for installed clients before
   adding new sync entities or rejection codes.

## Architecture boundary

Pure entitlement calculations consume explicit grants, scope and server time.
Effect workflows authorize and query/write through scoped repos; connectors
verify provider evidence later. Local caching follows the existing account and
save boundaries, not a `PlanningWorkspace` billing singleton. Mock grants belong
in isolated tests, not a production bypass that accepts client claims.

## Acceptance and tests

- One root grant covers that root and current/future direct children, not
  another root, sibling of a child-only invitee, or every workspace membership.
- Commercial coverage does not promote a guest/collaborator or bypass revocation.
- A scoped child can learn its own coverage without parent/private billing data.
- Expired/revoked coverage cannot deny basic invitation/RSVP or local export.
- Pure tests cover exact service boundaries, overlap, revoked and missing grants
  using an injected clock. API tests cover unauthorized cross-account lookups.
- Native tests cover cache/relaunch/account switches and export/restore with
  pending changes, missing media and unsupported versions without data loss.
- Existing users see no new restrictions from this foundation slice.

## Deferrals

No payments, annual products, pricing experiments that charge users, or blanket
server enforcement. Unresolved policy blocks paid rollout, not pure resolver
or export design work.
