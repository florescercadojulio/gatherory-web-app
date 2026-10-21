import { createInstance } from 'i18next'
import { expect, test } from 'vitest'
import en from '@/i18n/locales/en'
import es from '@/i18n/locales/es'
import esServerErrors from '@/i18n/locales/es.server-errors'

function leafKeys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof child === 'string' ? [path] : leafKeys(child, path)
  })
}

test.each(['en', 'es'])('rendered %s consumer copy uses event terminology', async (locale) => {
  const i18n = createInstance()
  await i18n.init({
    resources: {
      en: { translation: en },
      es: { translation: { ...es, serverErrors: esServerErrors } },
    },
    lng: locale,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

  // Include every English key so Spanish fallback copy is checked too. Stable
  // internal keys may still mention workspace; only rendered values matter.
  for (const key of leafKeys(en)) {
    expect(i18n.t(key), key).not.toMatch(
      /\bworkspaces?\b|\bespacios? de (?:trabajo|planificaci[oó]n)\b/i
    )
  }
  expect(i18n.t('feedback.workspaceLoadTitle')).toBe(
    locale === 'es' ? 'No se pudo cargar este evento' : 'This event could not be loaded'
  )
})
