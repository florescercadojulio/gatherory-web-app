import { and, eq, inArray, isNull } from "drizzle-orm"
import { redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { z } from "zod"

import { db } from "@/db"
import { member, organization, teamMember } from "@/db/schema/auth.schema"
import { event, eventParticipant } from "@/db/schema/event.schema"
import { workspacePlanningSettings } from "@/db/schema/planning.schema"
import { auth } from "@/lib/auth"
import { requireSessionMiddleware } from "@/lib/auth.middleware"

type AuthWorkspace = {
  id: string
  name: string
  slug: string
  workspaceType: string
}

type WorkspaceAccess = "member" | "participant"

const CreateWorkspaceInputSchema = z
  .object({
    eventName: z.string().trim().min(2).max(120),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime().optional(),
    isAllDay: z.boolean().default(false),
    timeZone: z.string().trim().min(1).max(100),
    locationName: z.string().trim().max(160).optional(),
    locationAddress: z.string().trim().max(500).optional(),
    budgetCap: z
      .string()
      .trim()
      .regex(/^\d+(?:\.\d{1,2})?$/)
      .optional(),
  })
  .refine(
    (value) =>
      !value.endsAt || new Date(value.endsAt) >= new Date(value.startsAt),
    {
      message: "The event end must be after its start.",
      path: ["endsAt"],
    },
  )

function personalWorkspaceSlug(userId: string) {
  const safeId = userId.toLowerCase().replaceAll(/[^a-z0-9]/g, "")
  return `personal-${safeId}`
}

async function availableWorkspaceSlug(name: string) {
  const baseSlug =
    name
      .trim()
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, "-")
      .replaceAll(/^-|-$/g, "")
      .slice(0, 80) || "workspace"
  const [existingWorkspace] = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.slug, baseSlug))
    .limit(1)

  return existingWorkspace
    ? `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`
    : baseSlug
}

async function ensurePlanningTeam(input: {
  organizationId: string
  userId: string
  headers: Headers
}) {
  const teams = await auth.api.listOrganizationTeams({
    headers: input.headers,
    query: { organizationId: input.organizationId },
  })
  const planningTeam =
    teams.find((team) => team.name === "Planning") ??
    (await auth.api.createTeam({
      headers: input.headers,
      body: {
        name: "Planning",
        organizationId: input.organizationId,
      },
    }))

  const [membership] = await db
    .select({ id: teamMember.id })
    .from(teamMember)
    .where(
      and(
        eq(teamMember.teamId, planningTeam.id),
        eq(teamMember.userId, input.userId),
      ),
    )
    .limit(1)

  if (!membership) {
    await auth.api.addTeamMember({
      headers: input.headers,
      body: {
        teamId: planningTeam.id,
        userId: input.userId,
        organizationId: input.organizationId,
      },
    })
  }

  await auth.api.setActiveTeam({
    headers: input.headers,
    body: { teamId: planningTeam.id },
  })

  return planningTeam
}

async function listAccessibleWorkspaces(input: {
  userId: string
  memberWorkspaces: AuthWorkspace[]
}) {
  const memberWorkspaceIds = input.memberWorkspaces.map(
    (workspace) => workspace.id,
  )
  const configuredMemberWorkspaces = memberWorkspaceIds.length
    ? await db
        .selectDistinct({ id: organization.id })
        .from(organization)
        .innerJoin(
          event,
          and(
            eq(event.organizationId, organization.id),
            isNull(event.parentEventId),
          ),
        )
        .where(inArray(organization.id, memberWorkspaceIds))
    : []
  const configuredMemberIds = new Set(
    configuredMemberWorkspaces.map((workspace) => workspace.id),
  )
  const participantWorkspaces = await db
    .selectDistinct({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      type: organization.workspaceType,
    })
    .from(organization)
    .innerJoin(event, eq(event.organizationId, organization.id))
    .innerJoin(
      eventParticipant,
      and(
        eq(eventParticipant.eventId, event.id),
        eq(eventParticipant.userId, input.userId),
      ),
    )

  const workspaces = new Map<
    string,
    {
      id: string
      name: string
      slug: string
      type: string
      access: WorkspaceAccess
    }
  >()

  for (const workspace of participantWorkspaces) {
    workspaces.set(workspace.id, { ...workspace, access: "participant" })
  }
  for (const workspace of input.memberWorkspaces) {
    if (!configuredMemberIds.has(workspace.id)) continue
    workspaces.set(workspace.id, {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      type: workspace.workspaceType,
      access: "member",
    })
  }

  return [...workspaces.values()].toSorted((left, right) =>
    left.name.localeCompare(right.name),
  )
}

async function provisionPersonalWorkspace(input: {
  headers: Headers
  userId: string
  userName: string
  activeOrganizationId?: string | null
}) {
  let memberWorkspaces = await auth.api.listOrganizations({
    headers: input.headers,
  })
  let workspace =
    memberWorkspaces.find(
      (candidate) => candidate.id === input.activeOrganizationId,
    ) ??
    memberWorkspaces.find(
      (candidate) => candidate.workspaceType === "personal",
    ) ??
    memberWorkspaces[0]

  if (!workspace) {
    try {
      workspace = await auth.api.createOrganization({
        headers: input.headers,
        body: {
          name: `${input.userName}'s Workspace`,
          slug: personalWorkspaceSlug(input.userId),
        },
      })
    } catch (error) {
      memberWorkspaces = await auth.api.listOrganizations({
        headers: input.headers,
      })
      const recoveredWorkspace = memberWorkspaces.find(
        (candidate) => candidate.slug === personalWorkspaceSlug(input.userId),
      )
      if (!recoveredWorkspace) throw error
      workspace = recoveredWorkspace
    }
  }

  if (workspace.id !== input.activeOrganizationId) {
    await auth.api.setActiveOrganization({
      headers: input.headers,
      body: { organizationId: workspace.id },
    })
  }

  const planningTeam = await ensurePlanningTeam({
    organizationId: workspace.id,
    userId: input.userId,
    headers: input.headers,
  })

  await db
    .insert(workspacePlanningSettings)
    .values({ organizationId: workspace.id })
    .onConflictDoNothing({
      target: workspacePlanningSettings.organizationId,
    })

  memberWorkspaces = await auth.api.listOrganizations({
    headers: input.headers,
  })

  return { workspace, planningTeam, memberWorkspaces }
}

export const ensurePersonalWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSessionMiddleware])
  .handler(async ({ context }) => {
    const headers = getRequestHeaders()
    const provisioned = await provisionPersonalWorkspace({
      headers,
      userId: context.user.id,
      userName: context.user.name,
      activeOrganizationId: context.session.activeOrganizationId,
    })
    const workspaces = await listAccessibleWorkspaces({
      userId: context.user.id,
      memberWorkspaces: provisioned.memberWorkspaces,
    })

    return {
      workspace: {
        id: provisioned.workspace.id,
        name: provisioned.workspace.name,
        slug: provisioned.workspace.slug,
        type: provisioned.workspace.workspaceType,
        access: "member" as const,
      },
      workspaces,
      planningTeam: {
        id: provisioned.planningTeam.id,
        name: provisioned.planningTeam.name,
      },
      user: context.user,
    }
  })

export const createWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSessionMiddleware])
  .validator(CreateWorkspaceInputSchema)
  .handler(async ({ data, context }) => {
    let disposableWorkspaceId: string | null = null
    let renamedWorkspace: { id: string; previousName: string } | null = null
    const headers = getRequestHeaders()
    try {
      const activeOrganizationId = context.session.activeOrganizationId
      const [activeWorkspace] = activeOrganizationId
        ? await db
            .select({
              id: organization.id,
              name: organization.name,
              slug: organization.slug,
              workspaceType: organization.workspaceType,
            })
            .from(organization)
            .innerJoin(
              member,
              and(
                eq(member.organizationId, organization.id),
                eq(member.userId, context.user.id),
              ),
            )
            .where(eq(organization.id, activeOrganizationId))
            .limit(1)
        : []
      const [activeMainEvent] = activeWorkspace
        ? await db
            .select({ id: event.id })
            .from(event)
            .where(
              and(
                eq(event.organizationId, activeWorkspace.id),
                isNull(event.parentEventId),
              ),
            )
            .limit(1)
        : []

      let workspace =
        activeWorkspace?.workspaceType === "personal" && !activeMainEvent
          ? activeWorkspace
          : null

      if (workspace) {
        renamedWorkspace = {
          id: workspace.id,
          previousName: workspace.name,
        }
        await db
          .update(organization)
          .set({ name: data.eventName })
          .where(eq(organization.id, workspace.id))
        workspace = { ...workspace, name: data.eventName }
      } else {
        workspace = await auth.api.createOrganization({
          headers,
          body: {
            name: data.eventName,
            slug: await availableWorkspaceSlug(data.eventName),
          },
        })
        disposableWorkspaceId = workspace.id
      }

      await auth.api.setActiveOrganization({
        headers,
        body: { organizationId: workspace.id },
      })
      await ensurePlanningTeam({
        organizationId: workspace.id,
        userId: context.user.id,
        headers,
      })

      await db.transaction(async (transaction) => {
        const [mainEvent] = await transaction
          .insert(event)
          .values({
            organizationId: workspace.id,
            parentEventId: null,
            title: data.eventName,
            status: "draft",
            purpose: null,
            planningStatus: null,
            category: null,
            startsAt: new Date(data.startsAt),
            endsAt: data.endsAt ? new Date(data.endsAt) : null,
            isAllDay: data.isAllDay,
            timeZone: data.timeZone,
            locationName: data.locationName || null,
            locationAddress: data.locationAddress || null,
            budgetCap: data.budgetCap ?? null,
            createdByUserId: context.user.id,
          })
          .returning({ id: event.id })

        if (!mainEvent) throw new Error("MAIN_EVENT_CREATE_FAILED")

        await transaction.insert(eventParticipant).values({
          eventId: mainEvent.id,
          userId: context.user.id,
          role: "host",
          planningPermission: "manage",
          attendanceStatus: "going",
        })

        await transaction
          .insert(workspacePlanningSettings)
          .values({
            organizationId: workspace.id,
            budgetCap: data.budgetCap ?? null,
          })
          .onConflictDoUpdate({
            target: workspacePlanningSettings.organizationId,
            set: {
              budgetCap: data.budgetCap ?? null,
              updatedAt: new Date(),
            },
          })
      })

      return {
        ok: true,
        data: { slug: workspace.slug },
      } as const
    } catch {
      if (disposableWorkspaceId) {
        await db
          .delete(organization)
          .where(eq(organization.id, disposableWorkspaceId))
          .catch(() => undefined)
        await auth.api
          .setActiveOrganization({
            headers,
            body: {
              organizationId: context.session.activeOrganizationId ?? null,
            },
          })
          .catch(() => undefined)
      } else if (renamedWorkspace) {
        await db
          .update(organization)
          .set({ name: renamedWorkspace.previousName })
          .where(eq(organization.id, renamedWorkspace.id))
          .catch(() => undefined)
      }
      return {
        ok: false,
        error: {
          userMessage: "The workspace could not be created. Try again.",
        },
      } as const
    }
  })

const ResolveWorkspaceInputSchema = z.object({
  slug: z.string().trim().min(1).max(160),
})

export const resolveWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSessionMiddleware])
  .validator(ResolveWorkspaceInputSchema)
  .handler(async ({ data, context }) => {
    const headers = getRequestHeaders()
    const memberWorkspaces = await auth.api.listOrganizations({ headers })
    const workspaces = await listAccessibleWorkspaces({
      userId: context.user.id,
      memberWorkspaces,
    })
    const workspace = workspaces.find(
      (candidate) => candidate.slug === data.slug,
    )

    if (!workspace) throw redirect({ to: "/" })

    let planningTeam: { id: string; name: string } | null = null
    if (workspace.access === "member") {
      if (workspace.id !== context.session.activeOrganizationId) {
        await auth.api.setActiveOrganization({
          headers,
          body: { organizationId: workspace.id },
        })
      }
      planningTeam = await ensurePlanningTeam({
        organizationId: workspace.id,
        userId: context.user.id,
        headers,
      })
    }

    return {
      workspace,
      workspaces,
      planningTeam,
      user: context.user,
    }
  })
