/**
 * All living entities (mobs/creatures) in Minecraft Java 1.21.11 that can be a
 * kill-quest target. The scoreboard `killed` criterion works with any entity
 * type id, so users can still type a custom/modded id if it is not listed here.
 */
import { mobLabelI18n } from '../i18n/useLabels';
import { useLocaleStore } from '../store/localeStore';
import { useMemo } from 'react';

export const MOB_IDS: string[] = [
  'minecraft:allay',
  'minecraft:armadillo',
  'minecraft:axolotl',
  'minecraft:bat',
  'minecraft:bee',
  'minecraft:blaze',
  'minecraft:bogged',
  'minecraft:breeze',
  'minecraft:camel',
  'minecraft:cat',
  'minecraft:cave_spider',
  'minecraft:chicken',
  'minecraft:cod',
  'minecraft:cow',
  'minecraft:creaking',
  'minecraft:creeper',
  'minecraft:dolphin',
  'minecraft:donkey',
  'minecraft:drowned',
  'minecraft:elder_guardian',
  'minecraft:enderman',
  'minecraft:endermite',
  'minecraft:ender_dragon',
  'minecraft:evoker',
  'minecraft:fox',
  'minecraft:frog',
  'minecraft:ghast',
  'minecraft:giant',
  'minecraft:glow_squid',
  'minecraft:goat',
  'minecraft:guardian',
  'minecraft:hoglin',
  'minecraft:horse',
  'minecraft:husk',
  'minecraft:illusioner',
  'minecraft:iron_golem',
  'minecraft:llama',
  'minecraft:magma_cube',
  'minecraft:mooshroom',
  'minecraft:mule',
  'minecraft:ocelot',
  'minecraft:panda',
  'minecraft:parrot',
  'minecraft:phantom',
  'minecraft:pig',
  'minecraft:piglin',
  'minecraft:piglin_brute',
  'minecraft:pillager',
  'minecraft:polar_bear',
  'minecraft:pufferfish',
  'minecraft:rabbit',
  'minecraft:ravager',
  'minecraft:salmon',
  'minecraft:sheep',
  'minecraft:shulker',
  'minecraft:silverfish',
  'minecraft:skeleton',
  'minecraft:skeleton_horse',
  'minecraft:slime',
  'minecraft:sniffer',
  'minecraft:snow_golem',
  'minecraft:spider',
  'minecraft:squid',
  'minecraft:stray',
  'minecraft:strider',
  'minecraft:tadpole',
  'minecraft:trader_llama',
  'minecraft:tropical_fish',
  'minecraft:turtle',
  'minecraft:vex',
  'minecraft:villager',
  'minecraft:vindicator',
  'minecraft:wandering_trader',
  'minecraft:warden',
  'minecraft:witch',
  'minecraft:wither',
  'minecraft:wither_skeleton',
  'minecraft:wolf',
  'minecraft:zoglin',
  'minecraft:zombie',
  'minecraft:zombie_horse',
  'minecraft:zombie_villager',
  'minecraft:zombified_piglin',
];

/** Turn "minecraft:cave_spider" into a display label (localized when available). */
export function mobLabel(id: string, locale?: import('../i18n/types').AppLocale): string {
  return mobLabelI18n(id, locale);
}

export function useMobOptions() {
  const locale = useLocaleStore((s) => s.locale);
  return useMemo(
    () => MOB_IDS.map((value) => ({ value, label: mobLabel(value, locale) })),
    [locale],
  );
}

/** @deprecated Use useMobOptions() for localized labels */
export const MOB_OPTIONS = MOB_IDS.map((value) => ({ value, label: mobLabel(value) }));

/** Ensure an entity id has a namespace, defaulting to villager if blank. */
export function normalizeEntityId(value: string): string {
  const v = (value || '').trim() || 'minecraft:villager';
  return v.includes(':') ? v : `minecraft:${v}`;
}

export function isVillager(entityType: string): boolean {
  return normalizeEntityId(entityType) === 'minecraft:villager';
}
