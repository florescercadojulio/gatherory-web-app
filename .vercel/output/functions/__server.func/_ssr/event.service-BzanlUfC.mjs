import { An as email, Bn as union, Cn as datetime, Fn as object, Hn as url, Tn as _null, Un as uuid, wn as _enum, zn as string } from "../_libs/@better-auth/core+[...].mjs";
import { C as Service } from "../_libs/effect.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/event.service-BzanlUfC.js
var optionalText = string().trim().max(2e3).optional().transform((value) => value || void 0);
var eventBase = {
	title: string().trim().min(1).max(120),
	description: optionalText,
	imageUrl: url().optional(),
	startsAt: datetime().optional(),
	endsAt: datetime().optional(),
	timeZone: string().trim().min(1).max(100),
	locationName: string().trim().max(160).optional(),
	locationAddress: string().trim().max(500).optional()
};
var CreateEventInputSchema = union([object({
	...eventBase,
	parentEventId: _null().optional(),
	purpose: _null().optional()
}), object({
	...eventBase,
	parentEventId: uuid(),
	purpose: _enum(["planning_scouting", "part_of_event"]),
	category: _enum([
		"venue",
		"food_tasting",
		"photography",
		"honeymoon",
		"attire_fitting",
		"wedding_shower",
		"bachelor_bachelorette",
		"rehearsal",
		"ceremony",
		"reception",
		"other"
	]).default("other"),
	planningStatus: _enum([
		"draft",
		"approved",
		"not_sure",
		"rejected",
		"archived"
	]).default("approved")
})]).refine((value) => !value.startsAt || !value.endsAt || new Date(value.endsAt) >= new Date(value.startsAt), {
	message: "The event end must be after its start.",
	path: ["endsAt"]
});
var ListEventsInputSchema = object({ organizationId: string().trim().min(1) });
var InviteEventParticipantInputSchema = object({
	eventId: uuid(),
	email: email().trim().toLowerCase(),
	role: _enum([
		"host",
		"collaborator",
		"guest"
	]),
	planningPermission: _enum([
		"manage",
		"contribute",
		"viewOnly"
	])
});
var AcceptEventInvitationInputSchema = object({ token: uuid() });
var EventService = class extends Service()("EventService") {};
//#endregion
export { ListEventsInputSchema as a, InviteEventParticipantInputSchema as i, CreateEventInputSchema as n, EventService as r, AcceptEventInvitationInputSchema as t };
