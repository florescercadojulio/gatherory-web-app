# API and MCP contract conventions

Adopted October 15, 2026. These conventions apply to blueprint contracts now
and to new public API/MCP contracts going forward. They do not silently change
existing native replication formats or introduce billing or an MCP server.

## One contract across transports

Maintain validation in `src/contracts/`; generate the checked-in JSON Schemas
with `pnpm contracts:generate`. Future OpenAPI operations and MCP tool inputs
and outputs must reuse these contracts, not invent different limits or units.
Run `pnpm contracts:check`, contract tests and typecheck when changing them.

JSON Schema describes structural rules. Authorization, supported currencies,
cross-field invariants, request size, nesting limits and idempotency still need
server enforcement. Generated schema validation never replaces domain workflows.
If a runtime refinement affects structural acceptance, export its equivalent
JSON Schema rule where possible and test both. In particular, known executable
modules cannot fall through to the permissive optional-module branch.

## Text: explicit character limits

Every free-form string and object property name needs a finite maximum and an
explicit minimum. Use `minLength` / `maxLength`, not SQL `CHAR(n)`, byte counts,
or token estimates. Literal and enum fields already declare finite values.
Formatting rules (UUID, URL, hash, currency code, timestamp) supplement limits;
they do not replace them. Reject excess content rather than silently truncate it.

Count **Unicode code points** in both runtime validation and JSON Schema. A
single `😀` counts as one; decomposed `e` + combining acute counts as two. This
is neither JavaScript UTF-16 `.length` nor Swift grapheme-cluster `String.count`.
Swift implementations should count `unicodeScalars`; JavaScript can iterate the
string. See the [JSON Schema string specification](https://github.com/json-schema-org/json-schema-spec/blob/main/specs/jsonschema-validation.md)
and [Zod JSON Schema metadata](https://zod.dev/json-schema).

Use `characterString(minChars, maxChars, trim)` in
`src/contracts/content-primitives.ts` for Unicode text. It enforces code-point
length and exports matching schema bounds. Most names/notes trim surrounding
whitespace before validation; discovery summaries and opaque configuration
preserve authored whitespace. JSON Schema validates the normalized payload; it
does not perform trimming. Do not silently apply Unicode normalization to
published content, because it can change source hashes.

Current limits:

| Content | Maximum characters |
| --- | ---: |
| Blueprint/package names and opaque identifiers | 160 |
| Event names, idea titles and instruction titles | 120 |
| Idea notes | 2,000 |
| Instruction bodies and opaque configuration string values | 5,000 |
| Discovery summaries | 500 |
| Discovery tags, stable keys and time-zone names | 100 |
| Permission/capability keys | 120 |
| Opaque configuration property names | 160 |
| Schema URLs | 2,048 |
| RFC 3339 installation timestamps | 29 |

Private authoring uses the narrower 120-character name limit, a 2,000-character
description, and the existing activity/idea/instruction limits. Its create,
save, publish and content schemas are exported separately. Catalog summaries
are display excerpts (first 500 code points) of the immutable full description;
authoring never silently truncates the stored description. The child source key
`main` is reserved to prevent aliasing the installed root event.

Required names/titles/body text have minimum one after trimming; optional notes
and summaries permit an empty string. Optional and nullable are separate choices,
not synonyms for empty. UUIDs are exactly 36 characters, SHA-256 hashes 64,
schedule clock values 5, currency codes 3 and country codes 2. Keep constants
named `...Chars` distinct from collection counts and `serializedBytes`.
The executable blueprint's separate 256 KiB serialized-byte ceiling still applies.
Opaque optional modules have recursively bounded JSON strings; introducing a new
executable module requires typed fields with their own narrower limits.

## Dates, time zones and Temporal

The server runtime is Node.js 26 or later, with native Temporal required for
blueprint schedule validation. The package engine and CI test runtime declare
this requirement; deployed runtimes must match it. Node 26 enables Temporal by
default ([Node release notes](https://nodejs.org/en/blog/release/v26.0.0/)). Do not
assume that this implies browser support or availability in every edge runtime.

Treat these as different kinds of data:

| Meaning | Wire representation | Server representation |
| --- | --- | --- |
| Confirmed instant | RFC 3339 string with seconds and `Z` or an explicit offset | `Temporal.Instant` |
| Event's civil-time context | Separate named IANA zone, e.g. `America/Detroit` | `Temporal.ZonedDateTime` |
| Calendar-only date | `YYYY-MM-DD`, no invented midnight or zone | `Temporal.PlainDate` |
| Wall-clock proposal | Local date/time plus named zone; not yet an instant | `Temporal.PlainDateTime`, resolved explicitly |
| Schedule clock proposal | `HH:mm` paired with calendar-date rules | `Temporal.PlainTime` |

Blueprint installation currently accepts **confirmed instants**, not floating
local input. `ConfirmedInstantSchema` is browser-safe and validates real RFC 3339
dates with 0–3 fractional-second digits. Reject local strings without an offset,
date-only values in an instant field, leap seconds, unknown offset `-00:00`, and
sub-millisecond precision. Current `Date`/database/native adapters preserve
milliseconds; accepting extra precision would silently change the reviewed time.
Date-only values remain a convention for future fields. Schedule suggestions
now return wall-clock `localDateTime` values, but these are not installation
inputs and must never be interpreted using the device's default zone.

The server-only `confirmed-schedule.server.ts` validates each main/child instant
against the event's named zone. A `Z` value identifies a UTC instant and is
projected into the zone. A non-Z offset asserts a local wall time and must agree
with that zone's rules on that date. Fixed-offset zone identifiers such as
`+05:00` are not substitutes for an event's IANA zone; `UTC` remains valid.

Use `offset: 'reject'`, `disambiguation: 'reject'` and `overflow: 'reject'` when
resolving wall-clock input. Spring-forward gaps and skipped dates must produce
an error instead of moving the time. During a fall-back overlap, either valid
explicit offset identifies a confirmed occurrence; do not silently choose
earlier/later when the caller supplied neither. See
[Temporal's timezone guidance](https://tc39.es/proposal-temporal/docs/timezone.html).

Relative blueprint schedule proposals remain suggestions requiring confirmation.
The authenticated, read-only `POST /api/blueprints/schedule` endpoint expands
the pinned revision using `dayOffset` arithmetic on calendar dates in the event
zone, then combines the proposed clock time and resolves explicitly. It returns
`suggested` (one UTC candidate), `ambiguous` (two candidates, earliest first),
`nonexistent` (no candidate), or `manual` (no proposal). Local date/time strings
have exactly 19 characters; candidate instants use the confirmed-instant schema.
Clients must explicitly confirm a candidate or manually choose another instant.
Never send a local proposal directly to installation. See
[date-aware native setup](../roadmaps/blueprints-roadmap/08-date-aware-setup.md).

One calendar day is not necessarily 24 elapsed hours. Use duration arithmetic
for elapsed leases/timeouts; do not replace it with calendar arithmetic.

Preserve reviewed timestamp strings, event zones and idempotency hashes. Use
`Date` only where an existing persistence/transport API requires it, after
validation, and do not change native epoch encoding, retry timestamps or sync
transactions as part of scheduling cleanup. Server OS timezone, browser locale
and the viewer's current zone must never silently replace the event's zone.

### Browser and SSR boundary

- Shared contracts serialize strings and contain no native Temporal calls.
  `src/server/blueprints/planning/confirmed-schedule.server.ts` is protected by
  TanStack's server-only marker. A directory called `server` alone is not an
  execution boundary; route loaders are not automatically server-only.
- Browsers can display validated instants with `Intl.DateTimeFormat` and an
  explicit zone. Do not parse `YYYY-MM-DD` as a JavaScript `Date` to display a
  calendar-only date, and do not use `new Date(localString)` to resolve an event
  wall time using the viewer's system zone.
- If a future client editor needs Temporal arithmetic, use a shared lazy-loaded
  compatibility adapter: feature-detect the needed Temporal classes and load a
  vetted polyfill when absent, or ask the server to resolve proposals. Never
  silently fall back to `Date` arithmetic. No browser polyfill is needed or
  installed for the current blueprint client; calendar reasoning is server-side.
- Keep SSR and initial hydration formatting deterministic using an explicit
  locale and zone. Read viewer-local preferences after hydration if needed.
- Keep timezone data current on the authoritative server. Revalidate proposed
  future times at confirmation; never silently rewrite existing confirmed
  events when timezone rules or the viewer's location change.

`tests/unit/blueprint-schedule.test.ts` covers DST gaps/overlaps, half-hour DST,
skipped dates, quarter-hour offsets, leap dates, invalid/offset-only zones,
precision, child schedules and contracts running without global Temporal.

## Money: integer minor-unit strings

Use the shared `MoneySchema` and `contracts/schemas/money.v1.schema.json`:

```json
{ "amountMinor": "10000", "currency": "USD" }
```

| USD amount | `amountMinor` |
| --- | --- |
| $0.00 | `"0"` |
| $0.01 | `"1"` |
| $1.00 | `"100"` |
| $100.00 | `"10000"` |
| $1,000.00 | `"100000"` |

- `amountMinor` is a canonical nonnegative ASCII digit string, 1–20 digits.
  Reject JSON numbers, decimal points, signs, exponent notation, surrounding
  whitespace, trailing newlines and leading zeroes except the single `"0"`.
- `currency` is required and has exactly three uppercase letters. The shared
  schema checks its shape; each operation must enforce its supported ISO 4217
  currency allowlist and corresponding minor-unit exponent. Do not assume every
  currency has two decimal places.
- The envelope is strict. Do not accept an ambiguous `amount` field alongside
  `amountMinor`, guess units from the value, or accept both old and new units.
- The 20-digit limit is a transport bound, not a promise that billing providers
  or storage support every such amount. Apply narrower business/provider bounds
  before converting or charging.
- Keep exact integer/decimal arithmetic internally (for example `BigInt` in
  TypeScript). Do not use `Number(amountMinor)` or multiply binary floating-point
  display values by 100. Serialize integer results back to strings; format a
  localized major-unit value only at the UI boundary.
- This money type models nonnegative prices. Future signed adjustments/refunds
  need an explicitly named, documented contract rather than weakening this one.

## Compatibility and current scope

The blueprint-linked **draft service-package** contract now uses `amountMinor`
for starting, additional-guest and add-on prices. The examples retain the same
economic amounts: the previous USD `"18500.00"` becomes `"1850000"`. These are
pre-release contract examples, not deployed billing data. The draft v1 schema
and fixtures were updated together; old decimal-price envelopes are rejected.

Do not apply this replacement directly to existing event budgets, expense
columns, native archives, outbox payloads or published client contracts. Those
formats retain their current units. Any future bridge needs an explicit unit
conversion, currency-specific exponent, exact round-trip tests and versioned
rollout where consumers already exist. Never reinterpret stored `"100"` from a
major-unit contract as one dollar.

No database migration, seed or transaction change is required for these contract
updates. The Wedding definition, pinned hash and native installation fixtures
remain unchanged. Before publishing a schema externally, freeze field names and
units; subsequent unit/shape changes require a versioned compatibility plan.

Regression coverage lives in
`tests/contracts/blueprint-content-conventions.test.ts`: exact boundaries,
emoji/combining characters, recursive configuration, typed-module fallback,
canonical money, precision above the JS safe-integer range, all package price
branches, and a generated-schema audit for unbounded string fields.
