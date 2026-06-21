import { type Project, type Quest } from '../types/quest';
import { isRewardSupported } from './platform';
import { toIdentifier } from '../types/ids';

export type IssueLevel = 'error' | 'warning';

export interface ValidationIssue {
  level: IssueLevel;
  message: string;
  questId?: string;
  questName?: string;
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

/** Validate the whole project; returns errors (block export) and warnings. */
export function validateProject(project: Project): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (level: IssueLevel, message: string, quest?: Quest) =>
    issues.push({ level, message, questId: quest?.id, questName: quest?.name });

  if (project.quests.length === 0) {
    add('error', 'The project has no quests.');
    return issues;
  }

  issues.push(...customItemIssues(project));

  const customItemIds = new Set((project.customItems ?? []).map((i) => i.id));

  const nameCounts = new Map<string, number>();
  const npcTagCounts = new Map<string, number>();

  for (const quest of project.quests) {
    const name = quest.name.trim();
    if (!name) add('error', 'A quest has an empty name.', quest);
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);

    if (!quest.npc.name.trim()) add('error', 'The quest giver has no name.', quest);

    const npcTag = toIdentifier(quest.npc.tag);
    npcTagCounts.set(npcTag, (npcTagCounts.get(npcTag) ?? 0) + 1);

    for (const msg of objectiveIssues(quest)) add('error', msg, quest);

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
      add('error', 'NPC spawn is set to fixed coordinates but none are provided.', quest);
    }

    if (quest.type === 'talk' && quest.targetNpc) {
      if (!quest.targetNpc.name.trim()) add('error', 'The target NPC has no name.', quest);
      if (quest.targetNpc.spawnMode === 'fixed' && !quest.targetNpc.coordinates) {
        add('error', 'Target NPC uses fixed coordinates but none are provided.', quest);
      }
    }

    // Chain integrity.
    if (quest.chain.requires) {
      const exists = project.quests.some((q) => q.name === quest.chain.requires);
      if (!exists) {
        add('error', `Chain requires "${quest.chain.requires}", which is not a quest in this project.`, quest);
      }
      if (quest.chain.requires === quest.name) {
        add('error', 'A quest cannot require itself.', quest);
      }
    }
    if (quest.chain.unlocks) {
      const exists = project.quests.some((q) => q.name === quest.chain.unlocks);
      if (!exists) {
        add('error', `Chain unlocks "${quest.chain.unlocks}", which is not a quest in this project.`, quest);
      }
    }

    // Reward platform compatibility.
    for (const reward of quest.rewards) {
      const support = isRewardSupported(project.platform, reward);
      if (support.note) {
        add(support.ok ? 'warning' : 'warning', `${support.note}`, quest);
      }
      if (reward.type === 'item' && !reward.value && !reward.customItemId) {
        add('error', 'An item reward is missing its item.', quest);
      }
      if (reward.customItemId && !customItemIds.has(reward.customItemId)) {
        add('error', 'A reward references a custom item that no longer exists.', quest);
      }
      if (reward.type === 'command' && !reward.value) {
        add('error', 'A command reward is missing its value.', quest);
      }
    }

    if (quest.rewards.length === 0) {
      add('warning', 'Quest has no rewards.', quest);
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
