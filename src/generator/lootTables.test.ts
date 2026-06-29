import { describe, it, expect } from 'vitest';
import { createProject, createCustomItem } from '../types/factory';
import {
  buildEmptyEntityLootTable,
  buildZoneDropLootTable,
  resolveDeathLootTableRef,
} from './lootTables';

describe('lootTables', () => {
  it('builds an empty entity loot table', () => {
    expect(buildEmptyEntityLootTable()).toEqual({
      type: 'minecraft:entity',
      pools: [],
    });
  });

  it('resolves death loot table refs by mode', () => {
    expect(resolveDeathLootTableRef('vanilla', 'ns', 'quests/0_q', 0)).toBeUndefined();
    expect(resolveDeathLootTableRef('none', 'ns', 'quests/0_q', 0)).toBe('ns:empty');
    expect(resolveDeathLootTableRef('custom', 'ns', 'quests/0_q', 0)).toBe(
      'ns:quests/quests/0_q/mob_drops_0',
    );
  });

  it('builds a vanilla drop loot table with chance', () => {
    const project = createProject('P');
    const table = buildZoneDropLootTable(project, [
      { target: 'minecraft:bone', amount: 2, chance: 50 },
    ]);
    expect(table.type).toBe('minecraft:entity');
    const pools = table.pools as Record<string, unknown>[];
    expect(pools).toHaveLength(1);
    const entry = (pools[0].entries as Record<string, unknown>[])[0];
    expect(entry.name).toBe('minecraft:bone');
    expect(entry.conditions).toEqual([
      { condition: 'minecraft:random_chance', chance: 0.5 },
    ]);
    const fns = entry.functions as Record<string, unknown>[];
    expect(fns[0]).toEqual({ function: 'minecraft:set_count', count: 2 });
  });

  it('builds a custom item drop with set_components', () => {
    const project = createProject('P');
    const item = createCustomItem('collectible', 'Token');
    item.tag = 'quest_token';
    item.displayName = 'Quest Token';
    project.customItems = [item];
    const table = buildZoneDropLootTable(project, [
      { customItemId: item.id, amount: 1 },
    ]);
    const pools = table.pools as Record<string, unknown>[];
    const entry = (pools[0].entries as Record<string, unknown>[])[0];
    expect(entry.name).toBe('minecraft:paper');
    const fns = entry.functions as Record<string, unknown>[];
    const setComponents = fns.find((f) => f.function === 'minecraft:set_components');
    expect(setComponents).toBeDefined();
    const components = setComponents!.components as Record<string, unknown>;
    expect(components['minecraft:custom_data']).toEqual({ questtool_id: 'quest_token' });
    expect(components['minecraft:item_name']).toBe('Quest Token');
  });

  it('includes enchantments in custom item drop components', () => {
    const project = createProject('P');
    const item = createCustomItem('tool', 'Enchanted Shovel');
    item.tag = 'ench_shovel';
    item.enchantments = [
      { enchantmentId: 'minecraft:efficiency', level: 4 },
      { enchantmentId: 'minecraft:fortune', level: 2 },
    ];
    project.customItems = [item];
    const table = buildZoneDropLootTable(project, [
      { customItemId: item.id, amount: 1 },
    ]);
    const pools = table.pools as Record<string, unknown>[];
    const entry = (pools[0].entries as Record<string, unknown>[])[0];
    const fns = entry.functions as Record<string, unknown>[];
    const setComponents = fns.find((f) => f.function === 'minecraft:set_components');
    const components = setComponents!.components as Record<string, unknown>;
    expect(components['minecraft:enchantments']).toEqual({
      levels: {
        'minecraft:efficiency': 4,
        'minecraft:fortune': 2,
      },
    });
  });

  it('uses one pool per drop entry', () => {
    const project = createProject('P');
    const table = buildZoneDropLootTable(project, [
      { target: 'minecraft:bone', amount: 1 },
      { target: 'minecraft:feather', amount: 1 },
    ]);
    const pools = table.pools as Record<string, unknown>[];
    expect(pools).toHaveLength(2);
  });
});
