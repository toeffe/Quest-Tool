import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { daResources } from '../src/i18n/locales/da';
import { enResources } from '../src/i18n/locales/en';

const LOCALES_ROOT = join(import.meta.dirname, '../src/i18n/locales');

function collectKeys(obj: unknown, prefix = ''): string[] {
  if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) {
    return prefix ? [prefix] : [];
  }
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value != null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...collectKeys(value, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

describe('i18n key parity', () => {
  it('en and da locale modules expose the same key paths', () => {
    expect(Object.keys(daResources).sort()).toEqual(Object.keys(enResources).sort());

    for (const ns of Object.keys(enResources) as (keyof typeof enResources)[]) {
      const enKeys = collectKeys(enResources[ns]);
      const daKeys = collectKeys(daResources[ns as keyof typeof daResources]);
      const missingInDa = enKeys.filter((k) => !daKeys.includes(k));
      const missingInEn = daKeys.filter((k) => !enKeys.includes(k));
      expect(missingInDa, `${ns} missing in da: ${missingInDa.join(', ')}`).toEqual([]);
      expect(missingInEn, `${ns} missing in en: ${missingInEn.join(', ')}`).toEqual([]);
    }
  });

  it('locale folders contain the same module files', () => {
    const enFiles = readdirSync(join(LOCALES_ROOT, 'en'))
      .filter((f) => f.endsWith('.ts'))
      .sort();
    const daFiles = readdirSync(join(LOCALES_ROOT, 'da'))
      .filter((f) => f.endsWith('.ts'))
      .sort();
    expect(daFiles).toEqual(enFiles);
  });
});
