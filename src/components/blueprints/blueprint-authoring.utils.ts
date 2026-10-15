import type { BlueprintDraftContent } from '@/contracts/blueprint-authoring.contracts'

export type BlueprintTarget = BlueprintDraftContent['ideas'][number]['target']
export type BlueprintCreatePayload = {
  organizationId: string
  content: BlueprintDraftContent
  source?: { catalogKey: string; revision: number }
}
export type BlueprintCreateAttempt = BlueprintCreatePayload & { requestId: string }

export function matchesCreateAttempt(
  attempt: BlueprintCreateAttempt,
  payload: BlueprintCreatePayload
) {
  return (
    JSON.stringify({
      organizationId: attempt.organizationId,
      content: attempt.content,
      ...(attempt.source ? { source: attempt.source } : {}),
    }) === JSON.stringify(payload)
  )
}

export function emptyBlueprintContent(): BlueprintDraftContent {
  return {
    name: '',
    description: '',
    experienceType: 'custom',
    children: [],
    ideas: [],
    instructions: [],
  }
}

export function reorder<T>(items: readonly T[], index: number, direction: -1 | 1): T[] {
  const nextIndex = index + direction
  if (index < 0 || index >= items.length || nextIndex < 0 || nextIndex >= items.length) {
    return [...items]
  }
  const next = [...items]
  ;[next[index], next[nextIndex]] = [next[nextIndex]!, next[index]!]
  return next
}

export function dependentsForChild(content: BlueprintDraftContent, childKey: string) {
  return {
    ideas: content.ideas.filter(
      (idea) => idea.target.kind === 'child' && idea.target.key === childKey
    ),
    instructions: content.instructions.filter(
      (instruction) => instruction.target.kind === 'child' && instruction.target.key === childKey
    ),
  }
}

export function targetForValue(value: string): BlueprintTarget {
  return value === 'main' ? { kind: 'main' } : { kind: 'child', key: value }
}

export function targetValue(target: BlueprintTarget) {
  return target.kind === 'main' ? 'main' : target.key
}

export function makeStableKey(prefix: string, title: string, existing: readonly string[]) {
  const base = title
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 70)
  const stem = `${prefix}_${base || 'item'}`
  let candidate = stem
  let suffix = 2
  while (existing.includes(candidate)) candidate = `${stem}_${suffix++}`
  return candidate
}
