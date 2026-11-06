# Production migration CI recovery — November 6, 2026

The Release 7 migration run [42226219463](https://github.com/florescercadojulio/gatherory-web-app/actions/runs/42226219463)
stopped at `pnpm test`, before either database migration or native materialization.
Two unit suites imported application environment validation without providing
their runtime dependencies. The Blueprint image fixture also regenerated JPEGs
whose bytes depended on the platform's encoder, then compared them against
checksums for canonical CDN variants.

The auth unit tests now supply test-only adapter/persistence mocks and a local
guest-session configuration. Disabled Android Apple sign-in always executes
its assertions and proves no redirect, cookie, or persistence write occurs.
Application environment validation remains enabled, including its existing
negative regression test. No production handler, workflow, service, repository,
schema, or migration changed in this recovery.

Blueprint tests now read exact JPEG variants stored under their manifest SHA-256
checksums (108 distinct files, 8,963,452 bytes). Coverage validates every unique
seed/Explore URL, checksum, JPEG type and dimensions, and rejects unknown URLs,
oversized downloads, missing files and corrupt bytes. Tests use no CDN network
access; production integrity checks and catalog manifests remain unchanged.
See the [fixture refresh instructions](../../tests/fixtures/blueprint-seed-image-variants/README.md).

The production workflow supplies `DATABASE_URL` only to the secret preflight,
migration and native-materialization steps. Dependency installation and unit
tests receive no production database credential. Tests still gate both writes;
the existing serialized production migration workflow is retained.

Validation before production retry:

- The three affected suites passed: 13 tests.
- A new Git archive plus the exact recovery changes was copied into an isolated
  Linux arm64 container. Node 24.22.2 and pnpm 12.9.1 installed the frozen lockfile
  from scratch. No developer dotenv files, app secrets or host dependencies were
  copied. External networking was then disconnected.
- `pnpm test` passed there: 189 files / 1,111 tests; 48 files / 76 opt-in
  integration tests skipped. This includes contract generation checks, Drizzle
  schema generation and the database-only CLI environment regressions.
- Host `pnpm typecheck` passed. Linux container typechecking was killed by its
  approximately 2 GiB memory limit, including a lower-concurrency retry.
  Typechecking also passed from the clean archive on macOS with an empty
  process environment and the host's installed dependencies linked in.
- Linux x64 dependency installation could not be validated locally because
  pnpm's native binary crashed under QEMU before installation. The actual GitHub
  Ubuntu x64 workflow remains the required production gate.

Before the retry, a read-only production audit found 24 applied migrations,
all matching checked-in hashes, and two pending migrations:
`20261025003143_lucky_robbie_robertson` and
`20261025150000_mcp_oauth_provider`. Neither had been partially applied. The
workflow retry and subsequent read-only journal audit are the release evidence
for their application; this document records the code and preflight checks.
