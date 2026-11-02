import { MoneyDecimal } from '@/lib/money'

/** Billing adapters provide numeric minor units; currency determines the scale. */
export function formatBillingPrice(amount: number, currency: string, locale?: string) {
  const fractionDigits =
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  const majorAmount = new MoneyDecimal(amount).dividedBy(new MoneyDecimal(10).pow(fractionDigits))

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: majorAmount.isInteger() ? 0 : fractionDigits,
  })
  // ECMA-402 accepts exact decimal strings; TypeScript's Intl declarations
  // currently expose only the number/bigint overloads. Avoid losing cents by
  // converting the major-unit string back to a binary float for formatting.
  const formatDecimal = formatter.format as (value: number | bigint | string) => string
  return formatDecimal(majorAmount.toFixed())
}
