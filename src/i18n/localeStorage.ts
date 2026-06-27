import { type AppLocale, DEFAULT_LOCALE, SUPPORTED_LOCALES } from './types';

const STORAGE_KEY = 'quest-tool-mc.locale';

export function detectBrowserLocale(): AppLocale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('da')) return 'da';
  return 'en';
}

export function getSavedAppLocale(): AppLocale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as AppLocale)) {
      return stored as AppLocale;
    }
  } catch {
    // ignore
  }
  return detectBrowserLocale();
}

export function saveAppLocale(locale: AppLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

export function applyDocumentLocale(locale: AppLocale): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
}
