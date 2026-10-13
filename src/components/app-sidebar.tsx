"use client"

import {
  CalendarDays,
  LayoutDashboard,
  Settings,
} from "lucide-react"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation()
  const workspaceUrl = `/workspaces/${workspace.slug}`

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
          label={t("navigation.gatherory")}
          items={[
            { title: t("common.allEvents"), url: "/workspaces", icon: LayoutDashboard },
            { title: t("navigation.eventDetails"), url: workspaceUrl, icon: CalendarDays },
            { title: t("common.account"), url: "/account", icon: Settings },
          ]}
        />
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
