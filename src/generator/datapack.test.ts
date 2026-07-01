import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { PROJECT_BACKUP_FILENAME } from '../state/projectStore';
import { createDimension, createTeleportPad } from '../types/dimension';
import {
  createCustomItem,
  createCustomMob,
  createProject,
  createQuest,
  createStarterJobs,
} from '../types/factory';
import type { Project } from '../types/quest';
import {
  buildDatapackFiles,
  buildDatapackZip,
  buildRawCommands,
  buildResourcePackZip,
} from './datapack';
import { DATAPACK_FORMAT } from './packFormat';

function sampleProject(): Project {
  const project = createProject('Test Pack', 'en');
  project.namespace = 'testpack';
  project.platform = 'paper';
  project.quests = [createQuest('Slay Zombies', 'kill')];
  return project;
}

describe('datapack structure', () => {
  it('emits pack.mcmeta with min_format/max_format for datapack format 94.1', () => {
    const files = buildDatapackFiles(sampleProject());
    const meta = JSON.parse(files['pack.mcmeta']);
    expect(meta.pack.min_format).toEqual([...DATAPACK_FORMAT]);
    expect(meta.pack.max_format).toEqual([...DATAPACK_FORMAT]);
    expect(meta.pack.pack_format).toBeUndefined();
    expect(meta.pack.supported_formats).toBeUndefined();
  });

  it('uses the singular function/ folder layout and minecraft load/tick tags', () => {
    const files = buildDatapackFiles(sampleProject());
    expect(files['data/minecraft/tags/function/load.json']).toBeDefined();
    expect(files['data/minecraft/tags/function/tick.json']).toBeDefined();
    expect(files['data/testpack/function/load.mcfunction']).toBeDefined();
    expect(files['data/testpack/function/tick.mcfunction']).toBeDefined();

    const loadTag = JSON.parse(files['data/minecraft/tags/function/load.json']);
    expect(loadTag.values).toContain('testpack:load');
  });

  it('creates per-quest tick, spawn, setup, and debug functions', () => {
    const files = buildDatapackFiles(sampleProject());
    const paths = Object.keys(files);
    expect(paths.some((p) => /function\/quests\/0_.*\/tick\.mcfunction$/.test(p))).toBe(true);
    expect(paths.some((p) => /function\/spawn\/0_.*\.mcfunction$/.test(p))).toBe(true);
    expect(files['data/testpack/function/setup_guide.mcfunction']).toBeDefined();
    expect(files['data/testpack/function/spawn_all.mcfunction']).toBeDefined();
    expect(files['data/testpack/function/debug.mcfunction']).toBeDefined();
    expect(files['install.txt']).toContain('1.21.11');
  });

  it('localizes install.txt readme by project locale', () => {
    const enReadme = buildDatapackFiles(sampleProject())['install.txt'];
    expect(enReadme).toContain('How playing works');
    expect(enReadme).not.toContain('Sådan spiller du');

    const daProject = createProject('Test Pakke', 'da');
    daProject.namespace = 'testpack';
    daProject.quests = [createQuest('Dræb zombier', 'kill', 'da')];
    const daReadme = buildDatapackFiles(daProject)['install.txt'];
    expect(daReadme).toContain('Sådan spiller du');
    expect(daReadme).not.toContain('How playing works');
  });

  it('declares scoreboard objectives in the load function', () => {
    const files = buildDatapackFiles(sampleProject());
    const load = files['data/testpack/function/load.mcfunction'];
    expect(load).toContain('scoreboard objectives add q0 dummy');
    expect(load).toContain('scoreboard objectives add q0t trigger');
    expect(load).toContain('minecraft.killed:minecraft.zombie');
    expect(load).toContain('minecraft.custom:minecraft.fish_caught');
  });

  it('emits jobs tick when project has jobs', () => {
    const files = buildDatapackFiles(sampleProject());
    expect(files['data/testpack/function/jobs/tick.mcfunction']).toBeDefined();
    expect(files['data/testpack/function/jobs/sync_all.mcfunction']).toBeDefined();
    expect(files['data/testpack/function/tick.mcfunction']).toContain(
      'function testpack:jobs/tick',
    );
    const paths = Object.keys(files);
    expect(paths.some((p) => /function\/jobs\/0_.*\/tick\.mcfunction$/.test(p))).toBe(true);
    expect(paths.some((p) => /advancement\/jobs\/0_.*\/root\.json$/.test(p))).toBe(true);
  });

  it('starter jobs load with valid stat criteria for all 11 jobs', () => {
    const project = createProject('Starter Jobs', 'en');
    project.namespace = 'jobpack';
    project.jobs = createStarterJobs();
    const files = buildDatapackFiles(project);
    const load = files['data/jobpack/function/load.mcfunction'];
    expect(load).not.toContain('minecraft:minecraft:');
    expect(load).toContain('minecraft.mined:minecraft.iron_ore');
    expect(load).toContain('minecraft.custom:minecraft.fish_caught');
    expect(load).toContain('minecraft.custom:minecraft.player_kills');
    for (let i = 0; i < 11; i++) {
      expect(load).toContain(`j${i}xp dummy`);
      expect(load).toContain(`j${i}lvl dummy`);
    }
    const jobsTick = files['data/jobpack/function/jobs/tick.mcfunction'];
    expect(jobsTick).toContain('function jobpack:jobs/bossbar_tick');
  });

  it('zoned kill quests use dummy killed scoreboard and emit advancement files', () => {
    const project = sampleProject();
    project.quests[0].objectives = [
      {
        target: 'minecraft:chicken',
        amount: 5,
        description: 'Slay chickens',
        spawnZone: true,
        location: { x: 10, y: 64, z: 20 },
        radius: 5,
      },
    ];
    const files = buildDatapackFiles(project);
    const load = files['data/testpack/function/load.mcfunction'];
    expect(load).toContain('scoreboard objectives add q0k0 dummy');
    expect(load).not.toContain('minecraft.killed:minecraft.chicken');
    const advPath = Object.keys(files).find((p) =>
      /advancement\/quests\/0_.*\/kill_0\.json$/.test(p),
    );
    expect(advPath).toBeDefined();
    const adv = JSON.parse(files[advPath!]);
    expect(adv.criteria.killed_quest_mob.trigger).toBe('minecraft:player_killed_entity');
    expect(adv.rewards.function).toContain('kill_credit_0');
    const turnin = Object.entries(files).find(([p]) => /turnin\.mcfunction$/.test(p))?.[1] ?? '';
    expect(turnin).toContain('kill @e[tag=qk_0_0]');
  });

  it('emits empty loot table when spawn zone uses no drops', () => {
    const project = sampleProject();
    project.quests[0].objectives = [
      {
        target: 'minecraft:chicken',
        amount: 5,
        spawnZone: true,
        zoneDropMode: 'none',
        location: { x: 10, y: 64, z: 20 },
        radius: 5,
      },
    ];
    const files = buildDatapackFiles(project);
    expect(files['data/testpack/loot_table/empty.json']).toBeDefined();
    const spawn = Object.entries(files).find(([p]) => /spawn_mob_0\.mcfunction$/.test(p))?.[1];
    expect(spawn).toContain('DeathLootTable:"testpack:empty"');
  });

  it('emits custom mob drop loot tables for spawn zones', () => {
    const project = sampleProject();
    project.quests[0].objectives = [
      {
        target: 'minecraft:chicken',
        amount: 5,
        spawnZone: true,
        zoneDropMode: 'custom',
        zoneDrops: [{ target: 'minecraft:feather', amount: 3 }],
        location: { x: 10, y: 64, z: 20 },
        radius: 5,
      },
    ];
    const files = buildDatapackFiles(project);
    const lootPath = Object.keys(files).find((p) => /mob_drops_0\.json$/.test(p));
    expect(lootPath).toBeDefined();
    const loot = JSON.parse(files[lootPath!]);
    expect(loot.pools[0].entries[0].name).toBe('minecraft:feather');
  });

  it('disables command feedback on load using the 1.21.11 gamerule id', () => {
    const files = buildDatapackFiles(sampleProject());
    const load = files['data/testpack/function/load.mcfunction'];
    expect(load).toContain('gamerule send_command_feedback false');
    expect(load).not.toContain('sendCommandFeedback');
  });

  it('includes reset and reset_all functions that clear quest scores', () => {
    const files = buildDatapackFiles(sampleProject());
    const reset = files['data/testpack/function/reset.mcfunction'];
    const resetAll = files['data/testpack/function/reset_all.mcfunction'];
    expect(reset).toContain('scoreboard players set @s q0 0');
    expect(reset).toContain('scoreboard players set @s q0d 0');
    expect(reset).toContain('scoreboard players set @s q0k0 0');
    expect(reset).toContain('advancement revoke @s from testpack:jobs/0_fishing/root');
    expect(resetAll).toContain('execute as @a run function testpack:reset');
  });

  it('namespaces item rewards so unprefixed item ids still work', () => {
    const project = sampleProject();
    project.quests[0].rewards = [{ type: 'item', value: 'diamond', amount: 2 }];
    const files = buildDatapackFiles(project);
    const turnin = Object.entries(files).find(([p]) => /turnin\.mcfunction$/.test(p))?.[1] ?? '';
    expect(turnin).toContain('give @s minecraft:diamond 2');
  });

  it('exports custom mob loot table and DeathLootTable on spawn_mob', () => {
    const project = createProject();
    project.namespace = 'droppack';
    const mob = createCustomMob('Loot Boss', 'en');
    mob.tag = 'loot_boss';
    mob.baseEntity = 'minecraft:frog';
    mob.drops = [{ target: 'minecraft:slime_ball', amount: 3, chance: 100 }];
    project.customMobs = [mob];
    const files = buildDatapackFiles(project);
    expect(files['data/droppack/loot_table/mobs/loot_boss.json']).toContain('slime_ball');
    expect(files['data/droppack/loot_table/mobs/loot_boss.json']).toContain(
      '"type": "minecraft:generic"',
    );
    expect(files['data/droppack/function/spawn_mob/loot_boss.mcfunction']).toContain(
      'DeathLootTable:"droppack:mobs/loot_boss"',
    );
  });

  it('includes give_custom_mobs and spawn_mob functions when custom mobs exist', () => {
    const project = sampleProject();
    const mob = createCustomMob('Elite', 'en');
    mob.tag = 'elite_zombie';
    project.customMobs = [mob];
    const files = buildDatapackFiles(project);
    expect(files['data/testpack/function/give_custom_mobs.mcfunction']).toBeDefined();
    expect(files['data/testpack/function/spawn_mob/elite_zombie.mcfunction']).toBeDefined();
  });

  it('gives custom item rewards with item components', () => {
    const project = sampleProject();
    const item = createCustomItem('collectible', 'Trophy');
    item.tag = 'trophy';
    project.customItems = [item];
    project.quests[0].rewards = [{ type: 'item', customItemId: item.id, amount: 1 }];
    const files = buildDatapackFiles(project);
    const turnin = Object.entries(files).find(([p]) => /turnin\.mcfunction$/.test(p))?.[1] ?? '';
    expect(turnin).toContain('give @s minecraft:paper[');
    expect(turnin).toContain('custom_data={questtool_id:"trophy"}');
    expect(files['data/testpack/function/give_custom_items.mcfunction']).toBeDefined();
  });

  it('reset re-locks quests that require a prerequisite', () => {
    const project = createProject('Chain', 'en');
    project.namespace = 'chain';
    const a = createQuest('First', 'kill');
    const b = createQuest('Second', 'kill');
    b.chain.requires = 'First';
    project.quests = [a, b];
    const reset = buildDatapackFiles(project)['data/chain/function/reset.mcfunction'];
    expect(reset).toContain('scoreboard players set @s q0 0');
    expect(reset).toContain('scoreboard players set @s q1 -1');
  });

  it('summons a villager NPC with NoAI and an inline CustomName component', () => {
    const files = buildDatapackFiles(sampleProject());
    const spawn = Object.entries(files).find(([p]) => /spawn\/0_/.test(p))?.[1] ?? '';
    expect(spawn).toContain('summon minecraft:villager');
    expect(spawn).toContain('NoAI:1b');
    expect(spawn).toContain('CustomName:{text:');
    expect(spawn).toContain('Offers:{Recipes:[]}');
    expect(spawn).toContain(
      'execute at @s rotated as @s run tp @e[tag=qg_0,limit=1,sort=nearest] ~ ~ ~ ~ ~',
    );
  });

  it('summons a non-villager NPC without villager-only NBT', () => {
    const project = sampleProject();
    project.quests[0].npc.entityType = 'minecraft:piglin';
    const files = buildDatapackFiles(project);
    const spawn = Object.entries(files).find(([p]) => /spawn\/0_/.test(p))?.[1] ?? '';
    expect(spawn).toContain('summon minecraft:piglin');
    expect(spawn).toContain('NoAI:1b');
    expect(spawn).not.toContain('Offers');
    expect(spawn).not.toContain('VillagerData');
  });

  it('applies appearance sub-variants for non-villager NPCs', () => {
    const project = sampleProject();
    project.quests[0].npc.entityType = 'minecraft:sheep';
    project.quests[0].npc.variants = { Color: '14' };
    const files = buildDatapackFiles(project);
    const spawn = Object.entries(files).find(([p]) => /spawn\/0_/.test(p))?.[1] ?? '';
    expect(spawn).toContain('summon minecraft:sheep');
    expect(spawn).toContain('Color:14b');
    expect(spawn).not.toContain('VillagerData');
  });

  it('summons a baby villager with permanent Age NBT when baby is enabled', () => {
    const project = sampleProject();
    project.quests[0].npc.baby = true;
    const files = buildDatapackFiles(project);
    const spawn = Object.entries(files).find(([p]) => /spawn\/0_/.test(p))?.[1] ?? '';
    expect(spawn).toContain('summon minecraft:villager');
    expect(spawn).toContain('Age:-2147483648');
  });

  it('does not add Age NBT for adult villagers by default', () => {
    const files = buildDatapackFiles(sampleProject());
    const spawn = Object.entries(files).find(([p]) => /spawn\/0_/.test(p))?.[1] ?? '';
    expect(spawn).not.toContain('Age:');
  });

  it('exports dimension pad pack without dimension_type and with restart guidance', () => {
    const project = createProject('Dim Pack', 'en');
    project.namespace = 'dimpack';
    const dim = createDimension('Void Arena');
    dim.tag = 'void_arena';
    project.dimensions = [dim];

    const pad = createTeleportPad('To Void');
    pad.at = { x: 0, y: 64, z: 0, radius: 2 };
    pad.to = { dimensionId: dim.id, x: 10, y: 64, z: 10 };
    pad.cooldownSeconds = 2;
    project.teleportPads = [pad];

    const files = buildDatapackFiles(project);
    const paths = Object.keys(files);

    expect(paths).toContain('data/dimpack/dimension/void_arena.json');
    expect(paths.some((p) => p.includes('dimension_type/'))).toBe(false);
    expect(JSON.parse(files['data/dimpack/dimension/void_arena.json']).type).toBe(
      'minecraft:overworld',
    );

    expect(files['data/dimpack/function/pads/tick.mcfunction']).toContain('pad0_cd');
    expect(files['data/dimpack/function/load.mcfunction']).toContain('pad0_cd');
    expect(paths.some((p) => p.includes('/portals/'))).toBe(false);

    expect(files['install.txt']).toContain('Restart the world');
    expect(files['install.txt']).toContain('/execute in dimpack:void_arena run tp @s 0 64 0');
    expect(files['data/dimpack/function/setup_guide.mcfunction']).toContain('dimpack:void_arena');
  });

  it('builds raw commands containing every file path', () => {
    const raw = buildRawCommands(sampleProject());
    expect(raw).toContain('# ===== pack.mcmeta =====');
    expect(raw).toContain('# ===== data/testpack/function/load.mcfunction =====');
  });

  it('produces a real ZIP that can be re-read with the expected entries', async () => {
    const blob = await buildDatapackZip(sampleProject());
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const zip = await JSZip.loadAsync(bytes);
    expect(zip.file('pack.mcmeta')).not.toBeNull();
    expect(zip.file('data/testpack/function/load.mcfunction')).not.toBeNull();
    expect(zip.file(PROJECT_BACKUP_FILENAME)).not.toBeNull();
    const backup = JSON.parse(await zip.file(PROJECT_BACKUP_FILENAME)!.async('string'));
    expect(backup.name).toBe('Test Pack');
    const meta = JSON.parse(await zip.file('pack.mcmeta')!.async('string'));
    expect(meta.pack.min_format).toEqual([...DATAPACK_FORMAT]);
  });

  it('exports resource pack separately when custom mob has skin', async () => {
    const TINY_PNG =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const project = sampleProject();
    const mob = createCustomMob('Boar', 'en');
    mob.tag = 'undead_boar';
    mob.baseEntity = 'minecraft:pig';
    mob.skinTexture = TINY_PNG;
    project.customMobs = [mob];

    const datapackFiles = buildDatapackFiles(project);
    expect(datapackFiles['data/testpack/pig_variant/undead_boar.json']).toBeDefined();
    expect(datapackFiles['resourcepack/pack.mcmeta']).toBeUndefined();

    const datapackBlob = await buildDatapackZip(project);
    const datapackZip = await JSZip.loadAsync(new Uint8Array(await datapackBlob.arrayBuffer()));
    expect(datapackZip.file('resourcepack/pack.mcmeta')).toBeNull();
    expect(datapackZip.file('pack.mcmeta')).not.toBeNull();

    const rpBlob = await buildResourcePackZip(project);
    const rpZip = await JSZip.loadAsync(new Uint8Array(await rpBlob.arrayBuffer()));
    expect(rpZip.file('pack.mcmeta')).not.toBeNull();
    expect(rpZip.file('assets/testpack/textures/entity/pig/undead_boar.png')).not.toBeNull();
  });
});
