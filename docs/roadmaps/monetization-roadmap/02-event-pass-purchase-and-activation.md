# 02 — Event Pass purchase and activation

**Status:** Planned. **Priority:** P1. **Depends on:** `01`; complete `03`
before charging production customers.

## Outcome and experience

The organizer purchases coverage for the selected existing main event. Before
checkout show its name, included sub-events, service period, storage allowance,
price/currency from the store, and renewal/expiry terms. Collaborators see the
event's coverage, not a demand to buy their own pass. RSVP has no paywall.

Begin with StoreKit for an in-app iOS offer and a server verification connector.
Confirm product type against the chosen time-limited service/restore model;
do not choose a non-consumable merely because the marketing calls this one-time.
External/web payment methods remain a separately reviewed distribution choice.

## Purchase and recovery sequence

1. Authorize a purchase intent for a root the sponsor is allowed to fund under
   the approved policy. Bind it to the canonical account and root; preserve a
   durable attempt identity. This does not create another event.
2. Run store checkout outside the product transaction. Cancellation makes no
   grant; pending/deferred verification is shown honestly, not as active.
3. Verify signed provider evidence server-side, including product, application,
   environment, account association, status and unique transaction identity.
   A client success Boolean or local receipt string alone is not authority.
4. In one database transaction, record verified receipt state and bind the grant
   exactly once. Recheck scope/ownership and prevent concurrent double binding.
5. Reconcile authorized coverage to clients. Complete/acknowledge the store
   transaction using the provider's recovery contract after durable processing;
   losing an HTTP response must not require repurchase or lose the grant.
6. Verify, deduplicate and reconcile provider notifications plus explicit
   restore/refresh. Handle out-of-order delivery and offline notification gaps.

The payment and database cannot be one distributed transaction. Recover an
already-paid but not-yet-bound purchase explicitly. If ownership changes during
checkout, retain verified evidence for authorized recovery/refund handling;
never silently bind it to a different root or pay twice.

Restore must recover the original permitted binding after reinstall/account
sign-in, not let an unrelated Gatherory account claim another user's purchase.
Define Store account/application account mismatch handling before release.

## Architecture boundary

The billing domain owns provider verification, purchase intents and commercial
grants. Event services own access and stable event identity. Native purchase
state belongs in a focused service/controller; HTTP and receipts do not belong
in the archive codec, outbox writer or feature view. Sync retains ordinary
event mutations; purchasing must not regenerate their stable IDs.

Blueprint installation is a separate user action. Using a free starter never
opens checkout, creates a purchase intent, or consumes an Event Pass. A later
purchase covers that installed event exactly like a blank-created event.

## Acceptance and tests

- Same transaction/replayed request/lost response creates one grant for one root.
- Invalid signatures, wrong products/environments and other-account evidence
  fail without exposing an event or unlocking capabilities.
- Pending, canceled, interrupted and concurrent purchase flows preserve local
  planning and show recoverable state. Restore does not duplicate coverage.
- Main event and children retain IDs, memberships, media and pending outbox work.
- Child-only collaborators gain paid capability only within their existing scope.
- Fake connectors and sandbox store tests cover verification and reconciliation;
  disposable DB tests prove receipt/binding rollback and uniqueness.
- No paid production enablement until lifecycle, mixed-client and offline
  acceptance in `03` is complete and storefront configuration is reviewed.

## Deferrals

Annual subscriptions, gifting, credits, pass transfer and a second payment
provider. Ownership/sponsor edge cases still need a defined safe policy even if
their self-service UI is deferred.
