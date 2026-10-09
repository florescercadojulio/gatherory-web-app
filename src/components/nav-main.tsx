import { Link, useRouterState } from "@tanstack/react-router"
import type { LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar.tsx"

export function NavMain({
  items,
  label = "Plan",
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    disabled?: boolean
    note?: string
  }[]
  label?: string
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const content = (
            <>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              {item.note && (
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {item.note}
                </span>
              )}
            </>
          )

          return (
            <SidebarMenuItem key={item.title}>
              {item.disabled ? (
                <SidebarMenuButton disabled tooltip={`${item.title} — later`}>
                  {content}
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  render={<Link to={item.url} />}
                >
                  {content}
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
