import { TanStackDevtools } from "@tanstack/react-devtools"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"

import TanStackQueryDevtools from "@/integrations/tanstack-query/devtools"

import { AccountSwitcher } from "./account-switcher"

export default function DevelopmentDevtools() {
  return (
    <TanStackDevtools
      config={{
        triggerMode: "fixed",
        position: "bottom-right",
        panelLocation: "bottom",
      }}
      plugins={[
        {
          name: "TanStack Router",
          render: <TanStackRouterDevtoolsPanel />,
        },
        TanStackQueryDevtools,
        {
          id: "gatherory-accounts",
          name: "Accounts",
          render: (_element, { theme }) => <AccountSwitcher theme={theme} />,
        },
      ]}
    />
  )
}
