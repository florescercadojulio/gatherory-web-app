import { z } from 'zod'
import { MoneyDecimal } from '@/lib/money'

const eventID = z.uuid().transform((value) => value.toLowerCase())
const budgetVersion = z.number().int().nonnegative()
const maxCents = 99_999_999_999_999
const cents = z.number().int().nonnegative().safe().max(maxCents)

/**
 * Budget writes are commands rather than event/archive field replacements.
 * Amounts use integer cents so a retry cannot change value through float
 * serialization. A null allocation/cap clears the optional value. Each
 * command replaces the complete budget vector so the server can validate
 * conservation and commit every balance as one operation.
 */
export const nativeBudgetMutationPayloadSchema = z
  .object({
    expectedBudgetVersion: budgetVersion,
    operation: z.literal('replace_budget'),
    allocations: z
      .array(z.object({ eventID, amountCents: cents.nullable() }).strict())
      .min(1)
      .max(100),
    workspaceCapCents: cents.nullable(),
  })
  .strict()
  .superRefine((payload, context) => {
    const ids = payload.allocations.map(({ eventID }) => eventID)
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: 'custom', message: 'Allocation event IDs must be unique' })
    }
  })

export type NativeBudgetMutationPayload = z.infer<typeof nativeBudgetMutationPayloadSchema>

export function decodeNativeBudgetMutationPayload(payload: string) {
  let decoded: unknown
  try {
    decoded = JSON.parse(payload)
  } catch {
    try {
      decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
    } catch {
      return null
    }
  }
  const result = nativeBudgetMutationPayloadSchema.safeParse(decoded)
  return result.success ? result.data : null
}

export function decodeBudgetArchive(payload: string): Record<string, unknown> | null {
  for (const source of [payload, Buffer.from(payload, 'base64').toString('utf8')]) {
    try {
      const value: unknown = JSON.parse(source)
      if (value && typeof value === 'object' && !Array.isArray(value))
        return value as Record<string, unknown>
    } catch {
      // Try the other supported workspace payload encoding.
    }
  }
  return null
}

function comparableMoney(value: unknown): string | null {
  if (value == null || value === '') return null
  const raw = typeof value === 'number' ? String(value) : typeof value === 'string' ? value : ''
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(raw)
  if (!match) return `invalid:${raw}`
  return new MoneyDecimal(raw).toFixed(2)
}

function budgetArchiveMoneyToWire(value: unknown) {
  const comparable = comparableMoney(value)
  if (comparable === null) return null
  if (comparable.startsWith('invalid:')) return value
  return new MoneyDecimal(comparable).toNumber()
}

export type NativeWorkspaceBudgetValues = {
  workspaceCap: string | null
  mainAllocation: string | null
  childAllocations: ReadonlyMap<string, string | null>
}

export function nativeWorkspaceBudgetChanges(
  incomingPayload: string,
  current: NativeWorkspaceBudgetValues
) {
  const incoming = decodeBudgetArchive(incomingPayload)
  if (!incoming) return true
  if (
    Object.hasOwn(incoming, 'workspaceBudgetCap') &&
    comparableMoney(incoming.workspaceBudgetCap) !== comparableMoney(current.workspaceCap)
  )
    return true
  if (
    Object.hasOwn(incoming, 'mainEventBudgetCap') &&
    comparableMoney(incoming.mainEventBudgetCap) !== comparableMoney(current.mainAllocation)
  )
    return true
  const timeline = Array.isArray(incoming.timeline) ? incoming.timeline : []
  return timeline.some((value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false
    const child = value as Record<string, unknown>
    if (!Object.hasOwn(child, 'budgetCap')) return false
    const id = typeof child.id === 'string' ? child.id.toLowerCase() : null
    return (
      comparableMoney(child.budgetCap) !==
      comparableMoney(id ? current.childAllocations.get(id) : null)
    )
  })
}

function archiveMoneyToCents(value: unknown) {
  if (value == null || value === '') return new MoneyDecimal(0)
  const money = comparableMoney(value)
  if (!money || money.startsWith('invalid:')) return null
  return new MoneyDecimal(money).mul(100)
}

/** Validates the one-time budget bootstrap carried by a newly created archive. */
export function nativeInitialWorkspaceBudgetIsValid(incomingPayload: string) {
  const incoming = decodeBudgetArchive(incomingPayload)
  if (!incoming) return false
  const hasAnyBudgetField =
    Object.hasOwn(incoming, 'workspaceBudgetCap') ||
    Object.hasOwn(incoming, 'mainEventBudgetCap') ||
    (Array.isArray(incoming.timeline) &&
      incoming.timeline.some(
        (value) =>
          !!value && typeof value === 'object' && !Array.isArray(value) && 'budgetCap' in value
      ))
  if (!hasAnyBudgetField) return true

  const cap = archiveMoneyToCents(incoming.workspaceBudgetCap)
  const main = archiveMoneyToCents(incoming.mainEventBudgetCap)
  if (cap === null || main === null) return false
  let total = main
  for (const value of Array.isArray(incoming.timeline) ? incoming.timeline : []) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue
    const amount = archiveMoneyToCents((value as Record<string, unknown>).budgetCap)
    if (amount === null) return false
    total = total.plus(amount)
  }
  return cap.isZero() ? total.isZero() : total.lessThanOrEqualTo(cap)
}

export function mergeNativeWorkspaceBudgetFields(
  incomingPayload: string,
  current: NativeWorkspaceBudgetValues
) {
  const archive = decodeBudgetArchive(incomingPayload)
  if (!archive) return null
  if (!Object.hasOwn(archive, 'workspaceBudgetCap'))
    archive.workspaceBudgetCap = current.workspaceCap
  if (!Object.hasOwn(archive, 'mainEventBudgetCap'))
    archive.mainEventBudgetCap = current.mainAllocation
  archive.workspaceBudgetCap = budgetArchiveMoneyToWire(archive.workspaceBudgetCap)
  archive.mainEventBudgetCap = budgetArchiveMoneyToWire(archive.mainEventBudgetCap)
  const timeline = Array.isArray(archive.timeline) ? archive.timeline : []
  archive.timeline = timeline.map((value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value
    const child = value as Record<string, unknown>
    if (Object.hasOwn(child, 'budgetCap'))
      return { ...child, budgetCap: budgetArchiveMoneyToWire(child.budgetCap) }
    const id = typeof child.id === 'string' ? child.id.toLowerCase() : null
    return {
      ...child,
      budgetCap: budgetArchiveMoneyToWire(id ? (current.childAllocations.get(id) ?? null) : null),
    }
  })
  return Buffer.from(JSON.stringify(archive), 'utf8').toString('base64')
}

export function nativeWorkspaceBudgetChanged(previousPayload: string, incomingPayload: string) {
  const previous = decodeBudgetArchive(previousPayload)
  const incoming = decodeBudgetArchive(incomingPayload)
  if (!previous || !incoming) return true
  if (
    Object.hasOwn(incoming, 'workspaceBudgetCap') &&
    comparableMoney(previous.workspaceBudgetCap) !== comparableMoney(incoming.workspaceBudgetCap)
  )
    return true
  if (
    Object.hasOwn(incoming, 'mainEventBudgetCap') &&
    comparableMoney(previous.mainEventBudgetCap) !== comparableMoney(incoming.mainEventBudgetCap)
  )
    return true
  const previousTimeline = Array.isArray(previous.timeline) ? previous.timeline : []
  const incomingTimeline = Array.isArray(incoming.timeline) ? incoming.timeline : []
  const previousByID = new Map(
    previousTimeline.flatMap((value) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return []
      const event = value as Record<string, unknown>
      const id = typeof event.id === 'string' ? event.id.toLowerCase() : null
      return id ? [[id, event] as const] : []
    })
  )
  return incomingTimeline.some((value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false
    const event = value as Record<string, unknown>
    if (!Object.hasOwn(event, 'budgetCap')) return false
    const id = typeof event.id === 'string' ? event.id.toLowerCase() : null
    return (
      comparableMoney(previousByID.get(id ?? '')?.budgetCap) !== comparableMoney(event.budgetCap)
    )
  })
}

export function nativeEventBudgetChanged(previous: unknown, incoming: unknown) {
  return comparableMoney(previous) !== comparableMoney(incoming)
}

export function budgetCentsToDecimal(value: number | null) {
  if (value === null) return null
  if (!Number.isSafeInteger(value) || value < 0 || value > maxCents) return null
  return new MoneyDecimal(value).div(100).toFixed(2)
}

/** Convert cents to the JSON number used by the existing native archive wire format. */
export function budgetCentsToNativeNumber(value: number | null) {
  const decimal = budgetCentsToDecimal(value)
  return decimal === null ? null : new MoneyDecimal(decimal).toNumber()
}
