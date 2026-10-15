# Monetization — Event Pass first

**Status:** Planned — documentation only; no billing implementation started.
**Priority:** P1, after the bounded blueprint experience validation gate.
**Owner area:** proposed server billing/entitlement domain, native purchases,
event collaboration, media policy, and release operations.
**Last reviewed:** October 15, 2026, web `ef57f6a`, iOS `9e3a70e`.

## Outcome and decisions

Implement the [monetization model](../../architecture/monetization-model.md):
free personal planning and guest RSVPs; one organizer-funded Event Pass covers
one main event and its sub-events. Annual plans follow later. Prices, duration,
quotas and store product type remain undecided. This is not authorization to
enable a paywall or change existing users' access.

## Current position and stopping point

Current source provides offline saves, authenticated sync, scoped event roles,
invitations/RSVPs and media delivery. It does not provide a billing domain,
StoreKit purchase flow or commercial entitlement checks. Native sign-in and
internal archive encoding are not proof of accountless planning or user-facing
export/restore. See `00` for the inspection boundary.

This session documents product rules, implementation slices, test gates and
cross-roadmap sequencing only. No migrations, products, prices, endpoints,
runtime flags or payment settings were created. Validation consists of Markdown
formatting, local links and a docs-only diff; runtime tests are not applicable.

**Immediate next step:** resolve the blueprint proving-slice contract and test
one curated starter through native installation as described in the
[sequencing assessment](../blueprints-roadmap/05-product-experience-and-billing-sequence.md).
In parallel, decide pass duration, free/paid boundaries and lifecycle policy on
paper. No billing code is needed to validate the starter experience.

## Delivery order

1. [00 — Current state and architecture](00-current-state-and-target-architecture.md).
2. [01 — Policy and entitlement foundation](01-policy-and-entitlement-foundation.md):
   resolve policy, preserve free use/export, add testable event-scoped coverage;
   no charging or enforcement for existing users.
3. [02 — Event Pass purchase and activation](02-event-pass-purchase-and-activation.md):
   verified purchase, exactly-once root binding, recovery and restoration.
4. [03 — Lifecycle, offline safety and rollout](03-lifecycle-offline-safety-and-rollout.md):
   complete expiry/refund/offline behavior and prove it before any paid rollout.

The numbered slices are ownership boundaries, not permission to release a
half-finished payment experience: `02` must not charge production customers
before `03` passes. The full web template-authoring UI is not a dependency of
these slices; transactional blueprint installation must still satisfy its own
acceptance gates. Neither roadmap authorizes a general sync rewrite.

## Later: annual coverage

Defer annual subscriptions until repeat hosting and Event Pass economics have
been measured. Define event counts, which organizer can activate coverage,
storage, renewal, lapse, overlapping passes and ownership changes first.
Implement annual coverage as another verified grant source using the same
capability resolver, not a parallel authorization system. Activation onto a
root must be explicit; a collaborator's personal subscription must not
automatically sponsor every event they can access.

Annual support also needs renewal/failed-payment/grace/restore tests and a
policy for already activated events after cancellation. No price, unlimited
event promise or annual StoreKit product is approved in this roadmap.

## Continuation and constraints

Read the product model, this README and the active slice; inspect current Git
state and the installed Intent catalog before implementing. Use existing pure
Effect workflows, production layer composition and explicit actor/scope inputs.
Use Vitest/`@effect/vitest`, disposable PostgreSQL tests and native Swift Testing.
Preserve account filters, stable sync identities and controller-owned saves.
Do not run production database actions or charge users as a routine test.

After each implementation slice, record actual behavior, files, validation,
open policies and rollout state. Update the dated source review rather than
treating this plan as evidence that purchases or free guest web flows work.
