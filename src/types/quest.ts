/**
 * Core data model for Quest Tool MC.
 * Everything the user configures in the wizard is described by these types,
 * and the generator turns a Project into a Minecraft 1.21.11 datapack.
 */

export type Platform = 'paper' | 'vanilla' | 'lan';

export const PLATFORM_LABELS: Record<Platform, string> = {
  paper: 'PaperMC Server',
  vanilla: 'Vanilla Server',
  lan: 'Open to LAN (Single-player)',
};

/** The kinds of quests the tool can generate. */
export type QuestType =
  | 'talk'
  | 'kill'
  | 'gather'
  | 'delivery'
  | 'exploration'
  | 'daily';

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

export interface Objective {
  /** For kill: mob id (e.g. "minecraft:zombie"). For gather/delivery: item id. */
  target?: string;
  /** Required amount (kills or items). */
  amount?: number;
  /** Human-readable label shown to the player. */
  description?: string;
  /** For exploration: the location to discover. For kill spawn zones: zone center. */
  location?: Coordinates;
  /** For exploration: how close (blocks) the player must get. For kill spawn zones: spawn radius. */
  radius?: number;
  /** When true (kill quests only), spawn tagged mobs in location/radius; only those kills count. */
  spawnZone?: boolean;
  /** Max live mobs in the spawn zone at once (kill spawn zones only). Defaults to min(amount, 5). */
  zoneCap?: number;
}

export type RewardType =
  | 'item'
  | 'xp'
  | 'money'
  | 'permission'
  | 'command';

export const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  item: 'Item',
  xp: 'Experience',
  money: 'Money',
  permission: 'Permission',
  command: 'Custom command',
};

export interface Reward {
  type: RewardType;
  /** item id for 'item', permission node for 'permission', raw command for 'command'. */
  value?: string;
  /** quantity for item / xp / money. */
  amount?: number;
}

export interface QuestChain {
  /** Quest name that must be completed before this one becomes available. */
  requires?: string;
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

export interface Project {
  id: string;
  name: string;
  /** Datapack namespace, derived from the project name. */
  namespace: string;
  platform: Platform;
  quests: Quest[];
  /** Manual Story Flow node positions, keyed by quest id (plus the Generate node). */
  flowPositions?: Record<string, { x: number; y: number }>;
  /** Schema version for migrations. */
  version: number;
}

export const WIZARD_STEPS = [
  'npc',
  'quest',
  'rewards',
  'chain',
  'generate',
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number];
