import { type Edge } from '@xyflow/react';
import { type Project, type Quest, type Objective } from '../../types/quest';
import { type EditorTab } from '../editor/ValidationBar';
import { getIncomingEdgeCount } from './chainEdges';
import i18n, { getAppLocale } from '../../i18n';
import { mobLabelI18n } from '../../i18n/useLabels';
import { customMobDisplayLabel } from '../../generator/customMobs';
import { type AppLocale } from '../../i18n/types';

export type PlaythroughStepKind =
  | 'prerequisite'
  | 'meet'
  | 'accept'
  | 'objective'
  | 'travel'
  | 'return'
  | 'complete'
  | 'reward'
  | 'next'
  | 'cooldown';

export interface PlaythroughStep {
  id: string;
  kind: PlaythroughStepKind;
  label: string;
  detail?: string;
  editorTab: EditorTab;
  icon: string;
}

function pt(key: string, options?: Record<string, unknown>, locale?: AppLocale): string {
  return i18n.t(key, { ns: 'flow', lng: locale ?? getAppLocale(), ...options });
}

function shortId(id: string | undefined): string {
  if (!id) return '?';
  return id.replace(/^minecraft:/, '');
}

function mobDisplay(id: string | undefined, locale?: AppLocale): string {
  if (!id) return '?';
  if (id.includes(':')) return mobLabelI18n(id, locale);
  return shortId(id);
}

function objectiveLabel(
  quest: Quest,
  o: Objective,
  index: number,
  project: Project,
  locale?: AppLocale,
): string {
  const desc = o.description?.trim();
  if (desc) return desc;

  const target =
    quest.type === 'kill' && o.eliteMobId
      ? customMobDisplayLabel(project, o.eliteMobId)
      : mobDisplay(o.target, locale);
  switch (quest.type) {
    case 'kill':
      return pt('playthrough.kill', { amount: o.amount ?? 0, target }, locale);
    case 'gather':
      return pt('playthrough.gather', { amount: o.amount ?? 0, target }, locale);
    case 'delivery':
      return pt('playthrough.deliver', { amount: o.amount ?? 0, target }, locale);
    case 'exploration':
      return o.location
        ? pt('playthrough.exploreCoords', { x: o.location.x, y: o.location.y, z: o.location.z }, locale)
        : pt('playthrough.exploreLocation', undefined, locale);
    case 'daily':
      return pt('playthrough.daily', { amount: o.amount ?? 0, target }, locale);
    case 'talk':
      return quest.targetNpc
        ? pt('playthrough.talkTo', { name: quest.targetNpc.name }, locale)
        : pt('playthrough.talkGiver', undefined, locale);
    default:
      return pt('playthrough.objectiveN', { n: index + 1 }, locale);
  }
}

function objectiveDetail(quest: Quest, o: Objective, locale?: AppLocale): string | undefined {
  if ((quest.type === 'kill' || quest.type === 'gather') && o.spawnZone && o.location) {
    const cap = o.zoneCap ?? Math.min(Math.max(1, o.amount ?? 1), 5);
    return pt(
      'playthrough.zoneDetail',
      {
        x: o.location.x,
        y: o.location.y,
        z: o.location.z,
        radius: o.radius ?? 5,
        cap,
      },
      locale,
    );
  }
  if (quest.type === 'exploration' && o.location) {
    return pt('playthrough.withinBlocks', { radius: o.radius ?? 10 }, locale);
  }
  return undefined;
}

function rewardSummary(quest: Quest, locale?: AppLocale): string {
  if (quest.rewards.length === 0) return pt('playthrough.noRewards', undefined, locale);
  const parts = quest.rewards.slice(0, 3).map((r) => {
    switch (r.type) {
      case 'item':
        return r.customItemId ? pt('playthrough.customItem', undefined, locale) : shortId(r.value);
      case 'xp':
        return `${r.amount ?? 0} XP`;
      case 'money':
        return pt('playthrough.coins', { amount: r.amount ?? 0 }, locale);
      case 'jobXp':
        return pt('playthrough.jobXp', undefined, locale);
      case 'permission':
        return pt('playthrough.permission', undefined, locale);
      case 'command':
        return pt('playthrough.command', undefined, locale);
      default:
        return r.type;
    }
  });
  const extra = quest.rewards.length - parts.length;
  if (extra > 0) {
    return pt('playthrough.moreRewards', { parts: parts.join(', '), count: extra }, locale);
  }
  return parts.join(', ');
}

function byName(quests: Quest[], name: string | undefined): Quest | undefined {
  if (!name) return undefined;
  return quests.find((q) => q.name === name);
}

/** Player-facing step list mirroring generator offer → accept → active → complete → rewards. */
export function buildQuestPlaythrough(quest: Quest, project: Project): PlaythroughStep[] {
  const locale = (project.locale ?? getAppLocale()) as AppLocale;
  const steps: PlaythroughStep[] = [];
  let n = 0;
  const add = (
    kind: PlaythroughStepKind,
    label: string,
    editorTab: EditorTab,
    icon: string,
    detail?: string,
  ) => {
    n += 1;
    steps.push({ id: `${quest.id}-${kind}-${n}`, kind, label, detail, editorTab, icon });
  };

  const isInstantTalk = quest.type === 'talk' && !quest.targetNpc;
  const giverName = quest.npc.name || pt('playthrough.giverFallback', undefined, locale);

  if (quest.chain.requires) {
    const prereq = byName(project.quests, quest.chain.requires);
    add(
      'prerequisite',
      prereq
        ? pt('playthrough.completeFirst', { name: prereq.name }, locale)
        : pt('playthrough.requiresMissing', { name: quest.chain.requires }, locale),
      'chain',
      'lock',
    );
  }

  if (quest.chain.requiresJob) {
    const job = project.jobs?.find((j) => j.id === quest.chain.requiresJob!.jobId);
    const level = quest.chain.requiresJob.level;
    add(
      'prerequisite',
      pt(
        'playthrough.reachJobLevel',
        { job: job?.name ?? pt('playthrough.jobFallback', undefined, locale), level },
        locale,
      ),
      'chain',
      'lock',
    );
  }

  add('meet', pt('playthrough.meet', { name: giverName }, locale), 'npc', 'meet');
  add('accept', pt('playthrough.accept', undefined, locale), 'npc', 'accept');

  if (isInstantTalk) {
    add('complete', pt('playthrough.instantComplete', undefined, locale), 'objectives', 'complete');
  } else if (quest.type === 'talk' && quest.targetNpc) {
    add(
      'travel',
      pt('playthrough.travelTo', { name: quest.targetNpc.name }, locale),
      'npc',
      'travel',
      quest.targetNpc.coordinates
        ? `(${quest.targetNpc.coordinates.x}, ${quest.targetNpc.coordinates.y}, ${quest.targetNpc.coordinates.z})`
        : undefined,
    );
    add(
      'complete',
      pt('playthrough.talkTo', { name: quest.targetNpc.name }, locale),
      'objectives',
      'complete',
    );
  } else {
    const objectives = quest.objectives.length ? quest.objectives : [{}];
    objectives.forEach((o, i) => {
      const kind = quest.type === 'exploration' ? 'travel' : 'objective';
      add(
        kind,
        objectiveLabel(quest, o, i, project, locale),
        'objectives',
        quest.type === 'exploration' ? 'travel' : quest.type === 'kill' ? 'fight' : 'task',
        objectiveDetail(quest, o, locale),
      );
    });

    if (quest.type !== 'exploration') {
      add('return', pt('playthrough.returnTo', { name: giverName }, locale), 'npc', 'return');
    }
    add('complete', pt('playthrough.turnIn', undefined, locale), 'npc', 'complete');
  }

  add(
    'reward',
    pt('playthrough.receive', { summary: rewardSummary(quest, locale) }, locale),
    'rewards',
    'reward',
  );

  if (quest.chain.unlocks) {
    const next = byName(project.quests, quest.chain.unlocks);
    const auto = quest.chain.autoStart;
    add(
      'next',
      next
        ? auto
          ? pt('playthrough.autoStarts', { name: next.name }, locale)
          : pt('playthrough.unlocks', { name: next.name }, locale)
        : pt('playthrough.missingNext', { name: quest.chain.unlocks }, locale),
      'chain',
      'next',
    );
  }

  if (quest.type === 'daily' && quest.cooldownSeconds > 0) {
    const mins = Math.round(quest.cooldownSeconds / 60);
    add(
      'cooldown',
      mins >= 60
        ? pt('playthrough.cooldownHours', { hours: Math.round(mins / 60) }, locale)
        : pt('playthrough.cooldownMinutes', { minutes: mins }, locale),
      'objectives',
      'cooldown',
    );
  }

  for (const dungeon of project.dungeons ?? []) {
    for (const room of dungeon.rooms) {
      if (room.questGate?.questName === quest.name) {
        add(
          'objective',
          pt('playthrough.dungeonGate', { dungeon: dungeon.name, room: room.name }, locale),
          'objectives',
          'dungeon',
        );
      }
      for (const trigger of room.triggers) {
        if (
          trigger.action.type === 'set_quest_state' &&
          trigger.action.questName === quest.name
        ) {
          add(
            'objective',
            pt(
              'playthrough.dungeonStateChange',
              { dungeon: dungeon.name, room: room.name, state: trigger.action.state },
              locale,
            ),
            'objectives',
            'dungeon',
          );
        }
      }
    }
  }

  return steps;
}

/** True when quest is a graph entry point (no incoming chain edges, no quest prerequisite). */
export function isStoryStart(quest: Quest, project: Project, edges: Edge[]): boolean {
  if (quest.chain.requires) return false;
  if (!prerequisiteResolved(quest, project)) return false;
  return getIncomingEdgeCount(quest.id, edges) === 0;
}

/** True when quest is gated behind another. */
export function isStoryLocked(quest: Quest): boolean {
  return Boolean(quest.chain.requires);
}

export function prerequisiteResolved(quest: Quest, project: Project): boolean {
  if (!quest.chain.requires) return true;
  return Boolean(byName(project.quests, quest.chain.requires));
}
