import { describe, it, expect } from 'vitest';
import {
  buildTestDatapackProject,
  buildTestDatapackFiles,
  buildTestDatapackZip,
} from './testDatapackProject';
import {
  TEST_DATAPACK_NAMESPACE,
  TEST_DATAPACK_SURFACE_Y,
} from './testDatapackConstants';
import { STARTER_JOB_KEYS } from '../types/factory';

const fnRoot = `data/${TEST_DATAPACK_NAMESPACE}/function`;

describe('buildTestDatapackProject', () => {
  it('exports a complete flat-world test suite', async () => {
    const project = buildTestDatapackProject();
    expect(project.namespace).toBe(TEST_DATAPACK_NAMESPACE);
    expect(project.quests).toHaveLength(18);
    expect(project.jobs).toHaveLength(11);

    const types = new Set(project.quests.map((q) => q.type));
    expect(types.has('talk')).toBe(true);
    expect(types.has('kill')).toBe(true);
    expect(types.has('gather')).toBe(true);
    expect(types.has('delivery')).toBe(true);
    expect(types.has('exploration')).toBe(true);
    expect(types.has('daily')).toBe(true);

    for (const quest of project.quests) {
      expect(quest.npc.spawnMode).toBe('fixed');
      expect(quest.npc.coordinates?.y).toBe(TEST_DATAPACK_SURFACE_Y);
    }

    const q12 = project.quests.find((q) => q.name.startsWith('12.'));
    expect(q12?.chain.requiresJob?.level).toBe(2);

    const q13 = project.quests.find((q) => q.name.startsWith('13.'));
    expect(q13?.rewards.some((r) => r.type === 'jobXp')).toBe(true);
    expect(q13?.chain.unlocks).toContain('14.');

    const q14 = project.quests.find((q) => q.name.startsWith('14.'));
    expect(q14?.chain.autoStart).toBe(true);

    const rewardTypes = new Set(project.quests.flatMap((q) => q.rewards.map((r) => r.type)));
    for (const t of ['item', 'xp', 'money', 'permission', 'command', 'jobXp'] as const) {
      expect(rewardTypes.has(t)).toBe(true);
    }

    for (const key of STARTER_JOB_KEYS) {
      const job = project.jobs!.find((j) => j.starterKey === key);
      expect(job?.xpPerLevel).toBe(15);
      const m2 = job?.milestones?.find((m) => m.level === 2);
      expect(m2?.rewards.length).toBeGreaterThan(0);
    }

    const milestoneTypes = new Set(
      project.jobs!.flatMap((j) => j.milestones?.flatMap((m) => m.rewards.map((r) => r.type)) ?? []),
    );
    expect(milestoneTypes.has('item')).toBe(true);
    expect(milestoneTypes.has('xp')).toBe(true);
    expect(milestoneTypes.has('money')).toBe(true);
    expect(milestoneTypes.has('command')).toBe(true);

    const { files } = buildTestDatapackFiles();
    expect(files[`${fnRoot}/place_test_stations.mcfunction`]).toContain('minecraft:coal_ore');
    expect(files[`${fnRoot}/place_test_stations.mcfunction`]).toContain('minecraft:enchanting_table');
    expect(files[`${fnRoot}/place_test_stations.mcfunction`]).toContain('minecraft:villager');
    expect(files[`${fnRoot}/spawn_all.mcfunction`]).toContain('place_test_stations');
    expect(files[`${fnRoot}/give_test_kit.mcfunction`]).toBeDefined();
    expect(files[`${fnRoot}/test_guide.mcfunction`]).toBeDefined();

    const exploreSpawn = Object.entries(files).find(
      ([p]) => p.includes('/spawn/') && p.toLowerCase().includes('explore'),
    )?.[1];
    expect(exploreSpawn).toContain('setblock 4 -60 8 minecraft:gold_block');

    const blob = await buildTestDatapackZip();
    expect(blob.size).toBeGreaterThan(0);
  });
});
