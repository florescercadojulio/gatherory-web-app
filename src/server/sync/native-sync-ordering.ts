export type NativeSyncEntityType =
  | "workspace"
  | "event"
  | "idea"
  | "participant"
  | "event_participation"
  | "attendance"
  | "expense"
  | "registry_item"
  | "note"
  | "moment"

type OrderedNativeMutation = {
  entityType: NativeSyncEntityType
  operation: "create" | "update" | "delete"
}

const mutationDependencyOrder: Record<NativeSyncEntityType, number> = {
  workspace: 0,
  participant: 1,
  event: 2,
  idea: 3,
  event_participation: 4,
  attendance: 5,
  expense: 6,
  registry_item: 7,
  note: 8,
  moment: 9,
}

/// Establish the workspace before records which need its scope. Deletions
/// reverse that relationship so the workspace is removed last.
export function compareNativeMutationOrder(
  left: OrderedNativeMutation,
  right: OrderedNativeMutation,
) {
  const leftOrder = mutationDependencyOrder[left.entityType]
  const rightOrder = mutationDependencyOrder[right.entityType]
  if (left.operation === "delete" && right.operation !== "delete") return 1
  if (left.operation !== "delete" && right.operation === "delete") return -1
  if (left.operation === "delete") return rightOrder - leftOrder
  return leftOrder - rightOrder
}
