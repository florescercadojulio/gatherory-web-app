# Gatherory documentation

Starting a new AI context? Read the [cross-project onboarding guide](development/ai-onboarding.md)
for repository ownership, established decisions, verification, and release context.

This repository owns the authenticated web companion and the server used by
native clients. The public landing site and iOS app are separate projects.
See the [repository README](../README.md) for setup, commands, authentication,
and database operations.

## What is Gatherory?

Gatherory helps people plan events together, keeping ideas, decisions, schedules,
and invitations in one shared place. A host creates an event, invites people to
help plan or attend, and coordinates the details without scattering them across
messages and separate tools.

Hosts and collaborators share ideas and express preferences through Decide;
team input informs planning without automatically approving an idea. Guests
see the invitation and event details and respond with their RSVP. A main event
can include related sub-events, such as a welcome dinner and reception.

The first release is iPhone-first and offline-first, with changes synchronized
when connected. The web app provides account management and a read-only planning
companion, while this repository's server supports the shared event data.
Reusable templates, business planning packages, and private recurring experiences
are future directions—not features promised in the current release.

See the [product model](architecture/product-model.md) for roles and release
boundaries, and [experience architecture](architecture/experience-blueprints.md)
for the longer-term design.

## Architecture

Read the product and data models first, then the relevant implementation guide.

| Document                                                             | Scope                                                                                                       |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [Product model](architecture/product-model.md)                       | Workspaces, events, participation, and release boundaries.                                                  |
| [Monetization model](architecture/monetization-model.md)             | Free personal planning/RSVPs, Event Pass tree coverage, and deferred annual plans; not implemented billing. |
| [Data model](architecture/data-model.md)                             | Schema ownership, native mapping, replication, and invariants.                                              |
| [Server architecture](architecture/server-architecture.md)           | Effect boundaries, authorization, contracts, workflows, and repositories.                                   |
| [Mobile session lifecycle](architecture/mobile-session-lifecycle.md) | Sign-in routing, onboarding, guest retention, preparation, and account isolation.                           |
| [Media system](architecture/media-system.md)                         | Uploads, signed URLs, access checks, storage, and cleanup.                                                  |
| [Experience architecture](architecture/experience-blueprints.md)     | Cross-platform design for reusable experiences, including future capabilities.                              |

- [Blueprint library collections](roadmaps/blueprint-ranking-roadmap/10-blueprint-library-collections.md): accepted native Yours/Saved/Liked navigation direction and pending implementation acceptance.
- [Search relevance and Explore header](roadmaps/blueprint-ranking-roadmap/11-search-relevance-and-scroll-header.md): phrase and typo matching evaluated against frozen v1, content-first browsing without category tiles, and the restored native Search title, profile toolbar and system search field.
- [Ads-enabled Explore stability](roadmaps/blueprint-ranking-roadmap/12-ads-enabled-feed-stability.md): measured ad slots and preview suspension, with real SDK sample scrolling/paging checks in Light/Dark and accessibility text. Production advertising remains disabled.
- [Discovery and library actions](roadmaps/blueprint-ranking-roadmap/13-discovery-and-library-actions.md): context-specific previews keep discovery read-only, preferences separate from copies, and Use explicit; locally implemented with focused native tests and simulator visual checks passed.
- [Unified Yours library](roadmaps/blueprint-ranking-roadmap/14-unified-yours-library.md): personal Blueprints and recoverable customizations in one grid, without a Drafts selector or empty-layout gap; native Create Blueprint event chooser and preserved setup recovery.
- [Single public preview and event creation](roadmaps/blueprint-ranking-roadmap/15-single-preview-and-event-creation.md): main event, included events and ideas in one public reading view; personal planning stays in Yours, with focused date confirmation and explicit Create Events.
- [Blueprint-led discovery](architecture/blueprint-led-discovery.md): accepted
  scan-first card direction with a cover, purpose-led title, optional creator
  byline, and preview-only event/idea detail. Categories stay internal; no
  required taxonomy, likes, or ranking change. The former highlight prototype
  and its validation are superseded history. Published content/related-term search
  is now implemented locally, alongside private Blueprint actions and default-off
  recommendation measurement.

## Marketing

- [Marketing documents](marketing/README.md): launch audience, positioning,
  acquisition experiments, landing-page recommendations, and measurement.
- [Launch strategy — October 21, 2026](marketing/launch-strategy.md): proposed
  founder-led launch plan; English-first with Spanish localization support.
  Targets and page changes are recommendations, not completed execution.

## Development

- [API and MCP contract conventions](development/api-contract-conventions.md):
  explicit character limits, integer minor-unit money strings, timezone-safe
  Temporal boundaries, shared schemas and compatibility rules for integrations.
- [Server implementation guide](development/server-implementation-guide.md):
  practical code references, Effect layer composition, authorization choices,
  test organization, and handoff checks for contributors and future chats.
- [Page creation standard](development/page-creation.md): routes, forms, shared
  controls, and accessibility conventions.
- [Localization inventory](development/i18n-string-inventory.md): string
  ownership and extraction areas, not a completed translation checklist.
- [Roadmap guide](development/roadmap-guide.md): planning and handoff conventions
  for multi-step work.

## Release and future work

- [Pinterest inspiration for event ideas](roadmaps/pinterest-event-ideas-roadmap/README.md):
  proposed board picker and selected references in event Ideas, existing manual
  link alternative, provider storage/sharing constraints, and build order.
  Planning only; no Pinterest integration or provider approval is implemented.

- [Blueprint ranking source research — October 22, 2026](research/blueprint-ranking-community-notes-2026-10-22.md):
  Community Notes code reuse map, trust and confidence mechanisms, and current
  Gatherory data gaps. The [discovery and ranking roadmap](roadmaps/blueprint-ranking-roadmap/README.md)
  records the current title-led card direction and the superseded highlight
  prototype history in [slice 01](roadmaps/blueprint-ranking-roadmap/01-blueprint-cards-and-highlights.md).
  [Content search and related terms](roadmaps/blueprint-ranking-roadmap/02-content-search-and-related-terms.md)
  are implemented locally. [Actions and verified measurement](roadmaps/blueprint-ranking-roadmap/03-actions-and-measurement.md)
  add private likes/bookmarks/hiding, opt-in organic signals and unchanged-copy
  adoption attribution. [Recommendation baseline](roadmaps/blueprint-ranking-roadmap/04-recommendation-baseline.md)
  adds explicit editorial priorities, creator diversity and recent-authored
  opportunity with versioned paging. [Baseline evaluation and signal readiness](roadmaps/blueprint-ranking-roadmap/05-baseline-evaluation-and-signal-readiness.md)
  records offline ordering checks and current signal limitations.
  [Measurement readiness report and attribution checks](roadmaps/blueprint-ranking-roadmap/06-measurement-readiness-report-and-attribution-checks.md)
  add a local read-only operational report and native snapshot/copy/install matrix.
  [Measurement cleanup and new-item opportunities](roadmaps/blueprint-ranking-roadmap/07-measurement-cleanup-and-new-item-opportunities.md)
  add acceptance order, exact pairing, opt-in serving diagnostics and promotion-only
  baseline v2. [Personal Like-based ranking](roadmaps/blueprint-ranking-roadmap/08-personal-like-ranking.md)
  adds private current-Like content affinity, baseline comparison and native
  cursor recovery. [Personal Like precision tuning](roadmaps/blueprint-ranking-roadmap/09-personal-like-precision.md)
  adds role-aware matching and broader fixtures: the known wedding overmatching
  improves, but fresh-challenge precision/recall equal v1. Production usefulness
  remains unverified; no pooled engagement weights are added.
  Spotlights, social expansion and community quality models follow later;
  these later capabilities remain planned. New discovery collection defaults off;
  no shared migration, deployment or phone release occurred.

- [Mobile collaboration notifications](roadmaps/notifications-roadmap/README.md):
  FCM connector/service proof of concept for assignment and exact-event changes;
  configuration, isolation, local verification and remaining device checks.

- [V1 guest release candidate](roadmaps/v1-guest-release-candidate-roadmap/README.md):
  device guest planning, invitation attendance, account handover and recovery;
  implementation evidence and remaining device/deployment acceptance.

- [Event-planning progress and customer research — October 20, 2026](research/event-planning-progress-2026-10-20.md):
  source-based product assessment, competitor capabilities, Reddit complaints,
  proposed priorities, and validation limits. Recommendations are not approved
  implementation scope or evidence of a deployed release.

- [Server architecture roadmap](roadmaps/server-architecture-roadmap/README.md):
  Effect domain refactoring, compatibility boundaries, and persistence migration.
- [v1 safeguards](release/v1-release-safeguards.md): implemented safety behavior
  and environment-specific verification checks. Historical results are not a
  live production audit.
- [Experience blueprints roadmap](roadmaps/blueprints-roadmap/README.md): the
  template implementation sequence and stopping point. Follow its status
  labels; planned behavior is not released behavior.
- [Monetization roadmap](roadmaps/monetization-roadmap/README.md): policy,
  entitlement foundation, Event Pass purchase, lifecycle/offline safety and paid
  rollout gates. Annual plans remain later work.
- [Blueprint experience versus billing](roadmaps/blueprints-roadmap/05-product-experience-and-billing-sequence.md):
  recommendation to prove curated native setup first, then billing, then finish
  full private authoring. This does not remove the original blueprint scope.

## Documentation conventions

- Put architectural rules in `architecture/`, contributor instructions in
  `development/`, release checks in `release/`, and feature plans in `roadmaps/`.
- Use lowercase kebab-case filenames and relative Markdown links. Source paths
  in inline code are repository-root-relative unless stated otherwise.
- Update this index and incoming links when adding or moving documents.
- Separate current implementation, planned behavior, and verification evidence.
  Record the date, environment, and result when completing release checks.
- Link to the owning document instead of duplicating rules. Never store secrets,
  private invite links, or production credentials in documentation.
