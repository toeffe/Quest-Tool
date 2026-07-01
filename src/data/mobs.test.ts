import { describe, expect, it } from 'vitest';
import { MOB_IDS, mobLabel } from './mobs';

describe('mob list', () => {
  it('contains a broad set of namespaced mob ids', () => {
    expect(MOB_IDS.length).toBeGreaterThan(70);
    expect(MOB_IDS.every((id) => id.startsWith('minecraft:'))).toBe(true);
    for (const id of [
      'minecraft:zombie',
      'minecraft:creeper',
      'minecraft:warden',
      'minecraft:bogged',
    ]) {
      expect(MOB_IDS).toContain(id);
    }
  });

  it('has no duplicates', () => {
    expect(new Set(MOB_IDS).size).toBe(MOB_IDS.length);
  });

  it('builds friendly labels', () => {
    expect(mobLabel('minecraft:cave_spider', 'en')).toBe('Cave Spider');
    expect(mobLabel('minecraft:cave_spider', 'da')).toBeTruthy();
    expect(mobLabel('minecraft:zombie', 'en')).toBe('Zombie');
  });
});
