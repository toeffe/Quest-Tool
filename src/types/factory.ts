import {
  type Npc,
  type Project,
  type Quest,
  type QuestType,
  type Reward,
} from './quest';
import {
  type CustomItem,
  type CustomItemKind,
} from './item';
import { type Job, type JobAction } from './job';
import { uid, toIdentifier } from './ids';
import { getBalancedDefaults, emptyMilestoneSlots } from '../generator/jobBalance';
import { defaultPresetForAction } from '../generator/jobStats';

export const PROJECT_SCHEMA_VERSION = 6;

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
  name: string;
  action: JobAction;
  statPreset?: string;
}

const STARTER_DEFS: StarterJobDef[] = [
  { starterKey: 'starter_fishing', name: 'Fishing', action: 'fish' },
  { starterKey: 'starter_mining', name: 'Mining', action: 'mine', statPreset: 'ores' },
  { starterKey: 'starter_woodcutting', name: 'Woodcutting', action: 'woodcut', statPreset: 'logs' },
  { starterKey: 'starter_farming', name: 'Farming', action: 'farm', statPreset: 'crops' },
  { starterKey: 'starter_combat', name: 'Combat', action: 'combat' },
  { starterKey: 'starter_hunting', name: 'Hunting', action: 'hunt', statPreset: 'hostile_mobs' },
  { starterKey: 'starter_breeding', name: 'Breeding', action: 'breeding' },
  { starterKey: 'starter_enchanting', name: 'Enchanting', action: 'enchanting' },
  { starterKey: 'starter_trading', name: 'Trading', action: 'trading' },
  { starterKey: 'starter_crafting', name: 'Crafting', action: 'craft', statPreset: 'basic_crafts' },
  { starterKey: 'starter_pvp', name: 'PvP', action: 'pvp' },
];

export function createJob(
  name = 'Fishing',
  action: JobAction = 'fish',
  overrides: Partial<Job> = {},
): Job {
  const balanced = getBalancedDefaults(action);
  const job: Job = {
    id: uid(),
    name,
    action,
    xpPerAction: balanced.xpPerAction,
    xpPerLevel: balanced.xpPerLevel,
    maxLevel: balanced.maxLevel,
    showActionBar: true,
    distanceUnit: balanced.distanceUnit,
    ...overrides,
  };
  if (job.action === 'mine' || job.action === 'woodcut' || job.action === 'farm' || job.action === 'hunt' || job.action === 'craft') {
    job.statPreset = job.statPreset ?? defaultPresetForAction(job.action);
  }
  return job;
}

/** Balanced starter jobs for new projects. */
export function createStarterJobs(): Job[] {
  return STARTER_DEFS.map((def) => {
    const balanced = getBalancedDefaults(def.action);
    const job: Job = {
      id: uid(),
      starterKey: def.starterKey,
      name: def.name,
      action: def.action,
      xpPerAction: balanced.xpPerAction,
      xpPerLevel: balanced.xpPerLevel,
      maxLevel: balanced.maxLevel,
      showActionBar: true,
      distanceUnit: balanced.distanceUnit,
      milestones: emptyMilestoneSlots(balanced.maxLevel),
    };
    if (def.statPreset) job.statPreset = def.statPreset;
    return job;
  });
}

/** Append any missing starter jobs (v5 → v6 migration). */
export function mergeStarterJobs(existing: Job[]): Job[] {
  const byKey = new Map<string, Job>();
  for (const job of existing) {
    if (job.starterKey) byKey.set(job.starterKey, job);
  }
  const out = [...existing];
  for (const starter of createStarterJobs()) {
    if (!byKey.has(starter.starterKey!)) {
      out.push({ ...starter, id: uid() });
    }
  }
  return out;
}

export function createNpc(): Npc {
  return {
    name: 'Quest Giver',
    tag: 'quest_giver',
    entityType: 'minecraft:villager',
    profession: 'librarian',
    variant: 'plains',
    dialogue: {
      greeting: 'Greetings, traveler! I have need of someone with your talents.',
      offer: 'Will you help me?',
      inProgress: 'Have you finished the task yet?',
      completion: 'Wonderful work! Here is your reward.',
    },
    spawnMode: 'player',
  };
}

/** A single fresh objective for a quest type (used for defaults and "add objective"). */
export function newObjectiveFor(type: QuestType): Quest['objectives'][number] {
  switch (type) {
    case 'kill':
      return { target: 'minecraft:zombie', amount: 5, description: 'Slay zombies' };
    case 'gather':
      return {
        target: 'minecraft:wheat',
        amount: 10,
        description: 'Collect wheat',
        consumeOnTurnIn: true,
      };
    case 'delivery':
      return { target: 'minecraft:bread', amount: 3, description: 'Deliver bread' };
    case 'exploration':
      return {
        location: { x: 100, y: 64, z: 100 },
        radius: 5,
        description: 'Discover the marked location',
      };
    case 'talk':
      return { description: 'Speak with the target' };
    case 'daily':
      return {
        target: 'minecraft:rotten_flesh',
        amount: 8,
        description: 'Gather rotten flesh',
        consumeOnTurnIn: true,
      };
    default:
      return {};
  }
}

export function defaultObjectiveFor(type: QuestType): Quest['objectives'] {
  return [newObjectiveFor(type)];
}

export function createQuest(name = 'New Quest', type: QuestType = 'kill'): Quest {
  return {
    id: uid(),
    name,
    type,
    category: 'General',
    description: 'A quest awaits.',
    npc: createNpc(),
    objectives: defaultObjectiveFor(type),
    rewards: [{ type: 'xp', amount: 50 } as Reward],
    chain: { autoStart: false, announce: false },
    cooldownSeconds: type === 'daily' ? 86400 : 0,
  };
}

export function createCustomItem(kind: CustomItemKind = 'general', name = 'New Item'): CustomItem {
  const tag = toIdentifier(name, 'item');
  const base: CustomItem = {
    id: uid(),
    name,
    tag,
    kind,
    baseItem: 'minecraft:paper',
    displayName: name,
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

export function createProject(name = 'My Quest Pack'): Project {
  return {
    id: uid(),
    name,
    namespace: 'questpack',
    platform: 'paper',
    quests: [createQuest('First Quest', 'kill')],
    jobs: createStarterJobs(),
    customItems: [],
    version: PROJECT_SCHEMA_VERSION,
  };
}
