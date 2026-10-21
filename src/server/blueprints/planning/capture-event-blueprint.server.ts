import '@tanstack/react-start/server-only'

import { Temporal } from '@/server/temporal.server'

import {
  BlueprintCaptureSelectionSchema,
  BlueprintEventCaptureSourceSchema,
  type BlueprintEventCaptureSource,
} from '@/contracts/blueprint-capture.contracts'
import {
  BlueprintDraftContentSchema,
  type BlueprintDraftContent,
} from '@/contracts/blueprint-authoring.contracts'
import {
  BlueprintStableKeySchema,
  normalizeBlueprintTodoWebsiteURL,
} from '@/contracts/blueprint-install.contracts'

type CaptureSelectionInput = Parameters<typeof BlueprintCaptureSelectionSchema.parse>[0]

/** Projects a validated event snapshot into portable blueprint draft content. */
export function captureEventBlueprint(
  sourceValue: BlueprintEventCaptureSource,
  selectionValue: CaptureSelectionInput,
  name?: string
): BlueprintDraftContent {
  const source = BlueprintEventCaptureSourceSchema.parse(sourceValue)
  const selection = BlueprintCaptureSelectionSchema.parse(selectionValue)
  const childrenById = new Map(source.children.map((child) => [child.id, child]))
  const selectedChildIds = new Set(selection.childIds)
  const selectedIdeaIds = new Set(selection.ideaIds)
  const selectedInstructionIds = new Set(selection.instructionIds)
  const selectedTodoIds = new Set(selection.todoIds)

  assertSelectedIdsExist(selection.childIds, childrenById, 'child')
  assertSelectedIdsExist(
    selection.ideaIds,
    new Map(source.ideas.map((idea) => [idea.id, idea])),
    'idea'
  )
  assertSelectedIdsExist(
    selection.instructionIds,
    new Map(source.instructions.map((instruction) => [instruction.id, instruction])),
    'instruction'
  )
  assertSelectedIdsExist(
    selection.todoIds,
    new Map(source.todos.map((todo) => [todo.id, todo])),
    'to-do'
  )

  const childKeys = new Map(
    source.children
      .filter(({ id }) => selectedChildIds.has(id))
      .map(({ id }) => [id, stableKey('event', id)])
  )
  const rootDate = source.event.startsAt
    ? Temporal.Instant.from(source.event.startsAt)
        .toZonedDateTimeISO(source.event.timeZone)
        .toPlainDate()
    : null

  const children = source.children
    .filter(({ id }) => selectedChildIds.has(id))
    .map((child) => {
      const scheduleProposal =
        rootDate && child.startsAt
          ? dateProposal(child.startsAt, source.event.timeZone, rootDate)
          : undefined
      return {
        key: childKeys.get(child.id)!,
        title: child.title,
        purpose: child.purpose,
        category: child.category,
        ...(scheduleProposal ? { scheduleProposal } : {}),
      }
    })

  const ideas = source.ideas
    .filter(({ id }) => selectedIdeaIds.has(id))
    .map((idea) => ({
      key: stableKey('idea', idea.id),
      title: idea.title,
      category: idea.category,
      ...(selection.includeIdeaNotes && idea.notes !== null ? { notes: idea.notes } : {}),
      target: targetForEventId(idea.eventId, source.event.id, childKeys, 'idea'),
      configuration: { version: 1 as const },
    }))

  const instructions = source.instructions
    .filter(({ id }) => selectedInstructionIds.has(id))
    .map((instruction) => ({
      key: stableKey('guide', instruction.id),
      title: instruction.title,
      body: instruction.body,
      audience: instruction.audience,
      target: targetForEventId(instruction.eventId, source.event.id, childKeys, 'instruction'),
    }))

  const todos = source.todos
    .filter(({ id }) => selectedTodoIds.has(id))
    .map((todo) => ({
      key: stableKey('todo', todo.id),
      title: todo.title,
      ...(todo.websiteURL ? { websiteURL: normalizeBlueprintTodoWebsiteURL(todo.websiteURL) } : {}),
      target: targetForEventId(todo.eventId, source.event.id, childKeys, 'todo'),
    }))

  return BlueprintDraftContentSchema.parse({
    name: name ?? source.event.title,
    description: '',
    experienceType: source.event.experienceType,
    children,
    ideas,
    instructions,
    todos,
  })
}

export type BlueprintCaptureMergeResult = {
  content: BlueprintDraftContent
  conflicts: string[]
}

/** Three-way merge for successive captures, preserving edits in the current draft. */
export function mergeCapturedBlueprint(
  previousCapturedValue: BlueprintDraftContent,
  nextCapturedValue: BlueprintDraftContent,
  currentContentValue: BlueprintDraftContent
): BlueprintCaptureMergeResult {
  const previous = BlueprintDraftContentSchema.parse(previousCapturedValue)
  const next = BlueprintDraftContentSchema.parse(nextCapturedValue)
  const current = BlueprintDraftContentSchema.parse(currentContentValue)
  const conflicts = new Set<string>()

  const mergedRoot = {
    name: mergeRootField('name', previous.name, next.name, current.name, conflicts),
    description: mergeRootField(
      'description',
      previous.description,
      next.description,
      current.description,
      conflicts
    ),
    experienceType: mergeRootField(
      'experienceType',
      previous.experienceType,
      next.experienceType,
      current.experienceType,
      conflicts
    ),
  }

  let children = mergeGroup(previous.children, next.children, current.children, conflicts)
  let ideas = mergeGroup(previous.ideas, next.ideas, current.ideas, conflicts)
  let instructions = mergeGroup(
    previous.instructions,
    next.instructions,
    current.instructions,
    conflicts
  )
  let todos = mergeGroup(previous.todos, next.todos, current.todos, conflicts)

  const retainedTargets = [...ideas, ...instructions, ...todos]
    .filter((item) => item.target.kind === 'child')
    .map((item) => (item.target.kind === 'child' ? item.target.key : ''))
  const presentChildKeys = new Set(children.map(({ key }) => key))
  const currentReferences = new Set(
    [...current.ideas, ...current.instructions, ...current.todos]
      .filter((item) => item.target.kind === 'child')
      .map((item) => (item.target.kind === 'child' ? item.target.key : ''))
  )
  for (const key of retainedTargets) {
    if (presentChildKeys.has(key)) continue
    if (currentReferences.has(key)) {
      const childToKeep =
        current.children.find((child) => child.key === key) ??
        previous.children.find((child) => child.key === key)
      if (childToKeep) {
        children = [...children, childToKeep]
        presentChildKeys.add(key)
      }
      conflicts.add(key)
      continue
    }

    ideas = preserveCurrentItemsForMissingTarget(ideas, current.ideas, key, conflicts)
    instructions = preserveCurrentItemsForMissingTarget(
      instructions,
      current.instructions,
      key,
      conflicts
    )
    todos = preserveCurrentItemsForMissingTarget(todos, current.todos, key, conflicts)
  }

  const content = BlueprintDraftContentSchema.parse({
    ...mergedRoot,
    children,
    ideas,
    instructions,
    todos,
  })
  return { content, conflicts: [...conflicts].sort() }
}

function stableKey(prefix: 'event' | 'idea' | 'guide' | 'todo', id: string): string {
  return BlueprintStableKeySchema.parse(`${prefix}_${id.replaceAll('-', '')}`)
}

function targetForEventId(
  eventId: string,
  rootEventId: string,
  childKeys: Map<string, string>,
  recordKind: 'idea' | 'instruction' | 'todo'
) {
  if (eventId === rootEventId) return { kind: 'main' as const }
  const key = childKeys.get(eventId)
  if (!key) {
    throw new Error(`Cannot capture ${recordKind} targeting an unselected child event.`)
  }
  return { kind: 'child' as const, key }
}

function dateProposal(startsAt: string, timeZone: string, rootDate: Temporal.PlainDate) {
  const local = Temporal.Instant.from(startsAt)
    .toZonedDateTimeISO(timeZone)
    .round({ smallestUnit: 'minute', roundingMode: 'trunc' })
  const dayOffset = rootDate.until(local.toPlainDate(), { largestUnit: 'day' }).days
  if (dayOffset < -365 || dayOffset > 3_650) return undefined
  return {
    anchor: 'main_start' as const,
    dayOffset,
    localTime: local.toPlainTime().toString({ smallestUnit: 'minute' }),
  }
}

function assertSelectedIdsExist<T>(ids: string[], records: Map<string, T>, label: string) {
  const missing = ids.find((id) => !records.has(id))
  if (missing) throw new Error(`Selected ${label} ${missing} does not exist in the source.`)
}

function mergeRootField<T>(
  field: string,
  previous: T,
  next: T,
  current: T,
  conflicts: Set<string>
): T {
  if (same(current, previous)) return next
  if (!same(current, next) && !same(previous, next)) conflicts.add(field)
  return current
}

function mergeGroup<T extends { key: string }>(
  previous: T[],
  next: T[],
  current: T[],
  conflicts: Set<string>
): T[] {
  const previousByKey = new Map(previous.map((item) => [item.key, item]))
  const nextByKey = new Map(next.map((item) => [item.key, item]))
  const currentByKey = new Map(current.map((item) => [item.key, item]))
  const merged = new Map<string, T>()

  for (const [key, previousItem] of previousByKey) {
    const nextItem = nextByKey.get(key)
    const currentItem = currentByKey.get(key)
    if (!currentItem) {
      if (nextItem && !same(previousItem, nextItem)) conflicts.add(key)
      continue
    }
    if (same(currentItem, previousItem)) {
      if (nextItem) merged.set(key, nextItem)
    } else {
      merged.set(key, currentItem)
      if (nextItem && !same(currentItem, nextItem) && !same(previousItem, nextItem)) {
        conflicts.add(key)
      } else if (!nextItem && !same(currentItem, previousItem)) {
        conflicts.add(key)
      }
    }
  }

  for (const [key, nextItem] of nextByKey) {
    if (previousByKey.has(key)) continue
    const currentItem = currentByKey.get(key)
    if (!currentItem) merged.set(key, nextItem)
    else {
      merged.set(key, currentItem)
      if (!same(currentItem, nextItem)) conflicts.add(key)
    }
  }

  for (const [key, currentItem] of currentByKey) {
    if (!previousByKey.has(key) && !nextByKey.has(key)) merged.set(key, currentItem)
  }

  const ordered: T[] = []
  for (const item of next) {
    const value = merged.get(item.key)
    if (value) ordered.push(value)
  }
  for (const item of current) {
    if (nextByKey.has(item.key)) continue
    const value = merged.get(item.key)
    if (value) ordered.push(value)
  }
  return ordered
}

function preserveCurrentItemsForMissingTarget<
  T extends { key: string; target: { kind: 'main' } | { kind: 'child'; key: string } },
>(items: T[], currentItems: T[], missingTargetKey: string, conflicts: Set<string>): T[] {
  return items.flatMap((item) => {
    if (item.target.kind !== 'child' || item.target.key !== missingTargetKey) return [item]
    const currentItem = currentItems.find(({ key }) => key === item.key)
    conflicts.add(item.key)
    conflicts.add(missingTargetKey)
    return currentItem ? [currentItem] : []
  })
}

function same(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => same(value, right[index]))
    )
  }
  if (isRecord(left) && isRecord(right)) {
    const leftKeys = Object.keys(left).sort()
    const rightKeys = Object.keys(right).sort()
    return (
      leftKeys.length === rightKeys.length &&
      leftKeys.every((key, index) => key === rightKeys[index] && same(left[key], right[key]))
    )
  }
  return false
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
