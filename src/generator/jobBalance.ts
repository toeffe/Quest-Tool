import { type Job, type JobAction, totalXpForLevel } from '../types/job';

export interface BalancedJobDefaults {
  xpPerAction: number;
  xpPerLevel: number;
  maxLevel: number;
  distanceUnit?: number;
}

const BALANCE: Record<JobAction, BalancedJobDefaults> = {
  fish: { xpPerAction: 10, xpPerLevel: 100, maxLevel: 50 },
  combat: { xpPerAction: 8, xpPerLevel: 120, maxLevel: 50 },
  mine: { xpPerAction: 5, xpPerLevel: 100, maxLevel: 50 },
  woodcut: { xpPerAction: 4, xpPerLevel: 80, maxLevel: 50 },
  farm: { xpPerAction: 6, xpPerLevel: 90, maxLevel: 50 },
  hunt: { xpPerAction: 10, xpPerLevel: 120, maxLevel: 50 },
  craft: { xpPerAction: 8, xpPerLevel: 100, maxLevel: 50 },
  use: { xpPerAction: 5, xpPerLevel: 100, maxLevel: 50 },
  breeding: { xpPerAction: 15, xpPerLevel: 150, maxLevel: 30 },
  enchanting: { xpPerAction: 20, xpPerLevel: 200, maxLevel: 30 },
  trading: { xpPerAction: 25, xpPerLevel: 250, maxLevel: 30 },
  pvp: { xpPerAction: 50, xpPerLevel: 500, maxLevel: 20 },
  walk: { xpPerAction: 1, xpPerLevel: 100, maxLevel: 50, distanceUnit: 1000 },
  sprint: { xpPerAction: 1, xpPerLevel: 100, maxLevel: 50, distanceUnit: 1000 },
  custom: { xpPerAction: 10, xpPerLevel: 100, maxLevel: 50 },
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

/** Suggested milestone levels for starter jobs (empty rewards). */
export const DEFAULT_MILESTONE_LEVELS = [5, 10, 25, 50] as const;

export function emptyMilestoneSlots(maxLevel: number): Job['milestones'] {
  return DEFAULT_MILESTONE_LEVELS.filter((l) => l <= maxLevel).map((level) => ({
    level,
    rewards: [],
  }));
}
