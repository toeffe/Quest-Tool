/**
 * Project-level dungeon definitions for Minecraft 1.21.11.
 * Dungeons are composed of rooms with bounding boxes, spawns, and triggers.
 */

import { uid, toIdentifier } from './ids';
import { type AppLocale, DEFAULT_LOCALE } from '../i18n/types';
import { defaultsT } from '../i18n/useLabels';

/** Quest state scoreboard values used by quest gates and triggers. */
export type QuestState = -1 | 0 | 1 | 2 | 3;

export interface BoundingBox {
  x1: number;
  y1: number;
  z1: number;
  x2: number;
  y2: number;
  z2: number;
}

export type RoomType =
  | 'boss_room'
  | 'patrol_corridor'
  | 'treasure_vault'
  | 'entrance'
  | 'puzzle_room'
  | 'safe_room'
  | 'custom';

export interface QuestGate {
  questName: string;
  requiredState: QuestState;
}

export interface RoomSpawn {
  id: string;
  sourceType: 'customMob' | 'vanilla';
  customMobId?: string;
  vanillaEntity?: string;
  count: number;
  spawnOnEntry: boolean;
  respawn: boolean;
}

export type TriggerEvent =
  | 'on_entry'
  | 'on_all_mobs_killed'
  | 'on_quest_complete'
  | 'on_exit';

export type TriggerAction =
  | { type: 'set_quest_state'; questName: string; state: QuestState }
  | { type: 'dialogue'; message: string; targets: 'all' | 'room' }
  | { type: 'unlock_chest'; x: number; y: number; z: number }
  | { type: 'custom_command'; command: string };

export interface RoomTrigger {
  id: string;
  event: TriggerEvent;
  action: TriggerAction;
  fireOnce: boolean;
}

export interface DungeonRoom {
  id: string;
  name: string;
  type: RoomType;
  /** Free-text label when type is 'custom'. */
  customTypeLabel?: string;
  bounds: BoundingBox;
  spawns: RoomSpawn[];
  triggers: RoomTrigger[];
  questGate?: QuestGate;
  /** Seconds before dead mobs respawn (default: none). */
  respawnCooldown?: number;
}

export interface Dungeon {
  id: string;
  /** Editor label, e.g. "Undead Crypt". */
  name: string;
  /** Slug for generated function paths, e.g. "undead_crypt". */
  tag: string;
  description?: string;
  /** When set, all room bounds are interpreted in this custom dimension. */
  dimensionId?: string;
  rooms: DungeonRoom[];
}

export function normalizeBounds(box: BoundingBox): BoundingBox {
  return {
    x1: Math.min(box.x1, box.x2),
    y1: Math.min(box.y1, box.y2),
    z1: Math.min(box.z1, box.z2),
    x2: Math.max(box.x1, box.x2),
    y2: Math.max(box.y1, box.y2),
    z2: Math.max(box.z1, box.z2),
  };
}

export function boundsVolume(box: BoundingBox): number {
  const b = normalizeBounds(box);
  return (b.x2 - b.x1 + 1) * (b.y2 - b.y1 + 1) * (b.z2 - b.z1 + 1);
}

export function createRoomSpawn(): RoomSpawn {
  return {
    id: uid(),
    sourceType: 'vanilla',
    vanillaEntity: 'minecraft:zombie',
    count: 1,
    spawnOnEntry: false,
    respawn: false,
  };
}

export function createRoomTrigger(event: TriggerEvent = 'on_entry'): RoomTrigger {
  return {
    id: uid(),
    event,
    action: { type: 'dialogue', message: '', targets: 'room' },
    fireOnce: false,
  };
}

export function createDungeonRoom(name?: string): DungeonRoom {
  return {
    id: uid(),
    name: name ?? 'Room',
    type: 'custom',
    bounds: { x1: 0, y1: 64, z1: 0, x2: 10, y2: 70, z2: 10 },
    spawns: [],
    triggers: [],
  };
}

export function createDungeon(
  name?: string,
  locale: AppLocale = DEFAULT_LOCALE,
): Dungeon {
  const t = defaultsT(locale);
  const dungeonName = name ?? t('dungeon.name');
  const tag = toIdentifier(dungeonName, 'dungeon');
  return {
    id: uid(),
    name: dungeonName,
    tag,
    rooms: [createDungeonRoom(t('dungeon.defaultRoom'))],
  };
}
