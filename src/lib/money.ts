import Decimal from 'decimal.js'

/**
 * Shared decimal arithmetic for money. Forty significant digits cover the
 * 20-digit portable money contract and sums of bounded native budget vectors.
 * Keep this configuration independent of other Decimal.js consumers.
 * Preserve decimal strings until an existing wire or display boundary needs
 * a number; constructing a Decimal cannot recover precision already lost.
 */
export const MoneyDecimal = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
})
