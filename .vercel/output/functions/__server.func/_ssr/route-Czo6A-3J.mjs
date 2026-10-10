import { yt as require_jsx_runtime } from "../_libs/@base-ui/react+[...].mjs";
import { l as Outlet } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Store, n as Users, v as Lightbulb, w as GalleryVerticalEnd, z as CalendarDays } from "../_libs/lucide-react.mjs";
import { D as Separator$1, i as Route$3 } from "./router-Dz7FCRyI.mjs";
import { a as SidebarFooter, c as SidebarProvider, d as WorkspaceSwitcher, i as SidebarContent, l as SidebarRail, n as NavUser, o as SidebarHeader, r as Sidebar, s as SidebarInset, t as NavMain, u as SidebarTrigger } from "./workspace-switcher-DsBVT49z.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-Czo6A-3J.js
var import_jsx_runtime = require_jsx_runtime();
function AppSidebar({ workspace, workspaces, planningTeamName, user, ...props }) {
	const workspaceUrl = `/workspaces/${workspace.slug}`;
	const navItems = workspace.access === "member" ? [
		{
			title: "Events",
			url: workspaceUrl,
			icon: CalendarDays
		},
		{
			title: "Ideas",
			url: workspaceUrl,
			icon: Lightbulb,
			disabled: true,
			note: "Next"
		},
		{
			title: "Participants",
			url: workspaceUrl,
			icon: Users,
			disabled: true,
			note: "Next"
		}
	] : [{
		title: "Shared events",
		url: workspaceUrl,
		icon: CalendarDays
	}, {
		title: "People",
		url: workspaceUrl,
		icon: Users,
		disabled: true,
		note: "Next"
	}];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sidebar, {
		collapsible: "icon",
		...props,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkspaceSwitcher, {
				workspace,
				workspaces,
				planningTeamName
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SidebarContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavMain, {
				label: workspace.access === "member" ? "Plan" : "Shared with you",
				items: navItems
			}), workspace.access === "member" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavMain, {
				label: "Coming later",
				items: [{
					title: "Professional tools",
					url: workspaceUrl,
					icon: Store,
					disabled: true,
					note: "Later"
				}, {
					title: "Template marketplace",
					url: workspaceUrl,
					icon: GalleryVerticalEnd,
					disabled: true,
					note: "Later"
				}]
			}) : null] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavUser, { user: {
				name: user.name,
				email: user.email,
				avatar: user.image ?? ""
			} }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SidebarRail, {})
		]
	});
}
function WorkspaceLayout() {
	const { workspaceContext } = Route$3.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SidebarProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppSidebar, {
		workspace: workspaceContext.workspace,
		workspaces: workspaceContext.workspaces,
		planningTeamName: workspaceContext.planningTeam?.name ?? null,
		user: workspaceContext.user
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
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/gatherory-icon.png",
					alt: "",
					className: "size-6 rounded-md"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate text-sm font-medium",
					children: workspaceContext.workspace.name
				})]
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})] })] });
}
//#endregion
export { WorkspaceLayout as component };
