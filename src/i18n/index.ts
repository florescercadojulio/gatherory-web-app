import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '@/i18n/locales/en'
import esServerErrors from '@/i18n/locales/es.server-errors'

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: { serverErrors: esServerErrors } } },
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: ['en', 'es'],
  interpolation: { escapeValue: false },
  returnNull: false,
})

export default i18n
