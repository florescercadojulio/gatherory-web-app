import { expect, test } from 'vitest'

import {
  decimalMoneyWireNumber,
  parseOptionalNativeMoneyDecimal,
  requireNativeMoneyDecimal,
} from '@/server/sync/services/native-money'
import { buildScopedEventArchive } from '@/server/sync/services/scoped-event-projection'

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')
const decode = (value: string) => JSON.parse(Buffer.from(value, 'base64').toString('utf8'))

test('native materializer validates decimal money exactly and retains accepted scale', () => {
  expect(parseOptionalNativeMoneyDecimal('9007199254740993.20')).toBe('9007199254740993.20')
  expect(parseOptionalNativeMoneyDecimal('1,234.500')).toBe('1234.500')
  expect(parseOptionalNativeMoneyDecimal('1.00\n')).toBeNull()
  expect(parseOptionalNativeMoneyDecimal(0.30000000000000004)).toBe('0.30000000000000004')

  for (const invalid of [null, undefined, '', ' 1.00', '-1.00', '1e2', '1.2.3', Number.NaN]) {
    expect(parseOptionalNativeMoneyDecimal(invalid)).toBeNull()
  }

  expect(() =>
    requireNativeMoneyDecimal('not-money', () => {
      throw new Error('EXPENSE_AMOUNT_MISSING')
    })
  ).toThrow('EXPENSE_AMOUNT_MISSING')
})

test('scoped event projections keep persisted decimal strings and emit number wire values', () => {
  const preciseAmount = '123456789012.34'
  const snapshot = {
    mainEventID: '10000000-0000-4000-8000-000000000001',
    timeline: [
      {
        id: '10000000-0000-4000-8000-000000000002',
        parentEventID: '10000000-0000-4000-8000-000000000001',
        title: 'Child',
        budgetCap: preciseAmount,
      },
    ],
  }
  const scoped = buildScopedEventArchive({
    snapshotPayload: encode(snapshot),
    entities: [],
    eventId: '10000000-0000-4000-8000-000000000002',
  })

  expect(scoped).not.toBeNull()
  const archive = decode(scoped!)
  expect(archive.mainEventBudgetCap).toBe(preciseAmount)
  expect(archive.scopedEvent.budgetCap).toBe(preciseAmount)

  const wireAmount = decimalMoneyWireNumber(preciseAmount)
  expect(typeof wireAmount).toBe('number')
  expect(String(wireAmount)).toBe(preciseAmount)
  expect(Number.isNaN(decimalMoneyWireNumber('not-money'))).toBe(true)
})
