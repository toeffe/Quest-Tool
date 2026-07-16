import { describe, expect, it } from 'vitest';
import { STARTER_JOB_KEYS } from '../types/factory';
import { TEST_DATAPACK_NAMESPACE, TEST_DATAPACK_SURFACE_Y } from './testDatapackConstants';
import {
  buildTestDatapackFiles,
  buildTestDatapackProject,
  buildTestDatapackZip,
} from './testDatapackProject';

const fnRoot = `data/${TEST_DATAPACK_NAMESPACE}/function`;

describe('buildTestDatapackProject', () => {
  it('exports a complete flat-world test suite', async () => {
    const project = buildTestDatapackProject();
    expect(project.namespace).toBe(TEST_DATAPACK_NAMESPACE);
    expect(project.quests).toHaveLength(24);
    expect(project.jobs).toHaveLength(11);

    const types = new Set(project.quests.map((q) => q.type));
    expect(types.has('talk')).toBe(true);
    expect(types.has('kill')).toBe(true);
    expect(types.has('gather')).toBe(true);
    expect(types.has('delivery')).toBe(true);
    expect(types.has('exploration')).toBe(true);
    expect(types.has('daily')).toBe(true);

    for (const quest of project.quests) {
      if (quest.npc.spawnMode === 'fixed') {
        expect(quest.npc.coordinates?.y).toBeDefined();
      }
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
      project.jobs!.flatMap(
        (j) => j.milestones?.flatMap((m) => m.rewards.map((r) => r.type)) ?? [],
      ),
    );
    expect(milestoneTypes.has('item')).toBe(true);
    expect(milestoneTypes.has('xp')).toBe(true);
    expect(milestoneTypes.has('money')).toBe(true);
    expect(milestoneTypes.has('command')).toBe(true);

    // Custom item kinds
    const kinds = new Set((project.customItems ?? []).map((i) => i.kind));
    expect(kinds.has('general')).toBe(true);
    expect(kinds.has('collectible')).toBe(true);
    expect(kinds.has('food')).toBe(true);
    expect(kinds.has('tool')).toBe(true);

    // World systems
    expect(project.containers?.length).toBeGreaterThanOrEqual(2);
    expect(project.dimensions?.length).toBeGreaterThanOrEqual(1);
    expect(project.teleportPads?.length).toBeGreaterThanOrEqual(2);
    expect(project.dungeons?.length).toBeGreaterThanOrEqual(1);

    // Quest coverage extras
    const talkTarget = project.quests.find((q) => q.name.startsWith('19.'));
    expect(talkTarget?.targetNpc).toBeDefined();

    const gatherZone = project.quests.find((q) => q.name.startsWith('20.'));
    expect(gatherZone?.type).toBe('gather');
    expect(gatherZone?.objectives[0]?.spawnZone).toBe(true);
    expect(gatherZone?.objectives[0]?.zoneMob).toBeTruthy();

    const eliteZone = project.quests.find((q) => q.name.startsWith('21.'));
    expect(eliteZone?.objectives[0]?.eliteMobId).toBeTruthy();
    expect(eliteZone?.objectives[0]?.spawnZone).toBe(true);

    const voidExplore = project.quests.find((q) => q.name.startsWith('22.'));
    expect(voidExplore?.objectives[0]?.location?.dimensionId).toBeTruthy();
    expect(voidExplore?.npc.coordinates?.dimensionId).toBeTruthy();

    const playerSpawn = project.quests.find((q) => q.name.startsWith('23.'));
    expect(playerSpawn?.npc.spawnMode).toBe('player');
    expect(playerSpawn?.npc.entityType).not.toBe('minecraft:villager');

    const manualSpawn = project.quests.find((q) => q.name.startsWith('24.'));
    expect(manualSpawn?.npc.spawnMode).toBe('manual');

    // Custom mob drops / scale / glowing / variants
    const elite = project.customMobs?.find((m) => m.tag === 'test_elite');
    expect(elite?.drops?.length).toBeGreaterThan(0);
    const glowPig = project.customMobs?.find((m) => m.tag === 'qa_glow_pig');
    expect(glowPig?.scale).toBe(1.5);
    expect(glowPig?.glowing).toBe(true);
    expect(glowPig?.variants?.variant).toBe('warm');

    expect(project.questLog?.enabled).toBe(true);

    const { files } = buildTestDatapackFiles();
    expect(files[`${fnRoot}/place_test_stations.mcfunction`]).toContain('minecraft:coal_ore');
    expect(files[`${fnRoot}/place_test_stations.mcfunction`]).toContain(
      'minecraft:enchanting_table',
    );
    expect(files[`${fnRoot}/place_test_stations.mcfunction`]).toContain('minecraft:villager');
    expect(files[`${fnRoot}/place_test_world.mcfunction`]).toContain('cyan_concrete');
    expect(files[`${fnRoot}/spawn_all.mcfunction`]).toContain('place_test_stations');
    expect(files[`${fnRoot}/spawn_all.mcfunction`]).toContain('place_test_world');
    expect(files[`${fnRoot}/spawn_all.mcfunction`]).toContain('containers/place_all');
    expect(files[`${fnRoot}/give_test_kit.mcfunction`]).toBeDefined();
    expect(files[`${fnRoot}/give_questlog.mcfunction`]).toContain('questlog/give_missing');
    expect(files[`${fnRoot}/questlog/sync.mcfunction`]).toContain('compute_fp');
    expect(files[`${fnRoot}/questlog/give.mcfunction`]).toContain('written_book_content');
    expect(files[`${fnRoot}/test_guide.mcfunction`]).toContain('containers/place_all');
    expect(files[`${fnRoot}/test_guide.mcfunction`]).toContain('give_questlog');
    expect(files[`${fnRoot}/test_guide.mcfunction`]).toContain('dungeons/qa_crypt/init');

    expect(files[`${fnRoot}/containers/place_all.mcfunction`]).toBeDefined();
    expect(files[`${fnRoot}/pads/tick.mcfunction`]).toBeDefined();
    expect(files[`${fnRoot}/dungeons/qa_crypt/init.mcfunction`]).toBeDefined();
    expect(files[`data/${TEST_DATAPACK_NAMESPACE}/dimension/qa_void.json`]).toBeDefined();
    expect(files[`data/${TEST_DATAPACK_NAMESPACE}/loot_table/mobs/test_elite.json`]).toBeDefined();

    const pigSpawn = files[`${fnRoot}/spawn_mob/qa_glow_pig.mcfunction`];
    expect(pigSpawn).toBeDefined();
    expect(pigSpawn).toContain('variant');
    expect(pigSpawn).toMatch(/scale|Glowing|glowing/i);

    const exploreSpawn = Object.entries(files).find(
      ([p]) => p.includes('/spawn/') && p.toLowerCase().includes('explore'),
    )?.[1];
    expect(exploreSpawn).toContain(`setblock 4 ${TEST_DATAPACK_SURFACE_Y} 8 minecraft:gold_block`);

    const blob = await buildTestDatapackZip();
    expect(blob.size).toBeGreaterThan(0);
  });
});
