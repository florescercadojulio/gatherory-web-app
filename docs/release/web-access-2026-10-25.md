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

## Production acceptance

Published through [PR #1](https://github.com/florescercadojulio/gatherory-web-app/pull/1).
Production commit: `2db89f4b2ea7f526f9fcd99e559b86b31be0bb66`.
Vercel deployment `dpl_C4FkYLRcdPyNzj7qaM17G9yjYE3W` reached READY and owns
`https://app.gatherory.com`. The release branch was
`codex/enable-web-app`; its source commit was `0cefff821cab2a1df327397868ca388c5bbd39c7`.

Anonymous live checks passed:

- `/` and `/workspaces`: HTTP 307 to `/auth/sign-in`, preserving session protection.
- `/auth/sign-in`: HTTP 200 with the existing email/password form.
- `/auth/sign-up` and `/auth/forgot-password`: HTTP 200.
- `/api/auth/get-session`: HTTP 200 with null session.
- `/api/sync/bootstrap`: HTTP 401; private planning data remains protected.
- `/privacy`: HTTP 307 to `https://gatherory.com/privacy`.
- `/mcp`: HTTP 404; this release did not enable production MCP.

The production browser opened the sign-in page instead of TestFlight. No
production login credentials, invitations, or planning-content mutations were
used for acceptance. The deployment-scoped error/fatal log query returned no
records during these checks; this is a short smoke window, not a long-term
monitoring claim. Results: `/tmp/gatherory-web-enable-production-http.json`.
The existing production workflow still runs tests before its migration step;
there are no new migration files in this release.

The existing [production workflow](https://github.com/florescercadojulio/gatherory-web-app/actions/runs/40239976759) completed successfully, including tests, checked-in migrations, and native-record projection in their existing order. Screenshot: `/tmp/gatherory-web-enabled-production.png`.
