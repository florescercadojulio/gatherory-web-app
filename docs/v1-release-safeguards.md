# v1 safeguards — implementation and remaining release checks

## Implemented

- Archived sub-events can be restored with their saved planning status.
- Decide offers Undo while the queue still contains ideas.
- Host/manage cancellation preserves records and closes new invitations/RSVP.
- A guest can leave exactly their selected invitation after server acknowledgement.
  A durable departure marker prevents stale native participation from restoring
  access; only a fresh validated invitation clears it.
- iOS exposes workspace-scoped durable save/upload feedback. Draft editors
  distinguish saved state from unsaved form input.
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

## Configuration not yet applied

The new additive Drizzle migrations are generated, not installed by automated
tests. Apply them through the normal migration workflow before exercising the
features against a running backend. Tests use local PostgreSQL and roll back
their fixtures and temporary DDL. They never reset user data or write R2 objects.

A moderator must be an actual verified sign-in account and must be provisioned
explicitly. The support mailbox is not a role. The local provisioning command
refuses missing/unverified accounts and remote databases. No real grant has
been made during this pass.

## Account deletion: unresolved findings

The existing Better Auth deletion hook is not yet a completed release audit.
It deletes uploader media and handles organization ownership, but remaining
member selection currently does not verify event planning authority. Native
snapshot/entity/change ownership still references users with cascading deletion,
so deleting an owner or writer can remove shared replication history unless
those records are transferred/sanitized deliberately. Native archive payloads
and author/contact details require explicit cleanup, not only foreign-key nulling.

The installed Better Auth deletion path does not revoke provider tokens. The
native Apple sign-in currently transmits only an identity token and nonce; it
does not exchange the authorization code for refresh/access tokens. New account
creation needs a verified code-exchange/storage path, and deletion needs token
revocation plus removal of local and server user data. Existing accounts without
revocable credentials still require deletion and a clearly explained manual
Apple-revocation fallback—not a permanently blocked Delete Account button.
See [Apple TN3194](https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple).

No live account-deletion or real R2-deletion test has been performed in this pass.

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
- Review production analytics consent, App Privacy disclosures, and the privacy
  policy against actual PostHog behavior before EU distribution. Default-enabled
  analytics here is the requested temporary configuration, not a legal-compliance claim.
- Test native system Calendar save/cancel and physical-device sharing. Automated
  Calendar tests validate the draft/date model, not a real external calendar write.
