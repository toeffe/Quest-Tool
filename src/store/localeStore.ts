import { create } from 'zustand';
import i18n, { setAppLocale } from '../i18n';
import { type AppLocale, DEFAULT_LOCALE } from '../i18n/types';
import { getSavedAppLocale, saveAppLocale } from '../i18n/localeStorage';

interface LocaleStore {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
}

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: getSavedAppLocale(),
  setLocale: (locale) => {
    saveAppLocale(locale);
    setAppLocale(locale);
    set({ locale });
  },
}));

/** Sync store when i18n language changes externally (e.g. tests). */
i18n.on('languageChanged', (lng) => {
  const locale = (lng === 'en' ? 'en' : DEFAULT_LOCALE) as AppLocale;
  useLocaleStore.setState({ locale });
});
