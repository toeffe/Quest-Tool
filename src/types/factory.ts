import { emptyMilestoneSlots, getBalancedDefaults } from '../generator/jobBalance';
import { defaultPresetForAction } from '../generator/jobStats';
import { type AppLocale, DEFAULT_LOCALE } from '../i18n/types';
import { defaultsT } from '../i18n/useLabels';
import type { CustomMob, CustomMobPhase } from './customMob';
import { toIdentifier, uid } from './ids';
import type { CustomItem, CustomItemKind } from './item';
import type { Job, JobAction } from './job';
import type { Npc, Project, Quest, QuestType, Reward } from './quest';

export const PROJECT_SCHEMA_VERSION = 11;

export const STARTER_JOB_KEYS = [
  'starter_fishing',
  'starter_mining',
  'starter_woodcutting',
  'starter_farming',
  'starter_combat',
  'starter_hunting',
  'starter_breeding',
  'starter_enchanting',
  'starter_trading',
  'starter_crafting',
  'starter_pvp',
] as const;

export type StarterJobKey = (typeof STARTER_JOB_KEYS)[number];

interface StarterJobDef {
  starterKey: StarterJobKey;
  nameKey: string;
  action: JobAction;
  statPreset?: string;
}

const STARTER_DEFS: StarterJobDef[] = [
  { starterKey: 'starter_fishing', nameKey: 'starter_fishing', action: 'fish' },
  { starterKey: 'starter_mining', nameKey: 'starter_mining', action: 'mine', statPreset: 'ores' },
  {
    starterKey: 'starter_woodcutting',
    nameKey: 'starter_woodcutting',
    action: 'woodcut',
    statPreset: 'logs',
  },
  {
    starterKey: 'starter_farming',
    nameKey: 'starter_farming',
    action: 'farm',
    statPreset: 'crops',
  },
  { starterKey: 'starter_combat', nameKey: 'starter_combat', action: 'combat' },
  {
    starterKey: 'starter_hunting',
    nameKey: 'starter_hunting',
    action: 'hunt',
    statPreset: 'hostile_mobs',
  },
  { starterKey: 'starter_breeding', nameKey: 'starter_breeding', action: 'breeding' },
  { starterKey: 'starter_enchanting', nameKey: 'starter_enchanting', action: 'enchanting' },
  { starterKey: 'starter_trading', nameKey: 'starter_trading', action: 'trading' },
  {
    starterKey: 'starter_crafting',
    nameKey: 'starter_crafting',
    action: 'craft',
    statPreset: 'basic_crafts',
  },
  { starterKey: 'starter_pvp', nameKey: 'starter_pvp', action: 'pvp' },
];

export function createJob(
  name?: string,
  action: JobAction = 'fish',
  overrides: Partial<Job> = {},
  locale: AppLocale = DEFAULT_LOCALE,
): Job {
  const t = defaultsT(locale);
  const balanced = getBalancedDefaults(action);
  const job: Job = {
    id: uid(),
    name: name ?? t('job.defaultName'),
    action,
    xpPerAction: balanced.xpPerAction,
    xpPerLevel: balanced.xpPerLevel,
    maxLevel: balanced.maxLevel,
    showActionBar: true,
    showProgressBar: true,
    distanceUnit: balanced.distanceUnit,
    ...overrides,
  };
  if (
    job.action === 'mine' ||
    job.action === 'woodcut' ||
    job.action === 'farm' ||
    job.action === 'hunt' ||
    job.action === 'craft'
  ) {
    job.statPreset = job.statPreset ?? defaultPresetForAction(job.action);
  }
  return job;
}

/** Balanced starter jobs for new projects. */
export function createStarterJobs(locale: AppLocale = DEFAULT_LOCALE): Job[] {
  const t = defaultsT(locale);
  return STARTER_DEFS.map((def) => {
    const balanced = getBalancedDefaults(def.action);
    const job: Job = {
      id: uid(),
      starterKey: def.starterKey,
      name: t(`starterJobs.${def.nameKey}`),
      action: def.action,
      xpPerAction: balanced.xpPerAction,
      xpPerLevel: balanced.xpPerLevel,
      maxLevel: balanced.maxLevel,
      showActionBar: true,
      showProgressBar: true,
      distanceUnit: balanced.distanceUnit,
      milestones: emptyMilestoneSlots(balanced.maxLevel),
    };
    if (def.statPreset) job.statPreset = def.statPreset;
    return job;
  });
}

/** Append any missing starter jobs (v5 → v6 migration). */
export function mergeStarterJobs(existing: Job[], locale: AppLocale = DEFAULT_LOCALE): Job[] {
  const byKey = new Map<string, Job>();
  for (const job of existing) {
    if (job.starterKey) byKey.set(job.starterKey, job);
  }
  const out = [...existing];
  for (const starter of createStarterJobs(locale)) {
    if (!byKey.has(starter.starterKey!)) {
      out.push({ ...starter, id: uid() });
    }
  }
  return out;
}

export function createNpc(locale: AppLocale = DEFAULT_LOCALE): Npc {
  const t = defaultsT(locale);
  return {
    name: t('npc.name'),
    tag: 'quest_giver',
    entityType: 'minecraft:villager',
    profession: 'librarian',
    variant: 'plains',
    dialogue: {
      greeting: t('npc.dialogue.greeting'),
      offer: t('npc.dialogue.offer'),
      inProgress: t('npc.dialogue.inProgress'),
      completion: t('npc.dialogue.completion'),
    },
    spawnMode: 'player',
  };
}

/** A single fresh objective for a quest type (used for defaults and "add objective"). */
export function newObjectiveFor(
  type: QuestType,
  locale: AppLocale = DEFAULT_LOCALE,
): Quest['objectives'][number] {
  const t = defaultsT(locale);
  switch (type) {
    case 'kill':
      return {
        target: t('objectives.kill.target'),
        amount: 5,
        description: t('objectives.kill.description'),
      };
    case 'gather':
      return {
        target: t('objectives.gather.target'),
        amount: 10,
        description: t('objectives.gather.description'),
        consumeOnTurnIn: true,
      };
    case 'delivery':
      return {
        target: t('objectives.delivery.target'),
        amount: 3,
        description: t('objectives.delivery.description'),
      };
    case 'exploration':
      return {
        location: { x: 100, y: 64, z: 100 },
        radius: 5,
        description: t('objectives.exploration.description'),
      };
    case 'talk':
      return { description: t('objectives.talk.description') };
    case 'daily':
      return {
        target: t('objectives.daily.target'),
        amount: 8,
        description: t('objectives.daily.description'),
        consumeOnTurnIn: true,
      };
    default:
      return {};
  }
}

export function defaultObjectiveFor(
  type: QuestType,
  locale: AppLocale = DEFAULT_LOCALE,
): Quest['objectives'] {
  return [newObjectiveFor(type, locale)];
}

export function createQuest(
  name?: string,
  type: QuestType = 'kill',
  locale: AppLocale = DEFAULT_LOCALE,
): Quest {
  const t = defaultsT(locale);
  return {
    id: uid(),
    name: name ?? t('quest.name'),
    type,
    category: t('quest.category'),
    description: t('quest.description'),
    npc: createNpc(locale),
    objectives: defaultObjectiveFor(type, locale),
    rewards: [{ type: 'xp', amount: 50 } as Reward],
    chain: { autoStart: false, announce: false },
    cooldownSeconds: type === 'daily' ? 86400 : 0,
  };
}

export function createCustomItem(
  kind: CustomItemKind = 'general',
  name?: string,
  locale: AppLocale = DEFAULT_LOCALE,
): CustomItem {
  const t = defaultsT(locale);
  const itemName = name ?? t('customItem.name');
  const tag = toIdentifier(itemName, 'item');
  const base: CustomItem = {
    id: uid(),
    name: itemName,
    tag,
    kind,
    baseItem: 'minecraft:paper',
    displayName: itemName,
    lore: [],
  };
  switch (kind) {
    case 'collectible':
      return {
        ...base,
        baseItem: 'minecraft:paper',
        glint: true,
        maxStackSize: 1,
        unbreakable: true,
        rarity: 'rare',
      };
    case 'food':
      return {
        ...base,
        baseItem: 'minecraft:apple',
        food: { nutrition: 4, saturation: 0.3 },
        consumable: { consumeSeconds: 1.6, effects: [] },
      };
    case 'tool':
      return {
        ...base,
        baseItem: 'minecraft:stick',
        tool: {
          defaultMiningSpeed: 1,
          damagePerBlock: 1,
          rules: [{ blocks: 'minecraft:sand', speed: 100 }],
        },
      };
    default:
      return base;
  }
}

export function createCustomMob(name?: string, locale: AppLocale = DEFAULT_LOCALE): CustomMob {
  const t = defaultsT(locale);
  const mobName = name ?? t('customMob.name');
  const tag = toIdentifier(mobName, 'mob');
  return {
    id: uid(),
    name: mobName,
    tag,
    baseEntity: 'minecraft:zombie',
    displayName: mobName,
  };
}

export function createCustomMobPhase(name?: string): CustomMobPhase {
  return {
    id: uid(),
    name: name ?? 'Phase 1',
  };
}

export function createProject(name?: string, locale: AppLocale = DEFAULT_LOCALE): Project {
  const t = defaultsT(locale);
  return {
    id: uid(),
    name: name ?? t('project.name'),
    namespace: t('project.namespace'),
    platform: 'paper',
    locale,
    quests: [createQuest(t('quest.firstQuestName'), 'kill', locale)],
    jobs: createStarterJobs(locale),
    customItems: [],
    customMobs: [],
    dungeons: [],
    dimensions: [],
    teleportPads: [],
    containers: [],
    version: PROJECT_SCHEMA_VERSION,
  };
}
