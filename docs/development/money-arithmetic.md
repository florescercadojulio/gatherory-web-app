# Money arithmetic

Reviewed November 2, 2026. Application money calculations use Decimal.js through
`src/lib/money.ts`. This is an arithmetic change; persisted units, currency rules,
native capabilities, and API shapes remain the same.

## Implementation map

| Concern                    | Owning code                                                                                                                 | Decimal behavior                                                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared configuration       | `src/lib/money.ts`                                                                                                          | Independent `MoneyDecimal` constructor with 40 significant digits and explicit half-up rounding.                                                      |
| Native budget contract     | `src/server/sync/contracts/native-budget-mutation.contract.ts`                                                              | Major-unit normalization, cent conversion, and initial allocation conservation.                                                                       |
| Atomic budget persistence  | `src/server/sync/repos/native-budget.persistence.ts`                                                                        | Exact allocation sums and comparisons against canonical amounts and the cap. Existing locks, permissions, and transaction ownership are retained.     |
| Native money parsing       | `src/server/sync/services/native-money.ts` and `src/server/sync/repos/native-materializer.persistence.ts`                   | Parse with Decimal after existing lexical validation; preserve decimal strings and their scale. Required expense failures retain their existing code. |
| Child-only sync projection | `src/server/sync/repos/scoped-event-sync.persistence.ts`                                                                    | Convert the canonical budget through Decimal at the existing numeric archive boundary.                                                                |
| Paid-expense projection    | `src/server/sync/services/native-paid-expense-projection.ts` and `src/server/sync/repos/native-paid-expense.persistence.ts` | Emit numeric native amounts and native category names while retaining settled balances and canonical archive ownership.                               |
| Browser summaries          | `src/server/sync/repos/native-insights.repo.ts`                                                                             | Sum expense strings as decimals before emitting the existing numeric summary.                                                                         |
| Budget progress            | `src/components/workspaces/workspace-overview-content.tsx`                                                                  | Calculate and cap the percentage as a decimal, converting only the final progress value to a number.                                                  |
| Billing price display      | `src/lib/billing-price.ts` and `src/components/auth/billing/billing-settings.tsx`                                           | Convert minor units using the currency exponent and pass an exact decimal string to Intl formatting.                                                  |

The [Decimal.js API](https://mikemcl.github.io/decimal.js/#clone) supports the
independently configured constructor used here. Forty significant digits cover
the 20-digit portable money contract and the
100-entry bounded native budget vector. The constructor is isolated from
Decimal.js's global configuration. Keep amounts as strings or decimals during
calculation; constructing a Decimal from an already rounded JavaScript number
cannot recover lost digits. Do not use arithmetic precision as permission to
accept amounts beyond a boundary's existing storage or transport limits.

## Compatibility

- PostgreSQL money columns remain `numeric(14, 2)` with string values in Drizzle.
- Native budget commands still use bounded integer-cent JSON numbers. Archive
  and entity money fields use numeric major units or explicit null, as required
  by Foundation Decimal Codable. Database decimal strings are converted only at
  this wire boundary; Decimal instances never cross it.
- New portable prices still use canonical integer minor-unit strings plus a
  currency. No currency conversion or universal two-decimal assumption is added.
- Native comma removal, null/omitted fields, required-value failures, and stored
  string scale remain compatible. The
  summary parser still trims surrounding whitespace; strict native amount
  parsers still reject it. The portable `MoneySchema` is unchanged.
- Paid expenses keep their canonical decimal amounts in persistence and project
  them as native JSON numbers. Database `food_and_drink` becomes native
  `foodAndDrink`; scoped projections exclude paid records moved to another event.
  Money literals, schema declarations, and contracts without arithmetic remain
  unchanged.
- The billing formatter uses the standard exact-string Intl overload, with a
  local type declaration because the installed TypeScript Intl overload omits
  string inputs. Its tests cover USD, JPY, KWD, and safe-integer amounts whose
  final cent would be lost by converting major units to a binary float.
  See [Intl exact-string formatting](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/format#using_format_with_a_string).

The source audit covered `src/` and `scripts/`, including MCP, Blueprint
projection, workspace creation, fixtures, and billing. Count, time, usage-limit,
and discovery-ranking arithmetic remains ordinary JavaScript arithmetic.

## Verification

Focused regressions cover `0.1 + 0.2`, 100-entry conservation and over-cap
rejection, large values, strict cent formats, null/invalid values, legacy parsing,
required expense failures, child projections, progress limits, and currency
exponents. They live in:

- `tests/unit/native-budget-mutation-contract.test.ts`
- `tests/unit/native-money-projection.test.ts`
- `tests/unit/native-insights-money.test.ts`
- `tests/unit/workspace-overview-render.test.ts`
- `tests/unit/billing-price.test.ts`
- `tests/unit/native-budget-wire.test.ts`
- `tests/unit/native-paid-expense-projection.test.ts`
- `tests/unit/native-sync-ordering.test.ts`
- `tests/integration/native-budget-sync.database.test.ts`

Local verification on November 2, 2026:

- `pnpm typecheck`: passed.
- `pnpm test`, including generated contract freshness: 962 passed, 74 skipped;
  155 test files passed and 46 skipped.
- Targeted source/test Prettier checks and `git diff --check`: passed.

Native budget database acceptance was also enabled against a new disposable
local PostgreSQL 18 database: all eight tests pass. Checked-in migrations were
applied only to that empty test container; no shared data was used. Other
database, HTTP, and R2 tests still require their explicit opt-ins and were not
enabled. See [shared budget sync](team-budget-sync.md#native-interoperability-follow-up--november-2-2026)
for the rehome/deletion/budget dependency acceptance.
No migration, seed, production build, or deployment is needed for this change.
