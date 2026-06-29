import { type Job, type JobAction, totalXpForLevel } from '../types/job';

export interface BalancedJobDefaults {
  xpPerAction: number;
  xpPerLevel: number;
  maxLevel: number;
  distanceUnit?: number;
}

const BALANCE: Record<JobAction, BalancedJobDefaults> = {
  fish: { xpPerAction: 8, xpPerLevel: 1000, maxLevel: 50 },
  combat: { xpPerAction: 6, xpPerLevel: 1000, maxLevel: 50 },
  mine: { xpPerAction: 4, xpPerLevel: 1200, maxLevel: 50 },
  woodcut: { xpPerAction: 3, xpPerLevel: 1000, maxLevel: 50 },
  farm: { xpPerAction: 4, xpPerLevel: 1600, maxLevel: 50 },
  hunt: { xpPerAction: 8, xpPerLevel: 1000, maxLevel: 50 },
  craft: { xpPerAction: 6, xpPerLevel: 1000, maxLevel: 50 },
  use: { xpPerAction: 4, xpPerLevel: 1000, maxLevel: 50 },
  breeding: { xpPerAction: 12, xpPerLevel: 2000, maxLevel: 40 },
  enchanting: { xpPerAction: 15, xpPerLevel: 2500, maxLevel: 35 },
  trading: { xpPerAction: 20, xpPerLevel: 3000, maxLevel: 35 },
  pvp: { xpPerAction: 35, xpPerLevel: 2500, maxLevel: 25 },
  walk: { xpPerAction: 1, xpPerLevel: 700, maxLevel: 50, distanceUnit: 2100 },
  sprint: { xpPerAction: 1, xpPerLevel: 700, maxLevel: 50, distanceUnit: 2500 },
  custom: { xpPerAction: 8, xpPerLevel: 1000, maxLevel: 50 },
};

/** Balanced XP curve defaults for a job action. */
export function getBalancedDefaults(action: JobAction): BalancedJobDefaults {
  return { ...BALANCE[action] };
}

/** Apply balanced XP fields to a job (preserves identity/display fields). */
export function applyBalancedDefaults(job: Job): Job {
  const d = getBalancedDefaults(job.action);
  return {
    ...job,
    xpPerAction: d.xpPerAction,
    xpPerLevel: d.xpPerLevel,
    maxLevel: d.maxLevel,
    distanceUnit: d.distanceUnit ?? job.distanceUnit,
  };
}

/** Estimated actions (or distance units) to reach a level. */
export function actionsToReachLevel(job: Job, level: number): number {
  if (job.xpPerAction < 1 || level < 1) return 0;
  return Math.ceil(totalXpForLevel(job, level) / job.xpPerAction);
}

/** Estimated actions (or distance units) to reach max level. */
export function actionsToReachMaxLevel(job: Job): number {
  return actionsToReachLevel(job, job.maxLevel);
}

/** Suggested milestone levels for starter jobs (empty rewards). */
export const DEFAULT_MILESTONE_LEVELS = [5, 10, 25, 50] as const;

export function emptyMilestoneSlots(maxLevel: number): Job['milestones'] {
  return DEFAULT_MILESTONE_LEVELS.filter((l) => l <= maxLevel).map((level) => ({
    level,
    rewards: [],
  }));
}
