import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ArrowLeftIcon, CalendarDaysIcon, HouseIcon, RefreshCwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const { t } = useTranslation()
  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }

    window.location.assign('/workspaces')
  }

  return (
    <main className="grid min-h-svh place-items-center px-6 py-12">
      <section className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <CalendarDaysIcon className="size-7" aria-hidden="true" />
        </div>

        <p className="mt-6 text-sm font-medium text-primary">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t('notFound.title')}</h1>
        <p className="mt-3 text-pretty leading-7 text-muted-foreground">
          {t('notFound.description')}
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Button render={<Link to="/workspaces" />}>
            <HouseIcon aria-hidden="true" />
            {t('common.home')}
          </Button>
          <Button variant="outline" onClick={goBack}>
            <ArrowLeftIcon aria-hidden="true" />
            {t('common.goBack')}
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCwIcon aria-hidden="true" />
            {t('common.tryAgain')}
          </Button>
        </div>
      </section>
    </main>
  )
}
