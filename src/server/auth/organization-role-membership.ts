import { sql, type SQLWrapper } from 'drizzle-orm'

/** Better Auth's owner role token; keep ownership checks limited to this built-in role. */
export const ORGANIZATION_OWNER_ROLE = 'owner' as const

/**
 * Match the built-in owner token in Better Auth's comma-separated membership
 * role field without treating arbitrary custom roles as owners.
 */
export function hasOrganizationOwnerRole(column: SQLWrapper) {
  return sql`${ORGANIZATION_OWNER_ROLE} = ANY(string_to_array(${column}, ','))`
}
