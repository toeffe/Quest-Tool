/**
 * Passive job / skill definitions for Quest Tool MC.
 * Jobs track player actions (e.g. fishing) and grant XP toward levels.
 */

/** The kinds of actions a job can track. */
export type JobAction =
  | 'fish'
  | 'combat'
  | 'breeding'
  | 'enchanting'
  | 'trading'
  | 'pvp'
  | 'mine'
  | 'woodcut'
  | 'farm'
  | 'hunt'
  | 'craft'
  | 'use'
  | 'walk'
  | 'sprint'
  | 'custom';

export const JOB_ACTION_LABELS: Record<JobAction, string> = {
  fish: 'Fishing',
  combat: 'Combat',
  breeding: 'Breeding',
  enchanting: 'Enchanting',
  trading: 'Trading',
  pvp: 'PvP',
  mine: 'Mining',
  woodcut: 'Woodcutting',
  farm: 'Farming',
  hunt: 'Hunting',
  craft: 'Crafting',
  use: 'Item use',
  walk: 'Walking (distance)',
  sprint: 'Sprinting (distance)',
  custom: 'Custom stat',
};

/** Actions that use stat presets or a single target id. */
export const TYPED_JOB_ACTIONS: JobAction[] = [
  'mine',
  'woodcut',
  'farm',
  'hunt',
  'craft',
  'use',
];

export const DISTANCE_JOB_ACTIONS: JobAction[] = ['walk', 'sprint'];

/** Reward types allowed on job milestones (no jobXp loops). */
export type JobMilestoneRewardType = 'item' | 'xp' | 'money' | 'command';

export const JOB_MILESTONE_REWARD_LABELS: Record<JobMilestoneRewardType, string> = {
  item: 'Item',
  xp: 'Experience',
  money: 'Money',
  command: 'Custom command',
};

export interface JobMilestoneReward {
  type: JobMilestoneRewardType;
  value?: string;
  customItemId?: string;
  amount?: number;
}

export interface JobMilestone {
  level: number;
  rewards: JobMilestoneReward[];
}

export interface Job {
  id: string;
  /** Stable slug for migration matching (e.g. starter_fishing). */
  starterKey?: string;
  /** Display name (e.g. "Fishing"). */
  name: string;
  action: JobAction;
  /** XP granted per action (e.g. per fish caught). */
  xpPerAction: number;
  /** Flat XP required per level. Total XP to reach level L = xpPerLevel * L. */
  xpPerLevel: number;
  /** Maximum level cap. */
  maxLevel: number;
  /** Show a brief action bar message when XP is gained. */
  showActionBar: boolean;
  /** Show a boss bar at the top with level, XP, and progress to the next level. */
  showProgressBar?: boolean;
  /** Preset id for typed actions (ores, logs, crops, …) or 'single'. */
  statPreset?: string;
  /** Single block/mob/item id when statPreset is 'single'. */
  statTarget?: string;
  /** Full scoreboard criterion when action is 'custom'. */
  customCriterion?: string;
  /** Centimeters per XP unit for walk/sprint (default 1000 = 10 blocks). */
  distanceUnit?: number;
  /** Rewards granted when the player reaches specific levels. */
  milestones?: JobMilestone[];
  /** Vanilla item id for the advancement tree icon (defaults by action). */
  advancementIcon?: string;
  /** Root advancement description override. */
  advancementDescription?: string;
  /** Root advancement tab background (1.21.11 id). */
  advancementBackground?: string;
  /** Level advancement title template; use {name} and {n}. */
  levelTitle?: string;
}

/** Total XP required to reach a given level (flat curve). */
export function totalXpForLevel(job: Job, level: number): number {
  return job.xpPerLevel * Math.max(0, level);
}

/** Level from current XP (flat curve). */
export function levelFromXp(job: Job, xp: number): number {
  if (job.xpPerLevel < 1) return 0;
  const raw = Math.floor(xp / job.xpPerLevel);
  return Math.min(job.maxLevel, Math.max(0, raw));
}

export function jobUsesPresets(action: JobAction): boolean {
  return TYPED_JOB_ACTIONS.includes(action);
}

export function jobIsDistance(action: JobAction): boolean {
  return DISTANCE_JOB_ACTIONS.includes(action);
}
