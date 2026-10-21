# Reusable event invitation QR links

October 21, 2026. Local implementation; not deployed.

## Product behavior

Each event has separate Guest and Collaborator invitation links. Creating a link
is explicit. Reopening sharing loads existing links without creating or replacing
them. The link and QR encode the same authorized `/join/<token>` URL. Switching
audiences must never replace the other audience's link.

New public links have no scheduled expiry. Revoking a Guest link leaves the
Collaborator link alone, and vice versa. Creating a link after revocation issues a
new token: previously printed QR codes remain invalid. Revocation stops new joins;
it does not remove people who already joined.

Scanning opens the existing invitation preview. People still explicitly accept
or RSVP. Guests can attend in the iPhone app without an account; collaborators
must sign in to help plan. Existing collaborator enablement, permission choices,
approval rules, event lifecycle checks, blocks, and creator authorization remain
effective. A QR code does not grant planning access or skip approval.
Device-guest enrollment now also rechecks the link creator's exact-event sharing
permission after locking and re-reading the token, matching account-based joining.
Removing or demoting the creator cannot leave a perpetual guest admission bypass.

The iPhone app displays and shares the QR image through native sharing controls,
including destinations that can save or print an image. There is no custom scanner
and no browser QR authoring feature. A shared invitation URL is a bearer link:
anyone who receives a copy can open its public invitation preview. It contains no
names, contacts, participant lists, or private planning data.

## Compatibility and rollout

The schema changes the public link key from `event_id` to `(event_id, role)` and
allows a null `expires_at`. Private, email-specific invitations keep their current
expiry and acceptance behavior.

The migration preserves existing tokens. Only unrevoked public links whose expiry
is still in the future become perpetual; already expired or revoked links are not
reactivated. Do not run the migration against an existing environment without
separate approval. Deploy the compatible server/schema before the new mobile build.

Public link creation uses the existing `POST /api/invitations` with no email field.
Public responses include the audience role and nullable expiry. The read-only
`GET /api/invitations?kind=share-links&eventId=<uuid>` lists usable public links for
authorized event managers. The existing GET without that selector still lists
join requests. Selected-role revocation uses `DELETE /api/invitations` with
`{ eventId, role }`. Older callers that omit `role` retain revoke-all behavior.

Links remain subject to existing access and event lifecycle restrictions. Turning
off collaborator links prevents joining even if someone kept a printed code.
Changing permissions or approval policy uses current server policy when joining;
the QR does not freeze a permission snapshot. Accounts that already participate
are not automatically upgraded by accepting a different audience's link.

## Verification and remaining device checks

Server verification on October 21:

- `pnpm typecheck` passed.
- `pnpm test` passed: 599 tests; 42 resource-gated tests skipped.
- Six focused invitation, HTTP-handler, device-guest, architecture, and migration
  test files passed all 20 tests with database gates enabled on a new disposable
  PostgreSQL 18 container. All migrations were applied only to that empty test
  database; the container was removed afterward.
- The migration test executes the actual checked-in SQL against a temporary
  table, proving active token retention, no revival of expired/revoked links,
  and support for two audience records on the same event.
- Device-guest regression scenarios cover both creator demotion and removal:
  old links deny new enrollment, an authorized surviving host can explicitly
  create a replacement, and existing participants remain unchanged.

Logs: `/tmp/gatherory-event-qr-server-tests-20261021.log`,
`/tmp/gatherory-event-qr-typecheck-20261021.log`, and
`/tmp/gatherory-event-qr-integration-20261021.log`.

Native verification on October 21:

- `GatheroryTests`: 889 tests in 126 suites passed, using only the non-UI test
  target. QR tests decode the generated image back to the exact invitation URL;
  transport tests cover audience, nullable expiry, read-only lookup, scoped
  revocation, and rejection of private or mismatched link responses.
- `bash scripts/verify-localizations.sh`: 1,500 strings verified in English and
  Spanish, with the existing dynamic AppCopy extraction warning.
- Log: `/tmp/gatherory-event-qr-native-20261021.log`.
- Result: `/tmp/gatherory-event-qr-derived/Logs/Test/Test-Gatherory-2026.10.21_10-59-23--0400.xcresult`.
- Localization log: `/tmp/gatherory-event-qr-localizations-20261021.log`.

UI tests are intentionally excluded. Database verification must use an isolated,
disposable local database; never reset or migrate a shared environment to run
these tests.

Before release, verify on physical iPhones:

- Create both links, close/reopen sharing, and scan saved/printed copies with the
  system Camera. Guest and Collaborator codes must stay distinct and stable.
- Share, save, and print the QR image with a readable quiet zone. Check light/dark
  mode, larger text, VoiceOver labels, and cancellation in native sharing.
- Verify signed-out Guest attendance, explicit RSVP, signed-in collaborator
  approval, and denied planner actions for guests. Scanning alone must not join.
- Revoke one audience, verify the other remains usable, then explicitly create a
  new link and confirm the old printed code cannot admit a new participant.
- Switch accounts/events or lose management permissions with sharing open; stale
  links must not remain available through Gatherory's sharing controls.
- Confirm production `/join/` app links and fallback behavior with the installed
  release build. Device installation, deployment, and migration remain separate
  release checks.
