import { describe, expect, it } from 'vitest'

import {
  budgetCentsToDecimal,
  decodeNativeBudgetMutationPayload,
  mergeNativeWorkspaceBudgetFields,
  nativeWorkspaceBudgetChanges,
  nativeInitialWorkspaceBudgetIsValid,
  nativeBudgetMutationPayloadSchema,
} from '@/server/sync/contracts/native-budget-mutation.contract'

const rootID = '10000000-0000-4000-8000-000000000001'
const childID = '20000000-0000-4000-8000-000000000002'

describe('native budget mutation contract', () => {
  it('accepts a complete versioned budget vector and normalizes event IDs', () => {
    const value = nativeBudgetMutationPayloadSchema.parse({
      expectedBudgetVersion: 7,
      operation: 'replace_budget',
      workspaceCapCents: 100_000,
      allocations: [
        { eventID: rootID.toUpperCase(), amountCents: 80_000 },
        { eventID: childID.toUpperCase(), amountCents: 20_000 },
      ],
    })

    expect(value.allocations.map(({ eventID }) => eventID)).toEqual([rootID, childID])
  })

  it('rejects duplicate event allocations, over-precision values, and unexpected fields', () => {
    const base = {
      expectedBudgetVersion: 1,
      operation: 'replace_budget',
      workspaceCapCents: 100,
      allocations: [
        { eventID: rootID, amountCents: 80 },
        { eventID: rootID, amountCents: 20 },
      ],
    }

    expect(nativeBudgetMutationPayloadSchema.safeParse(base).success).toBe(false)
    expect(
      nativeBudgetMutationPayloadSchema.safeParse({
        ...base,
        allocations: [{ eventID: childID, amountCents: 100_000_000_000_000 }],
      }).success
    ).toBe(false)
    expect(
      nativeBudgetMutationPayloadSchema.safeParse({ ...base, requestID: crypto.randomUUID() })
        .success
    ).toBe(false)
  })

  it('decodes only valid JSON commands and converts cents without rounding', () => {
    expect(decodeNativeBudgetMutationPayload('{')).toBeNull()
    expect(
      decodeNativeBudgetMutationPayload(
        Buffer.from(
          JSON.stringify({
            expectedBudgetVersion: 0,
            operation: 'replace_budget',
            workspaceCapCents: 100,
            allocations: [{ eventID: rootID, amountCents: 100 }],
          })
        ).toString('base64')
      )?.expectedBudgetVersion
    ).toBe(0)
    expect(
      decodeNativeBudgetMutationPayload(
        JSON.stringify({
          expectedBudgetVersion: 0,
          operation: 'replace_budget',
          workspaceCapCents: null,
          allocations: [{ eventID: rootID, amountCents: 1234 }],
        })
      )?.allocations[0]?.amountCents
    ).toBe(1234)
    expect(budgetCentsToDecimal(1234)).toBe('12.34')
    expect(budgetCentsToDecimal(null)).toBeNull()
    expect(budgetCentsToDecimal(99_999_999_999_999)).toBe('999999999999.99')
    expect(budgetCentsToDecimal(Number.MAX_SAFE_INTEGER)).toBeNull()
  })

  it('preserves canonical budget values when an ordinary archive omits them', () => {
    const current = {
      workspaceCap: '1000.00',
      mainAllocation: '800.00',
      childAllocations: new Map([[childID, '100.00']]),
    }
    const incoming = Buffer.from(
      JSON.stringify({
        title: 'Content-only edit',
        timeline: [{ id: childID, title: 'Child' }],
      })
    ).toString('base64')

    expect(nativeWorkspaceBudgetChanges(incoming, current)).toBe(false)
    const merged = JSON.parse(
      Buffer.from(mergeNativeWorkspaceBudgetFields(incoming, current)!, 'base64').toString('utf8')
    )
    expect(merged.workspaceBudgetCap).toBe(1000)
    expect(merged.mainEventBudgetCap).toBe(800)
    expect(merged.timeline[0].budgetCap).toBe(100)
    expect(
      nativeWorkspaceBudgetChanges(
        Buffer.from(JSON.stringify({ ...merged, workspaceBudgetCap: 1200 })).toString('base64'),
        current
      )
    ).toBe(true)
  })

  it('validates a newly created archive budget before it has a versioned budget entity', () => {
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')
    const base = {
      workspaceBudgetCap: 100,
      mainEventBudgetCap: 75,
      timeline: [{ id: childID, budgetCap: 25 }],
    }
    expect(nativeInitialWorkspaceBudgetIsValid(encode(base))).toBe(true)
    expect(nativeInitialWorkspaceBudgetIsValid(encode({ ...base, mainEventBudgetCap: 76 }))).toBe(
      false
    )
    expect(
      nativeInitialWorkspaceBudgetIsValid(
        encode({ workspaceBudgetCap: null, mainEventBudgetCap: null, timeline: [] })
      )
    ).toBe(true)
    expect(
      nativeInitialWorkspaceBudgetIsValid(
        encode({ workspaceBudgetCap: null, mainEventBudgetCap: 1, timeline: [] })
      )
    ).toBe(false)
  })

  it('uses exact decimal arithmetic for fractional cents and complete allocation sums', () => {
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')
    expect(
      nativeInitialWorkspaceBudgetIsValid(
        encode({
          workspaceBudgetCap: 0.3,
          mainEventBudgetCap: 0.1,
          timeline: [{ id: childID, budgetCap: 0.2 }],
        })
      )
    ).toBe(true)

    const allocations = Array.from({ length: 100 }, (_, index) => ({
      id: `child-${index}`,
      budgetCap: '0.01',
    }))
    expect(
      nativeInitialWorkspaceBudgetIsValid(
        encode({ workspaceBudgetCap: '1.00', mainEventBudgetCap: '0.00', timeline: allocations })
      )
    ).toBe(true)
    expect(
      nativeInitialWorkspaceBudgetIsValid(
        encode({ workspaceBudgetCap: '0.99', mainEventBudgetCap: '0.00', timeline: allocations })
      )
    ).toBe(false)
  })

  it('keeps archive amount lexical validation strict at cent boundaries', () => {
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')
    for (const invalid of ['0.001', ' 0.10', '0.10\n', '+0.10', '01.00', '1e2']) {
      expect(
        nativeInitialWorkspaceBudgetIsValid(
          encode({ workspaceBudgetCap: '1.00', mainEventBudgetCap: invalid, timeline: [] })
        )
      ).toBe(false)
    }
    expect(budgetCentsToDecimal(1)).toBe('0.01')
    expect(budgetCentsToDecimal(99_999_999_999_999)).toBe('999999999999.99')
  })
})
