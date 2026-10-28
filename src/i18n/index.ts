import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '@/i18n/locales/en'
import es from '@/i18n/locales/es'
import esServerErrors from '@/i18n/locales/es.server-errors'
import enMcp from '@/i18n/locales/en.mcp'
import esMcp from '@/i18n/locales/es.mcp'

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en, mcp: enMcp },
    es: { translation: { ...es, serverErrors: esServerErrors }, mcp: esMcp },
  },
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: ['en', 'es'],
  interpolation: { escapeValue: false },
  returnNull: false,
})

export default i18n
