# Gatherory documentation

This repository owns the authenticated web companion and the server used by
native clients. The public landing site and iOS app are separate projects.
See the [repository README](../README.md) for setup, commands, authentication,
and database operations.

## Architecture

Read the product and data models first, then the relevant implementation guide.

| Document | Scope |
| --- | --- |
| [Product model](architecture/product-model.md) | Workspaces, events, participation, and release boundaries. |
| [Data model](architecture/data-model.md) | Schema ownership, native mapping, replication, and invariants. |
| [Server architecture](architecture/server-architecture.md) | Effect boundaries, authorization, contracts, workflows, and repositories. |
| [Media system](architecture/media-system.md) | Uploads, signed URLs, access checks, storage, and cleanup. |
| [Experience architecture](architecture/experience-blueprints.md) | Cross-platform design for reusable experiences, including future capabilities. |

## Development

- [Page creation standard](development/page-creation.md): routes, forms, shared
  controls, and accessibility conventions.
- [Localization inventory](development/i18n-string-inventory.md): string
  ownership and extraction areas, not a completed translation checklist.
- [Roadmap guide](development/roadmap-guide.md): planning and handoff conventions
  for multi-step work.

## Release and future work

- [v1 safeguards](release/v1-release-safeguards.md): implemented safety behavior
  and environment-specific verification checks. Historical results are not a
  live production audit.
- [Experience blueprints roadmap](roadmaps/blueprints-roadmap/README.md): the
  template implementation sequence and stopping point. Follow its status
  labels; planned behavior is not released behavior.

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
