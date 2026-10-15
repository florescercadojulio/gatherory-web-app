import posthog from 'posthog-js'
import { PostHogProvider as BasePostHogProvider } from '@posthog/react'
import type { ReactNode } from 'react'
import { redactTemplateLinkCredentials } from '@/lib/template-link-privacy'

if (
  typeof window !== 'undefined' &&
  import.meta.env.VITE_POSTHOG_KEY &&
  !window.location.pathname.startsWith('/templates/shared/')
) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    before_send: (event) =>
      window.location.pathname.startsWith('/templates/shared/')
        ? null
        : redactTemplateLinkCredentials(event),
    session_recording: { blockClass: 'ph-no-record' },
    defaults: '2025-11-30',
  })
}

interface PostHogProviderProps {
  children: ReactNode
}

export default function PostHogProvider({ children }: PostHogProviderProps) {
  return <BasePostHogProvider client={posthog}>{children}</BasePostHogProvider>
}
