import { createAccessControl } from 'better-auth/plugins/access'
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from 'better-auth/plugins/organization/access'

/** Shared server/client access-control vocabulary for workspace administration. */
export const orgAccessControl = createAccessControl(defaultStatements)

/** Keep BetterAuth's existing baseline role semantics. */
export const orgRoles = {
  owner: ownerAc,
  admin: adminAc,
  member: memberAc,
} as const

/** Organization administration only; event participation uses EventPermissions. */
export type OrgPermissions = {
  [Resource in keyof typeof defaultStatements]?: Array<(typeof defaultStatements)[Resource][number]>
}
