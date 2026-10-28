import {
  ThemePreviewDark,
  ThemePreviewLight,
  ThemePreviewSystem,
  useAuthPlugin,
} from '@better-auth-ui/react'
import { useEffect, useId, useState } from 'react'
import { cn } from 'cn'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx'
import { themePlugin } from '@/lib/auth/theme-plugin.ts'

export type AppearanceProps = {
  className?: string
  showHeading?: boolean
}

const themeOptions = [
  { value: 'system', Preview: ThemePreviewSystem },
  { value: 'light', Preview: ThemePreviewLight },
  { value: 'dark', Preview: ThemePreviewDark },
] as const

/** Better Auth owns the preference and previews; the account page owns the layout. */
export function Appearance({ className, showHeading = true }: AppearanceProps) {
  const { useTheme, localization } = useAuthPlugin(themePlugin)
  const { theme, setTheme, themes = [] } = useTheme()
  const groupId = useId()
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

  return (
    <section className={cn('account-appearance', className)}>
      {showHeading && <h2 className="app-section-heading">{localization.appearance}</h2>}
      <p id={groupId} className="mb-3 text-sm font-medium">
        {localization.theme}
      </p>
      <RadioGroup
        aria-labelledby={groupId}
        value={isMounted ? theme : ''}
        onValueChange={setTheme}
        className="grid grid-cols-3 gap-3"
        disabled={!isMounted || !theme}
      >
        {themeOptions
          .filter(({ value }) => themes.includes(value))
          .map(({ value, Preview }) => {
            const label = localization[value]
            const id = `${groupId}-${value}`
            return (
              <label
                key={value}
                htmlFor={id}
                className="account-theme-choice"
                data-selected={isMounted && theme === value ? 'true' : undefined}
              >
                <div className="account-theme-preview" aria-hidden="true" inert>
                  <Preview className="w-full" />
                </div>
                <div className="account-theme-choice-label">
                  <span id={`${id}-label`}>{label}</span>
                  <RadioGroupItem value={value} id={id} aria-labelledby={`${id}-label`} />
                </div>
              </label>
            )
          })}
      </RadioGroup>
    </section>
  )
}
