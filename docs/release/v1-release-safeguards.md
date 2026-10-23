# v1 safeguards — implementation and remaining release checks

The current guest/invitation release checkpoint is the
[October 21 mobile V1 audit](mobile-v1-guest-invitation-audit.md). Use it for the
latest source fixes and pending device/deployment evidence. This document's
older verification snapshot remains historical.

> Verification snapshot: October 13, 2026. The checks below describe that
> implementation pass, not a live audit of production or the current TestFlight
> build. Revalidate against the target environment before marking a check done.

## Implemented

- Archived sub-events can be restored with their saved planning status.
- Decide offers Undo while the queue still contains ideas.
- Host/manage cancellation preserves records and closes new invitations/RSVP.
- A guest can leave exactly their selected invitation after server acknowledgement.
  A durable departure marker prevents stale native participation from restoring
  access; only a fresh validated invitation clears it.
- iOS Account centralizes sync/media-transfer status and manual retry. Editors
  and invitation content do not duplicate sync indicators or explanatory copy.
- Add to Calendar uses the native editor, exports a copy, and handles all-day
  inclusive dates and time zones. It does not request calendar read permission.
- Personal photo hide/report, account-isolated caches, user blocking/unblocking,
  and an explicitly permissioned abuse-report queue. Normal uploads have no
  host approval gate. Blocking never removes shared membership.
- Moderation evidence is revealed deliberately, review transitions are atomic
  and audited, and normal image URLs honor global/personal hiding. Existing
  signed URLs can remain usable until expiration.
- New native copy is translated in English and Spanish. Analytics configuration
  remains enabled by default in Debug and Release as currently requested;
  automated fixtures do not send analytics.

## Deployment configuration to verify

Automated tests do not establish whether deployed Drizzle migrations are
current. Verify them through the normal migration workflow before exercising the
features against a running backend. Tests use local PostgreSQL and roll back
their fixtures and temporary DDL. They never reset user data or write R2 objects.

A moderator must be an actual verified sign-in account and must be provisioned
explicitly. The support mailbox is not a role. The local provisioning command
refuses missing/unverified accounts and remote databases. No real grant has
been made during this pass.

## Account deletion: implemented and remaining checks

The Better Auth deletion hook preserves shared planning and transfers ownership
to an existing planner while removing the departing user's contact details,
private workspaces, and uploaded R2 objects. The local HTTP/PostgreSQL/dev-R2
deletion test covers owner and collaborator cases.

Native Sign in with Apple sends its single-use authorization code to the server
after Better Auth verifies the identity token. The server exchanges the code
with Apple, verifies the returned identity and App ID, binds it to the signed-in
Apple account, and encrypts the refresh and access tokens in the Better Auth
account record. Account deletion revokes a stored refresh token (or access token)
with Apple's `/auth/revoke` endpoint before local deletion. A failed revocation
leaves the Gatherory account available so deletion can be retried. Accounts
created before code capture still delete without a token, and the iOS Delete
Account sheet explains how to remove Gatherory manually in Apple settings.
This follows [Apple TN3194](https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple).

The token exchange and revocation paths have controlled local database tests
with signed fixture identity tokens and mocked Apple responses. A physical
Sign in with Apple account and production Apple endpoint remain unverified.

## Content filtering: decision/provisioning still needed

Personal hiding, reporting, blocking, and human moderation are implemented;
automatic sensitive-image classification is not. No third-party screening
provider has been authorized or added.

Apple's on-device Sensitive Content Analysis is a possible personal warning
layer, not a universal server moderation replacement. It requires a signed
capability/entitlement and operates only when the person's applicable system
settings enable it. Classification results must stay on-device and must not
be sent through analytics, reports, or sync. Provisioning and child/adult
intervention behavior need verification before shipping that layer.
See [Apple's Sensitive Content Analysis guidance](https://developer.apple.com/documentation/SensitiveContentAnalysis/detecting-nudity-in-media-and-providing-intervention-options).

Do not treat the implemented report queue alone as proof of
[App Store user-generated-content compliance](https://developer.apple.com/app-store/review/guidelines/#user-generated-content).

## Submission checks still required

- Verify native live auth → invitation → media → sync with a migrated backend.
- Verify shared account deletion with multiple planners and guests, including
  provider revocation and authored content/snapshot cleanup.
- Designate and staff moderation/support, and decide/provision content filtering.
- The Blueprint recommendation measurement slice adds its own account opt-in
  (default off), telemetry purge on opt-out and 30-day retention. It sends no new
  external analytics events. Before enabling it in a deployment, apply its
  migration, configure excluded internal/test accounts and schedule retention
  cleanup; see [slice 03](../roadmaps/blueprint-ranking-roadmap/03-actions-and-measurement.md).
  This does not complete the broader SDK/privacy review below.
- Review production analytics consent, App Privacy disclosures, and the privacy
  policy against actual PostHog behavior before EU distribution. Default-enabled
  analytics here is the requested temporary configuration, not a legal-compliance claim.
- Test native system Calendar save/cancel and physical-device sharing. Automated
  Calendar tests validate the draft/date model, not a real external calendar write.
