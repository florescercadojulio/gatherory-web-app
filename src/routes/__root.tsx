import {
  ClientOnly,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

import PostHogProvider from '../integrations/posthog/provider'

import appCss from '../styles.css?url'
import { Providers } from '@/components/providers'
import { NotFoundPage } from '@/components/not-found-page'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

const DevelopmentDevtools = import.meta.env.DEV
  ? lazy(() => import('@/integrations/devtools/devtools'))
  : () => null

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      {
        name: 'theme-color',
        content: '#ffffff',
        media: '(prefers-color-scheme: light)',
      },
      {
        name: 'theme-color',
        content: '#000000',
        media: '(prefers-color-scheme: dark)',
      },
      {
        title: 'Gatherory',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '256x256',
        href: '/favicon.png',
      },
      {
        rel: 'apple-touch-icon',
        href: '/gatherory-icon.png',
      },
    ],
  }),
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PostHogProvider>
          <Providers>{children}</Providers>
        </PostHogProvider>
        <ClientOnly>
          <Suspense fallback={null}>
            <DevelopmentDevtools />
          </Suspense>
        </ClientOnly>
        <Scripts />
      </body>
    </html>
  )
}
