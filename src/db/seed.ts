import { ServerOperationError } from '@/lib/domain-errors'
import { and, eq } from 'drizzle-orm'
import { reset } from 'drizzle-seed'

import { db, pool } from '@/db'
import * as authSchema from '@/db/schema/auth.schema'
import * as blueprintSchema from '@/db/schema/blueprint.schema'
import { member, organization, team, teamMember, user } from '@/db/schema/auth.schema'
import * as eventSchema from '@/db/schema/event.schema'
import * as mediaSchema from '@/db/schema/media.schema'
import * as moderationSchema from '@/db/schema/moderation.schema'
import * as planningSchema from '@/db/schema/planning.schema'
import * as syncSchema from '@/db/schema/sync.schema'
import {
  createDevelopmentWorkspaceSeed,
  writeDevelopmentWorkspaceSeed,
} from '@/db/development-workspace-seed'
import { seedCuratedBlueprints } from '@/db/seeds/curated-blueprints'
import { seedPrivateTemplates } from '@/db/seeds/private-templates'
import { auth } from '@/lib/auth'
import { materializeNativeMutation } from '@/server/sync/repos/native-materializer.persistence'
import { createEventWorkspace } from '@/server/workspaces/handlers/workspace-provisioning.adapter'
import { developmentUsers } from '../../scripts/seed/development-users'

type SeedUser = { id: string; name: string; email: string }

async function ensureDevelopmentUser(input: (typeof developmentUsers)[number]): Promise<SeedUser> {
  const [existingUser] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
    })
    .from(user)
    .where(eq(user.email, input.email))
    .limit(1)

  if (existingUser) {
    if (!existingUser.emailVerified) {
      await db.update(user).set({ emailVerified: true }).where(eq(user.id, existingUser.id))
    }

    return existingUser
  }

  const result = await auth.api.signUpEmail({ body: input })
  await db.update(user).set({ emailVerified: true }).where(eq(user.id, result.user.id))
  console.log(`Created development user: ${result.user.email}`)
  return result.user
}

function personalWorkspaceSlug(userId: string) {
  return `personal-${userId.toLowerCase().replaceAll(/[^a-z0-9]/g, '')}`
}

async function ensureWorkspace(owner: SeedUser, workspaceName = "Alex & Jordan's Gatherory") {
  const slug = personalWorkspaceSlug(owner.id)
  let [workspace] = await db
    .select({ id: organization.id, name: organization.name })
    .from(organization)
    .where(eq(organization.slug, slug))
    .limit(1)

  if (!workspace) {
    workspace = await createEventWorkspace({
      name: workspaceName,
      slug,
      userId: owner.id,
    })
  } else if (workspace.name !== workspaceName) {
    await db
      .update(organization)
      .set({ name: workspaceName })
      .where(eq(organization.id, workspace.id))
  }

  const [ownerMembership] = await db
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.organizationId, workspace.id), eq(member.userId, owner.id)))
    .limit(1)

  if (!ownerMembership) {
    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: workspace.id,
      userId: owner.id,
      role: 'owner',
      createdAt: new Date(),
    })
  }

  let [planningTeam] = await db
    .select({ id: team.id })
    .from(team)
    .where(and(eq(team.organizationId, workspace.id), eq(team.name, 'Planning')))
    .limit(1)

  if (!planningTeam) {
    const [createdTeam] = await db
      .insert(team)
      .values({
        id: crypto.randomUUID(),
        name: 'Planning',
        organizationId: workspace.id,
        createdAt: new Date(),
      })
      .returning({ id: team.id })
    planningTeam = createdTeam
  }

  if (!planningTeam)
    throw new ServerOperationError({
      category: 'system',
      code: 'SEED_FAILED',
      debugMessage: 'Unable to seed the Planning team.',
    })

  const [ownerTeamMembership] = await db
    .select({ id: teamMember.id })
    .from(teamMember)
    .where(and(eq(teamMember.teamId, planningTeam.id), eq(teamMember.userId, owner.id)))
    .limit(1)

  if (!ownerTeamMembership) {
    await db.insert(teamMember).values({
      id: crypto.randomUUID(),
      teamId: planningTeam.id,
      userId: owner.id,
      membershipKey: `${planningTeam.id}:${owner.id}`,
      createdAt: new Date(),
    })
  }

  await db
    .update(team)
    .set({ memberCount: 1, updatedAt: new Date() })
    .where(eq(team.id, planningTeam.id))

  return { workspace, planningTeam }
}

async function ensureReviewAccess(input: {
  workspaceId: string
  planningTeamId: string
  reviewer: SeedUser
}) {
  const [existingMembership] = await db
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.organizationId, input.workspaceId), eq(member.userId, input.reviewer.id)))
    .limit(1)

  if (!existingMembership) {
    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: input.workspaceId,
      userId: input.reviewer.id,
      // Full access lets App Review exercise every organizer workflow.
      role: 'owner',
      createdAt: new Date(),
    })
  }

  const [existingTeamMembership] = await db
    .select({ id: teamMember.id })
    .from(teamMember)
    .where(
      and(eq(teamMember.teamId, input.planningTeamId), eq(teamMember.userId, input.reviewer.id))
    )
    .limit(1)

  if (!existingTeamMembership) {
    await db.insert(teamMember).values({
      id: crypto.randomUUID(),
      teamId: input.planningTeamId,
      userId: input.reviewer.id,
      membershipKey: `${input.planningTeamId}:${input.reviewer.id}`,
      createdAt: new Date(),
    })
  }

  await db
    .update(team)
    .set({ memberCount: 2, updatedAt: new Date() })
    .where(eq(team.id, input.planningTeamId))
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new ServerOperationError({
      category: 'system',
      code: 'SEED_FAILED',
      debugMessage: 'The development seed cannot run in production.',
    })
  }

  console.log('Resetting database...')
  await reset(db, {
    ...authSchema,
    ...blueprintSchema,
    ...eventSchema,
    ...mediaSchema,
    ...moderationSchema,
    ...planningSchema,
    ...syncSchema,
  })
  const curatedBlueprints = await seedCuratedBlueprints()

  const users = await Promise.all(developmentUsers.map(ensureDevelopmentUser))
  const typedUsers = [users[0], users[1], users[2], users[3], users[4]] as const
  const { workspace, planningTeam } = await ensureWorkspace(typedUsers[0])
  const { workspace: appReviewWorkspace } = await ensureWorkspace(
    typedUsers[4],
    "App Review's Personal Workspace"
  )
  await ensureReviewAccess({
    workspaceId: workspace.id,
    planningTeamId: planningTeam.id,
    reviewer: typedUsers[4],
  })
  const seed = createDevelopmentWorkspaceSeed({
    workspaceId: workspace.id,
    users: typedUsers,
    receptionPlanner: users[5],
    pendingCollaborators: [users[6], users[7]],
    now: new Date(),
  })
  await db.transaction((transaction) =>
    writeDevelopmentWorkspaceSeed(transaction, seed, materializeNativeMutation)
  )
  await db.update(user).set({ hasCompletedOnboarding: true }).where(eq(user.id, typedUsers[0].id))
  await db.update(user).set({ hasCompletedOnboarding: true }).where(eq(user.id, typedUsers[4].id))
  const privateTemplates = await seedPrivateTemplates(typedUsers[4].id, appReviewWorkspace.id)
  const cottageStatus =
    privateTemplates.publishedCottage.publishedRevision === null
      ? 'draft'
      : privateTemplates.publishedCottage.publishedDraftVersion ===
          privateTemplates.publishedCottage.draftVersion
        ? 'published'
        : 'edited draft; prior published revision preserved'

  console.log("Seeded Alex & Jordan's event workspace.")
  console.log('Reception-only planner: reception-planner@gatherory.test')
  console.log(
    'Pending approvals: pending-collaborator@gatherory.test, latest-collaborator@gatherory.test'
  )
  console.log('All development accounts use password: password')
  console.log('App Review fixture: appreview@gatherory.test / password')
  console.log(
    `Curated blueprint catalog is ready (${curatedBlueprints.inserted} revisions inserted).`
  )
  console.log(
    `App Review private templates: ${privateTemplates.publishedCottage.content.name} (${cottageStatus}) and ${privateTemplates.rapidTestDraft.content.name} (draft). Open Templates and filter Source to Private; use Published or Draft status to find each.`
  )
  console.log(
    'The review fixture starts in the seeded workspace; contextual onboarding primers remain unseen on a clean app install.'
  )
}

main()
  .catch((error: unknown) => {
    console.error('Unable to seed the Gatherory database.', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
