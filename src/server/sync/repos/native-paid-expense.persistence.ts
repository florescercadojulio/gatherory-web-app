import { and, eq, inArray } from 'drizzle-orm'

import { db } from '@/db'
import { eventExpense } from '@/db/schema/planning.schema'

import { decodeBudgetArchive } from '../contracts/native-budget-mutation.contract'
import {
  projectPaidExpenseMutation,
  projectPaidExpensesInArchive,
} from '../services/native-paid-expense-projection'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

const encode = (value: unknown) => Buffer.from(JSON.stringify(value), 'utf8').toString('base64')

/** Keep settled expense balances authoritative when older archives are replayed. */
export async function preservePaidExpensesInArchive(
  transaction: Transaction,
  organizationId: string,
  payload: string,
  eventIds?: string[]
) {
  const archive = decodeBudgetArchive(payload)
  if (!archive) return payload
  const filters = [eq(eventExpense.organizationId, organizationId), eq(eventExpense.status, 'paid')]
  if (eventIds) filters.push(inArray(eventExpense.eventId, eventIds))
  const paid = await transaction
    .select()
    .from(eventExpense)
    .where(and(...filters))
  if (!paid.length && !eventIds) return payload

  const expenses = Array.isArray(archive.eventExpenses) ? archive.eventExpenses : []
  archive.eventExpenses = projectPaidExpensesInArchive(expenses, paid, eventIds)
  return encode(archive)
}

export async function preservePaidExpenseMutation(
  transaction: Transaction,
  organizationId: string,
  expenseId: string,
  payload: string
) {
  const [row] = await transaction
    .select({ amount: eventExpense.amount, status: eventExpense.status })
    .from(eventExpense)
    .where(
      and(
        eq(eventExpense.id, expenseId),
        eq(eventExpense.organizationId, organizationId),
        eq(eventExpense.status, 'paid')
      )
    )
    .limit(1)
    .for('update')
  if (!row) return payload
  const incoming = decodeBudgetArchive(payload)
  if (!incoming) return payload
  return encode(projectPaidExpenseMutation(incoming, row))
}

export async function isPaidExpense(
  transaction: Transaction,
  organizationId: string,
  expenseId: string
) {
  const [row] = await transaction
    .select({ id: eventExpense.id })
    .from(eventExpense)
    .where(
      and(
        eq(eventExpense.id, expenseId),
        eq(eventExpense.organizationId, organizationId),
        eq(eventExpense.status, 'paid')
      )
    )
    .limit(1)
    .for('update')
  return !!row
}

export async function hasPaidExpensesForEvent(
  transaction: Transaction,
  organizationId: string,
  eventId: string
) {
  const [row] = await transaction
    .select({ id: eventExpense.id })
    .from(eventExpense)
    .where(
      and(
        eq(eventExpense.organizationId, organizationId),
        eq(eventExpense.eventId, eventId),
        eq(eventExpense.status, 'paid')
      )
    )
    .limit(1)
  return !!row
}
