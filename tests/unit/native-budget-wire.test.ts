import { expect, test } from 'vitest'

import {
  budgetCentsToNativeNumber,
  mergeNativeWorkspaceBudgetFields,
} from '@/server/sync/contracts/native-budget-mutation.contract'

const rootID = '10000000-0000-4000-8000-000000000001'
const childID = '20000000-0000-4000-8000-000000000002'

const encode = (value: unknown) => Buffer.from(JSON.stringify(value), 'utf8').toString('base64')
const decode = (value: string) => JSON.parse(Buffer.from(value, 'base64').toString('utf8'))

test('budget cents project as numeric major units at the native archive boundary', () => {
  expect(budgetCentsToNativeNumber(1)).toBe(0.01)
  expect(budgetCentsToNativeNumber(1234)).toBe(12.34)
  expect(budgetCentsToNativeNumber(99_999_999_999_999)).toBe(999_999_999_999.99)
  expect(budgetCentsToNativeNumber(null)).toBeNull()
})

test('merged archives emit numeric budget values and explicit nulls', () => {
  const incoming = encode({
    mainEventID: rootID,
    mainEventBudgetCap: '250.00',
    timeline: [
      { id: childID, title: 'Child' },
      { id: '30000000-0000-4000-8000-000000000003', budgetCap: null },
    ],
  })
  const merged = decode(
    mergeNativeWorkspaceBudgetFields(incoming, {
      workspaceCap: '1000.00',
      mainAllocation: '250.00',
      childAllocations: new Map([[childID, '12.34']]),
    })!
  )

  expect(merged.workspaceBudgetCap).toBe(1000)
  expect(typeof merged.workspaceBudgetCap).toBe('number')
  expect(merged.mainEventBudgetCap).toBe(250)
  expect(typeof merged.mainEventBudgetCap).toBe('number')
  expect(merged.timeline[0].budgetCap).toBe(12.34)
  expect(typeof merged.timeline[0].budgetCap).toBe('number')
  expect(merged.timeline[1].budgetCap).toBeNull()
  expect(JSON.stringify(merged)).toContain('"workspaceBudgetCap":1000')
})
