import { ServerOperationError } from "@/lib/domain-errors"
import { and, eq } from "drizzle-orm"
import { reset } from "drizzle-seed"

import { db, pool } from "@/db"
import * as authSchema from "@/db/schema/auth.schema"
import {
  member,
  organization,
  team,
  teamMember,
  user,
} from "@/db/schema/auth.schema"
import * as eventSchema from "@/db/schema/event.schema"
import {
  event,
  eventInvitation,
  eventParticipant,
  workspacePerson,
} from "@/db/schema/event.schema"
import * as mediaSchema from "@/db/schema/media.schema"
import * as planningSchema from "@/db/schema/planning.schema"
import {
  eventExpense,
  eventNote,
  idea,
  ideaDecision,
  ideaMusicTrack,
  musicTrack,
  registryItem,
  workspacePlanningSettings,
} from "@/db/schema/planning.schema"
import * as syncSchema from "@/db/schema/sync.schema"
import {
  createReviewWorkspaceArchive,
  encodeNativeWorkspaceSnapshot,
  reviewWorkspaceIds,
} from "@/db/review-workspace-fixture"
import { auth } from "@/lib/auth"
import { createEventWorkspace } from "@/server/workspaces/create-event-workspace"

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
  // This is intentionally a local review fixture. Keep the actual App Review
  // credentials in App Store Connect; this seed always refuses production.
  {
    name: "Gatherory App Review",
    email: "appreview@gatherory.test",
    password: "password",
  },
] as const

const eventIds = reviewWorkspaceIds.events
const planningIds = reviewWorkspaceIds.planning
const personIds = reviewWorkspaceIds.people

type SeedUser = { id: string; name: string; email: string }

async function ensureDevelopmentUser(
  input: (typeof developmentUsers)[number],
): Promise<SeedUser> {
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
      await db
        .update(user)
        .set({ emailVerified: true })
        .where(eq(user.id, existingUser.id))
    }

    return existingUser
  }

  const result = await auth.api.signUpEmail({ body: input })
  await db
    .update(user)
    .set({ emailVerified: true })
    .where(eq(user.id, result.user.id))
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
    workspace = await createEventWorkspace({
      name: "Alex & Jordan's Gatherory",
      slug,
      userId: owner.id,
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
      and(eq(member.organizationId, workspace.id), eq(member.userId, owner.id)),
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
      and(eq(team.organizationId, workspace.id), eq(team.name, "Planning")),
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

  if (!planningTeam) throw new ServerOperationError({ category: "system", code: "SEED_FAILED", debugMessage: "Unable to seed the Planning team." })

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
    .where(
      and(
        eq(member.organizationId, input.workspaceId),
        eq(member.userId, input.reviewer.id),
      ),
    )
    .limit(1)

  if (!existingMembership) {
    await db.insert(member).values({
      id: crypto.randomUUID(),
      organizationId: input.workspaceId,
      userId: input.reviewer.id,
      // Full access lets App Review exercise every organizer workflow.
      role: "owner",
      createdAt: new Date(),
    })
  }

  const [existingTeamMembership] = await db
    .select({ id: teamMember.id })
    .from(teamMember)
    .where(
      and(
        eq(teamMember.teamId, input.planningTeamId),
        eq(teamMember.userId, input.reviewer.id),
      ),
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

/**
 * iOS reads a versioned native snapshot during its first cloud bootstrap;
 * the web app reads the normalized rows seeded below. Write both sides so the
 * local App Review fixture opens as a populated workspace on either client.
 */
async function seedNativeReviewWorkspace(input: {
  workspaceId: string
  users: readonly [SeedUser, SeedUser, SeedUser, SeedUser, SeedUser]
}) {
  const [alex, jordan, maya, sam, reviewer] = input.users
  const archive = createReviewWorkspaceArchive({ users: input.users })

  await db
    .insert(syncSchema.nativeWorkspaceSnapshot)
    .values({
      scopeId: eventIds.main,
      ownerUserId: alex.id,
      organizationId: input.workspaceId,
      payload: encodeNativeWorkspaceSnapshot(archive),
      serverVersion: 1,
      isDeleted: false,
    })
    .onConflictDoUpdate({
      target: syncSchema.nativeWorkspaceSnapshot.scopeId,
      set: {
        ownerUserId: alex.id,
        organizationId: input.workspaceId,
        payload: encodeNativeWorkspaceSnapshot(archive),
        serverVersion: 1,
        isDeleted: false,
        updatedAt: new Date(),
      },
    })

  const scopeMembers = [
    { userId: alex.id, role: "owner" as const },
    { userId: jordan.id, role: "owner" as const },
    { userId: maya.id, role: "editor" as const },
    { userId: sam.id, role: "viewer" as const },
    // App Review can exercise organizer flows without needing Alex's account.
    { userId: reviewer.id, role: "owner" as const },
  ]

  for (const scopeMember of scopeMembers) {
    await db
      .insert(syncSchema.nativeSyncScopeMember)
      .values({ scopeId: eventIds.main, ...scopeMember })
      .onConflictDoUpdate({
        target: [
          syncSchema.nativeSyncScopeMember.scopeId,
          syncSchema.nativeSyncScopeMember.userId,
        ],
        set: { role: scopeMember.role, updatedAt: new Date() },
      })
  }
}

async function seedEventWorkspace(input: {
  workspaceId: string
  users: readonly [SeedUser, SeedUser, SeedUser, SeedUser, SeedUser]
}) {
  const [alex, jordan, maya, sam, appReview] = input.users
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
      planningStatus: null,
      category: null,
      startsAt: new Date("2027-06-13T20:00:00.000Z"),
      endsAt: new Date("2027-06-14T05:00:00.000Z"),
      locationName: "Willow & Stone Estate",
      locationAddress: "Ann Arbor, Michigan",
      budgetCap: "30000.00",
    },
    {
      ...shared,
      id: eventIds.venueTour,
      parentEventId: eventIds.main,
      title: "Final venue walkthrough",
      description: "Confirm the ceremony layout and rain plan.",
      status: null,
      purpose: "planning_scouting" as const,
      planningStatus: "approved" as const,
      category: "venue" as const,
      startsAt: new Date("2027-01-16T16:00:00.000Z"),
      endsAt: new Date("2027-01-16T17:30:00.000Z"),
      locationName: "Willow & Stone Estate",
      locationAddress: "Ann Arbor, Michigan",
      budgetCap: "1500.00",
    },
    {
      ...shared,
      id: eventIds.tasting,
      parentEventId: eventIds.main,
      title: "Menu tasting",
      description: "Choose the dinner menu and late-night snack.",
      status: null,
      purpose: "planning_scouting" as const,
      planningStatus: "approved" as const,
      category: "food_tasting" as const,
      startsAt: new Date("2027-03-20T22:00:00.000Z"),
      endsAt: new Date("2027-03-21T00:00:00.000Z"),
      locationName: "Juniper Kitchen",
      locationAddress: "Detroit, Michigan",
      budgetCap: "800.00",
    },
    {
      ...shared,
      id: eventIds.rehearsal,
      parentEventId: eventIds.main,
      title: "Rehearsal dinner",
      description: "Dinner with the wedding party and immediate family.",
      status: null,
      purpose: "part_of_event" as const,
      planningStatus: "approved" as const,
      category: "rehearsal" as const,
      startsAt: new Date("2027-06-12T22:30:00.000Z"),
      endsAt: new Date("2027-06-13T01:00:00.000Z"),
      locationName: "The Common Table",
      locationAddress: "Ann Arbor, Michigan",
      budgetCap: "3500.00",
    },
    {
      ...shared,
      id: eventIds.ceremony,
      parentEventId: eventIds.main,
      title: "Ceremony",
      description: "The moment we make it official.",
      status: null,
      purpose: "part_of_event" as const,
      planningStatus: "approved" as const,
      category: "ceremony" as const,
      startsAt: new Date("2027-06-13T20:00:00.000Z"),
      endsAt: new Date("2027-06-13T20:45:00.000Z"),
      locationName: "Willow & Stone Estate",
      locationAddress: "Ann Arbor, Michigan",
      budgetCap: null,
    },
    {
      ...shared,
      id: eventIds.reception,
      parentEventId: eventIds.main,
      title: "Dinner & reception",
      description: "Dinner, toasts, and dancing under the trees.",
      status: null,
      purpose: "part_of_event" as const,
      planningStatus: "approved" as const,
      category: "reception" as const,
      startsAt: new Date("2027-06-13T21:30:00.000Z"),
      endsAt: new Date("2027-06-14T03:30:00.000Z"),
      locationName: "Willow & Stone Estate",
      locationAddress: "Ann Arbor, Michigan",
      budgetCap: "12000.00",
    },
    {
      ...shared,
      id: eventIds.afterParty,
      parentEventId: eventIds.main,
      title: "After-party",
      description: "One last round for anyone still dancing.",
      status: null,
      purpose: "part_of_event" as const,
      planningStatus: "approved" as const,
      category: "reception" as const,
      startsAt: new Date("2027-06-14T04:00:00.000Z"),
      endsAt: new Date("2027-06-14T06:00:00.000Z"),
      locationName: "The Last Word",
      locationAddress: "Ann Arbor, Michigan",
      budgetCap: "2000.00",
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
          planningStatus: record.planningStatus,
          category: record.category,
          startsAt: record.startsAt,
          endsAt: record.endsAt,
          timeZone: record.timeZone,
          locationName: record.locationName,
          locationAddress: record.locationAddress,
          budgetCap: record.budgetCap,
          updatedAt: new Date(),
        },
      })
  }

  const people = [
    { id: personIds.alex, account: alex },
    { id: personIds.jordan, account: jordan },
    { id: personIds.maya, account: maya },
    { id: personIds.sam, account: sam },
    { id: personIds.appReview, account: appReview },
  ]
  for (const person of people) {
    await db
      .insert(workspacePerson)
      .values({
        id: person.id,
        organizationId: input.workspaceId,
        userId: person.account.id,
        displayName: person.account.name,
        email: person.account.email.toLowerCase(),
      })
      .onConflictDoUpdate({
        target: workspacePerson.id,
        set: {
          userId: person.account.id,
          displayName: person.account.name,
          email: person.account.email.toLowerCase(),
          updatedAt: new Date(),
        },
      })
  }

  const participantRecords = Object.values(eventIds).flatMap((eventId) => [
    {
      eventId,
      personId: personIds.alex,
      role: "host" as const,
      planningPermission: "manage" as const,
      attendanceStatus: "going" as const,
    },
    {
      eventId,
      personId: personIds.jordan,
      role: "host" as const,
      planningPermission: "manage" as const,
      attendanceStatus: "going" as const,
    },
    {
      eventId,
      personId: personIds.maya,
      role: "collaborator" as const,
      planningPermission: "contribute" as const,
      attendanceStatus: "going" as const,
    },
    {
      eventId,
      personId: personIds.sam,
      role: "guest" as const,
      planningPermission: "view_only" as const,
      attendanceStatus: "not_sure" as const,
    },
    {
      eventId,
      personId: personIds.appReview,
      role: "host" as const,
      planningPermission: "manage" as const,
      attendanceStatus: "going" as const,
    },
  ])

  for (const participant of participantRecords) {
    await db
      .insert(eventParticipant)
      .values(participant)
      .onConflictDoUpdate({
        target: [eventParticipant.eventId, eventParticipant.personId],
        set: {
          role: participant.role,
          planningPermission: participant.planningPermission,
          attendanceStatus: participant.attendanceStatus,
          updatedAt: new Date(),
        },
      })
  }

  await db
    .insert(workspacePlanningSettings)
    .values({
      organizationId: input.workspaceId,
      budgetCap: "30000.00",
    })
    .onConflictDoUpdate({
      target: workspacePlanningSettings.organizationId,
      set: { budgetCap: "30000.00", updatedAt: new Date() },
    })

  const ideaRecords = [
    {
      id: planningIds.venueIdea,
      organizationId: input.workspaceId,
      eventId: eventIds.main,
      category: "venue" as const,
      status: "approved" as const,
      title: "Willow & Stone Estate",
      note: "Garden ceremony, dinner under the trees, and a weather-ready indoor space.",
      estimatedCost: "14500.00",
      configuration: {
        version: 1 as const,
        setting: "both",
        capacity: 140,
        area: "Ann Arbor",
      },
      submittedByUserId: alex.id,
    },
    {
      id: planningIds.musicIdea,
      organizationId: input.workspaceId,
      eventId: eventIds.main,
      category: "music" as const,
      status: "shortlisted" as const,
      title: "First dance song",
      note: "A warm, easy song for the first dance.",
      estimatedCost: null,
      configuration: { version: 1 as const },
      submittedByUserId: jordan.id,
    },
    {
      id: planningIds.attireIdea,
      organizationId: input.workspaceId,
      eventId: eventIds.main,
      category: "attire" as const,
      status: "maybe" as const,
      title: null,
      note: "Comfortable shoes encouraged for the lawn.",
      estimatedCost: null,
      configuration: {
        version: 1 as const,
        style: "garden",
        restrictions: "Avoid white and ivory.",
      },
      submittedByUserId: maya.id,
    },
    {
      id: planningIds.registryIdea,
      organizationId: input.workspaceId,
      eventId: eventIds.main,
      category: "registry" as const,
      status: "approved" as const,
      title: "Weekend getaway fund",
      note: "Help us plan a quiet first trip after the wedding.",
      estimatedCost: "1500.00",
      configuration: {
        version: 1 as const,
        category: "cash_fund",
        quantity: 1,
      },
      submittedByUserId: alex.id,
    },
    {
      id: planningIds.linkIdea,
      organizationId: input.workspaceId,
      eventId: eventIds.main,
      category: "link" as const,
      status: "shortlisted" as const,
      title: "Wedding weekend guide",
      note: "Travel notes, arrival details, and our favorite Ann Arbor stops.",
      estimatedCost: null,
      configuration: { version: 1 as const, url: "https://gatherory.com" },
      submittedByUserId: jordan.id,
    },
    {
      id: planningIds.eventIdea,
      organizationId: input.workspaceId,
      eventId: eventIds.main,
      category: "event" as const,
      status: "maybe" as const,
      title: "Welcome drinks",
      note: "An easy Friday evening gathering for everyone arriving early.",
      estimatedCost: "850.00",
      configuration: { version: 1 as const, purpose: "welcome" },
      submittedByUserId: maya.id,
    },
    {
      id: planningIds.flowersIdea,
      organizationId: input.workspaceId,
      eventId: eventIds.main,
      category: "flowers" as const,
      status: "shortlisted" as const,
      title: "Garden rose arrangements",
      note: "Loose roses, olive branches, and soft seasonal greens for the tables.",
      estimatedCost: "2800.00",
      configuration: { version: 1 as const, focus: "tables" },
      submittedByUserId: alex.id,
    },
    {
      id: planningIds.foodIdea,
      organizationId: input.workspaceId,
      eventId: eventIds.main,
      category: "food" as const,
      status: "maybe" as const,
      title: "Family-style dinner",
      note: "A seasonal dinner with vegetarian and gluten-free options for every guest.",
      estimatedCost: "7200.00",
      configuration: { version: 1 as const, type: "meal" },
      submittedByUserId: sam.id,
    },
    {
      id: planningIds.photographyIdea,
      organizationId: input.workspaceId,
      eventId: eventIds.main,
      category: "photography" as const,
      status: "approved" as const,
      title: "Golden-hour portraits",
      note: "Reserve a few quiet minutes before dinner for portraits in the garden.",
      estimatedCost: "1200.00",
      configuration: { version: 1 as const, style: "documentary" },
      submittedByUserId: maya.id,
    },
    {
      id: planningIds.decorIdea,
      organizationId: input.workspaceId,
      eventId: eventIds.main,
      category: "decor" as const,
      status: "shortlisted" as const,
      title: "Candlelit reception tables",
      note: "Layered glass votives and low arrangements to keep every conversation open.",
      estimatedCost: "950.00",
      configuration: { version: 1 as const, focus: "reception" },
      submittedByUserId: jordan.id,
    },
    {
      id: planningIds.invitationsIdea,
      organizationId: input.workspaceId,
      eventId: eventIds.main,
      category: "invitations" as const,
      status: "approved" as const,
      title: "Watercolor invitations",
      note: "Soft botanical stationery that carries the garden setting into every invitation.",
      estimatedCost: "650.00",
      configuration: { version: 1 as const, format: "printed" },
      submittedByUserId: alex.id,
    },
    {
      id: planningIds.honeymoonIdea,
      organizationId: input.workspaceId,
      eventId: eventIds.main,
      category: "honeymoon" as const,
      status: "maybe" as const,
      title: "Amalfi coast escape",
      note: "A slow, sunlit first trip after the celebration.",
      estimatedCost: "6000.00",
      configuration: { version: 1 as const, style: "relaxing" },
      submittedByUserId: jordan.id,
    },
    {
      id: planningIds.otherIdea,
      organizationId: input.workspaceId,
      eventId: eventIds.main,
      category: "other" as const,
      status: "new" as const,
      title: "Late-night coffee bar",
      note: "An espresso cart and small treats for the last dance set.",
      estimatedCost: "500.00",
      configuration: { version: 1 as const },
      submittedByUserId: sam.id,
    },
  ]

  for (const record of ideaRecords) {
    await db
      .insert(idea)
      .values(record)
      .onConflictDoUpdate({
        target: idea.id,
        set: {
          status: record.status,
          title: record.title,
          note: record.note,
          estimatedCost: record.estimatedCost,
          configuration: record.configuration,
          updatedAt: new Date(),
        },
      })
  }

  await db
    .insert(ideaDecision)
    .values({
      ideaId: planningIds.musicIdea,
      userId: alex.id,
      choice: "love",
    })
    .onConflictDoUpdate({
      target: [ideaDecision.ideaId, ideaDecision.userId],
      set: { choice: "love", updatedAt: new Date() },
    })

  await db
    .insert(musicTrack)
    .values({
      id: planningIds.musicTrack,
      provider: "apple_music",
      providerTrackId: "i.4YBN1YWf2a62bq9",
      title: "BABYDOLL (Speed)",
      artistName: "Ari Abdul",
      albumTitle: "BABYDOLL (Speed) - Single",
      artworkUrl:
        "musicKit://artwork/library/4B2C9115-D692-4636-BDB7-31676E1FB4AB/600x600?aat=Music126%2Fv4%2F23%2F73%2F2f%2F23732f5f%2D181f%2D2bbd%2Dfeb5%2D3ab42eb958ff%2F196589059925%2Ejpg&at=item&id=316369963290033991&lid=4B2C9115%2DD692%2D4636%2DBDB7%2D31676E1FB4AB&mt=music",
      durationMs: 156651,
    })
    .onConflictDoNothing({ target: musicTrack.id })

  await db
    .insert(ideaMusicTrack)
    .values({
      ideaId: planningIds.musicIdea,
      musicTrackId: planningIds.musicTrack,
      sortOrder: 0,
    })
    .onConflictDoNothing({
      target: [ideaMusicTrack.ideaId, ideaMusicTrack.musicTrackId],
    })

  await db
    .insert(eventExpense)
    .values({
      id: planningIds.venueExpense,
      organizationId: input.workspaceId,
      eventId: eventIds.main,
      sourceIdeaId: planningIds.venueIdea,
      title: "Venue deposit",
      amount: "3500.00",
      category: "venue",
      status: "committed",
      createdByUserId: alex.id,
    })
    .onConflictDoUpdate({
      target: eventExpense.id,
      set: { amount: "3500.00", status: "committed", updatedAt: new Date() },
    })

  await db
    .insert(eventNote)
    .values({
      id: planningIds.eventNote,
      organizationId: input.workspaceId,
      eventId: eventIds.main,
      authorUserId: alex.id,
      body: "The venue walkthrough is confirmed. Meet at the garden entrance.",
    })
    .onConflictDoNothing({ target: eventNote.id })

  await db
    .insert(registryItem)
    .values({
      id: planningIds.registryItem,
      organizationId: input.workspaceId,
      eventId: eventIds.main,
      sourceIdeaId: planningIds.registryIdea,
      title: "Weekend getaway fund",
      note: "A quiet first trip after the wedding.",
      category: "cash_fund",
      price: "1500.00",
      quantity: 1,
      createdByUserId: alex.id,
    })
    .onConflictDoUpdate({
      target: registryItem.id,
      set: { price: "1500.00", updatedAt: new Date() },
    })

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
    await db
      .insert(workspacePerson)
      .values({
        id: personIds.pendingGuest,
        organizationId: input.workspaceId,
        displayName: "Invited Family",
        email: pendingEmail,
      })
      .onConflictDoNothing({ target: workspacePerson.id })
    await db.insert(eventInvitation).values({
      eventId: eventIds.main,
      personId: personIds.pendingGuest,
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
    throw new ServerOperationError({ category: "system", code: "SEED_FAILED", debugMessage: "The development seed cannot run in production." })
  }

  console.log("Resetting database...")
  await reset(db, {
    ...authSchema,
    ...eventSchema,
    ...mediaSchema,
    ...planningSchema,
    ...syncSchema,
  })

  const users = await Promise.all(developmentUsers.map(ensureDevelopmentUser))
  const typedUsers = users as [SeedUser, SeedUser, SeedUser, SeedUser, SeedUser]
  const { workspace, planningTeam } = await ensureWorkspace(typedUsers[0])
  await ensureReviewAccess({
    workspaceId: workspace.id,
    planningTeamId: planningTeam.id,
    reviewer: typedUsers[4],
  })
  await seedEventWorkspace({ workspaceId: workspace.id, users: typedUsers })
  await seedNativeReviewWorkspace({
    workspaceId: workspace.id,
    users: typedUsers,
  })
  await db
    .update(user)
    .set({ hasCompletedOnboarding: true })
    .where(eq(user.id, typedUsers[0].id))
  await db
    .update(user)
    .set({ hasCompletedOnboarding: true })
    .where(eq(user.id, typedUsers[4].id))

  console.log("Seeded Alex & Jordan's event workspace.")
  console.log("All development accounts use password: password")
  console.log("App Review fixture: appreview@gatherory.test / password")
  console.log(
    "The review fixture starts in the seeded workspace; contextual onboarding primers remain unseen on a clean app install.",
  )
}

main()
  .catch((error: unknown) => {
    console.error("Unable to seed the Gatherory database.", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
