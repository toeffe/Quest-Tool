import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { enResources } from './locales/en';
import { daResources } from './locales/da';
import { getSavedAppLocale, applyDocumentLocale } from './localeStorage';
import { DEFAULT_LOCALE } from './types';

const initialLocale = getSavedAppLocale();

void i18n.use(initReactI18next).init({
  resources: {
    en: enResources,
    da: daResources,
  },
  lng: initialLocale,
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

applyDocumentLocale(initialLocale);

export function getAppLocale() {
  return (i18n.language === 'en' ? 'en' : 'da') as import('./types').AppLocale;
}

export function setAppLocale(locale: import('./types').AppLocale) {
  void i18n.changeLanguage(locale);
  applyDocumentLocale(locale);
}

export default i18n;
