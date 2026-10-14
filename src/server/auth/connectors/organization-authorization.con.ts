import { Context, type Effect } from 'effect'
import type { DomainError } from '@/lib/domain-errors'
import type { OrgPermissions } from '@/lib/org-permissions'

export type OrganizationMembership = {
  readonly id: string
  readonly userId: string
  readonly organizationId: string
  readonly role: string
}

export class OrganizationAuthorizationCon extends Context.Service<
  OrganizationAuthorizationCon,
  {
    readonly activeMember: (
      headers: Headers
    ) => Effect.Effect<OrganizationMembership | null, DomainError>
    readonly hasPermission: (input: {
      headers: Headers
      organizationId: string
      permissions: OrgPermissions
    }) => Effect.Effect<boolean, DomainError>
  }
>()('OrganizationAuthorizationCon') {}
