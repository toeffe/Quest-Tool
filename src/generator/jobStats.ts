import {
  type Job,
  type JobAction,
  jobUsesPresets,
} from '../types/job';
import { namespaced, statId } from './context';

export const JOB_STAT_PRESET_LABELS: Record<string, string> = {
  ores: 'Common ores',
  logs: 'All log types',
  crops: 'Common crops',
  hostile_mobs: 'Hostile mobs',
  animals: 'Passive animals',
  basic_crafts: 'Basic crafts',
  single: 'Single target',
};

/** Presets available per typed action. */
export const ACTION_PRESETS: Partial<Record<JobAction, string[]>> = {
  mine: ['ores', 'single'],
  woodcut: ['logs', 'single'],
  farm: ['crops', 'single'],
  hunt: ['hostile_mobs', 'animals', 'single'],
  craft: ['basic_crafts', 'single'],
  use: ['single'],
};

const ORES = [
  'minecraft:coal_ore',
  'minecraft:deepslate_coal_ore',
  'minecraft:iron_ore',
  'minecraft:deepslate_iron_ore',
  'minecraft:copper_ore',
  'minecraft:deepslate_copper_ore',
  'minecraft:gold_ore',
  'minecraft:deepslate_gold_ore',
  'minecraft:redstone_ore',
  'minecraft:deepslate_redstone_ore',
  'minecraft:lapis_ore',
  'minecraft:deepslate_lapis_ore',
  'minecraft:diamond_ore',
  'minecraft:deepslate_diamond_ore',
  'minecraft:emerald_ore',
  'minecraft:deepslate_emerald_ore',
  'minecraft:nether_gold_ore',
  'minecraft:nether_quartz_ore',
  'minecraft:ancient_debris',
];

const LOGS = [
  'minecraft:oak_log',
  'minecraft:spruce_log',
  'minecraft:birch_log',
  'minecraft:jungle_log',
  'minecraft:acacia_log',
  'minecraft:dark_oak_log',
  'minecraft:mangrove_log',
  'minecraft:cherry_log',
  'minecraft:crimson_stem',
  'minecraft:warped_stem',
];

const CROPS = [
  'minecraft:wheat',
  'minecraft:carrots',
  'minecraft:potatoes',
  'minecraft:beetroots',
  'minecraft:nether_wart',
  'minecraft:sugar_cane',
  'minecraft:cocoa',
  'minecraft:melon',
  'minecraft:pumpkin',
  'minecraft:sweet_berry_bush',
];

const HOSTILE_MOBS = [
  'minecraft:zombie',
  'minecraft:skeleton',
  'minecraft:creeper',
  'minecraft:spider',
  'minecraft:enderman',
  'minecraft:witch',
  'minecraft:slime',
  'minecraft:phantom',
  'minecraft:drowned',
  'minecraft:husk',
  'minecraft:stray',
  'minecraft:pillager',
  'minecraft:vindicator',
  'minecraft:blaze',
  'minecraft:ghast',
  'minecraft:magma_cube',
  'minecraft:wither_skeleton',
  'minecraft:shulker',
  'minecraft:guardian',
  'minecraft:elder_guardian',
];

const ANIMALS = [
  'minecraft:cow',
  'minecraft:pig',
  'minecraft:sheep',
  'minecraft:chicken',
  'minecraft:horse',
  'minecraft:donkey',
  'minecraft:mule',
  'minecraft:rabbit',
  'minecraft:goat',
  'minecraft:mooshroom',
  'minecraft:bee',
  'minecraft:fox',
  'minecraft:wolf',
  'minecraft:cat',
  'minecraft:ocelot',
  'minecraft:parrot',
  'minecraft:turtle',
  'minecraft:camel',
  'minecraft:sniffer',
];

const BASIC_CRAFTS = [
  'minecraft:bread',
  'minecraft:torch',
  'minecraft:stick',
  'minecraft:iron_ingot',
  'minecraft:oak_planks',
  'minecraft:crafting_table',
  'minecraft:furnace',
  'minecraft:chest',
];

export const JOB_STAT_PRESETS: Record<string, string[]> = {
  ores: ORES,
  logs: LOGS,
  crops: CROPS,
  hostile_mobs: HOSTILE_MOBS,
  animals: ANIMALS,
  basic_crafts: BASIC_CRAFTS,
};

const CUSTOM_STATS: Record<Exclude<JobAction, 'custom' | 'mine' | 'woodcut' | 'farm' | 'hunt' | 'craft' | 'use'>, string> = {
  fish: 'minecraft.custom:minecraft.fish_caught',
  combat: 'minecraft.custom:minecraft.mob_kills',
  breeding: 'minecraft.custom:minecraft.animals_bred',
  enchanting: 'minecraft.custom:minecraft.enchant_item',
  trading: 'minecraft.custom:minecraft.traded_with_villager',
  pvp: 'minecraft.custom:minecraft.player_kills',
  walk: 'minecraft.custom:minecraft.walk_one_cm',
  sprint: 'minecraft.custom:minecraft.sprint_one_cm',
};

function typedCriterion(action: JobAction, target: string): string {
  const id = statId(target);
  switch (action) {
    case 'mine':
    case 'woodcut':
    case 'farm':
      return `minecraft.mined:${id}`;
    case 'hunt':
      return `minecraft.killed:${id}`;
    case 'craft':
      return `minecraft.crafted:${id}`;
    case 'use':
      return `minecraft.used:${id}`;
    default:
      return `minecraft.mined:${id}`;
  }
}

function presetTargets(job: Job): string[] {
  const preset = job.statPreset ?? defaultPresetForAction(job.action);
  if (preset === 'single') {
    const t = job.statTarget?.trim();
    return t ? [namespaced(t)] : [];
  }
  return (JOB_STAT_PRESETS[preset] ?? []).map(namespaced);
}

export function defaultPresetForAction(action: JobAction): string {
  switch (action) {
    case 'mine':
      return 'ores';
    case 'woodcut':
      return 'logs';
    case 'farm':
      return 'crops';
    case 'hunt':
      return 'hostile_mobs';
    case 'craft':
      return 'basic_crafts';
    case 'use':
      return 'single';
    default:
      return 'single';
  }
}

/** Resolve Minecraft scoreboard criteria for a job (1+ entries). */
export function resolveJobStatCriteria(job: Job): string[] {
  if (job.action === 'custom') {
    const c = job.customCriterion?.trim();
    return c ? [c] : [];
  }
  if (jobUsesPresets(job.action)) {
    const targets = presetTargets(job);
    return targets.map((t) => typedCriterion(job.action, t));
  }
  if (job.action === 'walk' || job.action === 'sprint') {
    return [CUSTOM_STATS[job.action]];
  }
  if (
    job.action === 'fish' ||
    job.action === 'combat' ||
    job.action === 'breeding' ||
    job.action === 'enchanting' ||
    job.action === 'trading' ||
    job.action === 'pvp'
  ) {
    return [CUSTOM_STATS[job.action]];
  }
  return [];
}

export function jobUsesMultiStat(job: Job): boolean {
  return resolveJobStatCriteria(job).length > 1;
}
