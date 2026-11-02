import { describe, expect, test } from 'vitest'
import { Effect } from 'effect'

import { queryNativeWorkspaceInsights } from '@/server/sync/repos/native-insights.repo'

function fakeDatabase(queryResults: unknown[][]) {
  let queryIndex = 0
  return {
    select: () => {
      const rows = queryResults[queryIndex++] ?? []
      const queryEffect = Effect.succeed(rows)
      const executable = {
        [Symbol.iterator]: () => queryEffect[Symbol.iterator](),
        orderBy: () => queryEffect,
      }
      const builder = {
        from: () => builder,
        innerJoin: () => builder,
        leftJoin: () => builder,
        where: () => executable,
      }
      return builder
    },
  }
}

function mainEvent(budgetCap: unknown = '300') {
  const now = new Date('2026-11-01T12:00:00Z')
  return {
    id: 'root-event',
    organizationId: 'workspace',
    workspaceName: 'Workspace',
    title: 'Event',
    startsAt: now,
    endsAt: null,
    isAllDay: false,
    timeZone: 'America/Detroit',
    locationName: null,
    locationAddress: null,
    status: 'ongoing',
    updatedAt: now,
    budgetCap,
  }
}

async function insightForExpenses(amounts: unknown[], budgetCap?: unknown) {
  const db = fakeDatabase([
    [mainEvent(budgetCap)],
    [],
    [],
    [],
    amounts.map((amount) => ({ eventId: 'root-event', amount })),
  ])
  const result = await Effect.runPromise(queryNativeWorkspaceInsights(db as never, 'planner'))
  return result.workspaces[0]!
}

describe('native workspace insight money', () => {
  test('sums decimal expense values exactly and ignores null or invalid amounts', async () => {
    const workspace = await insightForExpenses([0.1, 0.2, null, 'not money', '', Number.NaN])

    expect(workspace.trackedCost).toBe(0.3)
  })

  test('retains small amounts when summing large expense totals', async () => {
    const workspace = await insightForExpenses([
      '999999999999.99',
      '999999999999.99',
      '999999999999.99',
    ])

    expect(workspace.trackedCost).toBe(2999999999999.97)
  })

  test('keeps invalid or null budget values absent', async () => {
    const invalidBudget = await insightForExpenses([], 'not money')
    const nullBudget = await insightForExpenses([], null)

    expect(invalidBudget.budgetCap).toBeNull()
    expect(nullBudget.budgetCap).toBeNull()
  })

  test('retains trimmed legacy amount and budget handling', async () => {
    const workspace = await insightForExpenses([' 0.10 ', '\n0.20'], ' 1.00 ')

    expect(workspace.trackedCost).toBe(0.3)
    expect(workspace.budgetCap).toBe(1)
  })
})
