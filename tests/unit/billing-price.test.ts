import { expect, test } from 'vitest'

import { formatBillingPrice } from '@/lib/billing-price'

test('billing prices respect currency exponents and omit unnecessary fraction digits', () => {
  expect(formatBillingPrice(100, 'USD', 'en-US')).toBe('$1')
  expect(formatBillingPrice(101, 'USD', 'en-US')).toBe('$1.01')
  expect(formatBillingPrice(0, 'USD', 'en-US')).toBe('$0')
  expect(formatBillingPrice(1234, 'JPY', 'en-US')).toBe('¥1,234')
  expect(formatBillingPrice(1234, 'KWD', 'en-US')).toBe('KWD\u00a01.234')
})

test('billing prices retain the last minor unit for safe integer amounts', () => {
  expect(formatBillingPrice(9_007_199_254_740_991, 'USD', 'en-US')).toBe('$90,071,992,547,409.91')
  expect(formatBillingPrice(9_007_199_254_740_991, 'KWD', 'en-US')).toBe(
    'KWD\u00a09,007,199,254,740.991'
  )
})
