# Host-authored stays, packages, and reusable experiences

**Direction recorded:** October 15, 2026, at the user's request.
**Status:** private authoring and cottage reuse implemented locally in [11](11-private-cottage-proof.md);
QR distribution, checklists, reminders and richer place data remain future work.
**Surface decision:** fine-grained reusable configuration belongs in the web app;
iOS stays focused on discovering, reviewing, using, and contributing to a plan.

## Experiences we must make room for

| Example | Author configures on the web | Recipient uses in their own experience |
| --- | --- | --- |
| Short-term rental / Airbnb-style property | Nearby places, suggested outings, arrival guidance, departure checklist | Scan a QR code, review the template, choose stay dates, copy it, and adapt the suggestions |
| Family cottage lent over summer | Family recommendations, cottage instructions, arrival/departure tasks | Create a fresh plan for that family's visit without inheriting earlier visitors' activity |
| Wedding package | Suggested venues, activities, suppliers, planning guidance and preparation tasks | Copy the planning content into an independent wedding plan; commercial acceptance remains separate |

These are reusable experiences, not a requirement to build booking software,
an Airbnb integration, a marketplace, or package checkout now. A family owner
does not need to become a professional business merely to author a template.
Suggestions remain ideas, not reservations, purchased services, attendance
answers, assignments accepted by another person, or approved decisions.

## Web authoring, lightweight native use

The web app owns template composition: reusable recommendations, ordering,
targets, audience, supported configuration, relative date rules, checklists,
reminder defaults, draft preview, immutable publication, and sharing controls.
Use guided controls rather than raw JSON or a general automation designer.

iOS owns the simple consumer path: open/scan a link, understand what will be
copied, choose dates/time zone and optional activities, confirm, then use the
ordinary event tools. Later it can complete checklist items and offer a concise
reminder opt-in. Keep normal editing of the resulting personal plan available;
web-first template configuration does not make installed plans read-only.
Do not add a template builder or property-management console to iOS.

## Copying, sharing, and ownership

1. The author maintains a reusable template, optionally associated with a
   persistent resource such as a property. The property is not a stay, booking,
   or shared workspace containing every visitor's plans.
2. A QR code represents a template URL. Opening it resolves an authorized,
   published source; it does not install, join, purchase, or grant access.
3. The recipient previews the exact revision/hash, reviews selections and dates,
   and explicitly creates their own experience using the existing recoverable
   installation workflow. Repeated submission of that request creates one plan.
4. The copy records source provenance but evolves independently. Author updates
   must not silently overwrite dates, recommendations, or checklist state in
   existing copies. A future update mechanism needs a reviewed semantic diff.

Distinguish **Use template** links from **Join event** invitations in UI, routes,
authorization, and API/MCP operations. A template QR must not convey organization
membership, collaborator approval, or access to a host's other events. Copying
a package grants its creator no access; collaboration requires a separate
scoped invitation or professional engagement.

Private authoring/publication and future unlisted distribution are separate capabilities. An unlisted
link can be forwarded and is not proof of a booking or family membership. Before
shipping, define link audience, revocation/expiry, abuse limits, and whether a
long-lived QR resolves a pinned revision or the latest publication. Whichever
policy is chosen, review/install must pin the exact revision and revalidate it;
never silently substitute content after confirmation. Revocation controls new
access, not remote deletion of recipients' independent plans. Preserve existing
uncertain-installation recovery rather than discarding a receipt on link failure.

Public/unlisted previews must exclude door codes, private addresses, credentials,
booking details, and previous visitors' personal content. Actual stay-specific
access instructions require a separately authorized delivery path, not a secret
embedded in a printed QR or copied public template.

## Future capability boundaries

- **Recommendations:** reuse ideas for places and activities where semantics
  fit. Richer location/link/media defaults need explicitly versioned portable
  contracts and native adapters. Today's executable idea configuration only
  supports its version marker; do not promise structured map pins or arbitrary
  configuration merely because the generic JSON envelope can hold them.
- **Checklists:** reusable item definitions describe arrival, departure, or
  preparation tasks. Installation creates fresh instance-local items. Completion,
  assignments, due dates, and activity history belong to the instance, never to
  the reusable definition. A new stay must not inherit completed items or people.
- **Reminders:** optional delivery rules refer to instance tasks or supported
  milestones. A checklist item can exist without a reminder. Define recipients,
  consent, channels, cancellation, and notification permission independently of
  completion. Installation must not silently schedule notifications for others.
- **Stay dates:** arrival and departure are distinct anchors. Existing scheduling
  supports only `main_start`; do not overload it to mean checkout. Add typed
  anchors and explicit range/time-zone validation when a stay slice is built.
  Use Temporal calendar arithmetic for civil-date offsets and elapsed durations
  only where intended. Missing anchors remain unresolved; do not invent dates.
  Recalculation must preserve user edits and require explicit confirmation.

Expose supported, independently versioned modules—not a generic executable
workflow language. Current clients must reject unsupported required modules
before installation and explain omitted optional capabilities. Adding actual
checklist/reminder support requires storage, authorization, projection and
compatibility work; putting definitions into opaque JSON is not implementation.

Keep live task writes on the existing durable offline mutation/transaction
model with stable IDs, idempotent retries and conflict rules. Reminder delivery
is a separate side effect: retries, relaunch, device changes, task completion,
and rescheduling must not duplicate or revive canceled notifications. Define
local versus server delivery ownership before implementing either. Preserve
account isolation, scoped access, and pending edits across capability upgrades.

## Relationship to monetization

These examples strengthen the repeat-organizer/host use case for later annual
plans; they do not settle pricing, allowances, or licensing. Template distribution,
collaborative planning coverage, property access, and a provider's package sale
are different products and must not share an implicit permission grant.

Keep the agreed free personal planning/RSVP experience and Event Pass boundary.
A copied template does not automatically consume a pass or subscribe the visitor.
Do not assume one property purchase covers unlimited independent stays. A future
owner-sponsored or annual offering needs explicit coverage and retention rules;
a wedding package's price is not the event's budget or Gatherory's pass price.

## Delivery sequence and evidence gates

1. Preserve these boundaries in current contracts/docs without speculative
   tables, empty app tabs, or new mutation types.
2. Build web private authoring/publication using existing ideas, activities and
   guidance; prove a cottage-style copy with fresh identities and no shared state.
3. Add permission-aware URL/QR distribution with a safe preview and explicit
   install. Prove forwarding, revoked links, stale revisions, and retry behavior.
4. Add a bounded checklist capability and arrival/departure anchors; test fresh
   completion state, scoped visibility, offline edits, relaunch, and older clients.
5. Add opt-in reminder delivery only after ownership, permission, cancellation,
   time-zone/DST and deduplication behavior is defined and tested.
6. Evaluate repeat-host annual coverage and commercial package/engagement flows
   separately, using actual repeated-use evidence.

These steps describe dependencies within this expansion, not permission to
start all of them now. The new authoring/reuse goal is a reason to revisit the
earlier billing-before-authoring recommendation when prioritizing the next
slice; it does not silently change the agreed monetization model or authorize
billing, a QR implementation, or a new native configuration surface.

See [architecture](../../architecture/experience-blueprints.md),
[web authoring](02-private-authoring-and-publishing.md),
[date-aware setup](08-date-aware-setup.md), and
[monetization](../../architecture/monetization-model.md).
