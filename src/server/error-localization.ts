import { createInstance } from 'i18next'
import en from '@/i18n/locales/en.server-errors'
import es from '@/i18n/locales/es.server-errors'
import type { MessageParams, UserMessageKey } from '@/lib/domain-errors'

// Separate from React's browser instance: no shared request mutates a language.
const translations = createInstance()
void translations.init({
  resources: {
    en: { translation: { serverErrors: en } },
    es: { translation: { serverErrors: es } },
  },
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: ['en', 'es'],
  initAsync: false,
  interpolation: { escapeValue: false },
  returnNull: false,
})

export function errorLocale(headers?: Headers, locale?: string): 'en' | 'es' {
  if (locale) return locale.toLowerCase().split(/[-_]/)[0] === 'es' ? 'es' : 'en'
  const languages = (headers?.get('accept-language') ?? '')
    .split(',')
    .map((entry, index) => {
      const [language, weight] = entry.trim().split(';')
      return {
        language: language.toLowerCase().split('-')[0],
        weight: weight ? Number(weight.trim().replace(/^q=/, '')) : 1,
        index,
      }
    })
    .filter((entry) => Number.isFinite(entry.weight) && entry.weight > 0 && entry.weight <= 1)
    .sort((a, b) => b.weight - a.weight || a.index - b.index)
  return languages.find((entry) => entry.language === 'en' || entry.language === 'es')?.language ===
    'es'
    ? 'es'
    : 'en'
}

export function translateError(
  key: UserMessageKey,
  locale: string,
  params?: MessageParams
): string {
  return translations.getFixedT(locale)(key, params)
}
