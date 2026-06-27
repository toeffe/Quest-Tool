import i18n from './index';
import { type AppLocale, DEFAULT_LOCALE } from './types';

export async function withLocale<T>(locale: AppLocale, fn: () => T | Promise<T>): Promise<T> {
  const prev = i18n.language;
  await i18n.changeLanguage(locale);
  try {
    return await fn();
  } finally {
    await i18n.changeLanguage(prev);
  }
}

export async function resetTestLocale(): Promise<void> {
  await i18n.changeLanguage(DEFAULT_LOCALE);
}
