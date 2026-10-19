# Native pre-install customization

Implemented locally October 16, 2026. Deployment and physical-device acceptance
remain separate release steps.

## Experience

Home / Ideas / Decide remains the read-only template preview. **Customize**
opens the account-scoped setup draft, where people can add or edit ideas and
sub-events before reviewing and installing their independent copy.

Editors reuse the workspace's category chooser, event-category strip, purpose
control and name/notes field presentations. Their save callbacks update only
the setup draft: they never receive a mutable `PlanningWorkspace`.

- Ideas: title, supported category, notes and main/sub-event placement.
- Sub-events: title, supported category and planning/event purpose.
- New items are selected for inclusion; editing does not reselect an excluded item.
- New sub-events require an explicitly confirmed date. Editing content preserves
  existing confirmed dates and source schedule proposals.
- Cancel leaves saved content unchanged. Saved edits survive relaunch and are
  isolated by account and, for shared links, link credential.

Music, private source media, typed category configuration, budgets, participants,
guidance authoring and nested grandchildren are not added by this slice. The
editors do not present unsupported fields and silently discard them.

## Contract and transaction boundary

The optional `customizations` field on installation/preview input is versioned:

```ts
{
  version: 1,
  children: ChildDefinition[],
  ideas: IdeaDefinition[]
}
```

Each array is an upsert overlay, keyed by a stable source key. Existing keys
replace supported fields in place; new keys append in supplied order. Effective
category order retains authored order and appends newly used idea categories.
The published catalog key, revision, definition and hash remain unchanged.
No template is edited or published automatically.

The server first checks access and the immutable source pin, then validates the
overlay and merged definition. Effective totals remain capped at 50 sub-events
and 100 ideas; titles at 120 Unicode code points and notes at 2,000. Requests and
effective documents retain the 256 KiB byte ceiling. Duplicate/reserved keys,
unknown targets, unsupported categories/configuration and unsupported customized
modules are rejected rather than silently dropped. As before, ideas targeting
excluded children are listed as omitted in review. The generated installation
JSON Schema includes the optional field; old requests omit it unchanged.

Review returns the effective plan. Installation retains that exact reviewed
request, including customizations, under its existing request UUID. Once an
install begins, editing is locked until receipt recovery finishes. Reusing a
UUID for different content is still a conflict. Source/link permission checks,
completed-receipt recovery, canonical/native writes and bootstrap import retain
their existing transaction boundaries. Draft edits never enqueue ordinary sync.

## Rollout and next work

Deploy the updated server before shipping native customization. An older server
rejects the unknown field; it must not fall back to installing an uncustomized
copy. No database migration is required for this request/planner extension.

The subsequent [Blueprints library tab](18-native-blueprints-library.md)
distinguishes private setup drafts and installed-copy history. Adding draft customization
does not introduce automatic publication, source refresh or a universal native
creation engine.

## Verification

- iOS app build and all 523 non-UI tests passed (631 executions including
  parameterized cases) on an isolated iPhone 18 Pro / iOS 27 simulator.
- Six new native model/draft regressions cover overlays, limits, source
  immutability, account isolation, legacy drafts and exact request encoding.
  The existing lost-response/relaunch/import test also runs with customized
  content and verifies no synthesized outbox mutations before a real edit.
- Web suite: 427 tests passed, 21 environment-gated tests skipped. The 12 new
  focused cases cover planner validation, immutable pins, separate native
  manifests, receipt conflicts and workflow authorization boundaries.
- Typecheck, generated contract checks and English/Spanish localization
  coverage (1,175 keys) passed.

UI tests, live database integration, deployment and physical-device acceptance
were not performed. Workflow/projection tests use isolated fakes and fixtures;
they do not claim a live server installation proof.
