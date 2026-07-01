import i18n, { getAppLocale } from '../i18n';
import type { AppLocale } from '../i18n/types';

export function tValidation(
  key: string,
  options?: Record<string, unknown>,
  locale?: AppLocale,
): string {
  return i18n.t(key, { ns: 'validation', lng: locale ?? getAppLocale(), ...options });
}
