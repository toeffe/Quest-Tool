import type { StarterJobKey } from '../types/factory';
import type { JobMilestoneReward } from '../types/job';
import type { Project } from '../types/quest';

const FAST_XP_PER_LEVEL = 15;

function jobByKey(project: Project, key: StarterJobKey) {
  const job = project.jobs?.find((j) => j.starterKey === key);
  if (!job) throw new Error(`Missing starter job: ${key}`);
  return job;
}

function milestone(level: number, rewards: JobMilestoneReward[]) {
  return { level, rewards };
}

/** Fast-level all starter jobs with Lv 2 milestone rewards (covers all milestone reward types). */
export function configureTestJobs(project: Project, customItemId: string) {
  const configs: { key: StarterJobKey; rewards: JobMilestoneReward[] }[] = [
    { key: 'starter_fishing', rewards: [{ type: 'xp', amount: 30 }] },
    { key: 'starter_mining', rewards: [{ type: 'item', value: 'minecraft:coal', amount: 4 }] },
    {
      key: 'starter_woodcutting',
      rewards: [{ type: 'item', customItemId, amount: 1 }],
    },
    { key: 'starter_farming', rewards: [{ type: 'xp', amount: 25 }] },
    {
      key: 'starter_combat',
      rewards: [{ type: 'command', value: 'say [Jobs] Combat milestone reached!' }],
    },
    { key: 'starter_hunting', rewards: [{ type: 'item', value: 'minecraft:string', amount: 3 }] },
    { key: 'starter_breeding', rewards: [{ type: 'xp', amount: 40 }] },
    { key: 'starter_enchanting', rewards: [{ type: 'money', amount: 10 }] },
    { key: 'starter_trading', rewards: [{ type: 'item', value: 'minecraft:book', amount: 1 }] },
    {
      key: 'starter_crafting',
      rewards: [{ type: 'item', customItemId, amount: 1 }],
    },
    { key: 'starter_pvp', rewards: [{ type: 'xp', amount: 50 }] },
  ];

  for (const { key, rewards } of configs) {
    const job = jobByKey(project, key);
    job.xpPerLevel = FAST_XP_PER_LEVEL;
    job.showProgressBar = true;
    job.showActionBar = true;
    job.milestones = [milestone(2, rewards)];
  }
}

export function getJobByKey(project: Project, key: StarterJobKey) {
  return jobByKey(project, key);
}
