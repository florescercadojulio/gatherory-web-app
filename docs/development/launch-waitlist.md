# Launch waitlist

October 23, 2026. Local implementation for people who want Gatherory launch
updates, alongside the already-open iPhone beta. No messages are sent by this
feature. Nothing was deployed or pushed, and the existing development and
production databases were not migrated or reset.

## Boundaries

The Astro landing repository owns the English/Spanish form. The TanStack web
app owns persistence and the private tracker at `/admin/waitlist`.

- `POST /api/waitlist` accepts a normalized email, explicit consent, language
  (`en`/`es`), source (`landing_home`/`landing_iphone`), an optional short campaign
  label, and an empty honeypot. Its JSON contract is in
  `src/server/waitlist/contracts/waitlist.contracts.ts`.
- The server assigns `launch-updates-v1` and the first-created timestamp. A
  unique normalized email makes concurrent retries idempotent. Retries do not
  overwrite first-touch attribution or reactivate an opted-out address. New
  and repeated requests get the same public acceptance envelope, without IDs,
  counts, or information about existing membership.
- This list is independent of accounts, workspaces, guests, and invitations.
  Signing up or attending an event never adds someone to it automatically.
- Addresses are opt-in requests, not verified email ownership. No account,
  verification, confirmation, marketing, or welcome email is created or sent.
  A future sending workflow must handle delivery and opt-outs separately.
- `GET /api/admin/waitlist` returns totals and pages of up to 50 entries.
  `PATCH /api/admin/waitlist` marks an entry opted out, idempotently. Both
  require a current verified session whose email is explicitly allowlisted.
  Organization owners and moderators have no implicit access.
- The UI offers status filters, refresh, pagination, export of the displayed
  page only, explicit opt-out confirmation, and sign-out. Stored rows are scoped
  to the current signed-in identity and are cleared on account changes. CSV
  cells are quoted and spreadsheet formula prefixes are neutralized.
- The tracker is excluded from PostHog initialization/event capture, and its
  contents carry the existing replay-block class plus the autocapture opt-out
  class. See [PostHog autocapture](https://posthog.com/docs/product-analytics/autocapture)
  and [replay privacy](https://posthog.com/docs/session-replay/privacy).

## Configuration and activation

Server-only settings:

| Setting | Behavior |
| --- | --- |
| `WAITLIST_ADMIN_EMAILS` | Comma-separated verified sign-in emails. Empty denies every tracker read/mutation. The requested owner address was configured only in ignored `.env.local`, not committed. |
| `WAITLIST_RATE_SECRET` | Optional dedicated secret of at least 32 characters. Falls back to the existing `BETTER_AUTH_SECRET`; no usable secret fails closed. |
| `WAITLIST_ALLOWED_ORIGINS` | Optional additional exact HTTPS origins. No wildcard matching. |
| `BETTER_AUTH_URL` | Adds the configured application origin when HTTPS; loopback HTTP is accepted only outside production. |

The public form allows `https://gatherory.com` and
`https://www.gatherory.com`. Local development additionally allows
`http://localhost:4321` and `http://localhost:3003`. Private mutations require
the app's own request origin; the private API does not enable cross-origin
credentialed reads.

Landing builds may set `PUBLIC_WAITLIST_API_URL`. By default it points at
`https://app.gatherory.com/api/waitlist` for production and
`http://localhost:3003/api/waitlist` during Astro development. This is a public
endpoint URL only; put no secrets or administrator emails in the landing app.

The additive migration is
`drizzle/20261023172442_friendly_leopardon/migration.sql` (and its generated
snapshot). It creates only `waitlist_signup`, `waitlist_rate_bucket`, and their
indexes/constraints. Review and apply it through the normal release sequence,
configure the owner allowlist in the target server environment, then deploy the
backend before publishing a form that submits to it. No migration was applied
to the existing development database or a remote database in this task.

## Abuse and privacy handling

Requests require an exact allowed Origin, JSON, valid fields, and a body no
larger than 4 KiB, including streamed bodies. Honeypot submissions are accepted
without storage. Durable ten-minute counters limit global attempts to 200,
the same email to three, and a trusted Vercel client IP to ten. The trusted IP
header is used only when `VERCEL=1`; arbitrary forwarded headers elsewhere are
ignored. See [Vercel request headers](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for).
CORS is a browser boundary, not proof that an HTTP caller is human.

Counters contain rotating HMAC keys and expiry times, never raw IPs/emails;
expired buckets are pruned as requests consume quota. A global counter remains
when a trusted IP is unavailable. Rate and storage failures do not claim that
an opt-in was saved. Storage driver errors are sanitized before the shared
error boundary, so SQL parameters and submitted emails are not attached to
application error logs.

The form uses a POST body, omits cookies and referrers, and never puts an email
in a URL. Only a bounded `utm_campaign` label is retained; full URLs, referrers,
device IDs, and general browsing history are not collected by the feature.
The form and privacy policy explain the purpose and the support-email route
for withdrawing a request. Staff can honor an opt-out in the tracker. Opt-out
is suppression, not erasure; handle access/erasure requests through the
existing support/privacy process rather than treating the status button as
deletion.

## Validation

- `pnpm typecheck` and the production build passed after the final UI and
  privacy changes. The build retains existing dependency `use client` warnings.
- Full `pnpm test`: 826 passed, 58 skipped across 121 passing and 37 skipped
  files, including contract generation checks. Optional database suites were
  not inferred to pass from those skips.
- Dedicated waitlist PostgreSQL run: 30 passed across the waitlist HTTP/unit
  tests and four real database tests. Those cover concurrent deduplication,
  first-touch preservation, opt-out suppression, atomic durable rate limits,
  expiry pruning, 50-row pagination, and stable ordering for tied timestamps.
- Final focused waitlist/privacy checks: 29 passed across two files.
- Landing checks: the five new waitlist tests, four content checks, five legal
  checks, 16 asset checks, and the 26-route production build passed. The new tests exercise the
  actual submission helper's wire shape, failure/retry handling, timeout signal,
  campaign bounds, and accessible SSR/client compilation.
- Browser checks used only a disposable local database. Required consent
  prevented a write; a genuine cross-origin form request saved a normalized
  English/home row. Spanish/iPhone requests preserved the original duplicate
  and saved a distinct Spanish row. The fourth same-email request displayed
  Spanish rate-limit copy, retained email/consent, re-enabled the button, and
  succeeded with another test address. The Spanish form has no page overflow
  at 320px.
- Anonymous tracker access showed no data. A verified fixture account, created
  only in the isolated database with a test-only preview allowlist, signed in
  through Better Auth and returned to a populated tracker. The real owner's
  account and verification state were not changed.
- Browser review confirmed that cancelling an inline opt-out leaves the row
  active, confirming updates status/totals, filters show the matching rows,
  and downloading a filtered page exports only those rows. Signing out removed
  the table and addresses and showed the sign-in link. The tracker DOM carries
  both analytics/replay privacy classes.

Database tests are opt-in and deliberately ignore `DATABASE_URL`:

```sh
RUN_WAITLIST_DB_TESTS=1 \
WAITLIST_TEST_DATABASE_URL=postgresql://waitlist_test:waitlist_test@127.0.0.1:55437/waitlist_test \
pnpm exec vitest run tests/integration/waitlist.database.test.ts tests/unit/waitlist.test.ts
```

They require that exact disposable database name and loopback port. Do not
point them at an ordinary development database. The test container was created
from the already-installed `postgres:18-alpine` image with no image download.

## Stopping point

The temporary app preview server and disposable database container were stopped,
and the landing development server was restarted without its test endpoint
override. The regular local database still needs the additive migration before
the default local form can save sign-ups.

Saved previews in the landing repository's `docs/marketing-assets/previews/`:
`waitlist-home-form.png`, `waitlist-home-success.png`,
`waitlist-spanish-mobile-retry.png`, and `waitlist-tracker-fixture.png`.
All displayed addresses are fictional test fixtures.

Local implementation is present in both repositories. Production activation,
target-environment migration/configuration, real-owner sign-in, and any email
delivery workflow remain separate release work. No private entry, owner email,
or credential is committed in the docs or tests.
