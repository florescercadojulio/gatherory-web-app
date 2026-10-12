"use client";

import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Settings } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AccountSidebar({
  user,
  summaryLabel = "Your events",
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; image?: string | null };
  summaryLabel?: string;
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link to="/workspaces" />}
              tooltip="Gatherory overview"
            >
              <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md border border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground">
                <img
                  src="/gatherory-icon.png"
                  alt=""
                  className="size-full object-cover"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Gatherory</span>
                <span className="truncate text-xs text-muted-foreground">
                  {summaryLabel}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          label="Gatherory"
          items={[
            {
              title: "Overview",
              url: "/workspaces",
              icon: LayoutDashboard,
            },
            {
              title: "Account",
              url: "/account",
              icon: Settings,
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
  );
}
