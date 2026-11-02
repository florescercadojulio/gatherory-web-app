import { expect, test } from 'vitest'

import {
  projectPaidExpenseMutation,
  projectPaidExpensesInArchive,
  type NativePaidExpenseProjectionRow,
} from '@/server/sync/services/native-paid-expense-projection'

const date = new Date('2026-10-30T12:00:00.000Z')
const row = (
  overrides: Partial<NativePaidExpenseProjectionRow> = {}
): NativePaidExpenseProjectionRow => ({
  id: '30000000-0000-4000-8000-000000000001',
  eventId: '10000000-0000-4000-8000-000000000002',
  sourceIdeaId: '20000000-0000-4000-8000-000000000002',
  title: 'Settled expense',
  amount: '123.45',
  category: 'food_and_drink',
  createdAt: date,
  updatedAt: date,
  ...overrides,
})

test('archive projection emits native money/category values and canonical ownership', () => {
  const canonical = row()
  const archive = projectPaidExpensesInArchive(
    [
      {
        id: canonical.id.toUpperCase(),
        eventID: '10000000-0000-4000-8000-000000000099',
        sourceIdeaID: '20000000-0000-4000-8000-000000000099',
        amount: '1.20',
        category: 'other',
        status: 'estimated',
        title: 'Existing title',
      },
    ],
    [canonical]
  ) as Record<string, unknown>[]

  expect(archive).toHaveLength(1)
  expect(archive[0]).toMatchObject({
    id: canonical.id,
    eventID: canonical.eventId,
    sourceIdeaID: canonical.sourceIdeaId,
    amount: 123.45,
    category: 'foodAndDrink',
    status: 'paid',
    title: 'Existing title',
  })
  expect(typeof archive[0].amount).toBe('number')
})

test('archive projection appends canonical paid rows and drops stale paid rows from a scoped archive', () => {
  const canonical = row()
  const appended = projectPaidExpensesInArchive([], [canonical]) as Record<string, unknown>[]
  expect(appended[0]).toMatchObject({
    eventID: canonical.eventId,
    sourceIdeaID: canonical.sourceIdeaId,
    amount: 123.45,
    category: 'foodAndDrink',
    status: 'paid',
  })

  const oldChildId = '10000000-0000-4000-8000-000000000099'
  const movedOut = projectPaidExpensesInArchive(
    [
      {
        id: canonical.id,
        eventID: oldChildId,
        sourceIdeaID: '20000000-0000-4000-8000-000000000099',
        amount: 123.45,
        category: 'foodAndDrink',
        status: 'paid',
      },
    ],
    [],
    [oldChildId]
  )
  expect(movedOut).toEqual([])
})

test('mutation projection preserves the submitted owner while protecting settled money', () => {
  const projected = projectPaidExpenseMutation(
    {
      eventID: '10000000-0000-4000-8000-000000000099',
      sourceIdeaID: '20000000-0000-4000-8000-000000000099',
      amount: 999,
      category: 'food_and_drink',
      status: 'estimated',
    },
    { amount: '123.45', status: 'paid' }
  )

  expect(projected).toMatchObject({
    eventID: '10000000-0000-4000-8000-000000000099',
    sourceIdeaID: '20000000-0000-4000-8000-000000000099',
    amount: 123.45,
    category: 'foodAndDrink',
    status: 'paid',
  })
})
