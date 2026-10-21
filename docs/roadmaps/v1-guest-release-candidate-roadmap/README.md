# V1 guest release candidate

**Status:** Implemented first slice — local non-UI checks pass; physical-device and deployment acceptance remain.  
**Priority:** P0 for the V1 candidate.  
**Owner areas:** iOS authentication/local persistence/invitations; server `/api/guest/*`.

## User outcome and approved scope

People can choose **Continue as Guest**, enter a recognizable name, and make
plans saved on this device. They can attend public guest invitations and respond
without creating an account. Inviting people to their own events and saving or
publishing blueprints require sign-in. The user approved “local planning +
attending invitations” on October 20, 2026.

The confirmed V1 sharing rule is **attend as guest; sign in to help plan**.
Signing in preserves the guest information and the pending invitation. Planning
access still requires the host's invitation/permissions; it is not an automatic
upgrade of guest attendance. Public guest links, collaborator links, and private
email invitations state their different access requirements.

This is the first approved slice following the
[event-planning research](../../research/event-planning-progress-2026-10-20.md),
not a claim that all research priorities or V1 release gates are complete.

## Current position and next work

Read [01 — implementation and verification](01-device-guest-mode.md) for source
ownership, account handover, permission boundaries, automated evidence, and
physical-device/deployment acceptance. No production migration, deployment,
build upload, commit, or push is authorized by this implementation task.

The browser invitation page still uses its existing account-based journey.
Browser-only/Android RSVP, dependable event announcements, personal reminders,
and practical exports remain later slices; none is implied by this native guest
implementation. A web planning editor, social features and billing are outside
this slice.

## Constraints

- A device guest is not a Better Auth account or a planner sync identity.
- An invited event is a read-only event projection, never an owned workspace.
- Claims require the device proof plus the real verified account session; names
  and email guesses never establish ownership.
- Local import adds to existing account data and preserves the source on failure.
- A partially completed import stays bound to its first target account.
- Destructive guest exit is explicit and device-only; it does not silently leave
  events or revoke the host's attendance history.
- Keep ordinary signed-in sign-out and its offline-draft recovery unchanged.

Related: [product model](../../architecture/product-model.md),
[server implementation guide](../../development/server-implementation-guide.md),
[native auth contract](../../../../ios-apps/gatherory/docs/auth-integration.md),
and [native offline sync](../../../../ios-apps/gatherory/docs/offline-sync.md).
