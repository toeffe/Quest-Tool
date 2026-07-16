/**
 * World systems for the flat-world test pack: dimension, pads, containers, dungeon.
 */

import { createWorldContainer } from '../types/container';
import { createDimension, createTeleportPad } from '../types/dimension';
import {
  createDungeon,
  createDungeonRoom,
  createRoomSpawn,
  createRoomTrigger,
} from '../types/dungeon';
import { uid } from '../types/ids';
import type { Project } from '../types/quest';
import { TEST_DATAPACK_SURFACE_Y } from './testDatapackConstants';

const Y = TEST_DATAPACK_SURFACE_Y;

/** Yard coords for containers (west of NPC line). */
export const TEST_CONTAINER_CHEST = { x: -12, y: Y, z: 0 } as const;
export const TEST_CONTAINER_BARREL = { x: -12, y: Y, z: 4 } as const;

/** Overworld pad at yard. */
export const TEST_PAD_OVERWORLD = { x: -20, y: Y, z: 0 } as const;
/** Void entry landing — kept clear of the return pad so anti-bounce nudge does not push into empty void. */
export const TEST_PAD_VOID_LANDING = { x: 0, y: 64, z: 8 } as const;
/** Return pad in the void (back to overworld). */
export const TEST_PAD_VOID_RETURN = { x: 0, y: 64, z: 0 } as const;
/** @deprecated Use TEST_PAD_VOID_RETURN. */
export const TEST_PAD_VOID = TEST_PAD_VOID_RETURN;

/** Dungeon room bounds in the overworld yard (north of job stations). */
export const TEST_DUNGEON_ENTRANCE = {
  x1: 60,
  y1: Y,
  z1: -40,
  x2: 68,
  y2: Y + 6,
  z2: -32,
} as const;
export const TEST_DUNGEON_BOSS = {
  x1: 70,
  y1: Y,
  z1: -40,
  x2: 78,
  y2: Y + 6,
  z2: -32,
} as const;
export const TEST_DUNGEON_CHEST = { x: 74, y: Y, z: -36 } as const;

export function addTestDimensionAndPads(project: Project): { dimensionId: string } {
  const dim = createDimension('QA Void', 'en');
  dim.tag = 'qa_void';
  project.dimensions = [...(project.dimensions ?? []), dim];

  const toVoid = createTeleportPad('QA To Void', 'en');
  toVoid.at = {
    x: TEST_PAD_OVERWORLD.x,
    y: TEST_PAD_OVERWORLD.y,
    z: TEST_PAD_OVERWORLD.z,
    radius: 1,
  };
  toVoid.to = {
    x: TEST_PAD_VOID_LANDING.x,
    y: TEST_PAD_VOID_LANDING.y,
    z: TEST_PAD_VOID_LANDING.z,
    dimensionId: dim.id,
  };
  toVoid.cooldownSeconds = 1;

  const toOverworld = createTeleportPad('QA To Overworld', 'en');
  toOverworld.at = {
    x: TEST_PAD_VOID_RETURN.x,
    y: TEST_PAD_VOID_RETURN.y,
    z: TEST_PAD_VOID_RETURN.z,
    radius: 1,
    dimensionId: dim.id,
  };
  toOverworld.to = {
    x: TEST_PAD_OVERWORLD.x + 3,
    y: TEST_PAD_OVERWORLD.y,
    z: TEST_PAD_OVERWORLD.z,
  };
  toOverworld.cooldownSeconds = 1;

  project.teleportPads = [...(project.teleportPads ?? []), toVoid, toOverworld];
  return { dimensionId: dim.id };
}

export function addTestContainers(project: Project, coinId: string): void {
  const chest = createWorldContainer('QA Supply Chest', 'en');
  chest.blockType = 'minecraft:chest';
  chest.location = { ...TEST_CONTAINER_CHEST };
  chest.refillIntervalSeconds = 30;
  chest.stock = [
    { target: 'minecraft:bread', amount: 4, chance: 100 },
    { target: 'minecraft:torch', amount: 8, chance: 80 },
  ];

  const barrel = createWorldContainer('QA Quest Barrel', 'en');
  barrel.blockType = 'minecraft:barrel';
  barrel.location = { ...TEST_CONTAINER_BARREL };
  barrel.refillIntervalSeconds = 60;
  barrel.stock = [{ customItemId: coinId, amount: 1, chance: 100 }];

  project.containers = [...(project.containers ?? []), chest, barrel];
}

export function addTestDungeon(project: Project, eliteMobId: string): void {
  const dungeon = createDungeon('QA Crypt', 'en');
  dungeon.tag = 'qa_crypt';
  dungeon.description = 'Small two-room test dungeon in the overworld yard.';

  const entrance = createDungeonRoom('Entrance');
  entrance.type = 'entrance';
  entrance.bounds = { ...TEST_DUNGEON_ENTRANCE };
  entrance.spawns = [
    {
      ...createRoomSpawn(),
      sourceType: 'vanilla',
      vanillaEntity: 'minecraft:zombie',
      count: 2,
      spawnOnEntry: true,
      respawn: false,
    },
  ];
  entrance.triggers = [
    {
      ...createRoomTrigger('on_entry'),
      action: { type: 'dialogue', message: 'Welcome to the QA Crypt.', targets: 'room' },
      fireOnce: true,
    },
  ];
  entrance.questGate = { questName: '1. Talk Intro', requiredState: 3 };

  const boss = createDungeonRoom('Boss Room');
  boss.type = 'boss_room';
  boss.bounds = { ...TEST_DUNGEON_BOSS };
  boss.spawns = [
    {
      ...createRoomSpawn(),
      sourceType: 'customMob',
      customMobId: eliteMobId,
      count: 1,
      spawnOnEntry: true,
      respawn: false,
    },
  ];
  boss.triggers = [
    {
      ...createRoomTrigger('on_all_mobs_killed'),
      action: {
        type: 'unlock_chest',
        x: TEST_DUNGEON_CHEST.x,
        y: TEST_DUNGEON_CHEST.y,
        z: TEST_DUNGEON_CHEST.z,
      },
      fireOnce: true,
    },
    {
      ...createRoomTrigger('on_all_mobs_killed'),
      id: uid(),
      action: { type: 'set_quest_state', questName: '1. Talk Intro', state: 3 },
      fireOnce: true,
    },
    {
      ...createRoomTrigger('on_exit'),
      id: uid(),
      action: { type: 'custom_command', command: 'say [QA Crypt] Player left boss room' },
      fireOnce: false,
    },
  ];

  dungeon.rooms = [entrance, boss];
  project.dungeons = [...(project.dungeons ?? []), dungeon];
}

/** Extra yard markers (pads, containers, dungeon outline) for place_test_world. */
export function generateWorldMarkerCommands(): string[] {
  const lines = ['# Quest Tool test yard — world systems markers'];

  // Teleport pad pads
  lines.push(
    `fill ${TEST_PAD_OVERWORLD.x - 1} ${Y} ${TEST_PAD_OVERWORLD.z - 1} ${TEST_PAD_OVERWORLD.x + 1} ${Y} ${TEST_PAD_OVERWORLD.z + 1} minecraft:cyan_concrete`,
  );

  // Container markers (blocks placed by containers/place_all)
  lines.push(
    `setblock ${TEST_CONTAINER_CHEST.x} ${Y - 1} ${TEST_CONTAINER_CHEST.z} minecraft:orange_concrete`,
    `setblock ${TEST_CONTAINER_BARREL.x} ${Y - 1} ${TEST_CONTAINER_BARREL.z} minecraft:brown_concrete`,
  );

  // Dungeon floor markers
  lines.push(
    `fill ${TEST_DUNGEON_ENTRANCE.x1} ${Y - 1} ${TEST_DUNGEON_ENTRANCE.z1} ${TEST_DUNGEON_ENTRANCE.x2} ${Y - 1} ${TEST_DUNGEON_ENTRANCE.z2} minecraft:stone_bricks`,
    `fill ${TEST_DUNGEON_BOSS.x1} ${Y - 1} ${TEST_DUNGEON_BOSS.z1} ${TEST_DUNGEON_BOSS.x2} ${Y - 1} ${TEST_DUNGEON_BOSS.z2} minecraft:deepslate_bricks`,
    `setblock ${TEST_DUNGEON_CHEST.x} ${Y} ${TEST_DUNGEON_CHEST.z} minecraft:chest{Lock:"qa_crypt"}`,
  );

  // Void platforms (dimension must exist — restart world after first install)
  lines.push(
    `execute in qtqa:qa_void run fill -2 63 -2 10 63 10 minecraft:stone`,
    `execute in qtqa:qa_void run fill -1 64 -1 1 64 1 minecraft:cyan_concrete`,
    `execute in qtqa:qa_void run fill -1 64 7 1 64 9 minecraft:light_blue_concrete`,
    `execute in qtqa:qa_void run setblock 8 64 8 minecraft:diamond_block`,
  );

  return lines;
}
