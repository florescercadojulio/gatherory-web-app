export const participantRoles = ["host", "collaborator", "guest"] as const
export type ParticipantRole = (typeof participantRoles)[number]

export const planningPermissions = ["manage", "contribute", "viewOnly"] as const
export type PlanningPermission = (typeof planningPermissions)[number]

export const capabilities = [
  "event.read",
  "event.update",
  "event.delete",
  "event.manageParticipants",
  "idea.read",
  "idea.create",
  "idea.update",
  "idea.decide",
  "timeline.read",
  "timeline.manage",
  "registry.read",
  "registry.manage",
  "registry.commit",
  "note.send",
  "attendance.respond",
] as const

export type Capability = (typeof capabilities)[number]

const viewerCapabilities = [
  "event.read",
  "idea.read",
  "timeline.read",
  "registry.read",
  "registry.commit",
  "attendance.respond",
] as const satisfies readonly Capability[]

const contributorCapabilities = [
  ...viewerCapabilities,
  "idea.create",
  "idea.update",
  "idea.decide",
  "timeline.manage",
  "note.send",
] as const satisfies readonly Capability[]

const managerCapabilities = [
  ...contributorCapabilities,
  "event.update",
  "event.delete",
  "event.manageParticipants",
  "registry.manage",
] as const satisfies readonly Capability[]

export const defaultCapabilitiesByPlanningPermission = {
  manage: managerCapabilities,
  contribute: contributorCapabilities,
  viewOnly: viewerCapabilities,
} as const satisfies Record<PlanningPermission, readonly Capability[]>

export function capabilitiesForParticipant(input: {
  role: ParticipantRole
  planningPermission: PlanningPermission
}): ReadonlySet<Capability> {
  if (input.role === "host") return new Set(managerCapabilities)
  if (input.role === "guest") return new Set(viewerCapabilities)

  return new Set(
    defaultCapabilitiesByPlanningPermission[input.planningPermission],
  )
}

export function hasCapabilities(
  granted: ReadonlySet<Capability>,
  required: readonly Capability[],
) {
  return required.every((capability) => granted.has(capability))
}
