# Mobile V1: guest and invitation audit

October 21, 2026. Source checkpoint: web/server `3a08757`, iOS `b465a7c`, plus
the uncommitted audit fixes described below. This is a local source and non-UI
verification record, not evidence of a deployed backend or a release build.

The subsequent [mobile invitation/RSVP usability pass](../../../ios-apps/gatherory/docs/invitation-rsvp-usability.md)
simplifies preview copy and makes response retries resend the actual choice.
It also journals explicit departures before sending them so failed cache cleanup
cannot reopen a left event offline. The journal is scoped to the server and exact
principal and never replays a leave. It preserves the permission, handover and
generation boundaries below; see its verification record for newer native test
and localization evidence.

## V1 behavior

**Attend as guest; sign in to help plan.** Opening a link or scanning a QR shows
the existing preview. Entering a guest name prepares the device identity only.
Joining, requesting planning access, and changing RSVP remain explicit actions.

Guest and Collaborator links are independent and reusable until revoked, subject
to current event lifecycle and authorization. Guest attendance never grants
planning membership. Collaborators sign in and follow current host-selected
permissions and approval. Private email invitations require the matching account.

Signing in preserves device guest plans and attendance. Existing account data,
roles, RSVP choices, and explicit departures take precedence. Handover adds data;
it does not replace the account's library or silently upgrade attendance.
Device guest identity and its proof never become a Better Auth bearer session.
Removing guest information from the device does not leave joined events or change
RSVPs. Leaving an event remains a separate, acknowledged action; host attendance
history is not silently erased by local cleanup.

## Audited journey

| Step                               | Boundary and recovery                                                                                                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open a link/QR                     | Validate the token and configured origin, load the preview, keep enrollment explicit. Invalid/revoked previews retain Close and expose no join action.                              |
| Continue as Guest                  | Persist a recognizable name and a separate device proof. Creating the profile does not accept an invitation or RSVP.                                                                |
| Join and RSVP                      | Use the exact event's guest capability; wait for acknowledgement. Failed RSVP requests keep the previous confirmed response.                                                        |
| Sign in to help plan               | Keep the pending invitation across sign-in. Accepted attendance does not upgrade the account to a collaborator. Approval checks refresh status rather than granting access locally. |
| Sign in with existing account data | Bootstrap the account, import with a durable receipt, claim attendance with verified account plus guest proof, then clean up the retained source.                                   |
| Interrupt or change accounts       | Reject stale completions using identity plus generation. Resume a partly completed handover only for its bound account.                                                             |
| Leave guest mode                   | Confirm device-data loss, persist removal recovery before cleanup, and retry failed cleanup without reopening partly removed data.                                                  |

Invitation checks include account/private-email mismatch, collaborator policy,
creator permission, expiration/revocation, event lifecycle, exact parent/child
scope, and server approval. Existing feed/RSVP/leave tests cover delayed A→B→A
callbacks; a successful join acknowledgement is retained if destination loading
fails. The account/guest stores retain their existing transaction and offline
mutation boundaries.

## Concrete gaps fixed in this pass

- **Stale invitation completions:** native preview, join, destination loading,
  and retained acknowledgements now bind to the session's principal generation,
  so an old A→B→A result cannot open the later session's event.
  Preview and join entry points also stay paused while sign-out is in progress.
- **Interrupted device removal:** guest removal now persists a backward-compatible
  recovery marker before teardown. Relaunch keeps the recovery gate instead of
  reopening a partially cleared guest profile. Keychain removal failures remain
  visible and retryable.
- **Handover cleanup:** durable account-bound cleanup separates a completed import
  and claim from local source/proof removal. Cleanup retries must not generate a
  new proof or repeat claim after the original proof has already been removed.
- **Claimed guest feed isolation:** projection queries independently require an
  unclaimed guest profile with no account owner. A feed request whose initial
  proof verification preceded claim cannot use the retired identity to read the
  resulting account attendance. The account keeps its guest role and RSVP, and
  same-account claim receipts remain idempotent.
- **Recovery wording:** English and Spanish messages no longer promise that all
  information is still on the device or that nothing was removed after partial
  cleanup. The removal confirmation explicitly says RSVPs will not change.

No new invitation privileges, automatic enrollment, reminder jobs, social
features, browser guest RSVP, or billing are added.

## Known recovery edge

If joining commits but its response is lost, and the host revokes/expires the
link before retry, retrying that token fails. Existing attendance remains in the
guest event feed: close the link and open the invitation from Events. A known
successful acknowledgement already skips rejoining when only the feed load
failed. Do not weaken revoked-link admission to conceal this edge. Verify the
feed recovery path on a device before release.

## Remaining V1 release blockers

These are acceptance gates, not claims that the current deployment is broken.
Resolve against the intended environment and record actual build/device evidence.

1. **Compatible server and migrations.** Verify the deployment revision and the
   checked-in invitation, guest, To-do, announcement, notification and blueprint
   migrations required by the release. Exercise authenticated native endpoints
   after rollout. No existing database was migrated by this audit; deployment
   requires separate authorization.
2. **Physical guest and account recovery.** Run guest attendance plus local plans
   → existing populated account, interrupted claim/cleanup, relaunch, wrong-account
   recovery, sign-out, and deletion cleanup. Verify two accounts never see each
   other's local or remote information. Include an upgrade install over the
   existing TestFlight build, not only a clean install.
3. **Actual invitation handoff.** Test Camera scanning and Messages/AirDrop links
   on cold and warm app launches; guest versus collaborator behavior; private
   email mismatch; verification-required sign-in; pending approval; independent
   revocation; cancelled/finished events; and network interruption. Check iOS 26
   and the current supported OS on physical devices, including large text and
   VoiceOver. Automated UI tests remain excluded from this pass.
4. **Release services and native handoffs.** Verify production APNs/FCM binding,
   notification taps through sign-in, current audience isolation, two-device
   sync/media, offline/relaunch recovery, Calendar save/cancel, CSV destinations,
   and saved/printed QR readability. Notification delivery is best effort; the
   disabled retry worker and scheduler must remain disabled for V1.
5. **Submission preparation.** Revalidate reviewer access, distribution
   entitlements/origins, support and moderation operations, content-filtering
   decisions, and current privacy disclosures. Increment the build for the next
   candidate and verify a Release archive before any separately approved upload.
   This audit does not inspect App Store Connect or change release configuration.

Browser/Android guest participation, personal reminders, household/plus-one and
meal workflows, vendor payments, social features and billing remain deferred.
They are not added as requirements for this mobile candidate.

## Verification

Native verification:

- `GatheroryTests`: **891 tests in 126 suites passed**, with only the non-UI
  target selected and parallel workers disabled.
- Lifecycle tests use in-memory stores and failure injection to verify interrupted
  cleanup, exact-account recovery, skipped import/claim, proof non-regeneration,
  discarded-profile relaunch gating, and older-profile decoding. Invitation
  progress tests cover stale acknowledgements across principal generations.
- `bash scripts/verify-localizations.sh`: **1,500 English/Spanish strings passed**,
  with the existing dynamic AppCopy extraction warning. Four existing bilingual
  recovery/removal messages were updated; no new localization keys were needed.
- Log: `/tmp/gatherory-guest-audit-native-20261021.log`.
- Result: `/tmp/gatherory-event-qr-derived/Logs/Test/Test-Gatherory-2026.10.21_12-02-21--0400.xcresult`.
- Localization log: `/tmp/gatherory-guest-audit-localizations-20261021.log`.

Server verification:

- `pnpm typecheck`: passed.
- `pnpm test`: 599 passed; 43 resource-gated tests skipped.
- Seven focused invitation, device-guest, handler, architecture and migration
  test files: 21 passed with invitation/device-guest database gates enabled.
- The new claim/feed regression failed against the original query, then passed
  with the retired-identity predicates. It verifies the no-existing-account-person
  claim path, retained guest RSVP, idempotent claim receipt, and retirement of the
  old guest projection.

Database tests ran only on a new disposable PostgreSQL 18 container, which was
removed after verification. Logs:
`/tmp/gatherory-guest-audit-server-tests-20261021.log`,
`/tmp/gatherory-guest-audit-typecheck-20261021.log`, and
`/tmp/gatherory-guest-audit-database-20261021.log`.

There are no production data changes, provider calls, UI tests, deployment,
build upload, commits or pushes in this audit. See the native
[verification record](../../../ios-apps/gatherory/docs/testing-verification.md)
for current test commands and the [event QR handoff](../roadmaps/event-invitation-qr-roadmap/README.md)
for the prior migration and physical-sharing checks.

Older release notes contain historical sync-route failures, media-transfer
deferrals, and review-account status. Preserve those as dated evidence; do not
copy them into a current blocker list without revalidation.
