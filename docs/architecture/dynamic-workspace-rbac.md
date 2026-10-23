# Dynamic workspace roles

This foundation uses Better Auth 1.7.7's Organization dynamic access control.
Workspace administrators can define roles from a known resource/action vocabulary
and assign them to workspace members without changing application code. Existing
`owner`, `admin`, and `member` defaults remain intact.

## Scope

These roles authorize workspace administration: organization settings, membership,
workspace invitations, teams, and access-control management. They do not grant
event participation, guest access, planning privileges, or private media access.
Event `host` / `collaborator` / `guest` roles and their planning permissions remain
separate and unchanged. Blueprint private authoring and account lifecycle actions
that require an actual owner continue to require the built-in owner token.

Custom role definitions are dynamic; the vocabulary of permissible actions is
still declared by server code. Adding an arbitrary permission name to a database
row does not create a new application capability. Future budget/venue-specific
event roles require an event authorization and native sync extension.

## Storage and configuration

- `src/lib/org-permissions.ts` defines the shared, client-safe access-control
  statement and built-in roles.
- `src/lib/auth.ts` and `auth-client.ts` enable dynamic access control. The
  configured maximum is 50 custom roles per workspace.
- `organization_role` stores the organization ID, role identifier, serialized
  permissions, and timestamps. Organization/role uniqueness prevents duplicate
  definitions, and deleting a workspace cascades its definitions.
- `member.role` remains Better Auth's comma-separated assignment string. Exact
  owner-token checks recognize `owner,another-role` without promoting a custom
  administrator to owner. Native event and replication roles are not interpreted
  as these comma-separated membership roles.

The existing Better Auth catchall exposes role-management endpoints. Its current
membership and permission checks apply even when requests specify another
organization ID. Role creators and editors cannot grant permissions they lack.
Application request policy additionally validates known resources/actions and
rejects reserved built-in or JavaScript prototype names.

Role assignment and workspace invitations also require the actor to possess
every permission in the granted role. Having `member:update` alone cannot be
used to assign an administrative role with additional powers. Only an owner can
grant the owner token. Definitions referenced by pending invitations cannot be
deleted; cancel or replace those invitations first. Better Auth also rejects
deletion while members still hold the role.

## Usage from future administration screens

Always use the selected workspace's explicit `organizationId`:

```ts
await authClient.organization.createRole({
  organizationId,
  role: 'team_coordinator',
  permission: { team: ['create', 'update'] },
})

await authClient.organization.updateMemberRole({
  organizationId,
  memberId,
  role: 'team_coordinator',
})

const result = await authClient.organization.hasPermission({
  organizationId,
  permissions: { team: ['update'] },
})
```

`listRoles`, `getRole`, `updateRole`, and `deleteRole` are also available through
the organization client. Permission edits use `updateRole`'s `data.permission`.
Use server-backed `hasPermission` for custom roles, rather than the synchronous
client-only `checkRolePermission`. Existing server helpers
`ensureOrgPermission` / `orgAuthorizationMiddleware` declare required permissions
in code and resolve them against current membership.

Role identifiers are stable keys, limited to 1–64 ASCII letters, numbers,
underscores, and hyphens; Better Auth stores them lowercase. Renaming identifiers
is rejected because the installed provider does not migrate member assignments
or invitations. To replace a key, create the replacement, reassign members and
invitations, then delete the unused definition. This foundation adds no new
administration UI or native role editor.

## Rollout

Apply `drizzle/20261022151347_unknown_drax/migration.sql` before deploying the
updated auth configuration. It adds only the role-definition table, indexes,
and organization foreign key. A normal future development `db:reset` applies
the checked-in migration; existing static roles require no definition rows or
assignment backfill. This task did not reset, seed, or migrate a database.

The native app retains its current event role contract. It neither receives
unknown event role values nor treats workspace custom roles as native planning
access. Native administration and event-specific custom role capabilities can
be added later using separate versioned contracts.

Implementation references: [Better Auth Organization documentation](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/plugins/organization.mdx)
and the installed `better-auth/dist/plugins/organization` implementation. Runtime
API behavior must be verified against the migrated database before rollout;
static checks do not establish runtime acceptance.

October 22, 2026 validation: TypeScript checking, the production web build, and
scoped diff checks passed. Drizzle's file-based generation check reported no
remaining schema changes after generating the additive migration. No tests were
added or run, and no database, deployment, or native installation was changed.
