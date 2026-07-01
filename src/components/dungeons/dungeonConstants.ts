import type { QuestState, RoomType, TriggerAction, TriggerEvent } from '../../types/dungeon';

export const ROOM_TYPE_OPTIONS: RoomType[] = [
  'boss_room',
  'patrol_corridor',
  'treasure_vault',
  'entrance',
  'puzzle_room',
  'safe_room',
  'custom',
];

export const TRIGGER_EVENTS: TriggerEvent[] = [
  'on_entry',
  'on_all_mobs_killed',
  'on_quest_complete',
  'on_exit',
];

export const TRIGGER_ACTION_TYPES: TriggerAction['type'][] = [
  'set_quest_state',
  'dialogue',
  'unlock_chest',
  'custom_command',
];

export const QUEST_STATES: QuestState[] = [-1, 0, 1, 2, 3];
