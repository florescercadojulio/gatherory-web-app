# Beta feedback: dates, contrast and browser access

Implementation date: October 23, 2026. These changes require a new native build
and web deployment; they are not included in the already-uploaded TestFlight
build 5. No database migration or reset is required.

## Event dates

New main events, child events, event ideas and Blueprint setup start at the
current device date/time. The previous defaults were six months ahead for
Blueprint setup and a week ahead for other event editors.

The native date sheet uses the event's saved IANA timezone automatically, with
the device timezone captured for new events. It no longer asks people to choose
a timezone. Existing events retain their stored zone and instant; this change
does not reinterpret or repair previously saved dates. All-day dates normalize
to midnight in the event's calendar, and optional end dates remain inclusive.

Event summaries now format using the saved event zone, matching the date sheet
instead of switching to the viewer's device zone. This covers Home, its event
switcher, event cards, the event directory, settings, archives and Collaborators.
Home's days-away calculation also uses the event's local calendar day. Internal
UTC/offset serialization and IANA zone fields remain unchanged.

## Collaborator contrast

Read-only people rows are ordinary content instead of disabled buttons. Names
retain primary text contrast and access labels remain adaptive in Light/Dark.
Managers retain the existing participant editor; this visual fix grants no
additional access or editing capability. UI fixtures use synthetic people and
events, with a DEBUG-only read-only viewer flag and ephemeral storage.

## Browser beta gate

The root route redirects browser login, signup and planning pages, including
navigation with an existing session, to
[Gatherory's public TestFlight invite](https://testflight.apple.com/join/rUDD4MCY).
The invite matches the landing site's `src/lib/site-links.ts`.

These paths remain available:

- `/api/*`, including native sync, sessions, social sign-in and OAuth callbacks.
- `/.well-known/*` for associated app links.
- `/join/*` and `/templates/shared/*` for public invitation and Blueprint previews.
- `/auth/reset-password` (with optional trailing slash) for email recovery.

Browser `/privacy`, `/terms`, `/legal` and `/support` forward to the existing
landing-site pages. Sign-in links from public previews reach TestFlight.

Native Google sign-in obtains an ID token in the iOS SDK and posts it to
`/api/auth/sign-in/social`; native Apple uses the same API plus its existing
token-revocation receipt. Native email authentication and `/api/auth/verify-email`
also retain their existing handlers. Provider credentials, auth authorization
and API permissions were not changed. This is a browser product gate, not an
API shutdown or user-agent check.

To reopen web planning later, remove the root route's beta redirect deliberately
and update these docs; no environment switch or mobile bypass token was added.

## Verification

- Native non-UI suite: **1,019 distinct tests / 1,153 executions passed**, zero
  failures, skips or recorded runtime warnings. Signed simulator result bundle:
  `/tmp/gatherory-beta-feedback-signed-unit-20261023.xcresult`.
- The new date coverage checks today's Blueprint default, timed instants over
  the Detroit spring DST boundary, all-day main/child edits surviving archive
  encode/decode in Los Angeles/Tokyo, and event-zone date labels across midnight.
- Blueprint setup's normal Light/Dark UI journey passed, including explicit
  date confirmation, cancel, save and recovery reopening. Result bundle:
  `/tmp/gatherory-beta-feedback-regressions-20261023.xcresult`. That initial run
  also included two failures described below and is not an all-green result.
- The standalone new-event date UI test passed in normal Light/Dark: default
  today, pick another day through the native calendar, verify the complete date
  including year, save, reopen and compare. Final bundle
  `/tmp/gatherory-beta-feedback-final-date-flow-20261023.xcresult` also reran all
  78 `GatheroryTests` checks through the updated archive-codec regression:
  **79 total checks passed**, zero failures/skips/runtime warnings.
- Read-only collaborator UI passed in normal Light/Dark, checking visible
  identity/access, absence of an edit button and no Participant sheet after a
  tap. Bundle: `/tmp/gatherory-beta-feedback-final-ui-20261023.xcresult`.
  Its earlier date-selector failure is superseded by the final date bundle
  above. Actual Light/Dark screenshots from both final flows were exported and
  visually inspected in `/tmp/gatherory-beta-feedback-final-date-shots` and
  `/tmp/gatherory-beta-feedback-final-ui-attachments`. The first contrast run
  used only the system theme argument and produced identical appearances;
  explicit app appearance arguments corrected it before final verification.
- Web: **835 tests passed**, with the existing 58 environment-gated skips;
  generated contract check, TypeScript typecheck and production build passed.
  The final focused gate/protected-route set passed 16 tests. Logs:
  `/tmp/gatherory-beta-feedback-web-final-tests-20261023.log`,
  `/tmp/gatherory-beta-feedback-web-focused-20261023.log`,
  `/tmp/gatherory-beta-feedback-web-typecheck-20261023.log`, and
  `/tmp/gatherory-beta-feedback-web-build-20261023.log`.
- Direct local HTTP smoke: login/planning returned 307 to TestFlight; native
  get-session and app association returned 200 JSON. Password recovery and
  public preview pages remained available; legal/support redirected to the
  landing site. Invalid preview tokens were used, not private event links.
- Localization coverage passed for 1,695 English/Spanish strings, retaining the
  existing non-literal AppCopy extraction warning. No new copy or packages.
- Native Release compilation for the generic iOS Simulator destination passed
  (arm64 and x86_64): `/tmp/gatherory-beta-feedback-release-build-20261023.log`.
  This is a build check, not a signed device archive or TestFlight upload.

The initial unsigned native run failed an existing account-cleanup Keychain
test with `-34018`; simulator ad-hoc signing restored its entitlement access,
and the complete unit suite then passed. A new UI test's first navigation
selector used an old localization key instead of its displayed “Add event”
label; stable accessibility identifiers corrected that test entry. Native
calendar probes were also corrected to read the value from the inner control
(whose accessibility type changes while its popup is open), and to account for
calendar cells omitting the year. The final assertion still checks the complete
chosen date before and after reopening.

Relevant UI methods are in `GatheroryUITests/GatheroryUITests.swift`:
`testNewWorkspaceDateStaysSelectedWhenDateEditorReopensInLightAndDarkMode` and
`testReadOnlyCollaboratorIdentityAndAccessStayReadableInLightAndDarkMode`.
Blueprint setup uses
`BlueprintPreviewActionsUITests/testBlueprintUseOpensRealSetupAndRequiresExplicitDateConfirmation`.

Live provider authentication, cross-device/server sync of an edited date and
delivery to testers remain acceptance checks after deploying/uploading. Local
fixtures bypass authentication; API availability and unchanged handlers do not
prove an end-to-end Google/Apple login. No migration, production data rewrite,
deployment or TestFlight upload was performed for this follow-up.
