# Event-planning product progress and customer complaints

**Research date:** October 20, 2026.  
**Source checkpoint:** web/server `6ff53ae`; iOS `5bdd241`.  
**Status:** Research assessment and proposed priorities, not an implementation
plan or authorization to build, deploy, or change permissions.

## Assessment

Gatherory has the feature breadth of a useful collaborative planning MVP. Its
next milestone should be proving that a host can plan an event, guests can
participate easily from their phones, and important changes reach them reliably.
Adding more planning modules is not the immediate priority.

This is a judgment based on the current source and external research, not a
percentage-complete estimate or a claim of product-market fit. The latest
blueprint and To-do changes are implemented and committed locally; their device
and deployment acceptance is separate. Automated tests do not establish guest
adoption, usability, or production reliability.

## Current Gatherory position

| Area | Source-based position | Implication |
| --- | --- | --- |
| Shared planning | Main/sub-events, Ideas, Decide, notes, budgets, and assigned/self-claimed To-dos are implemented. | Enough breadth to test real planning workflows. |
| Reusable plans | Blueprints, link/QR sharing, independent saved copies and optional To-do definitions are implemented locally. | A promising area to test as differentiation; uniqueness has not been established. |
| Guest participation | Accounts are required to accept invitations. The browser join route has no attendance response control and directs accepted users toward iPhone; the native app owns RSVP interaction. | Android and browser-only guests are a significant participation gap. |
| Reminders and updates | To-do dates do not schedule reminders. Planning notes do not send email or push notifications. | Saving information does not mean guests or collaborators have received it. |
| Detailed guest logistics | No complete household/plus-one, per-guest meal questionnaire, or seating workflow was found. | A gap for a full wedding suite; not necessarily a blocker for a small gathering. |
| Budget depth | Caps and expenses support estimated/committed/paid status, but not a complete vendor, deposit, or payment-deadline workflow. | Useful basic tracking, not vendor-payment management. |
| Portability | Native Add to Calendar exists. No general guest-list, schedule, or budget CSV/PDF export surface was found. | Venues and helpers may still need manual handoffs. |
| Platforms and release | Planning edits are iPhone-first; the web is a read-only planning companion. No Android client was found in the mapped repositories. | Test the guest journey separately from the organizer's native experience. |

These findings describe the source tree, not the currently deployed service or
an installed build. They do not rule out external/manual workarounds.

### Code and implementation evidence

- [Browser invitation route](../../src/routes/join/$token.tsx): sign-in/account
  creation, invitation acceptance, and the iPhone continuation message.
- [Invitation acceptance workflow](../../src/server/events/workflows/accept-event-invitation-token.workflow.ts)
  and [guest RSVP persistence](../../src/server/events/repos/guest-invitation.repo.persistence.ts):
  authenticated, event-scoped participation and personal attendance changes.
- Native [invitation screen](../../../ios-apps/gatherory/Gatherory/Features/Events/EventInvitationScreen.swift)
  and [guest invitation store](../../../ios-apps/gatherory/Gatherory/Features/Events/GuestInvitationStore.swift):
  the attendance response interaction.
- Native [note composer](../../../ios-apps/gatherory/Gatherory/Features/Home/NoteComposerView.swift):
  explicitly states that sharing a planning note sends no email or notification.
- [Shared To-dos handoff](../roadmaps/to-dos-reminders-roadmap/01-shared-event-to-dos.md),
  [blueprint To-dos handoff](../roadmaps/to-dos-reminders-roadmap/02-blueprint-to-dos.md),
  and native [verification record](../../../ios-apps/gatherory/docs/testing-verification.md)
  distinguish local implementation from remaining release checks.

## Market expectations

The comparison covers consumer invitations and collaborative planning, rather
than conference registration, ticketing operations, or professional planner CRM.
Official feature pages establish advertised capabilities, not independent proof
of their quality.

| Product | Relevant advertised behavior | Lesson for Gatherory |
| --- | --- | --- |
| Partiful | Guests can RSVP without installing its app; hosts have guest messages and configurable automatic reminders. | Invitation access and communication are core parts of the event experience. |
| Apple Invites | Browser RSVP works without an Apple Account, with email verification; existing Apple accounts may require sign-in. | Avoid equating “no app required” with “no authentication steps.” |
| Joy | Guest/party and meal information, RSVP tracking, filtered guest communication, and CSV import/export. | Guest data must support practical headcounts and handoffs. |
| Zola | Website, guest list/RSVP, checklist, budget, registry, and guest messaging. | A broad feature list is established market territory; breadth alone is a weak distinction. |

Sources: [Partiful guest access](https://partiful.com/),
[Partiful reminders](https://help.partiful.com/en-us/articles/15525436-what-event-reminders-do-you-send),
[Apple RSVP instructions](https://support.apple.com/guide/apple-invites/rsvp-to-an-event-devc9d9cdbd5/ios),
[Joy overview](https://withjoy.com/help/en/articles/8309436-joy-101),
[Joy import/export](https://withjoy.com/help/en/articles/8309207-importing-and-exporting-your-guest-list),
and [Zola planning app](https://www.zola.com/wedding-planning/app).

## What complaints suggest

### Information is scattered across too many tools

A wedding-planning discussion describes information spread across five apps.
Replies repeatedly recommend a master spreadsheet, sometimes alongside a
dedicated guest-facing service. This supports testing whether Gatherory connects
ideas, decisions, tasks, and costs without making people enter the same details
twice. It does not establish that every user wants every feature in one app.
[Reddit discussion](https://www.reddit.com/r/weddingplanning/comments/1x57cqk/what_wedding_planning_appwebsite_do_you_recommend/).

### Prescriptive planning can create anxiety

A newly engaged person found an app's deadlines overwhelming before they had
even chosen a wedding date. Optional dates, flexible blueprints, and ordinary
language are a good fit for this concern. Suggestions should not become
mandatory obligations or overdue counters just because a person starts a plan.
[Reddit example](https://www.reddit.com/r/weddingplanning/comments/1bwstc5/best_wedding_planning_app/).

### Basic RSVP failures undermine otherwise attractive products

A detailed historical Joy complaint describes duplicate guests, confusing
plus-one handling, extra steps before RSVP, delivery concerns, and difficulty
extracting a useful guest list. These are useful failure cases for our own
testing, not evidence that the competitor still has those bugs. Joy's current
documentation does describe guest-list export.
[Reddit complaint](https://www.reddit.com/r/weddingplanning/comments/1g3b6qx/withjoy_is_free_but_bad/),
[current Joy export documentation](https://withjoy.com/help/en/articles/8309207-importing-and-exporting-your-guest-list).

### Important changes must reach people

An event host described a cancellation reaching one group through Facebook
while other guests missed email and still arrived. Another discussion describes
an organizer losing their WhatsApp-based communication channel. The product
lesson is dependable event communication, not simply adding a chat feed.
[Reddit cancellation account](https://www.reddit.com/r/ios/comments/1ihntn0/introducing_apple_invites_a_new_app_that_brings/),
[Reddit communication outage](https://www.reddit.com/r/weddingplanning/comments/1nookt0/).

A personal To-do reminder helps the planner remember work. A venue-change or
cancellation message helps guests act on changed event information. These are
separate needs with separate consent, delivery, and lifecycle requirements.

### People still need a practical day-of handoff

A day-of scheduling discussion emphasizes a shared run sheet, clear ownership,
and someone responsible for timing. Software cannot ensure people follow the
schedule. A readable export or shared schedule may be more useful initially
than a complicated live operations dashboard.
[Reddit discussion](https://www.reddit.com/r/weddingplanning/comments/1u1f93p/app_to_keep_wedding_day_on_schedule/).

## Proposed next priorities

The order below is a research recommendation for the next scope discussion.
It does not replace approved roadmaps or authorize implementation.

1. **Complete the mobile-browser guest journey.** Open the invitation, understand
   the details, RSVP, change a response, and add the event to a calendar on
   iPhone and Android. Examine where account creation or app installation adds
   friction. Preserve verified identity where required, event-scoped access,
   guest privacy, revocation, and the separation between RSVP and planning rights.
2. **Provide dependable event updates.** Start with important changes and
   messages to relevant guests, with understandable notification preferences.
   Do not promise delivery merely because a note or event edit was saved.
3. **Add optional personal reminders.** Keep them separate from due dates,
   assignments, and guest announcements. The
   [existing reminder proposal](../roadmaps/to-dos-reminders-roadmap/README.md)
   records consent, account isolation, cancellation, and offline tradeoffs.
4. **Add practical exports.** Start with guest lists, schedules, and budgets for
   authorized venues/helpers. Decide export scope and privacy deliberately;
   calendar export already exists and is not the same as these handoffs.

Households, plus-ones, meal questions, vendor payments, and seating should be
prioritized according to the initial audience. A dinner or birthday does not
need the same depth as a wedding. Social features, a vendor marketplace, and
advanced seating tools can remain deferred while the core journey is validated.

## Suggested validation milestone

After required deployment/device checks, pilot a dinner, a birthday, and a small
multi-event celebration. Include a host, collaborators, an Android/browser-only
guest, and someone who does not already know the product. Observe whether they
can create the event, delegate a task, respond to an invitation, find changed
details, and hand off the schedule without coaching.

Record where people return to texts or spreadsheets, repeat data entry, miss a
message, or ask what to tap next. Those observations should determine the next
implementation slice. A small pilot is proposed validation, not evidence that
the product is already validated.

## Research limits

- Reddit is self-selected and much of this sample concerns weddings. Do not
  generalize it to all event types or infer complaint frequency from it.
- Some threads contain promotion, disputed allegations, or older product
  behavior. Use concrete reported experiences as hypotheses; do not repeat
  claims about data selling, security, or vendor misconduct as verified facts.
- This was desk research and a source review, not interviews, a usability study,
  a competitor hands-on benchmark, or a live production audit.
- Recheck official capabilities before relying on this dated comparison for
  implementation or public positioning. No claim of unique features, market
  share, willingness to pay, or a completion percentage is established here.
