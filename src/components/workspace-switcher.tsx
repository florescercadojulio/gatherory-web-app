"use client"

import { Link } from "@tanstack/react-router"
import {
  CalendarDays,
  Check,
  ChevronsUpDown,
  LayoutGrid,
  Users,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export type WorkspaceSwitcherItem = {
  id: string
  name: string
  slug: string
  type: string
  access: "member" | "participant"
}

export function WorkspaceSwitcher({
  workspace,
  workspaces,
  planningTeamName,
}: {
  workspace: WorkspaceSwitcherItem | null
  workspaces: WorkspaceSwitcherItem[]
  planningTeamName: string | null
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <img
                src="/gatherory-icon.png"
                alt=""
                className="size-full object-cover"
              />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {workspace?.name ?? "All events"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {!workspace
                  ? `${workspaces.length} ${workspaces.length === 1 ? "event" : "events"}`
                  : workspace.access === "member"
                    ? `${planningTeamName ?? "Planning"} team`
                    : "Shared with you"}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="gap-2 p-2"
                render={<Link to="/workspaces" />}
              >
                <div className="flex size-7 items-center justify-center rounded-md border">
                  <LayoutGrid className="size-4" />
                </div>
                <span className="flex-1">All events</span>
                {!workspace ? <Check className="ml-auto size-4" /> : null}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Events
              </DropdownMenuLabel>
              {workspaces.map((candidate) => (
                <DropdownMenuItem
                  key={candidate.id}
                  className="gap-2 p-2"
                  render={
                    <Link
                      to="/workspaces/$workspaceSlug"
                      params={{ workspaceSlug: candidate.slug }}
                    />
                  }
                >
                  <div className="flex size-7 items-center justify-center rounded-md border">
                    {candidate.access === "member" ? (
                      <CalendarDays className="size-4" />
                    ) : (
                      <Users className="size-4" />
                    )}
                  </div>
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate">{candidate.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {candidate.access === "member"
                        ? "Your event"
                        : "Shared with you"}
                    </span>
                  </div>
                  {candidate.id === workspace?.id ? (
                    <Check className="ml-auto size-4" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
