/**
 * Core data model for Quest Tool MC.
 * Everything the user configures in the wizard is described by these types,
 * and the generator turns a Project into a Minecraft 1.21.11 datapack.
 */

import type { AppLocale } from '../i18n/types';

export type Platform = 'paper' | 'vanilla' | 'lan';

export const PLATFORM_LABELS: Record<Platform, string> = {
  paper: 'PaperMC Server',
  vanilla: 'Vanilla Server',
  lan: 'Open to LAN (Single-player)',
};

/** The kinds of quests the tool can generate. */
export type QuestType = 'talk' | 'kill' | 'gather' | 'delivery' | 'exploration' | 'daily';

export const QUEST_TYPE_LABELS: Record<QuestType, string> = {
  talk: 'Talk to an NPC',
  kill: 'Kill mobs',
  gather: 'Gather items',
  delivery: 'Deliver items',
  exploration: 'Explore a location',
  daily: 'Daily / repeatable',
};

/** How an NPC should be placed in the world. */
export type SpawnMode = 'player' | 'fixed' | 'manual';

export interface Coordinates {
  x: number;
  y: number;
  z: number;
  /** When set, coordinates are in this project dimension (undefined = overworld). */
  dimensionId?: string;
}

export interface NpcDialogue {
  /** Shown when the player is near and has not started the quest. */
  greeting: string;
  /** Shown when offering the quest (with the clickable Accept prompt). */
  offer: string;
  /** Shown when the player is near but the quest is still in progress. */
  inProgress: string;
  /** Shown when the player returns with objectives complete. */
  completion: string;
}

/**
 * Quest-giver NPC. Villager-based by default. The `tag` is a unique entity tag
 * used to find and interact with this NPC in the generated functions.
 */
export interface Npc {
  /** Display name shown above the NPC. */
  name: string;
  /** Unique entity tag (sanitized identifier, e.g. "elder_marcus"). */
  tag: string;
  /** Entity type used for the NPC (e.g. "minecraft:villager", "minecraft:piglin"). */
  entityType: string;
  /** Villager profession for appearance (only used when entityType is a villager). */
  profession: string;
  /** Villager biome variant for appearance (only used when entityType is a villager). */
  variant: string;
  /** When true, spawns as a permanently baby villager (Age:-2147483648). */
  baby?: boolean;
  /** Appearance sub-variants for non-villager mobs, keyed by NBT field name. */
  variants?: Record<string, string>;
  dialogue: NpcDialogue;
  spawnMode: SpawnMode;
  /** Used when spawnMode === 'fixed'. */
  coordinates?: Coordinates;
}

/**
 * A separate NPC the player must visit for a "talk" quest. Optional — when set
 * the player completes the objective by approaching this NPC instead of the giver.
 */
export interface TargetNpc {
  name: string;
  tag: string;
  /** Entity type used for the target NPC. */
  entityType: string;
  /** When true, spawns as a permanently baby villager (Age:-2147483648). */
  baby?: boolean;
  /** Appearance sub-variants for non-villager mobs, keyed by NBT field name. */
  variants?: Record<string, string>;
  /** Dialogue shown when the player reaches the target NPC. */
  dialogue: string;
  spawnMode: SpawnMode;
  coordinates?: Coordinates;
}

/** How quest-spawned mobs in a kill spawn zone behave on death. */
export type ZoneDropMode = 'none' | 'vanilla' | 'custom';

/** One item entry in a spawn zone custom drop list. */
export interface ZoneDrop {
  /** Vanilla item id (e.g. "minecraft:diamond"). */
  target?: string;
  /** Project custom item id. */
  customItemId?: string;
  /** Stack size per drop. Defaults to 1. */
  amount?: number;
  /** Drop chance 1–100 (%). Defaults to 100. */
  chance?: number;
}

export interface Objective {
  /** For kill: mob id (e.g. "minecraft:zombie"). For gather/delivery: vanilla item id. */
  target?: string;
  /** When set on gather/delivery/daily, matches a project custom item instead of target. */
  customItemId?: string;
  /** When set on kill objectives, matches a project custom mob instead of target. */
  eliteMobId?: string;
  /** Required amount (kills or items). */
  amount?: number;
  /** Human-readable label shown to the player. */
  description?: string;
  /** For exploration: the location to discover. For spawn zones: zone center. */
  location?: Coordinates;
  /** For exploration: how close (blocks) the player must get. For spawn zones: spawn radius. */
  radius?: number;
  /** When true, spawn tagged mobs in location/radius (kill: only those kills count; gather: farm drops). */
  spawnZone?: boolean;
  /** Gather spawn zones: entity type to spawn (e.g. "minecraft:cow"). Kill zones use target. */
  zoneMob?: string;
  /** Max live mobs in the spawn zone at once. Defaults to min(amount, 5). */
  zoneCap?: number;
  /** When true on gather/daily, remove required items from inventory on turn-in (delivery always does). */
  consumeOnTurnIn?: boolean;
  /** Spawn zones: what items drop when tagged mobs die. */
  zoneDropMode?: ZoneDropMode;
  /** Spawn zones: custom drop list when zoneDropMode is 'custom'. */
  zoneDrops?: ZoneDrop[];
  /** Exploration: place this block at the objective location when NPCs spawn (e.g. minecraft:gold_block). */
  markerBlock?: string;
}

export type RewardType = 'item' | 'xp' | 'money' | 'permission' | 'command' | 'jobXp';

export const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  item: 'Item',
  xp: 'Experience',
  money: 'Money',
  permission: 'Permission',
  command: 'Custom command',
  jobXp: 'Job XP',
};

export interface Reward {
  type: RewardType;
  /** Vanilla item id for 'item', permission node for 'permission', raw command for 'command'. */
  value?: string;
  /** When set on item rewards, gives a project custom item instead of value. */
  customItemId?: string;
  /** Project job id for 'jobXp' rewards. */
  jobId?: string;
  /** quantity for item / xp / money / jobXp. */
  amount?: number;
}

/** Optional job level gate for quest availability. */
export interface JobRequirement {
  jobId: string;
  level: number;
}

export interface QuestChain {
  /** Quest name that must be completed before this one becomes available. */
  requires?: string;
  /** Job level that must be reached before this quest becomes available. */
  requiresJob?: JobRequirement;
  /** Quest name that auto-starts when this one is completed. */
  unlocks?: string;
  /** Auto-start this quest as soon as its prerequisite is complete. */
  autoStart: boolean;
  /** Broadcast a server-wide announcement when this quest is completed. */
  announce: boolean;
}

export interface Quest {
  id: string;
  name: string;
  type: QuestType;
  category: string;
  description: string;
  npc: Npc;
  /** Optional target NPC for "talk" quests. */
  targetNpc?: TargetNpc;
  objectives: Objective[];
  rewards: Reward[];
  chain: QuestChain;
  /** Cooldown in seconds before a daily/repeatable quest can be taken again. */
  cooldownSeconds: number;
}

import type { WorldContainer } from './container';
import type { CustomMob } from './customMob';
import type { Dimension, TeleportPad } from './dimension';
import type { Dungeon } from './dungeon';
import type { CustomItem } from './item';
import type { Job } from './job';

export interface Project {
  id: string;
  name: string;
  /** Datapack namespace, derived from the project name. */
  namespace: string;
  platform: Platform;
  /** Language for generated datapack strings and new-entity defaults. */
  locale?: AppLocale;
  quests: Quest[];
  /** Passive job / skill definitions (fishing, etc.). */
  jobs?: Job[];
  /** Reusable custom item definitions for rewards and objectives. */
  customItems?: CustomItem[];
  /** Reusable custom mob definitions for kill objectives. */
  customMobs?: CustomMob[];
  /** Dungeon definitions with rooms, spawns, and triggers. */
  dungeons?: Dungeon[];
  /** Custom void dimensions. */
  dimensions?: Dimension[];
  /** Teleport pads between dimensions (one-way; pair two for round trips). */
  teleportPads?: TeleportPad[];
  /** World containers that are placed and periodically refilled. */
  containers?: WorldContainer[];
  /**
   * Optional in-game quest log book. When enabled, the datapack can rebuild a
   * per-player written book from live quest scores on request.
   */
  questLog?: {
    enabled: boolean;
    /** Optional book title (clamped to 32 chars in the generator). */
    title?: string;
  };
  /** Manual Story Flow node positions, keyed by quest/dungeon id (plus the Generate node). */
  flowPositions?: Record<string, { x: number; y: number }>;
  /** Schema version for migrations. */
  version: number;
}

export const WIZARD_STEPS = ['npc', 'quest', 'rewards', 'chain', 'generate'] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number];
