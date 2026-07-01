import type { ZoneDrop } from '../../types/quest';

export function defaultZoneDrop(): ZoneDrop {
  return { target: 'minecraft:rotten_flesh', amount: 1, chance: 100 };
}

export function zoneDropSource(drop: ZoneDrop): 'vanilla' | 'custom' {
  return drop.customItemId ? 'custom' : 'vanilla';
}
