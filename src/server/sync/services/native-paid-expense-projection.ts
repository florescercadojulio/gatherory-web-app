import { decimalMoneyWireNumber } from './native-money'

export type NativePaidExpenseProjectionRow = {
  id: string
  eventId: string
  sourceIdeaId: string | null
  title: string
  amount: string
  category: string
  createdAt: Date
  updatedAt: Date
}

function nativeExpenseCategory(category: unknown) {
  return category === 'food_and_drink' || category === 'food_drink' ? 'foodAndDrink' : category
}

function archivedPaidExpense(row: NativePaidExpenseProjectionRow) {
  return {
    id: row.id,
    eventID: row.eventId,
    sourceIdeaID: row.sourceIdeaId,
    title: row.title,
    amount: decimalMoneyWireNumber(row.amount),
    category: nativeExpenseCategory(row.category),
    status: 'paid',
    createdAt: row.createdAt.getTime() / 1000 - 978_307_200,
    updatedAt: row.updatedAt.getTime() / 1000 - 978_307_200,
  }
}

/** Project canonical paid rows into the existing native archive wire shape. */
export function projectPaidExpensesInArchive(
  expenses: unknown[],
  paidRows: NativePaidExpenseProjectionRow[],
  eventIds?: readonly string[]
) {
  const paidById = new Map(paidRows.map((row) => [row.id.toLowerCase(), row]))
  const presentIDs = new Set<string>()
  const scopedEventIds = eventIds ? new Set(eventIds.map((id) => id.toLowerCase())) : null
  const result: unknown[] = []

  for (const value of expenses) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      result.push(value)
      continue
    }
    const expense = value as Record<string, unknown>
    const id = typeof expense.id === 'string' ? expense.id.toLowerCase() : null
    const row = id ? paidById.get(id) : undefined
    if (row && id) {
      presentIDs.add(id)
      // The database owns the current event and source-idea links. This keeps
      // an old archive from reattaching a rehomed paid expense to its former child.
      result.push({
        ...expense,
        id: row.id,
        eventID: row.eventId,
        sourceIdeaID: row.sourceIdeaId,
        amount: decimalMoneyWireNumber(row.amount),
        category: nativeExpenseCategory(row.category),
        status: 'paid',
      })
      continue
    }

    const ownerId =
      typeof expense.eventID === 'string'
        ? expense.eventID.toLowerCase()
        : typeof expense.eventId === 'string'
          ? expense.eventId.toLowerCase()
          : null
    if (expense.status === 'paid' && ownerId && scopedEventIds?.has(ownerId)) continue
    result.push(value)
  }

  for (const row of paidRows) {
    const id = row.id.toLowerCase()
    if (!presentIDs.has(id)) result.push(archivedPaidExpense(row))
  }
  return result
}

/** Protect the settled amount/status in an entity payload while keeping its submitted owner. */
export function projectPaidExpenseMutation(
  incoming: Record<string, unknown>,
  row: { amount: string; status: string }
) {
  return {
    ...incoming,
    amount: decimalMoneyWireNumber(row.amount),
    status: 'paid',
    ...(Object.hasOwn(incoming, 'category')
      ? { category: nativeExpenseCategory(incoming.category) }
      : {}),
  }
}
