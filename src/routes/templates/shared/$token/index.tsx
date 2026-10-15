import { createFileRoute } from '@tanstack/react-router'
import { ArrowUpRight, CalendarDays, Lightbulb, ListChecks } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  BlueprintCatalogDefinitionSchema,
  BlueprintExperienceTreeModuleSchema,
  BlueprintIdeasModuleSchema,
  BlueprintInstructionsModuleSchema,
} from '@/contracts/blueprint-install.contracts'
import { Button } from '@/components/ui/button'
import { resolveBlueprintShareLink } from '@/server/blueprints/handlers/blueprint-sharing.functions'

export const Route = createFileRoute('/templates/shared/$token/')({
  loader: async ({ params }) => {
    if (!/^[0-9a-f]{64}$/.test(params.token)) return { entry: null }
    try {
      const result = await resolveBlueprintShareLink({ data: { token: params.token } })
      return { entry: result.ok ? result.data : null }
    } catch {
      return { entry: null }
    }
  },
  headers: () => ({
    'Cache-Control': 'private, no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
  }),
  head: () => ({
    meta: [
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'referrer', content: 'no-referrer' },
    ],
  }),
  component: SharedTemplatePage,
})

function SharedTemplatePage() {
  const { t } = useTranslation()
  const { token } = Route.useParams()
  const { entry } = Route.useLoaderData()
  const parsed = entry ? BlueprintCatalogDefinitionSchema.safeParse(entry.definition) : null
  const definition = parsed?.success ? parsed.data : null
  const tree = definition?.modules
    .map((module) => BlueprintExperienceTreeModuleSchema.safeParse(module))
    .find((result) => result.success)
  const ideas = definition?.modules
    .map((module) => BlueprintIdeasModuleSchema.safeParse(module))
    .find((result) => result.success)
  const instructions = definition?.modules
    .map((module) => BlueprintInstructionsModuleSchema.safeParse(module))
    .find((result) => result.success)

  if (!definition) {
    return (
      <main className="ph-no-capture ph-no-record mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-4 px-6 py-16">
        <img src="/gatherory-icon.png" alt="Gatherory" className="size-14 rounded-2xl" />
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('blueprints.sharedUnavailableTitle')}
        </h1>
        <p className="text-muted-foreground">{t('blueprints.sharedUnavailableDescription')}</p>
      </main>
    )
  }

  return (
    <main className="ph-no-capture ph-no-record mx-auto flex min-h-svh max-w-2xl flex-col gap-8 px-6 py-12 sm:py-16">
      <header className="space-y-4">
        <img src="/gatherory-icon.png" alt="Gatherory" className="size-12 rounded-xl" />
        <p className="text-sm font-medium text-muted-foreground">
          {t('blueprints.sharedTemplateEyebrow')}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {definition.blueprint.name}
        </h1>
        <p className="text-muted-foreground">{t('blueprints.sharedTemplatePrivacy')}</p>
      </header>

      <section aria-label={t('blueprints.sharedTemplateContent')} className="space-y-7">
        {tree?.success ? (
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CalendarDays aria-hidden="true" className="size-5" />
              {t('blueprints.sharedEvents', { count: tree.data.config.children.length })}
            </h2>
            {tree.data.config.children.length > 0 ? (
              <ul className="space-y-2">
                {tree.data.config.children.map((child) => (
                  <li key={child.key} className="rounded-lg border bg-card px-4 py-3">
                    <p className="font-medium">{child.title}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t('blueprints.sharedNoEvents')}</p>
            )}
          </div>
        ) : null}

        {ideas?.success ? (
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Lightbulb aria-hidden="true" className="size-5" />
              {t('blueprints.sharedIdeas', { count: ideas.data.config.ideas.length })}
            </h2>
            {ideas.data.config.ideas.length > 0 ? (
              <ul className="space-y-2">
                {ideas.data.config.ideas.map((idea) => (
                  <li key={idea.key} className="rounded-lg border bg-card px-4 py-3">
                    <p className="font-medium">{idea.title}</p>
                    {idea.notes ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {idea.notes}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t('blueprints.sharedNoIdeas')}</p>
            )}
          </div>
        ) : null}

        {instructions?.success ? (
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ListChecks aria-hidden="true" className="size-5" />
              {t('blueprints.sharedGuidance', { count: instructions.data.config.sections.length })}
            </h2>
            {instructions.data.config.sections.length > 0 ? (
              <ul className="space-y-2">
                {instructions.data.config.sections.map((section) => (
                  <li key={section.key} className="rounded-lg border bg-card px-4 py-3">
                    <p className="font-medium">{section.title}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {section.body}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t('blueprints.sharedNoGuidance')}</p>
            )}
          </div>
        ) : null}
      </section>

      <footer className="space-y-3 border-t pt-6">
        <Button
          render={
            <a href={`gatherory://template/${token}`} rel="noreferrer">
              {t('blueprints.sharedOpenInApp')}
              <ArrowUpRight aria-hidden="true" />
            </a>
          }
          className="w-full sm:w-auto"
        />
        <p className="text-sm text-muted-foreground">{t('blueprints.sharedCopyHint')}</p>
      </footer>
    </main>
  )
}
