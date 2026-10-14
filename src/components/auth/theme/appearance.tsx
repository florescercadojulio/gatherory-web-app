import {
  ThemePreviewDark,
  ThemePreviewLight,
  ThemePreviewSystem,
  useAuthPlugin,
} from '@better-auth-ui/react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Field, FieldContent, FieldLabel, FieldTitle } from '@/components/ui/field.tsx'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx'
import { themePlugin } from '@/lib/auth/theme-plugin.ts'
import { cn } from 'cn'

export type AppearanceProps = {
  className?: string
}

/**
 * Renders a theme selector card with visual theme previews.
 *
 * Displays a card containing radio buttons for selecting between system, light,
 * and dark themes. Each option shows a visual preview of the theme.
 *
 * @param className - Optional additional CSS class names for the card container.
 * @returns A JSX element containing the theme selector card.
 */
export function Appearance({ className }: AppearanceProps) {
  const { useTheme, localization } = useAuthPlugin(themePlugin)
  const { theme, setTheme, themes = [] } = useTheme()

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => setIsMounted(true), [])

  return (
    <section className={cn('border-t pt-6', className)}>
      <h2 className="app-section-heading mb-4">{localization.appearance}</h2>

      <Field>
        <FieldLabel>{localization.theme}</FieldLabel>

        <RadioGroup
          value={isMounted ? theme : ''}
          onValueChange={setTheme}
          className="grid grid-cols-2 gap-3 border-y py-4 sm:grid-cols-3"
          disabled={!isMounted || !theme}
        >
          {themes.includes('system') && (
            <FieldLabel htmlFor="system">
              <Field orientation="horizontal">
                <FieldContent className="gap-2">
                  <div className="flex items-center gap-2 justify-between">
                    <FieldTitle>
                      <Monitor className="size-4 text-muted-foreground" />

                      {localization.system}
                    </FieldTitle>

                    <RadioGroupItem value="system" id="system" />
                  </div>

                  <ThemePreviewSystem className="w-full" />
                </FieldContent>
              </Field>
            </FieldLabel>
          )}

          {themes.includes('light') && (
            <FieldLabel htmlFor="light">
              <Field orientation="horizontal">
                <FieldContent className="gap-2">
                  <div className="flex items-center gap-2 justify-between">
                    <FieldTitle>
                      <Sun className="size-4 text-muted-foreground" />

                      {localization.light}
                    </FieldTitle>

                    <RadioGroupItem value="light" id="light" />
                  </div>

                  <ThemePreviewLight className="w-full" />
                </FieldContent>
              </Field>
            </FieldLabel>
          )}

          {themes.includes('dark') && (
            <FieldLabel htmlFor="dark">
              <Field orientation="horizontal">
                <FieldContent className="gap-2">
                  <div className="flex items-center gap-2 justify-between">
                    <FieldTitle>
                      <Moon className="size-4 text-muted-foreground" />

                      {localization.dark}
                    </FieldTitle>

                    <RadioGroupItem value="dark" id="dark" />
                  </div>

                  <ThemePreviewDark className="w-full" />
                </FieldContent>
              </Field>
            </FieldLabel>
          )}
        </RadioGroup>
      </Field>
    </section>
  )
}
