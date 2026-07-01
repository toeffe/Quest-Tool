import { describe, expect, it } from 'vitest';
import { createDimension } from '../types/dimension';
import {
  createDungeon,
  createDungeonRoom,
  createRoomSpawn,
  normalizeBounds,
} from '../types/dungeon';
import { createProject, createQuest } from '../types/factory';
import { buildContext } from './context';
import {
  boundsCenter,
  boundsToSelector,
  buildDungeonRoomContexts,
  buildDungeonsTickFunction,
  buildRoomSpawnFunction,
  buildRoomTickFunction,
  compileDungeons,
} from './dungeons';
import { buildLoadFunction, buildTickFunction } from './load';

describe('dungeons generator', () => {
  it('normalizes bounds to selector offsets', () => {
    const sel = boundsToSelector({ x1: 10, y1: 64, z1: 5, x2: 0, y2: 70, z2: 15 });
    expect(normalizeBounds({ x1: 10, y1: 64, z1: 5, x2: 0, y2: 70, z2: 15 })).toEqual({
      x1: 0,
      y1: 64,
      z1: 5,
      x2: 10,
      y2: 70,
      z2: 15,
    });
    expect(sel).toEqual({ x: 0, y: 64, z: 5, dx: 10, dy: 6, dz: 10 });
  });

  it('computes bounds center', () => {
    expect(boundsCenter({ x1: 0, y1: 64, z1: 0, x2: 10, y2: 70, z2: 10 })).toEqual({
      x: 5,
      y: 67,
      z: 5,
    });
  });

  it('generates room tick with occupancy detection', () => {
    const project = createProject('Test');
    const dungeon = createDungeon('Crypt');
    dungeon.rooms = [
      {
        ...createDungeonRoom('Boss'),
        bounds: { x1: -120, y1: 64, z1: 88, x2: -96, y2: 80, z2: 112 },
        spawns: [createRoomSpawn()],
      },
    ];
    project.dungeons = [dungeon];
    const ctx = buildContext(project);
    const rc = buildDungeonRoomContexts(ctx)[0];
    const tick = buildRoomTickFunction(ctx, rc);
    expect(tick).toContain('scoreboard players set #prev');
    expect(tick).toContain('x=-120,y=64,z=88,dx=24,dy=16,dz=24');
    expect(tick).toContain('on_entry');
    expect(tick).toContain('on_all_killed');
  });

  it('generates spawn maintenance for vanilla mobs', () => {
    const project = createProject('Test');
    const dungeon = createDungeon('Crypt');
    dungeon.rooms = [
      {
        ...createDungeonRoom('Hall'),
        spawns: [{ ...createRoomSpawn(), count: 4, vanillaEntity: 'minecraft:zombie' }],
      },
    ];
    project.dungeons = [dungeon];
    const ctx = buildContext(project);
    const rc = buildDungeonRoomContexts(ctx)[0];
    const spawn = buildRoomSpawnFunction(ctx, rc);
    expect(spawn).toContain('minecraft:zombie');
    expect(spawn).toContain('matches ..3');
    expect(spawn).toContain('questtool_room_dr0r0');
  });

  it('includes dungeons in load and global tick', () => {
    const project = createProject('Test');
    project.dungeons = [createDungeon('Crypt')];
    const ctx = buildContext(project);
    const load = buildLoadFunction(ctx);
    const tick = buildTickFunction(ctx);
    expect(load).toContain('dr0r0_occ');
    expect(load).toContain('dungeons/crypt/init');
    expect(tick).toContain('function questpack:dungeons/tick');
  });

  it('compileDungeons produces init reset and room functions', () => {
    const project = createProject('Test');
    project.quests = [createQuest('Hunt', 'kill')];
    const dungeon = createDungeon('Crypt');
    dungeon.rooms = [createDungeonRoom('Entry')];
    project.dungeons = [dungeon];
    const ctx = buildContext(project);
    const files = compileDungeons(ctx);
    const paths = Object.keys(files);
    expect(paths.some((p) => p.endsWith('dungeons/tick.mcfunction'))).toBe(true);
    expect(paths.some((p) => p.includes('dungeons/crypt/init.mcfunction'))).toBe(true);
    expect(paths.some((p) => p.includes('dungeons/crypt/reset.mcfunction'))).toBe(true);
    expect(paths.some((p) => p.includes('/rooms/entry/tick.mcfunction'))).toBe(true);
    expect(paths.some((p) => p.includes('/rooms/entry/spawn.mcfunction'))).toBe(true);
  });

  it('buildDungeonsTickFunction calls room ticks', () => {
    const project = createProject('Test');
    project.dungeons = [createDungeon('Crypt')];
    const ctx = buildContext(project);
    const tick = buildDungeonsTickFunction(ctx);
    expect(tick).toContain('rooms/');
    expect(tick).toContain('/tick');
  });

  it('scopes dungeon room ticks to custom dimension when dimensionId is set', () => {
    const project = createProject('Test');
    project.namespace = 'questpack';
    const dim = createDimension('Void Crypt');
    dim.tag = 'void_crypt';
    project.dimensions = [dim];

    const dungeon = createDungeon('Crypt');
    dungeon.dimensionId = dim.id;
    dungeon.rooms = [
      {
        ...createDungeonRoom('Boss'),
        bounds: { x1: 0, y1: 64, z1: 0, x2: 10, y2: 70, z2: 10 },
      },
    ];
    project.dungeons = [dungeon];

    const ctx = buildContext(project);
    const tick = buildDungeonsTickFunction(ctx);
    expect(tick).toContain(
      'execute in questpack:void_crypt run execute if entity @a[x=0,y=64,z=0,dx=10,dy=6,dz=10]',
    );

    const rc = buildDungeonRoomContexts(ctx)[0];
    const roomTick = buildRoomTickFunction(ctx, rc);
    expect(roomTick).toContain(
      'execute in questpack:void_crypt run execute if entity @a[x=0,y=64,z=0,dx=10,dy=6,dz=10]',
    );
  });
});
