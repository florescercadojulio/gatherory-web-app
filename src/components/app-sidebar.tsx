"use client"

import {
  CalendarDays,
  GalleryVerticalEnd,
  Lightbulb,
  Store,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/nav-main.tsx"
import { NavUser } from "@/components/nav-user.tsx"
import {
  WorkspaceSwitcher,
  type WorkspaceSwitcherItem,
} from "@/components/workspace-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar.tsx"

export function AppSidebar({
  workspace,
  workspaces,
  planningTeamName,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  workspace: WorkspaceSwitcherItem
  workspaces: WorkspaceSwitcherItem[]
  planningTeamName: string | null
  user: { name: string; email: string; image?: string | null }
}) {
  const workspaceUrl = `/workspaces/${workspace.slug}`
  const navItems =
    workspace.access === "member"
      ? [
          { title: "Events", url: workspaceUrl, icon: CalendarDays },
          {
            title: "Ideas",
            url: workspaceUrl,
            icon: Lightbulb,
            disabled: true,
            note: "Next",
          },
          {
            title: "Participants",
            url: workspaceUrl,
            icon: Users,
            disabled: true,
            note: "Next",
          },
        ]
      : [
          { title: "Shared events", url: workspaceUrl, icon: CalendarDays },
          {
            title: "People",
            url: workspaceUrl,
            icon: Users,
            disabled: true,
            note: "Next",
          },
        ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher
          workspace={workspace}
          workspaces={workspaces}
          planningTeamName={planningTeamName}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          label={workspace.access === "member" ? "Plan" : "Shared with you"}
          items={navItems}
        />
        {workspace.access === "member" ? (
          <NavMain
            label="Coming later"
            items={[
              {
                title: "Professional tools",
                url: workspaceUrl,
                icon: Store,
                disabled: true,
                note: "Later",
              },
              {
                title: "Template marketplace",
                url: workspaceUrl,
                icon: GalleryVerticalEnd,
                disabled: true,
                note: "Later",
              },
            ]}
          />
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user.name,
            email: user.email,
            avatar: user.image ?? "",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
