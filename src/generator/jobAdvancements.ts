import { type Job, type JobAction } from '../types/job';
import { type CompileContext, type JobContext, namespaced } from './context';
import { totalXpForLevel } from '../types/job';

export type JobAdvancementSegment = 'root' | `level_${number}`;

/** Full advancement id, e.g. questpack:jobs/0_fishing/level_3 */
export function jobAdvancementId(
  ctx: CompileContext,
  jc: JobContext,
  segment: JobAdvancementSegment,
): string {
  const suffix = segment === 'root' ? 'root' : segment;
  return `${ctx.namespace}:${jc.fnBase}/${suffix}`;
}

/** Advancement JSON path under the datapack data root. */
export function jobAdvancementPath(
  ctx: CompileContext,
  jc: JobContext,
  segment: JobAdvancementSegment,
): string {
  const suffix = segment === 'root' ? 'root' : segment;
  return `data/${ctx.namespace}/advancement/${jc.fnBase}/${suffix}.json`;
}

export function defaultJobAdvancementIcon(action: JobAction): string {
  switch (action) {
    case 'fish':
      return 'minecraft:fishing_rod';
    case 'combat':
    case 'hunt':
    case 'pvp':
      return 'minecraft:iron_sword';
    case 'mine':
      return 'minecraft:iron_pickaxe';
    case 'woodcut':
      return 'minecraft:iron_axe';
    case 'farm':
      return 'minecraft:wheat';
    case 'breeding':
      return 'minecraft:wheat_seeds';
    case 'enchanting':
      return 'minecraft:enchanting_table';
    case 'trading':
      return 'minecraft:emerald';
    case 'craft':
      return 'minecraft:crafting_table';
    case 'use':
      return 'minecraft:stick';
    case 'walk':
    case 'sprint':
      return 'minecraft:leather_boots';
    case 'custom':
      return 'minecraft:book';
  }
}

export function defaultJobAdvancementBackground(action: JobAction): string {
  switch (action) {
    case 'fish':
    case 'farm':
    case 'breeding':
      return 'minecraft:gui/advancements/backgrounds/husbandry';
    case 'mine':
    case 'woodcut':
    case 'craft':
    case 'use':
      return 'minecraft:gui/advancements/backgrounds/stone';
    case 'combat':
    case 'hunt':
    case 'pvp':
    case 'walk':
    case 'sprint':
      return 'minecraft:gui/advancements/backgrounds/adventure';
    case 'enchanting':
    case 'trading':
      return 'minecraft:gui/advancements/backgrounds/end';
    case 'custom':
      return 'minecraft:gui/advancements/backgrounds/adventure';
  }
}

/** Vanilla advancement tab backgrounds (1.21.11 resource location format). */
export const JOB_ADVANCEMENT_BACKGROUNDS = [
  { value: 'minecraft:gui/advancements/backgrounds/husbandry', label: 'Husbandry (green)' },
  { value: 'minecraft:gui/advancements/backgrounds/adventure', label: 'Adventure (map)' },
  { value: 'minecraft:gui/advancements/backgrounds/stone', label: 'Story (stone)' },
  { value: 'minecraft:gui/advancements/backgrounds/nether', label: 'Nether (red)' },
  { value: 'minecraft:gui/advancements/backgrounds/end', label: 'End (purple)' },
] as const;

/** Normalize legacy paths (textures/…/foo.png) to 1.21.11 advancement background ids. */
export function normalizeAdvancementBackground(id: string): string {
  let s = id.trim();
  if (!s) return s;
  s = s.replace(/^minecraft:textures\//, 'minecraft:');
  s = s.replace(/\.png$/i, '');
  if (!s.includes(':')) s = `minecraft:${s}`;
  return s;
}

export function jobAdvancementBackground(job: Job): string {
  const custom = job.advancementBackground?.trim();
  if (custom) return normalizeAdvancementBackground(custom);
  return defaultJobAdvancementBackground(job.action);
}

function levelDescription(job: Job, level: number): string {
  const xpRequired = totalXpForLevel(job, level);
  const milestone = (job.milestones ?? []).find((m) => m.level === level && m.rewards.length > 0);
  if (milestone) {
    return `Reach ${xpRequired} total XP. Milestone reward at this level.`;
  }
  return `Reach ${xpRequired} total XP.`;
}

function rootDescription(job: Job): string {
  if (job.advancementDescription?.trim()) return job.advancementDescription.trim();
  switch (job.action) {
    case 'fish':
      return 'Catch fish to earn XP and level up this skill.';
    case 'combat':
      return 'Defeat mobs to earn XP and level up this skill.';
    case 'mine':
      return 'Mine blocks to earn XP and level up this skill.';
    case 'woodcut':
      return 'Chop logs to earn XP and level up this skill.';
    case 'farm':
      return 'Harvest crops to earn XP and level up this skill.';
    case 'hunt':
      return 'Hunt creatures to earn XP and level up this skill.';
    case 'breeding':
      return 'Breed animals to earn XP and level up this skill.';
    case 'enchanting':
      return 'Enchant items to earn XP and level up this skill.';
    case 'trading':
      return 'Trade with villagers to earn XP and level up this skill.';
    case 'pvp':
      return 'Defeat players to earn XP and level up this skill.';
    case 'craft':
      return 'Craft items to earn XP and level up this skill.';
    case 'use':
      return 'Use items to earn XP and level up this skill.';
    case 'walk':
      return 'Walk to earn XP and level up this skill.';
    case 'sprint':
      return 'Sprint to earn XP and level up this skill.';
    case 'custom':
      return 'Perform tracked actions to earn XP and level up this skill.';
  }
}

function levelTitle(job: Job, level: number): string {
  if (job.levelTitle) {
    return job.levelTitle.replace(/\{name\}/g, job.name).replace(/\{n\}/g, String(level));
  }
  return `${job.name} — Level ${level}`;
}

function buildRootAdvancement(jc: JobContext): object {
  const { job } = jc;
  const icon = namespaced(job.advancementIcon ?? defaultJobAdvancementIcon(job.action));
  return {
    display: {
      icon: { id: icon },
      title: { text: job.name },
      description: { text: rootDescription(job) },
      background: jobAdvancementBackground(job),
      frame: 'task',
      show_toast: false,
      announce_to_chat: false,
    },
    criteria: {
      unlock: { trigger: 'minecraft:impossible' },
    },
  };
}

function buildLevelAdvancement(
  ctx: CompileContext,
  jc: JobContext,
  level: number,
): object {
  const { job } = jc;
  const icon = namespaced(job.advancementIcon ?? defaultJobAdvancementIcon(job.action));
  const parent =
    level === 1
      ? jobAdvancementId(ctx, jc, 'root')
      : jobAdvancementId(ctx, jc, `level_${level - 1}`);
  return {
    display: {
      icon: { id: icon },
      title: { text: levelTitle(job, level) },
      description: { text: levelDescription(job, level) },
      frame: level >= job.maxLevel ? 'goal' : 'task',
      show_toast: false,
      announce_to_chat: false,
    },
    parent,
    criteria: {
      unlock: { trigger: 'minecraft:impossible' },
    },
  };
}

/** Build advancement JSON files for one job's skill tree. */
export function buildJobAdvancementFiles(
  ctx: CompileContext,
  jc: JobContext,
): Record<string, string> {
  const files: Record<string, string> = {};
  const { job } = jc;

  files[jobAdvancementPath(ctx, jc, 'root')] =
    JSON.stringify(buildRootAdvancement(jc), null, 2) + '\n';

  for (let level = 1; level <= job.maxLevel; level++) {
    files[jobAdvancementPath(ctx, jc, `level_${level}`)] =
      JSON.stringify(buildLevelAdvancement(ctx, jc, level), null, 2) + '\n';
  }

  return files;
}

/** mcfunction lines to grant advancements matching the player's current job level. */
export function buildJobSyncAdvancementLines(ctx: CompileContext, jc: JobContext): string[] {
  const lines: string[] = [
    `# Sync ${jc.job.name} advancements to current level`,
    // Root is always granted so the custom Advancements tab is visible (Minecraft hides tabs until one node is earned).
    `advancement grant @s only ${jobAdvancementId(ctx, jc, 'root')}`,
  ];
  for (let level = 1; level <= jc.job.maxLevel; level++) {
    lines.push(
      `execute if score @s ${jc.level} matches ${level}.. run advancement grant @s only ${jobAdvancementId(ctx, jc, `level_${level}`)}`,
    );
  }
  return lines;
}

/** mcfunction lines to revoke all advancements for one job (used in reset). */
export function buildJobRevokeAdvancementLines(ctx: CompileContext, jc: JobContext): string[] {
  return [
    `advancement revoke @s from ${jobAdvancementId(ctx, jc, 'root')}`,
  ];
}
