import { MoneyDecimal } from '@/lib/money'

/** Parse existing native money fields without changing their comma/scale contract. */
export function parseOptionalNativeMoneyDecimal(value: unknown): string | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  const normalized = String(value).replaceAll(',', '')
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null
  try {
    // Decimal validates the exact decimal input without converting it through a
    // binary float or changing the scale retained in the native payload.
    new MoneyDecimal(normalized)
  } catch {
    return null
  }
  return normalized
}

export function requireNativeMoneyDecimal(value: unknown, reject: () => never): string {
  return parseOptionalNativeMoneyDecimal(value) ?? reject()
}

/** Convert a persisted decimal to the number required by the native archive wire contract. */
export function decimalMoneyWireNumber(value: string) {
  try {
    return new MoneyDecimal(value).toNumber()
  } catch {
    // The previous Number conversion produced NaN for malformed persisted
    // values; JSON serialization has always represented that as null.
    return Number.NaN
  }
}
