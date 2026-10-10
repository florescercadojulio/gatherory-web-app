import { yt as require_jsx_runtime } from "./_libs/@base-ui/react+[...].mjs";
import { O as Compass, f as MapPin, k as Clock3, l as PartyPopper, m as MailPlus, n as Users, z as CalendarDays } from "./_libs/lucide-react.mjs";
import { A as Badge, D as Separator$1, F as CardHeader, I as CardTitle, M as CardAction, N as CardContent, P as CardDescription, j as Card, n as Route } from "./_ssr/router-Dz7FCRyI.mjs";
import { n as AvatarFallback, r as AvatarImage, t as Avatar$1 } from "./_ssr/avatar-CXnE7paH.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_workspaceSlug-BcXegcl5.js
var import_jsx_runtime = require_jsx_runtime();
var dateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
	timeZone: "America/Detroit"
});
var dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
	timeZone: "America/Detroit"
});
function initials(name) {
	return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}
function label(value) {
	return value.replaceAll("_", " ");
}
function EventWorkspace({ event, shared }) {
	const planningEvents = event.childEvents.filter((child) => child.purpose === "planning_scouting");
	const guestEvents = event.childEvents.filter((child) => child.purpose === "part_of_event");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-6",
		"aria-labelledby": `event-${event.id}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "relative min-h-72 overflow-hidden bg-linear-to-br from-primary/15 via-card to-sky-500/10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute -top-20 right-0 size-72 rounded-full bg-primary/15 blur-3xl" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
					className: "relative",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-6 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyPopper, { className: "size-6" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							id: `event-${event.id}`,
							className: "text-2xl sm:text-3xl",
							children: event.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, {
							className: "max-w-2xl text-sm leading-relaxed sm:text-base",
							children: event.description
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardAction, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap justify-end gap-2",
							children: [
								shared ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									children: "Shared with you"
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "secondary",
									className: "capitalize",
									children: event.currentParticipant.role
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "secondary",
									className: "capitalize",
									children: event.status
								})
							]
						}) })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "relative mt-auto grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-x-6 gap-y-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-4 text-primary" }), event.startsAt ? dateFormatter.format(new Date(event.startsAt)) : "Date not set"]
						}), event.locationName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "inline-flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-4 text-primary" }), event.locationName]
						}) : null]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex -space-x-2",
							"aria-label": "Event participants",
							children: event.participants.slice(0, 4).map((participant) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar$1, {
								className: "size-8 border-2 border-card",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, {
									src: participant.image ?? void 0,
									alt: participant.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
									className: "text-[10px]",
									children: initials(participant.name)
								})]
							}, participant.id))
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-sm text-muted-foreground",
							children: [event.participants.length, " people"]
						})]
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Event schedule" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Planning work and guest-facing moments share one event model." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardAction, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					variant: "outline",
					children: [event.childEvents.length, " events"]
				}) })
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventGroup, {
						title: "Planning & scouting",
						icon: Compass,
						events: planningEvents
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator$1, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventGroup, {
						title: "Part of the experience",
						icon: PartyPopper,
						events: guestEvents
					})
				]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "People" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Event roles stay separate from account access." }),
				event.pendingInvitationCount ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardAction, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
					variant: "outline",
					className: "gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MailPlus, {}),
						event.pendingInvitationCount,
						" pending"
					]
				}) }) : null
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "space-y-4",
				children: event.participants.map((participant) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar$1, {
							className: "size-9",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, {
								src: participant.image ?? void 0,
								alt: participant.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
								className: "text-xs",
								children: initials(participant.name)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm font-medium",
								children: participant.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "capitalize text-xs text-muted-foreground",
								children: participant.role
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "secondary",
							className: "capitalize",
							children: label(participant.attendanceStatus)
						})
					]
				}, participant.id))
			})] })]
		})]
	});
}
function EventGroup({ title, icon: Icon, events }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-sm font-medium",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 text-primary" }), title]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-3 sm:grid-cols-2",
			children: events.map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg border bg-muted/25 p-4 transition-colors hover:bg-muted/50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: event.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 space-y-1 text-xs text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, { className: "size-3.5" }), event.startsAt ? dateTimeFormatter.format(new Date(event.startsAt)) : "Date not set"]
						}),
						event.locationName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3.5" }), event.locationName]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "flex items-center gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-3.5" }),
								event.participantCount,
								" participants"
							]
						})
					]
				})]
			}, event.id))
		})]
	});
}
function Home() {
	const result = Route.useLoaderData();
	const { workspaceContext } = Route.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-1 flex-col gap-8 p-4 md:p-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-semibold tracking-tight",
				children: "Your events"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "The main event and schedule available to your event role."
			})]
		}), !result.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
			className: "max-w-2xl",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Events are temporarily unavailable" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: result.error.userMessage })] })
		}) : result.data.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
			className: "max-w-2xl border-dashed bg-muted/30",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Your first event starts here" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Create a main event, add its schedule, and invite hosts, collaborators, and guests." })
			] })
		}) : result.data.map((event) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventWorkspace, {
			event,
			shared: workspaceContext.workspace.access === "participant"
		}, event.id))]
	});
}
//#endregion
export { Home as component };
