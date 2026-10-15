'use client'

import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Settings, LibraryBig } from 'lucide-react'

import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

export function AccountSidebar({
  user,
  summaryLabel,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; image?: string | null }
  summaryLabel?: string
}) {
  const { t } = useTranslation()
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link to="/workspaces" />}
              tooltip={t('navigation.yourEvents')}
            >
              <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md border border-sidebar-border bg-sidebar-primary text-sidebar-primary-foreground">
                <img src="/gatherory-icon.png" alt="" className="size-full object-cover" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Gatherory</span>
                <span className="truncate text-xs text-muted-foreground">
                  {summaryLabel ?? t('navigation.yourEvents')}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          label={t('navigation.gatherory')}
          items={[
            {
              title: t('navigation.overview'),
              url: '/workspaces',
              icon: LayoutDashboard,
            },
            {
              title: t('common.account'),
              url: '/account',
              icon: Settings,
            },
            {
              title: t('navigation.templates'),
              url: '/blueprints',
              icon: LibraryBig,
            },
          ]}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user.name,
            email: user.email,
            avatar: user.image ?? '',
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
