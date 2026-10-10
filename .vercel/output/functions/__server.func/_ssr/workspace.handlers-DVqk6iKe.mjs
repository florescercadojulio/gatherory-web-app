import { o as getRequestHeaders, r as createServerFn } from "./ssr.mjs";
import { Cn as datetime, Fn as object, On as boolean, zn as string } from "../_libs/@better-auth/core+[...].mjs";
import { D as inArray, S as eq, _ as and, k as isNull } from "../_libs/@better-auth/drizzle-adapter+[...].mjs";
import { C as requireSessionMiddleware, O as workspacePlanningSettings, T as teamMember, b as organization, d as db, h as eventParticipant, l as auth, p as event, v as member } from "./auth.middleware-DPSGMhoZ.mjs";
import { t as createServerRpc } from "./createServerRpc-Bb8AUJau.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/workspace.handlers-DVqk6iKe.js
var CreateWorkspaceInputSchema = object({
	eventName: string().trim().min(2).max(120),
	startsAt: datetime(),
	endsAt: datetime().optional(),
	isAllDay: boolean().default(false),
	timeZone: string().trim().min(1).max(100),
	locationName: string().trim().max(160).optional(),
	locationAddress: string().trim().max(500).optional(),
	budgetCap: string().trim().regex(/^\d+(?:\.\d{1,2})?$/).optional()
}).refine((value) => !value.endsAt || new Date(value.endsAt) >= new Date(value.startsAt), {
	message: "The event end must be after its start.",
	path: ["endsAt"]
});
function personalWorkspaceSlug(userId) {
	return `personal-${userId.toLowerCase().replaceAll(/[^a-z0-9]/g, "")}`;
}
async function availableWorkspaceSlug(name) {
	const baseSlug = name.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "").slice(0, 80) || "workspace";
	const [existingWorkspace] = await db.select({ id: organization.id }).from(organization).where(eq(organization.slug, baseSlug)).limit(1);
	return existingWorkspace ? `${baseSlug}-${crypto.randomUUID().slice(0, 8)}` : baseSlug;
}
async function ensurePlanningTeam(input) {
	const planningTeam = (await auth.api.listOrganizationTeams({
		headers: input.headers,
		query: { organizationId: input.organizationId }
	})).find((team) => team.name === "Planning") ?? await auth.api.createTeam({
		headers: input.headers,
		body: {
			name: "Planning",
			organizationId: input.organizationId
		}
	});
	const [membership] = await db.select({ id: teamMember.id }).from(teamMember).where(and(eq(teamMember.teamId, planningTeam.id), eq(teamMember.userId, input.userId))).limit(1);
	if (!membership) await auth.api.addTeamMember({
		headers: input.headers,
		body: {
			teamId: planningTeam.id,
			userId: input.userId,
			organizationId: input.organizationId
		}
	});
	await auth.api.setActiveTeam({
		headers: input.headers,
		body: { teamId: planningTeam.id }
	});
	return planningTeam;
}
async function listAccessibleWorkspaces(input) {
	const memberWorkspaceIds = input.memberWorkspaces.map((workspace) => workspace.id);
	const configuredMemberWorkspaces = memberWorkspaceIds.length ? await db.selectDistinct({ id: organization.id }).from(organization).innerJoin(event, and(eq(event.organizationId, organization.id), isNull(event.parentEventId))).where(inArray(organization.id, memberWorkspaceIds)) : [];
	const configuredMemberIds = new Set(configuredMemberWorkspaces.map((workspace) => workspace.id));
	const participantWorkspaces = await db.selectDistinct({
		id: organization.id,
		name: organization.name,
		slug: organization.slug,
		type: organization.workspaceType
	}).from(organization).innerJoin(event, eq(event.organizationId, organization.id)).innerJoin(eventParticipant, and(eq(eventParticipant.eventId, event.id), eq(eventParticipant.userId, input.userId)));
	const workspaces = /* @__PURE__ */ new Map();
	for (const workspace of participantWorkspaces) workspaces.set(workspace.id, {
		...workspace,
		access: "participant"
	});
	for (const workspace of input.memberWorkspaces) {
		if (!configuredMemberIds.has(workspace.id)) continue;
		workspaces.set(workspace.id, {
			id: workspace.id,
			name: workspace.name,
			slug: workspace.slug,
			type: workspace.workspaceType,
			access: "member"
		});
	}
	return [...workspaces.values()].toSorted((left, right) => left.name.localeCompare(right.name));
}
async function provisionPersonalWorkspace(input) {
	let memberWorkspaces = await auth.api.listOrganizations({ headers: input.headers });
	let workspace = memberWorkspaces.find((candidate) => candidate.id === input.activeOrganizationId) ?? memberWorkspaces.find((candidate) => candidate.workspaceType === "personal") ?? memberWorkspaces[0];
	if (!workspace) try {
		workspace = await auth.api.createOrganization({
			headers: input.headers,
			body: {
				name: `${input.userName}'s Workspace`,
				slug: personalWorkspaceSlug(input.userId)
			}
		});
	} catch (error) {
		memberWorkspaces = await auth.api.listOrganizations({ headers: input.headers });
		const recoveredWorkspace = memberWorkspaces.find((candidate) => candidate.slug === personalWorkspaceSlug(input.userId));
		if (!recoveredWorkspace) throw error;
		workspace = recoveredWorkspace;
	}
	if (workspace.id !== input.activeOrganizationId) await auth.api.setActiveOrganization({
		headers: input.headers,
		body: { organizationId: workspace.id }
	});
	const planningTeam = await ensurePlanningTeam({
		organizationId: workspace.id,
		userId: input.userId,
		headers: input.headers
	});
	await db.insert(workspacePlanningSettings).values({ organizationId: workspace.id }).onConflictDoNothing({ target: workspacePlanningSettings.organizationId });
	memberWorkspaces = await auth.api.listOrganizations({ headers: input.headers });
	return {
		workspace,
		planningTeam,
		memberWorkspaces
	};
}
var ensurePersonalWorkspace_createServerFn_handler = createServerRpc({
	id: "0f444619df00ce59304dff2c1a3a5f9ad15c1d4aca70b224159cf0398f9a4640",
	name: "ensurePersonalWorkspace",
	filename: "src/server/workspaces/handlers/workspace.handlers.ts"
}, (opts) => ensurePersonalWorkspace.__executeServer(opts));
var ensurePersonalWorkspace = createServerFn({ method: "GET" }).middleware([requireSessionMiddleware]).handler(ensurePersonalWorkspace_createServerFn_handler, async ({ context }) => {
	const provisioned = await provisionPersonalWorkspace({
		headers: getRequestHeaders(),
		userId: context.user.id,
		userName: context.user.name,
		activeOrganizationId: context.session.activeOrganizationId
	});
	const workspaces = await listAccessibleWorkspaces({
		userId: context.user.id,
		memberWorkspaces: provisioned.memberWorkspaces
	});
	return {
		workspace: {
			id: provisioned.workspace.id,
			name: provisioned.workspace.name,
			slug: provisioned.workspace.slug,
			type: provisioned.workspace.workspaceType,
			access: "member"
		},
		workspaces,
		planningTeam: {
			id: provisioned.planningTeam.id,
			name: provisioned.planningTeam.name
		},
		user: context.user
	};
});
var createWorkspace_createServerFn_handler = createServerRpc({
	id: "32887a17f4d4edaba479ed42a689f75cee09e3a8940db35488dff7996f08564b",
	name: "createWorkspace",
	filename: "src/server/workspaces/handlers/workspace.handlers.ts"
}, (opts) => createWorkspace.__executeServer(opts));
var createWorkspace = createServerFn({ method: "POST" }).middleware([requireSessionMiddleware]).validator(CreateWorkspaceInputSchema).handler(createWorkspace_createServerFn_handler, async ({ data, context }) => {
	let disposableWorkspaceId = null;
	let renamedWorkspace = null;
	const headers = getRequestHeaders();
	try {
		const activeOrganizationId = context.session.activeOrganizationId;
		const [activeWorkspace] = activeOrganizationId ? await db.select({
			id: organization.id,
			name: organization.name,
			slug: organization.slug,
			workspaceType: organization.workspaceType
		}).from(organization).innerJoin(member, and(eq(member.organizationId, organization.id), eq(member.userId, context.user.id))).where(eq(organization.id, activeOrganizationId)).limit(1) : [];
		const [activeMainEvent] = activeWorkspace ? await db.select({ id: event.id }).from(event).where(and(eq(event.organizationId, activeWorkspace.id), isNull(event.parentEventId))).limit(1) : [];
		let workspace = activeWorkspace?.workspaceType === "personal" && !activeMainEvent ? activeWorkspace : null;
		if (workspace) {
			renamedWorkspace = {
				id: workspace.id,
				previousName: workspace.name
			};
			await db.update(organization).set({ name: data.eventName }).where(eq(organization.id, workspace.id));
			workspace = {
				...workspace,
				name: data.eventName
			};
		} else {
			workspace = await auth.api.createOrganization({
				headers,
				body: {
					name: data.eventName,
					slug: await availableWorkspaceSlug(data.eventName)
				}
			});
			disposableWorkspaceId = workspace.id;
		}
		await auth.api.setActiveOrganization({
			headers,
			body: { organizationId: workspace.id }
		});
		await ensurePlanningTeam({
			organizationId: workspace.id,
			userId: context.user.id,
			headers
		});
		await db.transaction(async (transaction) => {
			const [mainEvent] = await transaction.insert(event).values({
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
				createdByUserId: context.user.id
			}).returning({ id: event.id });
			if (!mainEvent) throw new Error("MAIN_EVENT_CREATE_FAILED");
			await transaction.insert(eventParticipant).values({
				eventId: mainEvent.id,
				userId: context.user.id,
				role: "host",
				planningPermission: "manage",
				attendanceStatus: "going"
			});
			await transaction.insert(workspacePlanningSettings).values({
				organizationId: workspace.id,
				budgetCap: data.budgetCap ?? null
			}).onConflictDoUpdate({
				target: workspacePlanningSettings.organizationId,
				set: {
					budgetCap: data.budgetCap ?? null,
					updatedAt: /* @__PURE__ */ new Date()
				}
			});
		});
		return {
			ok: true,
			data: { slug: workspace.slug }
		};
	} catch {
		if (disposableWorkspaceId) {
			await db.delete(organization).where(eq(organization.id, disposableWorkspaceId)).catch(() => void 0);
			await auth.api.setActiveOrganization({
				headers,
				body: { organizationId: context.session.activeOrganizationId ?? null }
			}).catch(() => void 0);
		} else if (renamedWorkspace) await db.update(organization).set({ name: renamedWorkspace.previousName }).where(eq(organization.id, renamedWorkspace.id)).catch(() => void 0);
		return {
			ok: false,
			error: { userMessage: "The workspace could not be created. Try again." }
		};
	}
});
var ResolveWorkspaceInputSchema = object({ slug: string().trim().min(1).max(160) });
var resolveWorkspace_createServerFn_handler = createServerRpc({
	id: "1888708c164f08e135af180def1b4b9b4b4098e34201b5b48b60b5e524b2a441",
	name: "resolveWorkspace",
	filename: "src/server/workspaces/handlers/workspace.handlers.ts"
}, (opts) => resolveWorkspace.__executeServer(opts));
var resolveWorkspace = createServerFn({ method: "GET" }).middleware([requireSessionMiddleware]).validator(ResolveWorkspaceInputSchema).handler(resolveWorkspace_createServerFn_handler, async ({ data, context }) => {
	const headers = getRequestHeaders();
	const memberWorkspaces = await auth.api.listOrganizations({ headers });
	const workspaces = await listAccessibleWorkspaces({
		userId: context.user.id,
		memberWorkspaces
	});
	const workspace = workspaces.find((candidate) => candidate.slug === data.slug);
	if (!workspace) return null;
	let planningTeam = null;
	if (workspace.access === "member") {
		if (workspace.id !== context.session.activeOrganizationId) await auth.api.setActiveOrganization({
			headers,
			body: { organizationId: workspace.id }
		});
		planningTeam = await ensurePlanningTeam({
			organizationId: workspace.id,
			userId: context.user.id,
			headers
		});
	}
	return {
		workspace,
		workspaces,
		planningTeam,
		user: context.user
	};
});
//#endregion
export { createWorkspace_createServerFn_handler, ensurePersonalWorkspace_createServerFn_handler, resolveWorkspace_createServerFn_handler };
