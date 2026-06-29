import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './locales/es'

const resources = {
  es: {
    translation: es,
  },
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: 'es',
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false, // React ya escapa por defecto
  },
})

export default i18n
