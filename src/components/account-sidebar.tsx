"use client"

import { Inbox, LayoutGrid } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
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
} from "@/components/ui/sidebar"

export function AccountSidebar({
  workspaces,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  workspaces: WorkspaceSwitcherItem[]
  user: { name: string; email: string; image?: string | null }
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher
          workspace={null}
          workspaces={workspaces}
          planningTeamName={null}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          label="Account"
          items={[
            {
              title: "Workspaces",
              url: "/workspaces",
              icon: LayoutGrid,
            },
            {
              title: "Invitations",
              url: "/workspaces",
              icon: Inbox,
              disabled: true,
              note: "Next",
            },
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
