import type { defaultStatements } from 'better-auth/plugins/organization/access'

/** Organization administration only; event participation uses EventPermissions. */
export type OrgPermissions = {
  [Resource in keyof typeof defaultStatements]?: Array<(typeof defaultStatements)[Resource][number]>
}
