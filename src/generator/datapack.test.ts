import { describe, it, expect } from 'vitest';
import { type Project } from '../types/quest';
import { createProject, createQuest } from '../types/factory';
import JSZip from 'jszip';
import { buildDatapackFiles, buildRawCommands, buildDatapackZip } from './datapack';
import { DATAPACK_FORMAT } from './packFormat';

function sampleProject(): Project {
  const project = createProject('Test Pack');
  project.namespace = 'testpack';
  project.platform = 'paper';
  project.quests = [createQuest('Slay Zombies', 'kill')];
  return project;
}

describe('datapack structure', () => {
  it('emits pack.mcmeta with the 1.21.11 min_format/max_format schema', () => {
    const files = buildDatapackFiles(sampleProject());
    const meta = JSON.parse(files['pack.mcmeta']);
    expect(meta.pack.min_format).toBe(DATAPACK_FORMAT);
    expect(meta.pack.max_format).toBe(DATAPACK_FORMAT);
    expect(meta.pack.pack_format).toBeUndefined();
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

  it('declares scoreboard objectives in the load function', () => {
    const files = buildDatapackFiles(sampleProject());
    const load = files['data/testpack/function/load.mcfunction'];
    expect(load).toContain('scoreboard objectives add q0 dummy');
    expect(load).toContain('scoreboard objectives add q0t trigger');
    expect(load).toContain('minecraft.killed:minecraft.zombie');
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
    expect(resetAll).toContain('execute as @a run function testpack:reset');
  });

  it('namespaces item rewards so unprefixed item ids still work', () => {
    const project = sampleProject();
    project.quests[0].rewards = [{ type: 'item', value: 'diamond', amount: 2 }];
    const files = buildDatapackFiles(project);
    const turnin = Object.entries(files).find(([p]) => /turnin\.mcfunction$/.test(p))?.[1] ?? '';
    expect(turnin).toContain('give @s minecraft:diamond 2');
  });

  it('reset re-locks quests that require a prerequisite', () => {
    const project = createProject('Chain');
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
    const meta = JSON.parse(await zip.file('pack.mcmeta')!.async('string'));
    expect(meta.pack.min_format).toBe(DATAPACK_FORMAT);
  });
});
