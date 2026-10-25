# Web access — October 25, 2026

The user requested reopening the existing web app. This release is based on
production commit `ee9b647651da11d6ddc03bb72794f4dc64d08cf6` and contains only
web-access changes and their regression coverage. It excludes the separate
unreleased MCP, Android, schema, and native-app work in the development checkout.

The root route no longer redirects sign-in, sign-up, recovery, and planning
navigation to TestFlight. Existing session and event permissions still govern
protected pages and server operations. Privacy, terms, legal, and support URLs
still redirect to the landing site. The existing sign-in form now mounts its
server-error message so failed credentials are visible and retryable.

No database migration or reset, dependency change, credential change, or MCP
enablement is part of this release.

Validation on Node 24.22.1: generated-contract freshness and full tests passed
(123 files, 831 tests passed; 37 files and 58 opt-in tests skipped); focused
routing/error-state tests passed (two files, four tests); typecheck and production
build passed. The build used synthetic configuration in an isolated source copy.

Logs: `/tmp/gatherory-web-enable-release-full.log`,
`/tmp/gatherory-web-enable-release-focused.log`,
`/tmp/gatherory-web-enable-release-types.log`, and
`/tmp/gatherory-web-enable-release-build.log`.

Production deployment and live sign-in/access checks are recorded in the
follow-up acceptance record after publication; passing local tests alone does
not establish production availability.
