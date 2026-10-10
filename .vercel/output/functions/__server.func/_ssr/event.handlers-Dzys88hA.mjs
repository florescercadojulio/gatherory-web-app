import { r as createServerFn } from "./ssr.mjs";
import { D as inArray, J as sql, S as eq, _ as and, h as asc, k as isNull } from "../_libs/@better-auth/drizzle-adapter+[...].mjs";
import { C as Service, _ as succeed, a as gen, c as provide, g as effect, h as void_, i as fail, n as catchTag, s as map } from "../_libs/effect.mjs";
import { C as requireSessionMiddleware, D as user, E as tryPersistence, a as InvalidInputError, b as organization, d as db, h as eventParticipant, i as ForbiddenError, m as eventInvitation, p as event, r as EntityNotFoundError, t as ConflictError, u as createAccessControl, v as member, w as runServerEffect } from "./auth.middleware-DPSGMhoZ.mjs";
import { a as ListEventsInputSchema, i as InviteEventParticipantInputSchema, n as CreateEventInputSchema, r as EventService, t as AcceptEventInvitationInputSchema } from "./event.service-BzanlUfC.mjs";
import { t as createServerRpc } from "./createServerRpc-Bb8AUJau.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/event.handlers-Dzys88hA.js
var acceptEventInvitationWorkflow = (input) => gen(function* () {
	return yield* (yield* EventService).acceptInvitation(input);
});
var createEventWorkflow = (input) => gen(function* () {
	return yield* (yield* EventService).create({
		organizationId: input.organizationId,
		userId: input.userId
	}, input.event);
});
var listEventsWorkflow = (input) => gen(function* () {
	return (yield* (yield* EventService).list(input)).map((item) => ({
		...item,
		startsAt: item.startsAt?.toISOString() ?? null,
		endsAt: item.endsAt?.toISOString() ?? null,
		childEvents: item.childEvents.map((child) => ({
			...child,
			startsAt: child.startsAt?.toISOString() ?? null,
			endsAt: child.endsAt?.toISOString() ?? null
		}))
	}));
});
var inviteEventParticipantWorkflow = (input) => gen(function* () {
	return yield* (yield* EventService).inviteParticipant(input.userId, input.invitation);
});
var planningPermissionToDatabase = {
	manage: "manage",
	contribute: "contribute",
	viewOnly: "view_only"
};
async function hasWorkspaceMembership(input) {
	const [membership] = await db.select({ id: member.id }).from(member).where(and(eq(member.organizationId, input.organizationId), eq(member.userId, input.userId))).limit(1);
	return Boolean(membership);
}
async function getEventParticipant(input) {
	const [participant] = await db.select({
		role: eventParticipant.role,
		planningPermission: eventParticipant.planningPermission
	}).from(eventParticipant).where(and(eq(eventParticipant.eventId, input.eventId), eq(eventParticipant.userId, input.userId))).limit(1);
	return participant;
}
async function createEventWithParticipants(input) {
	return db.transaction(async (transaction) => {
		let inheritedParticipants = [];
		if (input.event.parentEventId) {
			const [parent] = await transaction.select({
				id: event.id,
				parentEventId: event.parentEventId,
				organizationId: event.organizationId
			}).from(event).where(and(eq(event.id, input.event.parentEventId), eq(event.organizationId, input.organizationId))).limit(1);
			if (!parent) throw new Error("EVENT_PARENT_NOT_FOUND");
			if (parent.parentEventId) throw new Error("EVENT_DEPTH_EXCEEDED");
			inheritedParticipants = await transaction.select({
				userId: eventParticipant.userId,
				role: eventParticipant.role,
				planningPermission: eventParticipant.planningPermission,
				attendanceStatus: eventParticipant.attendanceStatus
			}).from(eventParticipant).where(eq(eventParticipant.eventId, parent.id));
		}
		const [createdEvent] = await transaction.insert(event).values({
			organizationId: input.organizationId,
			parentEventId: input.event.parentEventId ?? null,
			title: input.event.title,
			description: input.event.description,
			imageUrl: input.event.imageUrl,
			status: input.event.parentEventId ? null : "draft",
			purpose: input.event.purpose ?? null,
			category: "category" in input.event ? input.event.category : null,
			planningStatus: "planningStatus" in input.event ? input.event.planningStatus : null,
			startsAt: input.event.startsAt ? new Date(input.event.startsAt) : void 0,
			endsAt: input.event.endsAt ? new Date(input.event.endsAt) : void 0,
			timeZone: input.event.timeZone,
			locationName: input.event.locationName,
			locationAddress: input.event.locationAddress,
			createdByUserId: input.userId
		}).returning({
			id: event.id,
			title: event.title,
			status: event.status,
			parentEventId: event.parentEventId
		});
		if (!createdEvent) throw new Error("EVENT_CREATE_FAILED");
		if (inheritedParticipants.length) await transaction.insert(eventParticipant).values(inheritedParticipants.map((participant) => ({
			...participant,
			eventId: createdEvent.id
		})));
		else await transaction.insert(eventParticipant).values({
			eventId: createdEvent.id,
			userId: input.userId,
			role: "host",
			planningPermission: "manage",
			attendanceStatus: "going"
		});
		return createdEvent;
	});
}
async function listVisibleMainEvents(input) {
	const mainEvents = await db.select({
		id: event.id,
		workspaceName: organization.name,
		title: event.title,
		description: event.description,
		imageUrl: event.imageUrl,
		status: event.status,
		startsAt: event.startsAt,
		endsAt: event.endsAt,
		timeZone: event.timeZone,
		locationName: event.locationName
	}).from(event).innerJoin(eventParticipant, and(eq(eventParticipant.eventId, event.id), eq(eventParticipant.userId, input.userId))).innerJoin(organization, eq(organization.id, event.organizationId)).where(and(eq(event.organizationId, input.organizationId), isNull(event.parentEventId))).orderBy(asc(event.startsAt), asc(event.createdAt));
	if (!mainEvents.length) return [];
	const mainEventIds = mainEvents.map((item) => item.id);
	const childEvents = await db.select({
		id: event.id,
		parentEventId: event.parentEventId,
		title: event.title,
		purpose: event.purpose,
		status: event.planningStatus,
		startsAt: event.startsAt,
		endsAt: event.endsAt,
		timeZone: event.timeZone,
		locationName: event.locationName
	}).from(event).where(inArray(event.parentEventId, mainEventIds)).orderBy(asc(event.startsAt), asc(event.createdAt));
	const allEventIds = [...mainEventIds, ...childEvents.map((item) => item.id)];
	const [participants, invitations] = await Promise.all([db.select({
		eventId: eventParticipant.eventId,
		id: user.id,
		name: user.name,
		image: user.image,
		role: eventParticipant.role,
		planningPermission: eventParticipant.planningPermission,
		attendanceStatus: eventParticipant.attendanceStatus
	}).from(eventParticipant).innerJoin(user, eq(user.id, eventParticipant.userId)).where(inArray(eventParticipant.eventId, allEventIds)), db.select({ eventId: eventInvitation.eventId }).from(eventInvitation).where(and(inArray(eventInvitation.eventId, allEventIds), eq(eventInvitation.status, "pending")))]);
	const participantsByEvent = Map.groupBy(participants, (participant) => participant.eventId);
	const invitationsByEvent = Map.groupBy(invitations, (invitation) => invitation.eventId);
	const childrenByParent = Map.groupBy(childEvents, (child) => child.parentEventId);
	return mainEvents.map((mainEvent) => {
		if (!mainEvent.status) throw new Error("MAIN_EVENT_STATUS_MISSING");
		const status = mainEvent.status;
		const eventParticipants = (participantsByEvent.get(mainEvent.id) ?? []).map(({ eventId: _eventId, ...participant }) => participant);
		const currentParticipant = eventParticipants.find((participant) => participant.id === input.userId);
		if (!currentParticipant) throw new Error("EVENT_PARTICIPANT_NOT_FOUND");
		return {
			...mainEvent,
			status,
			pendingInvitationCount: invitationsByEvent.get(mainEvent.id)?.length ?? 0,
			currentParticipant,
			participants: eventParticipants,
			childEvents: (childrenByParent.get(mainEvent.id) ?? []).flatMap((child) => {
				if (!child.purpose || !child.status) return [];
				const status = child.status;
				const { parentEventId: _parentEventId, ...childEvent } = child;
				return [{
					...childEvent,
					status,
					purpose: child.purpose,
					participantCount: participantsByEvent.get(child.id)?.length ?? 0
				}];
			})
		};
	});
}
async function createEventInvitation(input) {
	const expiresAt = /* @__PURE__ */ new Date();
	expiresAt.setDate(expiresAt.getDate() + 14);
	const [invitation] = await db.insert(eventInvitation).values({
		eventId: input.invitation.eventId,
		email: input.invitation.email,
		role: input.invitation.role,
		planningPermission: planningPermissionToDatabase[input.invitation.planningPermission],
		invitedByUserId: input.actorUserId,
		expiresAt
	}).onConflictDoUpdate({
		target: [eventInvitation.eventId, eventInvitation.email],
		targetWhere: sql`${eventInvitation.status} = 'pending'`,
		set: {
			role: input.invitation.role,
			planningPermission: planningPermissionToDatabase[input.invitation.planningPermission],
			invitedByUserId: input.actorUserId,
			expiresAt,
			updatedAt: /* @__PURE__ */ new Date()
		}
	}).returning({
		id: eventInvitation.id,
		token: eventInvitation.token,
		email: eventInvitation.email,
		expiresAt: eventInvitation.expiresAt
	});
	if (!invitation) throw new Error("EVENT_INVITATION_CREATE_FAILED");
	return invitation;
}
async function acceptEventInvitation$1(input) {
	return db.transaction(async (transaction) => {
		const [pendingInvitation] = await transaction.select({
			id: eventInvitation.id,
			eventId: eventInvitation.eventId,
			email: eventInvitation.email,
			role: eventInvitation.role,
			planningPermission: eventInvitation.planningPermission,
			expiresAt: eventInvitation.expiresAt
		}).from(eventInvitation).where(and(eq(eventInvitation.token, input.invitation.token), eq(eventInvitation.status, "pending"))).limit(1);
		if (!pendingInvitation) throw new Error("EVENT_INVITATION_NOT_FOUND");
		if (pendingInvitation.expiresAt <= /* @__PURE__ */ new Date()) throw new Error("EVENT_INVITATION_EXPIRED");
		if (pendingInvitation.email !== input.userEmail.trim().toLowerCase()) throw new Error("EVENT_INVITATION_EMAIL_MISMATCH");
		if (!(await transaction.update(eventInvitation).set({
			status: "accepted",
			acceptedByUserId: input.userId,
			updatedAt: /* @__PURE__ */ new Date()
		}).where(and(eq(eventInvitation.id, pendingInvitation.id), eq(eventInvitation.status, "pending"))).returning({ id: eventInvitation.id }))[0]) throw new Error("EVENT_INVITATION_ALREADY_USED");
		await transaction.insert(eventParticipant).values({
			eventId: pendingInvitation.eventId,
			userId: input.userId,
			role: pendingInvitation.role,
			planningPermission: pendingInvitation.planningPermission
		}).onConflictDoNothing({ target: [eventParticipant.eventId, eventParticipant.userId] });
		return {
			eventId: pendingInvitation.eventId,
			role: pendingInvitation.role,
			planningPermission: pendingInvitation.planningPermission
		};
	});
}
/** Persistence contract consumed by the Event service. */
var EventRepo = class extends Service()("EventRepo") {};
function repositoryOperation(code, operation) {
	return tryPersistence(code, operation);
}
var EventRepoLive = succeed(EventRepo, {
	hasWorkspaceMembership: (input) => repositoryOperation("EVENT_WORKSPACE_MEMBERSHIP_QUERY_FAILED", () => hasWorkspaceMembership(input)),
	getEventParticipant: (input) => repositoryOperation("EVENT_PARTICIPANT_QUERY_FAILED", () => getEventParticipant(input)),
	createEventWithParticipants: (input) => repositoryOperation("EVENT_CREATE_FAILED", () => createEventWithParticipants(input)),
	listVisibleMainEvents: (input) => repositoryOperation("EVENT_LIST_FAILED", () => listVisibleMainEvents(input)),
	createEventInvitation: (input) => repositoryOperation("EVENT_INVITATION_CREATE_FAILED", () => createEventInvitation(input)),
	acceptEventInvitation: (input) => repositoryOperation("EVENT_INVITATION_ACCEPT_FAILED", () => acceptEventInvitation$1(input))
});
var eventAccessControl = createAccessControl({
	event: [
		"read",
		"create_child",
		"update",
		"delete",
		"manage_participants"
	],
	idea: [
		"read",
		"create",
		"update",
		"decide"
	],
	timeline: ["read", "manage"],
	registry: [
		"read",
		"manage",
		"commit"
	],
	media: [
		"read",
		"upload",
		"manage"
	],
	note: ["send"],
	attendance: ["respond"]
});
var viewerStatements = {
	event: ["read"],
	idea: ["read"],
	timeline: ["read"],
	registry: ["read", "commit"],
	media: ["read"],
	attendance: ["respond"]
};
var contributorStatements = {
	...viewerStatements,
	event: ["read", "create_child"],
	idea: [
		"read",
		"create",
		"update",
		"decide"
	],
	timeline: ["read", "manage"],
	media: ["read", "upload"],
	note: ["send"]
};
var managerStatements = {
	...contributorStatements,
	event: [
		"read",
		"create_child",
		"update",
		"delete",
		"manage_participants"
	],
	registry: [
		"read",
		"manage",
		"commit"
	],
	media: [
		"read",
		"upload",
		"manage"
	]
};
var eventAccessRoles = {
	viewer: eventAccessControl.newRole(viewerStatements),
	contributor: eventAccessControl.newRole(contributorStatements),
	manager: eventAccessControl.newRole(managerStatements),
	host: eventAccessControl.newRole(managerStatements)
};
function eventAccessRoleForParticipant(participant) {
	if (participant.role === "host") return "host";
	if (participant.role === "guest") return "viewer";
	if (participant.planningPermission === "manage") return "manager";
	if (participant.planningPermission === "contribute") return "contributor";
	return "viewer";
}
function hasEventPermission(participant, permissions) {
	return eventAccessRoles[eventAccessRoleForParticipant(participant)].authorize(permissions).success === true;
}
function planningPermissionFromDatabase(value) {
	return value === "view_only" ? "viewOnly" : value;
}
var EventAuthorization = class extends Service()("EventAuthorization") {};
var EventAuthorizationLive = succeed(EventAuthorization, { require: (participant, permissions) => hasEventPermission(participant, permissions) ? void_ : fail(new ForbiddenError({
	category: "authorization",
	code: "EVENT_PERMISSION_REQUIRED"
})) });
function persistenceCode(error) {
	return error.cause instanceof Error ? error.cause.message : void 0;
}
function translateCreateFailure(error) {
	switch (persistenceCode(error)) {
		case "EVENT_DEPTH_EXCEEDED": return fail(new ConflictError({
			category: "conflict",
			code: "EVENT_DEPTH_EXCEEDED",
			userMessage: "Events can only be nested one level deep."
		}));
		case "EVENT_PARENT_NOT_FOUND": return fail(new EntityNotFoundError({
			category: "not_found",
			code: "EVENT_PARENT_NOT_FOUND",
			userMessage: "The parent event could not be found."
		}));
		case "EVENT_FORBIDDEN": return fail(new ForbiddenError({
			category: "authorization",
			code: "EVENT_CREATE_FORBIDDEN",
			userMessage: "You do not have permission to create this event."
		}));
		default: return fail(error);
	}
}
function translateInvitationFailure(error) {
	switch (persistenceCode(error)) {
		case "EVENT_INVITATION_EMAIL_MISMATCH": return fail(new ForbiddenError({
			category: "authorization",
			code: "EVENT_INVITATION_EMAIL_MISMATCH",
			userMessage: "Sign in with the email address that was invited."
		}));
		case "EVENT_INVITATION_EXPIRED": return fail(new ConflictError({
			category: "conflict",
			code: "EVENT_INVITATION_EXPIRED",
			userMessage: "This invitation has expired. Ask the host for a new one."
		}));
		case "EVENT_INVITATION_NOT_FOUND":
		case "EVENT_INVITATION_ALREADY_USED": return fail(new EntityNotFoundError({
			category: "not_found",
			code: "EVENT_INVITATION_INVALID",
			userMessage: "This invitation is invalid or has already been used."
		}));
		default: return fail(error);
	}
}
var EventServiceLive = effect(EventService, gen(function* () {
	const repo = yield* EventRepo;
	const authorization = yield* EventAuthorization;
	return {
		create: (actor, event) => gen(function* () {
			if (event.parentEventId) {
				const participant = yield* repo.getEventParticipant({
					eventId: event.parentEventId,
					userId: actor.userId
				});
				if (!participant) return yield* fail(new ForbiddenError({
					category: "authorization",
					code: "PARENT_EVENT_PARTICIPANT_REQUIRED",
					userMessage: "You do not have access to the parent event."
				}));
				yield* authorization.require({
					role: participant.role,
					planningPermission: planningPermissionFromDatabase(participant.planningPermission)
				}, { event: ["create_child"] });
			} else if (!(yield* repo.hasWorkspaceMembership(actor))) return yield* fail(new ForbiddenError({
				category: "authorization",
				code: "WORKSPACE_MEMBERSHIP_REQUIRED",
				userMessage: "You do not have access to this workspace."
			}));
			return yield* repo.createEventWithParticipants({
				...actor,
				event
			}).pipe(catchTag("PersistenceError", translateCreateFailure));
		}),
		list: (actor) => repo.listVisibleMainEvents(actor),
		inviteParticipant: (userId, invitation) => gen(function* () {
			const participant = yield* repo.getEventParticipant({
				eventId: invitation.eventId,
				userId
			});
			if (!participant) return yield* fail(new ForbiddenError({
				category: "authorization",
				code: "EVENT_PARTICIPANT_REQUIRED",
				userMessage: "You do not have access to this event."
			}));
			yield* authorization.require({
				role: participant.role,
				planningPermission: planningPermissionFromDatabase(participant.planningPermission)
			}, { event: ["manage_participants"] });
			return yield* repo.createEventInvitation({
				actorUserId: userId,
				invitation
			});
		}),
		acceptInvitation: (input) => repo.acceptEventInvitation(input).pipe(catchTag("PersistenceError", translateInvitationFailure))
	};
}));
var provideEventLayers = (program) => program.pipe(provide(EventServiceLive), provide(EventRepoLive), provide(EventAuthorizationLive));
var createEvent_createServerFn_handler = createServerRpc({
	id: "054ea92b101a12b86c34af60651e01d28b976a8b4d1d95a6702f73857bac4827",
	name: "createEvent",
	filename: "src/server/events/handlers/event.handlers.ts"
}, (opts) => createEvent.__executeServer(opts));
var createEvent = createServerFn({ method: "POST" }).middleware([requireSessionMiddleware]).validator(CreateEventInputSchema).handler(createEvent_createServerFn_handler, ({ data, context }) => {
	const organizationId = context.session.activeOrganizationId;
	if (!organizationId) return runServerEffect(fail(new InvalidInputError({
		category: "validation",
		code: "ACTIVE_WORKSPACE_REQUIRED",
		userMessage: "Choose a workspace and try again."
	})));
	return runServerEffect(provideEventLayers(createEventWorkflow({
		organizationId,
		userId: context.user.id,
		event: data
	})));
});
var listEvents_createServerFn_handler = createServerRpc({
	id: "8b204c21af0fc3a1cb1f8bb66c3641607f7537a11efa75aa1ad779f25b3d8cbb",
	name: "listEvents",
	filename: "src/server/events/handlers/event.handlers.ts"
}, (opts) => listEvents.__executeServer(opts));
var listEvents = createServerFn({ method: "GET" }).middleware([requireSessionMiddleware]).validator(ListEventsInputSchema).handler(listEvents_createServerFn_handler, ({ data, context }) => runServerEffect(provideEventLayers(listEventsWorkflow({
	organizationId: data.organizationId,
	userId: context.user.id
}))));
var inviteEventParticipant_createServerFn_handler = createServerRpc({
	id: "39460b0515c6d8af169b8173348b107dadf82cfffc185ff78134676ec21a0d7c",
	name: "inviteEventParticipant",
	filename: "src/server/events/handlers/event.handlers.ts"
}, (opts) => inviteEventParticipant.__executeServer(opts));
var inviteEventParticipant = createServerFn({ method: "POST" }).middleware([requireSessionMiddleware]).validator(InviteEventParticipantInputSchema).handler(inviteEventParticipant_createServerFn_handler, ({ data, context }) => runServerEffect(provideEventLayers(inviteEventParticipantWorkflow({
	userId: context.user.id,
	invitation: data
}).pipe(map((invitation) => ({
	...invitation,
	expiresAt: invitation.expiresAt.toISOString()
}))))));
var acceptEventInvitation_createServerFn_handler = createServerRpc({
	id: "ea9c3ccd684a3ab6408182521f7361b9fd69b5bd20aeea57d33337e1626e4056",
	name: "acceptEventInvitation",
	filename: "src/server/events/handlers/event.handlers.ts"
}, (opts) => acceptEventInvitation.__executeServer(opts));
var acceptEventInvitation = createServerFn({ method: "POST" }).middleware([requireSessionMiddleware]).validator(AcceptEventInvitationInputSchema).handler(acceptEventInvitation_createServerFn_handler, ({ data, context }) => runServerEffect(provideEventLayers(acceptEventInvitationWorkflow({
	userId: context.user.id,
	userEmail: context.user.email,
	invitation: data
}))));
//#endregion
export { acceptEventInvitation_createServerFn_handler, createEvent_createServerFn_handler, inviteEventParticipant_createServerFn_handler, listEvents_createServerFn_handler };
