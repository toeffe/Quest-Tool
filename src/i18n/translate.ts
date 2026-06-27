import i18n from '../i18n';
import { type AppLocale } from '../i18n/types';
import { getAppLocale } from '../i18n';

export function tValidation(
  key: string,
  options?: Record<string, unknown>,
  locale?: AppLocale,
): string {
  return i18n.t(key, { ns: 'validation', lng: locale ?? getAppLocale(), ...options });
}
