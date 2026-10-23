import { APIError, createAuthMiddleware } from 'better-auth/api'
import { hasPermission } from 'better-auth/plugins/organization'
import type { OrganizationOptions } from 'better-auth/plugins/organization'

import { defaultStatements } from 'better-auth/plugins/organization/access'

const builtInRoles = new Set(['owner', 'admin', 'member'])
const unsupportedRoleKeys = new Set(['__proto__', 'prototype', 'constructor'])
const roleNamePattern = /^[a-zA-Z0-9_-]{1,64}$/
const guardedPaths = new Set([
  '/organization/create-role',
  '/organization/update-role',
  '/organization/delete-role',
  '/organization/update-member-role',
  '/organization/invite-member',
])
export type OrganizationRolePolicySession = {
  user: { id: string }
  session: { activeOrganizationId?: string | null }
}
export type OrganizationRolePolicySessionResolver = (
  headers: Headers
) => Promise<OrganizationRolePolicySession | null>

type BasePolicyContext = Parameters<typeof hasPermission>[1] & {
  headers?: Headers
  path?: string
  body?: unknown
}
type PolicyContext = BasePolicyContext
type OrganizationRolePolicyOptions = Pick<
  OrganizationOptions,
  'ac' | 'creatorRole' | 'dynamicAccessControl' | 'roles'
>

function rejectRoleInput(message: string): never {
  throw APIError.from('BAD_REQUEST', {
    code: 'INVALID_ORGANIZATION_ROLE',
    message,
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateRoleName(value: unknown): void {
  if (typeof value !== 'string' || !roleNamePattern.test(value)) {
    rejectRoleInput('Role names must be 1–64 ASCII letters, numbers, hyphens, or underscores.')
  }

  const normalized = value.toLowerCase()
  if (builtInRoles.has(normalized)) {
    rejectRoleInput('Role names cannot replace a built-in organization role.')
  }
  if (unsupportedRoleKeys.has(normalized)) {
    rejectRoleInput('Role name is reserved.')
  }
}

function parseRequestedRoles(value: unknown): string[] {
  if (typeof value !== 'string' && !Array.isArray(value)) {
    rejectRoleInput('Role assignments must be a role name or a list of role names.')
  }
  const roles = (Array.isArray(value) ? value : [value]).flatMap((role) => {
    if (typeof role !== 'string') rejectRoleInput('Every assigned role must be a string.')
    return role
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
  })
  if (roles.length === 0) rejectRoleInput('At least one role must be assigned.')
  return roles
}

/** Validate custom role permissions against BetterAuth's supported vocabulary. */
function validatePermission(value: unknown): void {
  if (!isRecord(value)) {
    rejectRoleInput('Role permissions must be an object of known resources and actions.')
  }

  for (const [resource, actions] of Object.entries(value)) {
    if (!Object.hasOwn(defaultStatements, resource)) {
      rejectRoleInput(`Unknown organization permission resource: ${resource}.`)
    }

    const knownActions = defaultStatements[resource as keyof typeof defaultStatements]
    if (
      !Array.isArray(actions) ||
      actions.some(
        (action) => typeof action !== 'string' || !knownActions.includes(action as never)
      )
    ) {
      rejectRoleInput(`Unknown organization permission action for resource: ${resource}.`)
    }
  }
}

/**
 * BetterAuth 1.7 validates permission resources and role-grant escalation, but
 * does not validate action names. Validate those and role identifiers before
 * its dynamic role endpoints persist or rename records.
 */
const validateDynamicOrganizationRole = (
  sessionResolver: OrganizationRolePolicySessionResolver,
  organizationOptions: OrganizationRolePolicyOptions
) =>
  createAuthMiddleware({}, async (ctx) => {
    const policyContext = ctx as unknown as PolicyContext
    if (policyContext.path === '/organization/create-role') {
      if (!isRecord(policyContext.body)) rejectRoleInput('Invalid role request.')
      validateRoleName(policyContext.body.role)
      validatePermission(policyContext.body.permission)
    }

    if (policyContext.path === '/organization/update-role') {
      if (!isRecord(policyContext.body) || !isRecord(policyContext.body.data)) {
        rejectRoleInput('Invalid role update request.')
      }
      if (policyContext.body.data.roleName !== undefined) {
        rejectRoleInput(
          'Custom role names cannot be changed because BetterAuth does not migrate existing assignments. Create a replacement role, reassign members and invitations, then delete the old role.'
        )
      }
      if (policyContext.body.data.permission !== undefined)
        validatePermission(policyContext.body.data.permission)
    }

    if (
      policyContext.path === '/organization/update-member-role' ||
      policyContext.path === '/organization/invite-member'
    ) {
      await validateRoleGrant(policyContext, sessionResolver, organizationOptions)
    }

    if (policyContext.path === '/organization/delete-role') {
      await rejectDeleteRoleWithPendingInvitations(
        policyContext,
        sessionResolver,
        organizationOptions
      )
    }
  })

/**
 * The injected getSession resolver runs a nested BetterAuth dispatch, allowing
 * the bearer plugin to normalize Authorization: Bearer before session lookup.
 */
export function organizationRolePolicyPlugin(
  sessionResolver: OrganizationRolePolicySessionResolver,
  organizationOptions: OrganizationRolePolicyOptions
) {
  return {
    id: 'organization-role-policy',
    hooks: {
      before: [
        {
          matcher: (context: { path?: string }) => guardedPaths.has(context.path ?? ''),
          handler: validateDynamicOrganizationRole(sessionResolver, organizationOptions),
        },
      ],
    },
  }
}

async function validateRoleGrant(
  ctx: PolicyContext,
  sessionResolver: OrganizationRolePolicySessionResolver,
  organizationOptions: OrganizationRolePolicyOptions
): Promise<void> {
  const body = isRecord(ctx.body) ? ctx.body : rejectRoleInput('Invalid role assignment request.')
  const { organizationId, actor } = await resolveActor(ctx, sessionResolver, body)

  const requestedRoles = parseRequestedRoles(body.role)
  const creatorRole = organizationOptions.creatorRole ?? 'owner'
  const actorRoleNames = actor.role.split(',').map((role) => role.trim())
  if (requestedRoles.includes(creatorRole) && !actorRoleNames.includes(creatorRole)) {
    throw APIError.from('FORBIDDEN', {
      code: 'FORBIDDEN',
      message: 'Only an organization owner can assign the owner role.',
    })
  }

  for (const requestedRole of requestedRoles) {
    const permissions = await getRolePermissions(
      ctx,
      organizationOptions,
      organizationId,
      requestedRole
    )
    if (!permissions) rejectRoleInput(`Unknown organization role: ${requestedRole}.`)

    for (const [resource, actions] of Object.entries(permissions)) {
      if (!Object.hasOwn(defaultStatements, resource) || !Array.isArray(actions)) {
        rejectRoleInput(`The assigned role has invalid permissions for resource: ${resource}.`)
      }
      for (const action of actions) {
        if (
          typeof action !== 'string' ||
          !defaultStatements[resource as keyof typeof defaultStatements].includes(action as never)
        ) {
          rejectRoleInput(
            `The assigned role has an unknown permission action for resource: ${resource}.`
          )
        }
        const actorHasPermission = await hasPermission(
          {
            role: actor.role,
            options: organizationOptions,
            organizationId,
            permissions: { [resource]: [action] },
          },
          ctx
        )
        if (!actorHasPermission) {
          throw APIError.from('FORBIDDEN', {
            code: 'FORBIDDEN',
            message: 'You can only assign roles whose permissions you already have.',
          })
        }
      }
    }
  }
}

async function getRolePermissions(
  ctx: PolicyContext,
  organizationOptions: OrganizationRolePolicyOptions,
  organizationId: string,
  roleName: string
): Promise<Record<string, unknown[]> | null> {
  const configuredRoles = organizationOptions.roles ?? {}
  if (Object.hasOwn(configuredRoles, roleName)) {
    return configuredRoles[roleName]!.statements as Record<string, unknown[]>
  }

  const customRole = (await ctx.context.adapter.findOne({
    model: 'organizationRole',
    where: [
      { field: 'organizationId', value: organizationId, operator: 'eq', connector: 'AND' },
      { field: 'role', value: roleName, operator: 'eq', connector: 'AND' },
    ],
  })) as { permission?: unknown } | null
  if (!customRole || typeof customRole.permission !== 'string') return null

  let permissions: unknown
  try {
    permissions = JSON.parse(customRole.permission)
  } catch {
    rejectRoleInput(`The assigned role has malformed permissions: ${roleName}.`)
  }
  if (!isRecord(permissions))
    rejectRoleInput(`The assigned role has malformed permissions: ${roleName}.`)
  return permissions as Record<string, unknown[]>
}

async function rejectDeleteRoleWithPendingInvitations(
  ctx: PolicyContext,
  sessionResolver: OrganizationRolePolicySessionResolver,
  organizationOptions: OrganizationRolePolicyOptions
): Promise<void> {
  if (!isRecord(ctx.body)) return
  const { organizationId, actor } = await resolveActor(ctx, sessionResolver, ctx.body)
  const canDeleteRoles = await hasPermission(
    {
      role: actor.role,
      options: organizationOptions,
      organizationId,
      permissions: { ac: ['delete'] },
    },
    ctx
  )
  if (!canDeleteRoles) {
    throw APIError.from('FORBIDDEN', {
      code: 'FORBIDDEN',
      message: 'You are not allowed to delete organization roles.',
    })
  }

  const roleWhere =
    typeof ctx.body.roleName === 'string'
      ? { field: 'role', value: ctx.body.roleName, operator: 'eq' as const }
      : typeof ctx.body.roleId === 'string'
        ? { field: 'id', value: ctx.body.roleId, operator: 'eq' as const }
        : null
  if (!roleWhere) return

  const role = (await ctx.context.adapter.findOne({
    model: 'organizationRole',
    where: [
      { field: 'organizationId', value: organizationId, operator: 'eq', connector: 'AND' },
      roleWhere,
    ],
  })) as { role: string } | null
  if (!role) return

  const invitations = (await ctx.context.adapter.findMany({
    model: 'invitation',
    where: [
      { field: 'organizationId', value: organizationId, operator: 'eq', connector: 'AND' },
      { field: 'status', value: 'pending', operator: 'eq', connector: 'AND' },
    ],
  })) as unknown as Array<{ role?: unknown }>
  const isAssigned = invitations.some(
    (invitation) =>
      typeof invitation.role === 'string' &&
      invitation.role
        .split(',')
        .map((item) => item.trim())
        .includes(role.role)
  )
  if (isAssigned) {
    throw APIError.from('BAD_REQUEST', {
      code: 'ROLE_IS_ASSIGNED_TO_PENDING_INVITATIONS',
      message:
        'This role is assigned to pending invitations. Reassign or cancel those invitations before deleting it.',
    })
  }
}

async function resolveActor(
  ctx: PolicyContext,
  sessionResolver: OrganizationRolePolicySessionResolver,
  body: Record<string, unknown>
): Promise<{ organizationId: string; actor: { role: string } }> {
  const headers = ctx.headers
  if (!headers)
    throw APIError.from('UNAUTHORIZED', {
      code: 'UNAUTHORIZED',
      message: 'Authentication is required.',
    })
  const session = await sessionResolver(headers)
  if (!session) {
    throw APIError.from('UNAUTHORIZED', {
      code: 'UNAUTHORIZED',
      message: 'Authentication is required.',
    })
  }

  const organizationId =
    (typeof body.organizationId === 'string' && body.organizationId) ||
    session.session.activeOrganizationId
  if (!organizationId) rejectRoleInput('An active organization or organizationId is required.')

  const actor = (await ctx.context.adapter.findOne({
    model: 'member',
    where: [
      { field: 'organizationId', value: organizationId, operator: 'eq', connector: 'AND' },
      { field: 'userId', value: session.user.id, operator: 'eq', connector: 'AND' },
    ],
  })) as { role?: unknown } | null
  if (!actor || typeof actor.role !== 'string') {
    throw APIError.from('FORBIDDEN', {
      code: 'FORBIDDEN',
      message: 'Organization membership is required.',
    })
  }
  return { organizationId, actor: { role: actor.role } }
}
