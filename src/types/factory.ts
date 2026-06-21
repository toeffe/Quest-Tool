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
import { uid, toIdentifier } from './ids';

export const PROJECT_SCHEMA_VERSION = 3;

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
    customItems: [],
    version: PROJECT_SCHEMA_VERSION,
  };
}
