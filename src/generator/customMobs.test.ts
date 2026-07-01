import { describe, expect, it } from 'vitest';
import { createCustomMob, createProject } from '../types/factory';
import {
  buildCustomMobKillAdvancement,
  buildCustomMobLootTable,
  buildGiveCustomMobsFunction,
  buildSpawnMobFunctions,
  customMobAdvancementNbt,
  resolveCustomMobDeathLootTable,
  summonCustomMob,
} from './customMobs';

describe('customMobs generator', () => {
  const mob = {
    ...createCustomMob('Undead Captain'),
    tag: 'undead_captain',
    baseEntity: 'minecraft:zombie',
    displayName: 'Undead Captain',
    health: 40,
    damage: 8,
    glowing: true,
    equipment: [{ slot: 'mainhand' as const, item: 'minecraft:iron_sword' }],
  };

  it('summonCustomMob uses 1.21.5+ attributes, equipment, and glowing', () => {
    const cmd = summonCustomMob(mob, 10, 64, -5, {
      deathLootTable: 'testpack:mobs/undead_captain',
    });
    expect(cmd).toContain('summon minecraft:zombie 10 64 -5');
    expect(cmd).toContain('questtool');
    expect(cmd).toContain('questtool_mob');
    expect(cmd).toContain('undead_captain');
    expect(cmd).toContain('Undead Captain');
    expect(cmd).toContain('attributes:[');
    expect(cmd).toContain('id:"max_health",base:40');
    expect(cmd).toContain('id:"attack_damage",base:8');
    expect(cmd).toContain('equipment:{mainhand:{id:"minecraft:iron_sword",count:1}');
    expect(cmd).toContain('drop_chances:{mainhand:0.0f}');
    expect(cmd).toContain('DeathLootTable:"testpack:mobs/undead_captain"');
    expect(cmd).toContain('Glowing:1b');
    expect(cmd).toContain('PersistenceRequired:1b');
    expect(cmd).not.toContain('Attributes:');
    expect(cmd).not.toContain('HandItems:');
  });

  it('summonCustomMob emits scale attribute when set', () => {
    const scaled = { ...mob, scale: 2 };
    const cmd = summonCustomMob(scaled, 0, 64, 0);
    expect(cmd).toContain('id:"scale",base:2');
  });

  it('customMobAdvancementNbt filters by registry tag and mob tag', () => {
    expect(customMobAdvancementNbt(mob)).toBe('{Tags:["questtool_mob","undead_captain"]}');
  });

  it('buildCustomMobKillAdvancement produces player_killed_entity criteria', () => {
    const adv = buildCustomMobKillAdvancement(mob, 'testpack', 'quests/0_kill/kill_credit_0');
    expect(adv).toMatchObject({
      criteria: {
        killed_custom_mob: {
          trigger: 'minecraft:player_killed_entity',
          conditions: {
            entity: {
              type: 'minecraft:zombie',
              nbt: '{Tags:["questtool_mob","undead_captain"]}',
            },
          },
        },
      },
      rewards: {
        function: 'testpack:quests/0_kill/kill_credit_0',
      },
    });
  });

  it('buildCustomMobLootTable returns null when all drop entries are invalid', () => {
    const project = createProject();
    const mobWithDrops = {
      ...mob,
      drops: [{ customItemId: 'missing-item-id', amount: 1 }],
    };
    expect(buildCustomMobLootTable(project, mobWithDrops)).toBeNull();
  });

  it('resolveCustomMobDeathLootTable skips invalid drop configs', () => {
    const project = createProject();
    project.namespace = 'testpack';
    const mobWithBadDrops = {
      ...mob,
      drops: [{ target: '', amount: 1 }],
    };
    expect(resolveCustomMobDeathLootTable(mobWithBadDrops, 'testpack', project)).toBeUndefined();
  });
  it('buildCustomMobLootTable outputs entity loot table JSON', () => {
    const project = createProject();
    const mobWithDrops = {
      ...mob,
      drops: [{ target: 'minecraft:rotten_flesh', amount: 2, chance: 100 }],
    };
    const table = buildCustomMobLootTable(project, mobWithDrops);
    expect(table).toMatchObject({ type: 'minecraft:generic' });
    expect(table?.pools).toBeDefined();
  });

  it('buildGiveCustomMobsFunction uses normalized namespace for loot tables', () => {
    const project = createProject();
    project.namespace = 'My Quest Pack';
    project.customMobs = [
      {
        ...mob,
        drops: [{ target: 'minecraft:rotten_flesh', amount: 1 }],
      },
    ];
    const fn = buildGiveCustomMobsFunction(project);
    expect(fn).toContain('DeathLootTable:"my_quest_pack:mobs/undead_captain"');
  });

  it('buildSpawnMobFunctions creates per-tag mcfunctions', () => {
    const project = createProject();
    project.customMobs = [mob];
    const files = buildSpawnMobFunctions(project);
    expect(files['spawn_mob/undead_captain.mcfunction']).toContain(
      'summon minecraft:zombie ~ ~1 ~',
    );
  });
});
