import { createAccessControl } from "better-auth/plugins/access"

export const participantRoles = ["host", "collaborator", "guest"] as const
export type ParticipantRole = (typeof participantRoles)[number]

export const planningPermissions = [
  "manage",
  "contribute",
  "viewOnly",
] as const
export type PlanningPermission = (typeof planningPermissions)[number]

/**
 * Event access is expressed as resource/action statements, matching Better
 * Auth's authorization model. This keeps permission checks readable and makes
 * it possible to share the same policy vocabulary with the web client later.
 */
export const eventPermissionStatement = {
  event: ["read", "create_child", "update", "delete", "manage_participants"],
  idea: ["read", "create", "update", "decide"],
  timeline: ["read", "manage"],
  registry: ["read", "manage", "commit"],
  media: ["read", "upload", "manage"],
  note: ["send"],
  attendance: ["respond"],
} as const

export const eventAccessControl = createAccessControl(eventPermissionStatement)

const viewerStatements = {
  event: ["read"],
  idea: ["read"],
  timeline: ["read"],
  registry: ["read", "commit"],
  media: ["read"],
  attendance: ["respond"],
} as const

const contributorStatements = {
  ...viewerStatements,
  event: ["read", "create_child"],
  idea: ["read", "create", "update", "decide"],
  timeline: ["read", "manage"],
  media: ["read", "upload"],
  note: ["send"],
} as const

const managerStatements = {
  ...contributorStatements,
  event: ["read", "create_child", "update", "delete", "manage_participants"],
  registry: ["read", "manage", "commit"],
  media: ["read", "upload", "manage"],
} as const

export const eventAccessRoles = {
  viewer: eventAccessControl.newRole(viewerStatements),
  contributor: eventAccessControl.newRole(contributorStatements),
  manager: eventAccessControl.newRole(managerStatements),
  host: eventAccessControl.newRole(managerStatements),
} as const

export type EventPermissions = {
  [Resource in keyof typeof eventPermissionStatement]?: Array<
    (typeof eventPermissionStatement)[Resource][number]
  >
}

export type EventParticipantAccess = {
  role: ParticipantRole
  planningPermission: PlanningPermission
}

export function eventAccessRoleForParticipant(
  participant: EventParticipantAccess,
): keyof typeof eventAccessRoles {
  if (participant.role === "host") return "host"
  if (participant.role === "guest") return "viewer"
  if (participant.planningPermission === "manage") return "manager"
  if (participant.planningPermission === "contribute") return "contributor"
  return "viewer"
}

export function hasEventPermission(
  participant: EventParticipantAccess,
  permissions: EventPermissions,
) {
  const role = eventAccessRoles[eventAccessRoleForParticipant(participant)]
  return role.authorize(permissions).success === true
}

export function planningPermissionFromDatabase(
  value: "manage" | "contribute" | "view_only",
): PlanningPermission {
  return value === "view_only" ? "viewOnly" : value
}
