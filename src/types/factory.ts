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

export const PROJECT_SCHEMA_VERSION = 2;

export function createNpc(): Npc {
  return {
    name: 'Questgiver',
    tag: 'quest_giver',
    entityType: 'minecraft:villager',
    profession: 'librarian',
    variant: 'plains',
    dialogue: {
      greeting: 'Hej, rejsende! Jeg har brug for en som dig.',
      offer: 'Vil du hjælpe mig?',
      inProgress: 'Er du færdig med opgaven endnu?',
      completion: 'Fantastisk arbejde! Her er din belønning.',
    },
    spawnMode: 'player',
  };
}

/** A single fresh objective for a quest type (used for defaults and "add objective"). */
export function newObjectiveFor(type: QuestType): Quest['objectives'][number] {
  switch (type) {
    case 'kill':
      return { target: 'minecraft:zombie', amount: 5, description: 'Dræb zombier' };
    case 'gather':
      return { target: 'minecraft:wheat', amount: 10, description: 'Saml hvede' };
    case 'delivery':
      return { target: 'minecraft:bread', amount: 3, description: 'Aflever brød' };
    case 'exploration':
      return {
        location: { x: 100, y: 64, z: 100 },
        radius: 5,
        description: 'Find det markerede sted',
      };
    case 'talk':
      return { description: 'Tal med målet' };
    case 'daily':
      return { target: 'minecraft:rotten_flesh', amount: 8, description: 'Saml råddent kød' };
    default:
      return {};
  }
}

export function defaultObjectiveFor(type: QuestType): Quest['objectives'] {
  return [newObjectiveFor(type)];
}

export function createQuest(name = 'Ny quest', type: QuestType = 'kill'): Quest {
  return {
    id: uid(),
    name,
    type,
    category: 'Generelt',
    description: 'En quest venter.',
    npc: createNpc(),
    objectives: defaultObjectiveFor(type),
    rewards: [{ type: 'xp', amount: 50 } as Reward],
    chain: { autoStart: false, announce: false },
    cooldownSeconds: type === 'daily' ? 86400 : 0,
  };
}

export function createCustomItem(kind: CustomItemKind = 'general', name = 'Nyt item'): CustomItem {
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

export function createProject(name = 'Mit quest-pakke'): Project {
  return {
    id: uid(),
    name,
    namespace: 'questpack',
    platform: 'paper',
    quests: [createQuest('Første quest', 'kill')],
    customItems: [],
    version: PROJECT_SCHEMA_VERSION,
  };
}
