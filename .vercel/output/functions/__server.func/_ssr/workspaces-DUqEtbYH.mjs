import { o as __toESM } from "../_runtime.mjs";
import { $ as DialogPopup, D as DialogRoot, Q as DialogPortal$1, X as DialogTrigger$1, Z as DialogTitle$1, bt as require_react, et as DialogDescription$1, nt as DialogBackdrop, tt as DialogClose, yt as require_jsx_runtime } from "../_libs/@base-ui/react+[...].mjs";
import { h as useRouter, m as useNavigate, p as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as useForm } from "../_libs/@tanstack/react-form+[...].mjs";
import { t as cn } from "../_libs/cn.mjs";
import { S as Inbox, V as ArrowUpRight, c as Plus, n as Users, t as X, y as LayoutGrid, z as CalendarDays } from "../_libs/lucide-react.mjs";
import { A as Badge, D as Separator$1, E as createWorkspace, F as CardHeader, I as CardTitle, L as Button$1, M as CardAction, O as Checkbox$1, P as CardDescription, R as Input$1, a as Route$4, j as Card, k as Label } from "./router-Dz7FCRyI.mjs";
import { a as SidebarFooter, c as SidebarProvider, d as WorkspaceSwitcher, i as SidebarContent, l as SidebarRail, n as NavUser, o as SidebarHeader, r as Sidebar, s as SidebarInset, t as NavMain, u as SidebarTrigger } from "./workspace-switcher-DsBVT49z.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/workspaces-DUqEtbYH.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AccountSidebar({ workspaces, user, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sidebar, {
		collapsible: "icon",
		...props,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkspaceSwitcher, {
				workspace: null,
				workspaces,
				planningTeamName: null
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavMain, {
				label: "Account",
				items: [{
					title: "Events",
					url: "/workspaces",
					icon: LayoutGrid
				}, {
					title: "Invitations",
					url: "/workspaces",
					icon: Inbox,
					disabled: true,
					note: "Next"
				}]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavUser, { user: {
				name: user.name,
				email: user.email,
				avatar: user.image ?? ""
			} }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarRail, {})
		]
	});
}
function Dialog$1({ ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogRoot, {
		"data-slot": "dialog",
		...props
	});
}
function DialogTrigger({ ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger$1, {
		"data-slot": "dialog-trigger",
		...props
	});
}
function DialogPortal({ ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogPortal$1, {
		"data-slot": "dialog-portal",
		...props
	});
}
function DialogOverlay({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogBackdrop, {
		"data-slot": "dialog-overlay",
		className: cn("fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0", className),
		...props
	});
}
function DialogContent({ className, children, showCloseButton = true, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPopup, {
		"data-slot": "dialog-content",
		className: cn("fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className),
		...props,
		children: [children, showCloseButton && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
			"data-slot": "dialog-close",
			render: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button$1, {
				variant: "ghost",
				className: "absolute top-2 right-2",
				size: "icon-sm"
			}),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: "Close"
			})]
		})]
	})] });
}
function DialogHeader({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-slot": "dialog-header",
		className: cn("flex flex-col gap-2", className),
		...props
	});
}
function DialogFooter({ className, showCloseButton = false, children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-slot": "dialog-footer",
		className: cn("-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end", className),
		...props,
		children: [children, showCloseButton && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
			render: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button$1, { variant: "outline" }),
			children: "Close"
		})]
	});
}
function DialogTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
		"data-slot": "dialog-title",
		className: cn("font-heading text-base leading-none font-medium", className),
		...props
	});
}
function DialogDescription({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
		"data-slot": "dialog-description",
		className: cn("text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground", className),
		...props
	});
}
function WorkspaceDirectory() {
	const { defaultWorkspaceContext } = Route$4.useRouteContext();
	const ownedWorkspaces = defaultWorkspaceContext.workspaces.filter((workspace) => workspace.access === "member");
	const sharedWorkspaces = defaultWorkspaceContext.workspaces.filter((workspace) => workspace.access === "participant");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SidebarProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountSidebar, {
		workspaces: defaultWorkspaceContext.workspaces,
		user: defaultWorkspaceContext.user
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SidebarInset, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "flex h-14 shrink-0 items-center gap-2 border-b px-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarTrigger, { className: "-ml-1" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator$1, {
				orientation: "vertical",
				className: "mr-2 h-4"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutGrid, { className: "size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate text-sm font-medium",
					children: "All events"
				})]
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex flex-1 flex-col gap-10 p-4 md:p-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-3xl font-semibold tracking-tight",
						children: "Events"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-2xl text-sm leading-6 text-muted-foreground",
						children: "Plan an event of your own or join one that has been shared with you."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreateEventDialog, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkspaceSection, {
				id: "owned-workspaces",
				title: "Your events",
				description: "Events you host and plan with your people.",
				workspaces: ownedWorkspaces,
				currentWorkspaceId: defaultWorkspaceContext.workspace.id
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkspaceSection, {
				id: "shared-workspaces",
				title: "Shared with you",
				description: "Events where you participate without managing the planning space.",
				workspaces: sharedWorkspaces,
				currentWorkspaceId: defaultWorkspaceContext.workspace.id,
				emptyMessage: "No additional events have been shared with you yet."
			})
		]
	})] })] });
}
function CreateEventDialog() {
	const navigate = useNavigate();
	const router = useRouter();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const form = useForm({
		defaultValues: emptyEventFormValues(),
		onSubmit: async ({ value }) => {
			const eventName = value.eventName.trim();
			if (eventName.length < 2) {
				setError("Enter an event name with at least two characters.");
				return;
			}
			if (!value.startsAt) {
				setError("Choose when the event starts.");
				return;
			}
			if (!value.timeZone.trim()) {
				setError("Enter the event time zone.");
				return;
			}
			if (value.endsAt && new Date(eventDateToIso(value.endsAt, value.isAllDay)) < new Date(eventDateToIso(value.startsAt, value.isAllDay))) {
				setError("The event must end after it starts.");
				return;
			}
			if (value.budgetCap && !/^\d+(?:\.\d{1,2})?$/.test(value.budgetCap)) {
				setError("Enter a valid budget with up to two decimal places.");
				return;
			}
			setError(null);
			try {
				const result = await createWorkspace({ data: {
					eventName,
					startsAt: eventDateToIso(value.startsAt, value.isAllDay),
					endsAt: value.endsAt ? eventDateToIso(value.endsAt, value.isAllDay) : void 0,
					isAllDay: value.isAllDay,
					timeZone: value.timeZone.trim(),
					locationName: value.locationName.trim() || void 0,
					locationAddress: value.locationAddress.trim() || void 0,
					budgetCap: value.budgetCap.trim() || void 0
				} });
				if (!result.ok) {
					setError(result.error.userMessage);
					return;
				}
				setOpen(false);
				form.reset(emptyEventFormValues());
				await router.invalidate();
				await navigate({
					to: "/workspaces/$workspaceSlug",
					params: { workspaceSlug: result.data.slug }
				});
			} catch {
				setError("The event could not be created. Try again.");
			}
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog$1, {
		open,
		onOpenChange: (nextOpen) => {
			setOpen(nextOpen);
			setError(null);
			if (nextOpen) form.reset(defaultEventFormValues());
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTrigger, {
			render: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button$1, { className: "gap-2" }),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "New event"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
			className: "max-h-[min(90vh,52rem)] overflow-y-auto sm:max-w-2xl",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: (event) => {
					event.preventDefault();
					event.stopPropagation();
					form.handleSubmit();
				},
				className: "contents",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Create an event" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Start with the details everyone needs. You can add cover art and invite hosts, collaborators, and guests after creating it." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-6 py-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "grid gap-3",
								"aria-labelledby": "event-details-heading",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									id: "event-details-heading",
									className: "font-medium",
									children: "Event details"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground",
									children: "Use the name people will recognize on the invitation."
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.Field, {
									name: "eventName",
									children: (field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: field.name,
											children: "Event name"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input$1, {
											id: field.name,
											name: field.name,
											autoComplete: "off",
											maxLength: 120,
											placeholder: "Alex & Jordan's wedding",
											value: field.state.value,
											onBlur: field.handleBlur,
											onChange: (event) => field.handleChange(event.target.value),
											autoFocus: true
										})]
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator$1, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "grid gap-3",
								"aria-labelledby": "event-schedule-heading",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start justify-between gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											id: "event-schedule-heading",
											className: "font-medium",
											children: "Date & time"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-muted-foreground",
											children: "Sub-events can be added to the timeline later."
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.Field, {
											name: "isAllDay",
											children: (field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
												className: "flex items-center gap-2 pt-0.5 font-normal",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox$1, {
													id: "event-is-all-day",
													checked: field.state.value,
													onCheckedChange: (checked) => {
														const isAllDay = checked === true;
														field.handleChange(isAllDay);
														for (const fieldName of ["startsAt", "endsAt"]) {
															const value = form.getFieldValue(fieldName);
															if (!value) continue;
															form.setFieldValue(fieldName, isAllDay ? value.slice(0, 10) : value.length === 10 ? `${value}T18:00` : value);
														}
													}
												}), "All-day"]
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.Subscribe, {
										selector: (state) => state.values.isAllDay,
										children: (isAllDay) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-3 sm:grid-cols-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.Field, {
												name: "startsAt",
												children: (field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: field.name,
														children: "Starts"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input$1, {
														id: field.name,
														type: isAllDay ? "date" : "datetime-local",
														value: field.state.value,
														onChange: (event) => field.handleChange(event.target.value)
													})]
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.Field, {
												name: "endsAt",
												children: (field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: field.name,
														children: "Ends (optional)"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input$1, {
														id: field.name,
														type: isAllDay ? "date" : "datetime-local",
														value: field.state.value,
														onChange: (event) => field.handleChange(event.target.value)
													})]
												})
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.Field, {
										name: "timeZone",
										children: (field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-2 sm:max-w-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: field.name,
												children: "Time zone"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input$1, {
												id: field.name,
												value: field.state.value,
												onChange: (event) => field.handleChange(event.target.value)
											})]
										})
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator$1, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								className: "grid gap-3",
								"aria-labelledby": "event-location-heading",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									id: "event-location-heading",
									className: "font-medium",
									children: "Location (optional)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground",
									children: "Add a venue now or leave it open while you decide."
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-3 sm:grid-cols-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.Field, {
										name: "locationName",
										children: (field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: field.name,
												children: "Location name"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input$1, {
												id: field.name,
												placeholder: "Willow & Stone Estate",
												value: field.state.value,
												onChange: (event) => field.handleChange(event.target.value)
											})]
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.Field, {
										name: "locationAddress",
										children: (field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: field.name,
												children: "Address"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input$1, {
												id: field.name,
												placeholder: "Ann Arbor, Michigan",
												value: field.state.value,
												onChange: (event) => field.handleChange(event.target.value)
											})]
										})
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator$1, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.Field, {
								name: "budgetCap",
								children: (field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									className: "grid gap-2",
									"aria-labelledby": "event-budget-heading",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											id: "event-budget-heading",
											className: "font-medium",
											children: "Budget (optional)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-muted-foreground",
											children: "This starts as the main event budget. You can allocate it across sub-events later."
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: field.name,
											className: "sr-only",
											children: "Budget cap"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input$1, {
											id: field.name,
											inputMode: "decimal",
											placeholder: "12000",
											value: field.state.value,
											onChange: (event) => field.handleChange(event.target.value),
											className: "sm:max-w-xs"
										})
									]
								})
							}),
							error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								role: "alert",
								className: "text-sm text-destructive",
								children: error
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(form.Subscribe, {
						selector: (state) => [
							state.values.eventName,
							state.values.startsAt,
							state.isSubmitting
						],
						children: ([eventName, startsAt, isSubmitting]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button$1, {
							type: "submit",
							disabled: isSubmitting || eventName.trim().length < 2 || !startsAt,
							children: isSubmitting ? "Creating…" : "Create event"
						})
					}) })
				]
			})
		})]
	});
}
function WorkspaceSection({ id, title, description, workspaces, currentWorkspaceId, emptyMessage }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-4",
		"aria-labelledby": `${id}-heading`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				id: `${id}-heading`,
				className: "text-lg font-semibold",
				children: title
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: description
			})]
		}), workspaces.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
			children: workspaces.map((workspace) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/workspaces/$workspaceSlug",
				params: { workspaceSlug: workspace.slug },
				className: "group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "h-full transition-[border-color,box-shadow,transform] group-hover:-translate-y-0.5 group-hover:border-primary/35 group-hover:shadow-md",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-5 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary",
							children: workspace.access === "member" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "pr-8",
							children: workspace.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: workspace.access === "member" ? workspace.type === "personal" ? "Your event" : "Team event" : "Shared with you" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardAction, {
							className: "flex items-center gap-2",
							children: [workspace.id === currentWorkspaceId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "secondary",
								children: "Current"
							}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-4 text-muted-foreground transition-colors group-hover:text-foreground" })]
						})
					] })
				})
			}, workspace.id))
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
			className: "border-dashed bg-muted/25",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: emptyMessage ?? "No events to show yet." }) })
		})]
	});
}
function emptyEventFormValues() {
	return {
		eventName: "",
		startsAt: "",
		endsAt: "",
		isAllDay: false,
		timeZone: "UTC",
		locationName: "",
		locationAddress: "",
		budgetCap: ""
	};
}
function defaultEventFormValues() {
	const startsAt = /* @__PURE__ */ new Date();
	startsAt.setMonth(startsAt.getMonth() + 6);
	startsAt.setHours(18, 0, 0, 0);
	return {
		...emptyEventFormValues(),
		startsAt: toLocalDateTimeValue(startsAt),
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
	};
}
function toLocalDateTimeValue(value) {
	const offset = value.getTimezoneOffset() * 6e4;
	return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}
function eventDateToIso(value, isAllDay) {
	const date = new Date(isAllDay && value.length === 10 ? `${value}T00:00` : value);
	if (isAllDay) date.setHours(0, 0, 0, 0);
	return date.toISOString();
}
//#endregion
export { WorkspaceDirectory as component };
