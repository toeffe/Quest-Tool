import { type Project, type Quest } from '../types/quest';
import { TYPED_JOB_ACTIONS } from '../types/job';
import { isRewardSupported } from './platform';
import { toIdentifier } from '../types/ids';
import { type AppLocale } from '../i18n/types';
import { getAppLocale } from '../i18n';
import { tValidation } from '../i18n/translate';
import {
  getEnchantmentMaxLevel,
  isKnownEnchantment,
  normalizeEnchantmentId,
} from '../data/enchantments';

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

function objectiveWhere(multi: boolean, i: number, locale: AppLocale): string {
  if (!multi) return tValidation('objective', undefined, locale);
  return tValidation('objectiveN', { n: i + 1 }, locale);
}

function objectiveIssues(quest: Quest, locale: AppLocale): string[] {
  const out: string[] = [];
  if (quest.objectives.length === 0) {
    out.push(tValidation('noObjective', undefined, locale));
    return out;
  }

  const multi = quest.objectives.length > 1;
  quest.objectives.forEach((o, i) => {
    const where = objectiveWhere(multi, i, locale);
    switch (quest.type) {
      case 'kill':
      case 'gather':
      case 'delivery':
      case 'daily':
        if (quest.type === 'kill') {
          if (!o.target) out.push(tValidation('missingTargetMob', { where }, locale));
        } else if (!o.target && !o.customItemId) {
          out.push(tValidation('missingTargetItem', { where }, locale));
        }
        if (!o.amount || o.amount < 1) out.push(tValidation('amountMin', { where }, locale));
        if ((quest.type === 'kill' || quest.type === 'gather') && o.spawnZone && !o.location) {
          out.push(tValidation('spawnZoneNoLocation', { where }, locale));
        }
        if (
          (quest.type === 'kill' || quest.type === 'gather') &&
          o.spawnZone &&
          o.zoneCap != null &&
          o.zoneCap < 1
        ) {
          out.push(tValidation('spawnCapMin', { where }, locale));
        }
        if (quest.type === 'gather' && o.spawnZone && !o.zoneMob) {
          out.push(tValidation('spawnZoneNoMob', { where }, locale));
        }
        if (
          (quest.type === 'kill' || quest.type === 'gather') &&
          o.spawnZone &&
          o.zoneDropMode === 'custom'
        ) {
          const drops = o.zoneDrops ?? [];
          if (!drops.length) {
            out.push(tValidation('customDropsEmpty', { where }, locale));
          }
          drops.forEach((d, di) => {
            const dropWhere =
              drops.length > 1
                ? tValidation('dropN', { where, n: di + 1 }, locale)
                : tValidation('drop', { where }, locale);
            if (!d.target && !d.customItemId) {
              out.push(tValidation('dropMissingItem', { where: dropWhere }, locale));
            }
            if (d.amount != null && d.amount < 1) {
              out.push(tValidation('dropAmountMin', { where: dropWhere }, locale));
            }
            if (d.chance != null && (d.chance < 1 || d.chance > 100)) {
              out.push(tValidation('dropChanceRange', { where: dropWhere }, locale));
            }
          });
        }
        break;
      case 'exploration':
        if (!o.location) out.push(tValidation('missingLocation', { where }, locale));
        break;
      case 'talk':
        break;
    }
  });
  return out;
}

function customItemIssues(project: Project, locale: AppLocale): ValidationIssue[] {
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
      issues.push({
        level: 'error',
        message: tValidation('customItemNoDisplayName', { name: item.name }, locale),
      });
    }
    if (!item.baseItem.trim()) {
      issues.push({
        level: 'error',
        message: tValidation('customItemNoBaseItem', { name: item.name }, locale),
      });
    }
    if (!referenced.has(item.id)) {
      issues.push({
        level: 'warning',
        message: tValidation('customItemUnused', { name: item.name }, locale),
      });
    }

    const enchantIds = new Set<string>();
    for (const enchant of item.enchantments ?? []) {
      const normId = normalizeEnchantmentId(enchant.enchantmentId);
      if (!normId) continue;

      if (enchant.level < 1) {
        issues.push({
          level: 'error',
          message: tValidation(
            'customItemEnchantmentLevel',
            { name: item.name, enchant: normId },
            locale,
          ),
        });
      }

      const maxLevel = getEnchantmentMaxLevel(normId);
      if (maxLevel != null && enchant.level > maxLevel) {
        issues.push({
          level: 'warning',
          message: tValidation(
            'customItemEnchantmentMaxLevel',
            { name: item.name, enchant: normId, max: maxLevel },
            locale,
          ),
        });
      }

      if (!isKnownEnchantment(normId)) {
        issues.push({
          level: 'warning',
          message: tValidation(
            'customItemUnknownEnchantment',
            { name: item.name, enchant: normId },
            locale,
          ),
        });
      }

      if (enchantIds.has(normId)) {
        issues.push({
          level: 'error',
          message: tValidation(
            'customItemDuplicateEnchantment',
            { name: item.name, enchant: normId },
            locale,
          ),
        });
      }
      enchantIds.add(normId);
    }
  }

  for (const [tag, count] of tagCounts) {
    if (count > 1) {
      issues.push({
        level: 'error',
        message: tValidation('duplicateItemTag', { tag, count }, locale),
      });
    }
  }

  return issues;
}

function jobIssues(project: Project, locale: AppLocale): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const jobs = project.jobs ?? [];
  const jobIds = new Set(jobs.map((j) => j.id));
  const nameCounts = new Map<string, number>();

  for (const job of jobs) {
    const name = job.name.trim();
    if (!name) {
      issues.push({
        level: 'error',
        message: tValidation('jobEmptyName', undefined, locale),
        jobId: job.id,
        jobName: job.name,
      });
    }
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
    if (job.xpPerAction < 1) {
      issues.push({
        level: 'error',
        message: tValidation('jobXpPerActionMin', { name: job.name }, locale),
        jobId: job.id,
        jobName: job.name,
      });
    }
    if (job.xpPerLevel < 1) {
      issues.push({
        level: 'error',
        message: tValidation('jobXpPerLevelMin', { name: job.name }, locale),
        jobId: job.id,
        jobName: job.name,
      });
    }
    if (job.maxLevel < 1) {
      issues.push({
        level: 'error',
        message: tValidation('jobMaxLevelMin', { name: job.name }, locale),
        jobId: job.id,
        jobName: job.name,
      });
    }
    if (job.advancementIcon && !job.advancementIcon.includes(':')) {
      issues.push({
        level: 'warning',
        message: tValidation('jobAdvIconWarning', { name: job.name }, locale),
        jobId: job.id,
        jobName: job.name,
      });
    }
    if (job.advancementBackground && !job.advancementBackground.includes(':')) {
      issues.push({
        level: 'warning',
        message: tValidation('jobAdvBackgroundWarning', { name: job.name }, locale),
        jobId: job.id,
        jobName: job.name,
      });
    }
    if (job.action === 'custom' && !job.customCriterion?.trim()) {
      issues.push({
        level: 'error',
        message: tValidation('jobCustomCriterion', { name: job.name }, locale),
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
          message: tValidation('jobSingleTarget', { name: job.name }, locale),
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
          message: tValidation(
            'jobMilestoneLevelRange',
            { name: job.name, level: milestone.level, maxLevel: job.maxLevel },
            locale,
          ),
          jobId: job.id,
          jobName: job.name,
          field: 'jobs.milestones',
        });
      }
      if (milestoneLevels.has(milestone.level)) {
        issues.push({
          level: 'error',
          message: tValidation(
            'jobDuplicateMilestone',
            { name: job.name, level: milestone.level },
            locale,
          ),
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
            message: tValidation(
              'jobMilestoneEmptyItem',
              { name: job.name, level: milestone.level },
              locale,
            ),
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
            message: tValidation('jobMilestoneMissingItem', { name: job.name }, locale),
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
        message: tValidation('duplicateJobName', { name, count }, locale),
      });
    }
  }

  for (const quest of project.quests) {
    const jobReq = quest.chain.requiresJob;
    if (jobReq) {
      if (!jobIds.has(jobReq.jobId)) {
        issues.push({
          level: 'error',
          message: tValidation('chainRequiresMissingJob', undefined, locale),
          questId: quest.id,
          questName: quest.name,
          field: 'chain.requiresJob',
        });
      }
      if (jobReq.level < 1) {
        issues.push({
          level: 'error',
          message: tValidation('jobLevelMin', undefined, locale),
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
            message: tValidation('jobXpRewardMissingJob', undefined, locale),
            questId: quest.id,
            questName: quest.name,
            field: 'rewards',
          });
        }
        if (!reward.amount || reward.amount < 1) {
          issues.push({
            level: 'error',
            message: tValidation('jobXpRewardMin', undefined, locale),
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
export function validateProject(project: Project, locale?: AppLocale): ValidationIssue[] {
  const effectiveLocale = locale ?? getAppLocale();
  const issues: ValidationIssue[] = [];
  const add = (level: IssueLevel, message: string, quest?: Quest, field?: string) =>
    issues.push({ level, message, questId: quest?.id, questName: quest?.name, field });

  if (project.quests.length === 0) {
    add('error', tValidation('projectNoQuests', undefined, effectiveLocale));
    return issues;
  }

  issues.push(...customItemIssues(project, effectiveLocale));
  issues.push(...jobIssues(project, effectiveLocale));

  const customItemIds = new Set((project.customItems ?? []).map((i) => i.id));

  const nameCounts = new Map<string, number>();
  const npcTagCounts = new Map<string, number>();

  for (const quest of project.quests) {
    const name = quest.name.trim();
    if (!name) add('error', tValidation('questEmptyName', undefined, effectiveLocale), quest, 'name');
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);

    if (!quest.npc.name.trim()) {
      add('error', tValidation('npcNoName', undefined, effectiveLocale), quest, 'npc.name');
    }

    const npcTag = toIdentifier(quest.npc.tag);
    npcTagCounts.set(npcTag, (npcTagCounts.get(npcTag) ?? 0) + 1);

    for (const msg of objectiveIssues(quest, effectiveLocale)) {
      add('error', msg, quest, 'objectives');
    }

    for (const o of quest.objectives) {
      if (o.customItemId && !customItemIds.has(o.customItemId)) {
        add('error', tValidation('objectiveMissingCustomItem', undefined, effectiveLocale), quest);
      }
      for (const d of o.zoneDrops ?? []) {
        if (d.customItemId && !customItemIds.has(d.customItemId)) {
          add(
            'error',
            tValidation('spawnDropMissingCustomItem', undefined, effectiveLocale),
            quest,
          );
        }
      }
    }

    if (quest.npc.spawnMode === 'fixed' && !quest.npc.coordinates) {
      add('error', tValidation('npcFixedNoCoords', undefined, effectiveLocale), quest, 'npc.coordinates');
    }

    if (quest.type === 'talk' && quest.targetNpc) {
      if (!quest.targetNpc.name.trim()) {
        add('error', tValidation('targetNpcNoName', undefined, effectiveLocale), quest, 'targetNpc.name');
      }
      if (quest.targetNpc.spawnMode === 'fixed' && !quest.targetNpc.coordinates) {
        add(
          'error',
          tValidation('targetNpcFixedNoCoords', undefined, effectiveLocale),
          quest,
          'targetNpc.coordinates',
        );
      }
    }

    if (quest.chain.requires) {
      const exists = project.quests.some((q) => q.name === quest.chain.requires);
      if (!exists) {
        add(
          'error',
          tValidation('chainRequiresNotFound', { name: quest.chain.requires }, effectiveLocale),
          quest,
          'chain.requires',
        );
      }
      if (quest.chain.requires === quest.name) {
        add('error', tValidation('chainSelfRequire', undefined, effectiveLocale), quest, 'chain.requires');
      }
    }
    if (quest.chain.unlocks) {
      const exists = project.quests.some((q) => q.name === quest.chain.unlocks);
      if (!exists) {
        add(
          'error',
          tValidation('chainUnlocksNotFound', { name: quest.chain.unlocks }, effectiveLocale),
          quest,
          'chain.unlocks',
        );
      }
    }

    for (const reward of quest.rewards) {
      const support = isRewardSupported(project.platform, reward, effectiveLocale);
      if (support.note) {
        add(support.ok ? 'warning' : 'warning', support.note, quest);
      }
      if (reward.type === 'item' && !reward.value && !reward.customItemId) {
        add('error', tValidation('rewardMissingItem', undefined, effectiveLocale), quest, 'rewards');
      }
      if (reward.customItemId && !customItemIds.has(reward.customItemId)) {
        add('error', tValidation('rewardMissingCustomItem', undefined, effectiveLocale), quest, 'rewards');
      }
      if (reward.type === 'command' && !reward.value) {
        add('error', tValidation('rewardMissingCommand', undefined, effectiveLocale), quest, 'rewards');
      }
    }

    if (quest.rewards.length === 0) {
      add('warning', tValidation('questNoRewards', undefined, effectiveLocale), quest, 'rewards');
    }
  }

  for (const [name, count] of nameCounts) {
    if (count > 1) {
      add('error', tValidation('duplicateQuestName', { name, count }, effectiveLocale));
    }
  }
  for (const [tag, count] of npcTagCounts) {
    if (count > 1) {
      add('error', tValidation('duplicateNpcTag', { tag, count }, effectiveLocale));
    }
  }

  return issues;
}

export function hasBlockingErrors(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.level === 'error');
}
