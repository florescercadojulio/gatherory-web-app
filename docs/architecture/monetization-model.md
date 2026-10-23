# Gatherory monetization model

**Decision recorded:** October 15, 2026. **Status:** agreed product direction;
billing and entitlement enforcement are not implemented.

Gatherory charges for coordinated planning, not access to a person's own plans.
This document owns the product rules; the [implementation roadmap](../roadmaps/monetization-roadmap/README.md)
owns delivery and the [blueprint sequencing assessment](../roadmaps/blueprints-roadmap/05-product-experience-and-billing-sequence.md)
owns the recommendation about what to build first.

## Explore advertising experiment — October 22, 2026

The user approved Google AdMob native cards within iPhone Explore, using
Google's dedicated test IDs first. Browse and category feeds page through real
blueprints and insert clearly attributed ads after six organic results, then
every twelve. Search, recent history, and private planning screens stay ad-free.
Catalog exhaustion stops the feed; it does not recycle content to show more ads.

The AdMob account is now approved; the app still Requires review because no
public App Store listing is linked. European and US privacy messages are
published in English/Spanish with Google-only initial partner lists. The public
publisher file and advertising disclosure are live. Debug uses Gatherory's app
ID with Google's native test unit so real app-specific UMP messages can be
validated. Production IDs are prepared behind disabled Release advertising;
no live requests, native release, billing change or backend deployment occurred.
Consent uses UMP, with privacy choices when required. Private event and account
data are not ad request targeting. See the native
[implementation and release requirements](../../../ios-apps/gatherory/docs/explore-advertising.md)
for consent, SDK disclosures, configuration, and runtime acceptance still needed
before live advertising. The Event Pass direction below remains separate.

## Agreed offering

| Offering            | Product boundary                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Free                | Useful personal planning, basic invitations and RSVPs, continued local access to one's plans, and data export.                                               |
| Event Pass          | Collaborative planning for one main event and its direct sub-events; one organizer pays and authorized collaborators participate without their own purchase. |
| Annual plans, later | Repeat-organizer coverage across multiple events, after usage and economics justify it. No annual product is part of the first billing release.              |

Personal budgets, ideas, decisions, schedules and notes must remain useful
without payment. Guests do not pay to view invitations or RSVP. The intended
guest experience works through the web without requiring app installation;
accountless responses require a separate security/product review and are not
asserted to exist today.

Free does not mean no backend. Invitation publication, guest responses,
identity, abuse controls and delivery have server costs. Do not switch off all
sync or require a pass at every authenticated endpoint. Define the included
free hosting allowance before launch; charge for collaborative planning, not
the mere presence of a network request.

No final price, service duration, storage allowance or unlimited-use promise
has been approved. The earlier $2.99/pass and $14.99/year proposals and the
$4.99/pass experiment are hypotheses, not a published price list. Measure
conversion and cost before selecting price, not just competing app prices.

## Coverage follows the main event

One pass covers the canonical main event and its direct children, including
children created later during its valid service period. A wedding's venue
visit, rehearsal and reception are not separate purchases. A different main
event is not covered merely because it has the same host or template.

The durable commercial binding is the canonical main-event ID, not the current
workspace slug, active organization, template revision, device, or child-only
native projection ID. One-main-event-per-workspace is today's invariant, not
a reason to make organization membership the permanent billing model.

Keep three identities distinct: the purchaser/sponsor, the event's ownership,
and each participant's access. A purchase grants no event role. A child-only
collaborator inherits commercial coverage, not parent/sibling access or Better
Auth organization membership. Resolve coverage server-side without returning
private parent records just to explain a child's entitlement.

Ownership transfer, sponsor deletion, refunds and overlapping grants need
explicit policies before paid release. Do not silently reassign a purchase to
a different event or revoke another person's independently valid coverage.

## Free and paid experience

Offer the pass when a host enables paid collaborative planning, after they can
understand the event and its value. Explain the whole-tree coverage, service
period and media allowance before checkout. Do not surprise invited people with
a personal subscription screen or put a purchase step in the RSVP flow.

Purchasing promotes the existing plan in place. Preserve root/child IDs,
participants, local content, media references and mutation identities. It must
not recreate the event or require re-invitation. Payment does not invite people,
approve collaborators, or publish private content automatically.

Basic curated templates and editing the resulting personal plan should not
require an Event Pass. Paid template licensing, professional packages and
creator payouts are different future products, not implied by pass ownership.

## Access, expiry and offline safety

The commercial entitlement is separate from authorization: an operation that
needs both must pass both checks. A valid pass cannot bypass a revoked role;
an authorized guest RSVP must not fail because the pass ended.

Keep local planning and account-scoped data readable after expiry. Never delete
local plans or withhold export to induce renewal. Cloud retention, download
availability and eventual deletion must have separately disclosed rules;
continued local access is not a promise of indefinite cloud hosting or recovery
of media never downloaded to that device.

Before any paid enforcement, define advance notice, grace and recovery for
pending work. Preserve durable offline edits and stable outbox IDs. A billing
hold needs an explicit recoverable outcome, not a misleading permission error,
silent discard, infinite automatic retry, or wholesale account sign-out.
Previously admitted work versus edits created after entitlement expiry needs a
server-enforceable policy; client timestamps alone are not proof of eligibility.

Cache account/scope-bound entitlement information for offline presentation;
the server remains authoritative for paid operations. Avoid network checks on
every tab change or keystroke. Billing status is not a new workspace data graph
and must not alter existing record/outbox transaction boundaries.

## Decisions required before charging

Future rental-property hosts, family cottage owners and package authors are
explicit repeat-use audiences. They may justify later annual or owner-sponsored
coverage, but no such allowance or price is approved. Template copying via QR
must remain distinct from payment, booking verification and event access.
Do not treat one property's template as unlimited coverage for all copied stays,
or turn a copied wedding package into an accepted commercial purchase. See the
[host-authored experience direction](../roadmaps/blueprints-roadmap/10-host-authored-experiences.md).

1. Pass duration/activation point, extensions and post-event grace. Twelve months
   from purchase is not assumed; it may expire before a long-planned wedding.
2. Free invitation/media quotas, paid storage/transfer allowances, retention,
   and treatment of personal cross-device backup and recovery.
3. Whether a collaboration trial is offered and how abuse/usage is bounded.
4. Refund/revocation, sponsor deletion, event ownership transfer, duplicate
   purchases, pass reassignment and treatment of existing free collaborators.
5. Store product type, storefront availability, purchase restoration and account
   binding. A one-time payment is not automatically a lifetime entitlement.
6. Export/restore scope, including media and unsynced local changes. Internal
   archive serialization is not yet a complete user-facing portability feature.

Annual price, event allowance, carry-over and subscription lapse behavior stay
open until the later annual slice. Do not advertise unlimited events/storage.

## Evidence and payment constraints

The supplied competitor/pricing research motivates validation, not proven
willingness to pay. Keep market comparisons dated and link primary pricing
sources if using them in a later pricing decision.

For purchases offered inside iOS, the implementation plan starts with StoreKit
and server-verified transactions. Review the applicable storefront rules before
choosing any external checkout or web-to-app entitlement path; no universal
external-payment exception is assumed. Relevant primary references, checked
October 15, 2026: [Apple payment guidelines](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase),
[In-App Purchase](https://developer.apple.com/documentation/storekit/in-app-purchase),
and [App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications).

This decision does not configure App Store products, change TestFlight access,
introduce a payment provider, or authorize charging current users.
