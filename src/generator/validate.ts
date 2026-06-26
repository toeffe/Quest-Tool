import { type Project, type Quest } from '../types/quest';
import { TYPED_JOB_ACTIONS } from '../types/job';
import { isRewardSupported } from './platform';
import { toIdentifier } from '../types/ids';

export type IssueLevel = 'error' | 'warning';

export interface ValidationIssue {
  level: IssueLevel;
  message: string;
  questId?: string;
  questName?: string;
  jobId?: string;
  jobName?: string;
  /** Field path for editor tab routing and focus (e.g. npc.name, objectives, chain.requires). */
  field?: string;
}

function objectiveIssues(quest: Quest): string[] {
  const out: string[] = [];
  if (quest.objectives.length === 0) {
    out.push('Quest has no objective.');
    return out;
  }

  // Talk quests use a single NPC-reach objective; the others can have several.
  const multi = quest.objectives.length > 1;
  quest.objectives.forEach((o, i) => {
    const where = multi ? `Objective ${i + 1}` : 'Objective';
    switch (quest.type) {
      case 'kill':
      case 'gather':
      case 'delivery':
      case 'daily':
        if (quest.type === 'kill') {
          if (!o.target) out.push(`${where} is missing a target mob.`);
        } else if (!o.target && !o.customItemId) {
          out.push(`${where} is missing a target item.`);
        }
        if (!o.amount || o.amount < 1) out.push(`${where} amount must be at least 1.`);
        if ((quest.type === 'kill' || quest.type === 'gather') && o.spawnZone && !o.location) {
          out.push(`${where} spawn zone is enabled but no location is set.`);
        }
        if (
          (quest.type === 'kill' || quest.type === 'gather') &&
          o.spawnZone &&
          o.zoneCap != null &&
          o.zoneCap < 1
        ) {
          out.push(`${where} spawn cap must be at least 1.`);
        }
        if (quest.type === 'gather' && o.spawnZone && !o.zoneMob) {
          out.push(`${where} spawn zone is enabled but no mob/creature is set.`);
        }
        if (
          (quest.type === 'kill' || quest.type === 'gather') &&
          o.spawnZone &&
          o.zoneDropMode === 'custom'
        ) {
          const drops = o.zoneDrops ?? [];
          if (!drops.length) {
            out.push(`${where} custom drops is enabled but no drops are configured.`);
          }
          drops.forEach((d, di) => {
            const dropWhere = drops.length > 1 ? `${where} drop ${di + 1}` : `${where} drop`;
            if (!d.target && !d.customItemId) {
              out.push(`${dropWhere} is missing an item.`);
            }
            if (d.amount != null && d.amount < 1) {
              out.push(`${dropWhere} amount must be at least 1.`);
            }
            if (d.chance != null && (d.chance < 1 || d.chance > 100)) {
              out.push(`${dropWhere} chance must be between 1 and 100.`);
            }
          });
        }
        break;
      case 'exploration':
        if (!o.location) out.push(`${where} is missing a target location.`);
        break;
      case 'talk':
        // Talk quests are valid with or without a target NPC.
        break;
    }
  });
  return out;
}

function customItemIssues(project: Project): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const items = project.customItems ?? [];
  const tagCounts = new Map<string, number>();
  const referenced = new Set<string>();

  for (const quest of project.quests) {
    for (const o of quest.objectives) {
      if (o.customItemId) referenced.add(o.customItemId);
      for (const d of o.zoneDrops ?? []) {
        if (d.customItemId) referenced.add(d.customItemId);
      }
    }
    for (const r of quest.rewards) {
      if (r.customItemId) referenced.add(r.customItemId);
    }
  }

  for (const item of items) {
    const tag = toIdentifier(item.tag);
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    if (!item.displayName.trim()) {
      issues.push({ level: 'error', message: `Custom item "${item.name}" has no display name.` });
    }
    if (!item.baseItem.trim()) {
      issues.push({ level: 'error', message: `Custom item "${item.name}" has no base item.` });
    }
    if (!referenced.has(item.id)) {
      issues.push({
        level: 'warning',
        message: `Custom item "${item.name}" is not used in any quest.`,
      });
    }
  }

  for (const [tag, count] of tagCounts) {
    if (count > 1) {
      issues.push({
        level: 'error',
        message: `Duplicate custom item tag "${tag}" (used ${count} times).`,
      });
    }
  }

  return issues;
}

function jobIssues(project: Project): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const jobs = project.jobs ?? [];
  const jobIds = new Set(jobs.map((j) => j.id));
  const nameCounts = new Map<string, number>();

  for (const job of jobs) {
    const name = job.name.trim();
    if (!name) {
      issues.push({
        level: 'error',
        message: 'A job has an empty name.',
        jobId: job.id,
        jobName: job.name,
      });
    }
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
    if (job.xpPerAction < 1) {
      issues.push({
        level: 'error',
        message: `Job "${job.name}" XP per action must be at least 1.`,
        jobId: job.id,
        jobName: job.name,
      });
    }
    if (job.xpPerLevel < 1) {
      issues.push({
        level: 'error',
        message: `Job "${job.name}" XP per level must be at least 1.`,
        jobId: job.id,
        jobName: job.name,
      });
    }
    if (job.maxLevel < 1) {
      issues.push({
        level: 'error',
        message: `Job "${job.name}" max level must be at least 1.`,
        jobId: job.id,
        jobName: job.name,
      });
    }
    if (job.advancementIcon && !job.advancementIcon.includes(':')) {
      issues.push({
        level: 'warning',
        message: `Job "${job.name}" advancement icon should be a namespaced id (e.g. minecraft:fishing_rod).`,
        jobId: job.id,
        jobName: job.name,
      });
    }
    if (job.advancementBackground && !job.advancementBackground.includes(':')) {
      issues.push({
        level: 'warning',
        message: `Job "${job.name}" advancement background should be a resource id (e.g. minecraft:gui/advancements/backgrounds/husbandry).`,
        jobId: job.id,
        jobName: job.name,
      });
    }
    if (job.action === 'custom' && !job.customCriterion?.trim()) {
      issues.push({
        level: 'error',
        message: `Job "${job.name}" needs a custom scoreboard criterion.`,
        jobId: job.id,
        jobName: job.name,
        field: 'jobs.customCriterion',
      });
    }
    if (TYPED_JOB_ACTIONS.includes(job.action)) {
      const preset = job.statPreset ?? 'single';
      if (preset === 'single' && !job.statTarget?.trim()) {
        issues.push({
          level: 'error',
          message: `Job "${job.name}" needs a single target id (or choose a preset).`,
          jobId: job.id,
          jobName: job.name,
          field: 'jobs.statTarget',
        });
      }
    }
    const milestoneLevels = new Set<number>();
    for (const milestone of job.milestones ?? []) {
      if (milestone.level < 1 || milestone.level > job.maxLevel) {
        issues.push({
          level: 'error',
          message: `Job "${job.name}" milestone level ${milestone.level} must be between 1 and ${job.maxLevel}.`,
          jobId: job.id,
          jobName: job.name,
          field: 'jobs.milestones',
        });
      }
      if (milestoneLevels.has(milestone.level)) {
        issues.push({
          level: 'error',
          message: `Job "${job.name}" has duplicate milestone at level ${milestone.level}.`,
          jobId: job.id,
          jobName: job.name,
          field: 'jobs.milestones',
        });
      }
      milestoneLevels.add(milestone.level);
      for (const reward of milestone.rewards) {
        if (reward.type === 'item' && !reward.value && !reward.customItemId) {
          issues.push({
            level: 'error',
            message: `Job "${job.name}" milestone Lv.${milestone.level} has an empty item reward.`,
            jobId: job.id,
            jobName: job.name,
            field: 'jobs.milestones',
          });
        }
      }
    }
  }

  const customItemIds = new Set((project.customItems ?? []).map((i) => i.id));
  for (const job of jobs) {
    for (const milestone of job.milestones ?? []) {
      for (const reward of milestone.rewards) {
        if (reward.customItemId && !customItemIds.has(reward.customItemId)) {
          issues.push({
            level: 'error',
            message: `Job "${job.name}" milestone references a custom item that no longer exists.`,
            jobId: job.id,
            jobName: job.name,
            field: 'jobs.milestones',
          });
        }
      }
    }
  }

  for (const [name, count] of nameCounts) {
    if (count > 1) {
      issues.push({
        level: 'error',
        message: `Duplicate job name: "${name}" (used ${count} times).`,
      });
    }
  }

  for (const quest of project.quests) {
    const jobReq = quest.chain.requiresJob;
    if (jobReq) {
      if (!jobIds.has(jobReq.jobId)) {
        issues.push({
          level: 'error',
          message: 'Chain requires a job that no longer exists.',
          questId: quest.id,
          questName: quest.name,
          field: 'chain.requiresJob',
        });
      }
      if (jobReq.level < 1) {
        issues.push({
          level: 'error',
          message: 'Job level requirement must be at least 1.',
          questId: quest.id,
          questName: quest.name,
          field: 'chain.requiresJob',
        });
      }
    }

    for (const reward of quest.rewards) {
      if (reward.type === 'jobXp') {
        if (!reward.jobId || !jobIds.has(reward.jobId)) {
          issues.push({
            level: 'error',
            message: 'A job XP reward references a job that no longer exists.',
            questId: quest.id,
            questName: quest.name,
            field: 'rewards',
          });
        }
        if (!reward.amount || reward.amount < 1) {
          issues.push({
            level: 'error',
            message: 'A job XP reward must grant at least 1 XP.',
            questId: quest.id,
            questName: quest.name,
            field: 'rewards',
          });
        }
      }
    }
  }

  return issues;
}

/** Validate the whole project; returns errors (block export) and warnings. */
export function validateProject(project: Project): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (level: IssueLevel, message: string, quest?: Quest, field?: string) =>
    issues.push({ level, message, questId: quest?.id, questName: quest?.name, field });

  if (project.quests.length === 0) {
    add('error', 'The project has no quests.');
    return issues;
  }

  issues.push(...customItemIssues(project));
  issues.push(...jobIssues(project));

  const customItemIds = new Set((project.customItems ?? []).map((i) => i.id));

  const nameCounts = new Map<string, number>();
  const npcTagCounts = new Map<string, number>();

  for (const quest of project.quests) {
    const name = quest.name.trim();
    if (!name) add('error', 'A quest has an empty name.', quest, 'name');
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);

    if (!quest.npc.name.trim()) add('error', 'The quest giver has no name.', quest, 'npc.name');

    const npcTag = toIdentifier(quest.npc.tag);
    npcTagCounts.set(npcTag, (npcTagCounts.get(npcTag) ?? 0) + 1);

    for (const msg of objectiveIssues(quest)) add('error', msg, quest, 'objectives');

    for (const o of quest.objectives) {
      if (o.customItemId && !customItemIds.has(o.customItemId)) {
        add('error', 'An objective references a custom item that no longer exists.', quest);
      }
      for (const d of o.zoneDrops ?? []) {
        if (d.customItemId && !customItemIds.has(d.customItemId)) {
          add('error', 'A spawn zone drop references a custom item that no longer exists.', quest);
        }
      }
    }

    if (quest.npc.spawnMode === 'fixed' && !quest.npc.coordinates) {
      add('error', 'NPC spawn is set to fixed coordinates but none are provided.', quest, 'npc.coordinates');
    }

    if (quest.type === 'talk' && quest.targetNpc) {
      if (!quest.targetNpc.name.trim()) add('error', 'The target NPC has no name.', quest, 'targetNpc.name');
      if (quest.targetNpc.spawnMode === 'fixed' && !quest.targetNpc.coordinates) {
        add('error', 'Target NPC uses fixed coordinates but none are provided.', quest, 'targetNpc.coordinates');
      }
    }

    // Chain integrity.
    if (quest.chain.requires) {
      const exists = project.quests.some((q) => q.name === quest.chain.requires);
      if (!exists) {
        add('error', `Chain requires "${quest.chain.requires}", which is not a quest in this project.`, quest, 'chain.requires');
      }
      if (quest.chain.requires === quest.name) {
        add('error', 'A quest cannot require itself.', quest, 'chain.requires');
      }
    }
    if (quest.chain.unlocks) {
      const exists = project.quests.some((q) => q.name === quest.chain.unlocks);
      if (!exists) {
        add('error', `Chain unlocks "${quest.chain.unlocks}", which is not a quest in this project.`, quest, 'chain.unlocks');
      }
    }

    // Reward platform compatibility.
    for (const reward of quest.rewards) {
      const support = isRewardSupported(project.platform, reward);
      if (support.note) {
        add(support.ok ? 'warning' : 'warning', `${support.note}`, quest);
      }
      if (reward.type === 'item' && !reward.value && !reward.customItemId) {
        add('error', 'An item reward is missing its item.', quest, 'rewards');
      }
      if (reward.customItemId && !customItemIds.has(reward.customItemId)) {
        add('error', 'A reward references a custom item that no longer exists.', quest, 'rewards');
      }
      if (reward.type === 'command' && !reward.value) {
        add('error', 'A command reward is missing its value.', quest, 'rewards');
      }
    }

    if (quest.rewards.length === 0) {
      add('warning', 'Quest has no rewards.', quest, 'rewards');
    }
  }

  for (const [name, count] of nameCounts) {
    if (count > 1) add('error', `Duplicate quest name: "${name}" (used ${count} times).`);
  }
  for (const [tag, count] of npcTagCounts) {
    if (count > 1) {
      add('warning', `NPC tag "${tag}" is used by ${count} quests; they will share/duplicate NPCs.`);
    }
  }

  return issues;
}

export function hasBlockingErrors(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.level === 'error');
}
