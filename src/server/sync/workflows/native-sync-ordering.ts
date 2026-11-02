export type NativeSyncEntityType =
  | 'workspace'
  | 'event'
  | 'idea'
  | 'idea_response'
  | 'participant'
  | 'event_participation'
  | 'attendance'
  | 'expense'
  | 'registry_item'
  | 'note'
  | 'todo'
  | 'moment'
  | 'budget_transfer'

type OrderedNativeMutation = {
  entityType: NativeSyncEntityType
  operation: 'create' | 'update' | 'delete'
}

const mutationDependencyOrder: Record<NativeSyncEntityType, number> = {
  workspace: 0,
  participant: 1,
  event: 2,
  idea: 3,
  idea_response: 4,
  event_participation: 4,
  attendance: 5,
  expense: 6,
  registry_item: 7,
  note: 8,
  todo: 8,
  moment: 9,
  budget_transfer: 10,
}

/** Establish the workspace before records which need its scope. */
export function compareNativeMutationOrder(
  left: OrderedNativeMutation,
  right: OrderedNativeMutation
) {
  const leftPhase = mutationPhase(left)
  const rightPhase = mutationPhase(right)
  if (leftPhase !== rightPhase) return leftPhase - rightPhase

  const leftOrder = mutationDependencyOrder[left.entityType]
  const rightOrder = mutationDependencyOrder[right.entityType]
  if (leftPhase === 1) return rightOrder - leftOrder
  return leftOrder - rightOrder
}

/** Content writes precede record deletes, then atomic budget replacement. */
function mutationPhase(mutation: OrderedNativeMutation) {
  if (mutation.entityType === 'workspace' && mutation.operation === 'delete') return 3
  if (mutation.entityType === 'budget_transfer') return 2
  if (mutation.operation === 'delete') return 1
  return 0
}
