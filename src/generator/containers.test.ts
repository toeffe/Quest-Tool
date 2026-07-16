import { describe, expect, it } from 'vitest';
import { createWorldContainer } from '../types/container';
import { createCustomItem, createProject } from '../types/factory';
import {
  compileContainers,
  containerIntervalTicks,
  containerLootTableId,
  containerLootTablePath,
  containerSlug,
  containerTimerHolder,
} from './containers';
import { buildContext } from './context';
import { buildDatapackFiles } from './datapack';
import { buildLoadFunction, buildTickFunction } from './load';
import { SYS_OBJECTIVE } from './sys';

describe('compileContainers', () => {
  it('emits place, refill, tick, loot table with exact command strings', () => {
    const project = createProject('Containers', 'en');
    project.namespace = 'questpack';
    const item = createCustomItem('collectible', 'Quest Key', 'en');
    item.tag = 'quest_key';
    project.customItems = [item];

    const container = createWorldContainer('Supply Chest', 'en');
    container.id = 'ctrtest01';
    container.blockType = 'minecraft:barrel';
    container.location = { x: 10, y: 64, z: -5 };
    container.refillIntervalSeconds = 60;
    container.stock = [
      { customItemId: item.id, amount: 1, chance: 100 },
      { target: 'minecraft:bread', amount: 3, chance: 50 },
    ];
    project.containers = [container];

    const ctx = buildContext(project);
    const files = compileContainers(ctx);
    const slug = containerSlug(container);
    expect(slug).toBe('supply_chest');

    const lootPath = containerLootTablePath('questpack', slug);
    expect(files[lootPath]).toBeDefined();
    const loot = JSON.parse(files[lootPath]!);
    expect(loot.type).toBe('minecraft:generic');
    expect(loot.pools).toHaveLength(2);
    expect(JSON.stringify(loot)).toContain('questtool_id');
    expect(JSON.stringify(loot)).toContain('quest_key');

    const place = files[`data/questpack/function/containers/${slug}/place.mcfunction`]!;
    expect(place).toContain('setblock 10 64 -5 minecraft:barrel');
    expect(place).toContain('data remove block 10 64 -5 Items');
    expect(place).toContain(
      `loot replace block 10 64 -5 container.0 loot ${containerLootTableId('questpack', slug)}`,
    );
    expect(place).toContain(
      `scoreboard players set ${containerTimerHolder(0)} ${SYS_OBJECTIVE} ${containerIntervalTicks(container)}`,
    );

    const refill = files[`data/questpack/function/containers/${slug}/refill.mcfunction`]!;
    expect(refill).toContain('data remove block 10 64 -5 Items');
    expect(refill).toContain(
      `loot replace block 10 64 -5 container.0 loot ${containerLootTableId('questpack', slug)}`,
    );
    expect(refill).not.toContain('setblock');

    const tick = files['data/questpack/function/containers/tick.mcfunction']!;
    expect(tick).toContain(
      `execute if score ${containerTimerHolder(0)} ${SYS_OBJECTIVE} matches 1.. run scoreboard players remove ${containerTimerHolder(0)} ${SYS_OBJECTIVE} 1`,
    );
    expect(tick).toContain(
      `execute if score ${containerTimerHolder(0)} ${SYS_OBJECTIVE} matches 0 run function questpack:containers/${slug}/refill`,
    );

    expect(files['data/questpack/function/containers/place_all.mcfunction']).toContain(
      `function questpack:containers/${slug}/place`,
    );
    expect(files['data/questpack/function/containers/refill_all.mcfunction']).toContain(
      `function questpack:containers/${slug}/refill`,
    );
  });

  it('scopes place/refill into custom dimensions', () => {
    const project = createProject('Dim Containers', 'en');
    project.namespace = 'questpack';
    const dim = {
      id: 'dim1',
      name: 'Void',
      tag: 'void',
    };
    project.dimensions = [dim];
    const container = createWorldContainer('Void Chest', 'en');
    container.location = { x: 0, y: 64, z: 0, dimensionId: dim.id };
    container.stock = [{ target: 'minecraft:diamond', amount: 1 }];
    project.containers = [container];

    const files = compileContainers(buildContext(project));
    const slug = containerSlug(container);
    const place = files[`data/questpack/function/containers/${slug}/place.mcfunction`]!;
    expect(place).toContain('execute in questpack:void run setblock 0 64 0 minecraft:chest');
    expect(place).toContain('execute in questpack:void run data remove block 0 64 0 Items');
    expect(place).toContain(
      'execute in questpack:void run loot replace block 0 64 0 container.0 loot questpack:containers/void_chest',
    );
  });

  it('wires load timers, tick hook, and datapack spawn_all', () => {
    const project = createProject('Wire', 'en');
    project.namespace = 'questpack';
    const container = createWorldContainer('Loot Barrel', 'en');
    container.refillIntervalSeconds = 5;
    container.stock = [{ target: 'minecraft:apple', amount: 1 }];
    project.containers = [container];

    const ctx = buildContext(project);
    const load = buildLoadFunction(ctx);
    expect(load).toContain(
      `scoreboard players set ${containerTimerHolder(0)} ${SYS_OBJECTIVE} ${containerIntervalTicks(container)}`,
    );

    const tick = buildTickFunction(ctx);
    expect(tick).toContain('function questpack:containers/tick');

    const files = buildDatapackFiles(project);
    expect(files['data/questpack/function/containers/place_all.mcfunction']).toBeDefined();
    expect(files['data/questpack/function/spawn_all.mcfunction']).toContain(
      'function questpack:containers/place_all',
    );
    expect(files['data/questpack/function/setup_guide.mcfunction']).toContain(
      'containers/place_all',
    );
  });
});
