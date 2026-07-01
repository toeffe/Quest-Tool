import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { applyDocumentLocale, getSavedAppLocale } from './localeStorage';
import { daResources } from './locales/da';
import { enResources } from './locales/en';
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

if (typeof document !== 'undefined') {
  document.title = i18n.t('appTitle', { ns: 'common' });
  i18n.on('languageChanged', () => {
    document.title = i18n.t('appTitle', { ns: 'common' });
  });
}

export function getAppLocale() {
  return (i18n.language === 'en' ? 'en' : 'da') as import('./types').AppLocale;
}

export function setAppLocale(locale: import('./types').AppLocale) {
  void i18n.changeLanguage(locale);
  applyDocumentLocale(locale);
}

export default i18n;
