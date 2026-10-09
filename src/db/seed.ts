import { and, eq } from "drizzle-orm"

import { db, pool } from "@/db"
import {
  member,
  organization,
  team,
  teamMember,
  user,
} from "@/db/schema/auth.schema"
import {
  event,
  eventInvitation,
  eventParticipant,
} from "@/db/schema/event.schema"
import { auth } from "@/lib/auth"

const developmentUsers = [
  {
    name: "Alex Morgan",
    email: "planner@gatherory.test",
    password: "password",
  },
  {
    name: "Jordan Lee",
    email: "jordan@gatherory.test",
    password: "password",
  },
  {
    name: "Maya Chen",
    email: "coordinator@gatherory.test",
    password: "password",
  },
  {
    name: "Sam Rivera",
    email: "guest@gatherory.test",
    password: "password",
  },
] as const

const eventIds = {
  main: "10000000-0000-4000-8000-000000000001",
  venueTour: "10000000-0000-4000-8000-000000000002",
  tasting: "10000000-0000-4000-8000-000000000003",
  rehearsal: "10000000-0000-4000-8000-000000000004",
  ceremony: "10000000-0000-4000-8000-000000000005",
  reception: "10000000-0000-4000-8000-000000000006",
  afterParty: "10000000-0000-4000-8000-000000000007",
} as const

type SeedUser = { id: string; name: string; email: string }

async function ensureDevelopmentUser(
  input: (typeof developmentUsers)[number],
): Promise<SeedUser> {
  const [existingUser] = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.email, input.email))
    .limit(1)

  if (existingUser) return existingUser

  const result = await auth.api.signUpEmail({ body: input })
  console.log(`Created development user: ${result.user.email}`)
  return result.user
}

function personalWorkspaceSlug(userId: string) {
  return `personal-${userId.toLowerCase().replaceAll(/[^a-z0-9]/g, "")}`
}

async function ensureWorkspace(owner: SeedUser) {
  const slug = personalWorkspaceSlug(owner.id)
  let [workspace] = await db
    .select({ id: organization.id, name: organization.name })
    .from(organization)
    .where(eq(organization.slug, slug))
    .limit(1)

  if (!workspace) {
    workspace = await auth.api.createOrganization({
      body: {
        name: "Alex & Jordan's Gatherory",
        slug,
        userId: owner.id,
      },
    })
  } else if (workspace.name !== "Alex & Jordan's Gatherory") {
    await db
      .update(organization)
      .set({ name: "Alex & Jordan's Gatherory" })
      .where(eq(organization.id, workspace.id))
  }

  const [ownerMembership] = await db
    .select({ id: member.id })
    .from(member)
    .where(
      and(
        eq(member.organizationId, workspace.id),
        eq(member.userId, owner.id),
      ),
    )
    .limit(1)

  if (!ownerMembership) {
    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: workspace.id,
      userId: owner.id,
      role: "owner",
      createdAt: new Date(),
    })
  }

  let [planningTeam] = await db
    .select({ id: team.id })
    .from(team)
    .where(
      and(
        eq(team.organizationId, workspace.id),
        eq(team.name, "Planning"),
      ),
    )
    .limit(1)

  if (!planningTeam) {
    const [createdTeam] = await db
      .insert(team)
      .values({
        id: crypto.randomUUID(),
        name: "Planning",
        organizationId: workspace.id,
        createdAt: new Date(),
      })
      .returning({ id: team.id })
    planningTeam = createdTeam
  }

  if (!planningTeam) throw new Error("Unable to seed the Planning team.")

  const [ownerTeamMembership] = await db
    .select({ id: teamMember.id })
    .from(teamMember)
    .where(
      and(
        eq(teamMember.teamId, planningTeam.id),
        eq(teamMember.userId, owner.id),
      ),
    )
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

  return workspace
}

async function seedEventWorkspace(input: {
  workspaceId: string
  users: readonly [SeedUser, SeedUser, SeedUser, SeedUser]
}) {
  const [alex, jordan, maya, sam] = input.users
  const shared = {
    organizationId: input.workspaceId,
    timeZone: "America/Detroit",
    createdByUserId: alex.id,
  } as const

  const eventRecords = [
    {
      ...shared,
      id: eventIds.main,
      parentEventId: null,
      title: "Alex & Jordan's Wedding",
      description:
        "A garden ceremony, dinner under the trees, and a full weekend with our favorite people.",
      status: "draft" as const,
      purpose: null,
      startsAt: new Date("2027-06-13T20:00:00.000Z"),
      endsAt: new Date("2027-06-14T05:00:00.000Z"),
      locationName: "Willow & Stone Estate",
      locationAddress: "Ann Arbor, Michigan",
    },
    {
      ...shared,
      id: eventIds.venueTour,
      parentEventId: eventIds.main,
      title: "Final venue walkthrough",
      description: "Confirm the ceremony layout and rain plan.",
      status: "draft" as const,
      purpose: "planning_scouting" as const,
      startsAt: new Date("2027-01-16T16:00:00.000Z"),
      endsAt: new Date("2027-01-16T17:30:00.000Z"),
      locationName: "Willow & Stone Estate",
      locationAddress: "Ann Arbor, Michigan",
    },
    {
      ...shared,
      id: eventIds.tasting,
      parentEventId: eventIds.main,
      title: "Menu tasting",
      description: "Choose the dinner menu and late-night snack.",
      status: "draft" as const,
      purpose: "planning_scouting" as const,
      startsAt: new Date("2027-03-20T22:00:00.000Z"),
      endsAt: new Date("2027-03-21T00:00:00.000Z"),
      locationName: "Juniper Kitchen",
      locationAddress: "Detroit, Michigan",
    },
    {
      ...shared,
      id: eventIds.rehearsal,
      parentEventId: eventIds.main,
      title: "Rehearsal dinner",
      description: "Dinner with the wedding party and immediate family.",
      status: "draft" as const,
      purpose: "part_of_event" as const,
      startsAt: new Date("2027-06-12T22:30:00.000Z"),
      endsAt: new Date("2027-06-13T01:00:00.000Z"),
      locationName: "The Common Table",
      locationAddress: "Ann Arbor, Michigan",
    },
    {
      ...shared,
      id: eventIds.ceremony,
      parentEventId: eventIds.main,
      title: "Ceremony",
      description: "The moment we make it official.",
      status: "draft" as const,
      purpose: "part_of_event" as const,
      startsAt: new Date("2027-06-13T20:00:00.000Z"),
      endsAt: new Date("2027-06-13T20:45:00.000Z"),
      locationName: "Willow & Stone Estate",
      locationAddress: "Ann Arbor, Michigan",
    },
    {
      ...shared,
      id: eventIds.reception,
      parentEventId: eventIds.main,
      title: "Dinner & reception",
      description: "Dinner, toasts, and dancing under the trees.",
      status: "draft" as const,
      purpose: "part_of_event" as const,
      startsAt: new Date("2027-06-13T21:30:00.000Z"),
      endsAt: new Date("2027-06-14T03:30:00.000Z"),
      locationName: "Willow & Stone Estate",
      locationAddress: "Ann Arbor, Michigan",
    },
    {
      ...shared,
      id: eventIds.afterParty,
      parentEventId: eventIds.main,
      title: "After-party",
      description: "One last round for anyone still dancing.",
      status: "draft" as const,
      purpose: "part_of_event" as const,
      startsAt: new Date("2027-06-14T04:00:00.000Z"),
      endsAt: new Date("2027-06-14T06:00:00.000Z"),
      locationName: "The Last Word",
      locationAddress: "Ann Arbor, Michigan",
    },
  ]

  for (const record of eventRecords) {
    await db
      .insert(event)
      .values(record)
      .onConflictDoUpdate({
        target: event.id,
        set: {
          organizationId: record.organizationId,
          parentEventId: record.parentEventId,
          title: record.title,
          description: record.description,
          status: record.status,
          purpose: record.purpose,
          startsAt: record.startsAt,
          endsAt: record.endsAt,
          timeZone: record.timeZone,
          locationName: record.locationName,
          locationAddress: record.locationAddress,
          updatedAt: new Date(),
        },
      })
  }

  const participantRecords = Object.values(eventIds).flatMap((eventId) => [
    {
      eventId,
      userId: alex.id,
      role: "host" as const,
      planningPermission: "manage" as const,
      attendanceStatus: "going" as const,
    },
    {
      eventId,
      userId: jordan.id,
      role: "host" as const,
      planningPermission: "manage" as const,
      attendanceStatus: "going" as const,
    },
    {
      eventId,
      userId: maya.id,
      role: "collaborator" as const,
      planningPermission: "contribute" as const,
      attendanceStatus: "going" as const,
    },
    {
      eventId,
      userId: sam.id,
      role: "guest" as const,
      planningPermission: "view_only" as const,
      attendanceStatus: "not_sure" as const,
    },
  ])

  for (const participant of participantRecords) {
    await db
      .insert(eventParticipant)
      .values(participant)
      .onConflictDoUpdate({
        target: [eventParticipant.eventId, eventParticipant.userId],
        set: {
          role: participant.role,
          planningPermission: participant.planningPermission,
          attendanceStatus: participant.attendanceStatus,
          updatedAt: new Date(),
        },
      })
  }

  const pendingEmail = "family@gatherory.test"
  const [pendingInvitation] = await db
    .select({ id: eventInvitation.id })
    .from(eventInvitation)
    .where(
      and(
        eq(eventInvitation.eventId, eventIds.main),
        eq(eventInvitation.email, pendingEmail),
        eq(eventInvitation.status, "pending"),
      ),
    )
    .limit(1)

  if (!pendingInvitation) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 14)
    await db.insert(eventInvitation).values({
      eventId: eventIds.main,
      email: pendingEmail,
      role: "guest",
      planningPermission: "view_only",
      invitedByUserId: alex.id,
      expiresAt,
    })
  }
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The development seed cannot run in production.")
  }

  const users = await Promise.all(developmentUsers.map(ensureDevelopmentUser))
  const typedUsers = users as [SeedUser, SeedUser, SeedUser, SeedUser]
  const workspace = await ensureWorkspace(typedUsers[0])
  await seedEventWorkspace({ workspaceId: workspace.id, users: typedUsers })

  console.log("Seeded Alex & Jordan's event workspace.")
  console.log("All development accounts use password: password")
}

main()
  .catch((error: unknown) => {
    console.error("Unable to seed the Gatherory database.", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
