/**
 * Complete flat-world test datapack — quests, jobs, stations, world systems, and in-pack guide.
 */

import { buildDatapackFiles, buildDatapackZipFromFiles, type FileMap } from '../generator/datapack';
import {
  createCustomItem,
  createCustomMob,
  createCustomMobPhase,
  createProject,
} from '../types/factory';
import { TEST_DATAPACK_NAMESPACE } from './testDatapackConstants';
import { generateTestGuideLines } from './testDatapackGuide';
import { configureTestJobs } from './testDatapackJobs';
import { buildTestQuests } from './testDatapackQuests';
import { generateStationCommands, generateTestKitCommands } from './testDatapackStations';
import {
  addTestContainers,
  addTestDimensionAndPads,
  addTestDungeon,
  generateWorldMarkerCommands,
} from './testDatapackWorld';

export {
  TEST_DATAPACK_NAMESPACE,
  TEST_DATAPACK_SURFACE_Y,
  TEST_DATAPACK_ZIP_NAME,
} from './testDatapackConstants';

export function buildTestDatapackProject() {
  const project = createProject('Quest Tool Test Pack');
  project.namespace = TEST_DATAPACK_NAMESPACE;
  project.platform = 'lan';
  project.name = 'Quest Tool Test Pack';
  project.locale = 'en';
  project.questLog = { enabled: true };

  const coin = createCustomItem('general', 'Ancient Coin', 'en');
  coin.baseItem = 'minecraft:gold_nugget';
  coin.displayName = 'Ancient Coin';
  coin.lore = ['Test custom item reward'];

  const relic = createCustomItem('collectible', 'Relic Shard', 'en');
  relic.displayName = 'Relic Shard';
  relic.lore = ['Collectible test item'];

  const ration = createCustomItem('food', 'Traveler Ration', 'en');
  ration.displayName = 'Traveler Ration';

  const pick = createCustomItem('tool', 'Prospector Pick', 'en');
  pick.displayName = 'Prospector Pick';
  pick.baseItem = 'minecraft:iron_pickaxe';

  project.customItems = [coin, relic, ration, pick];

  const elite = createCustomMob('Test Elite', 'en');
  elite.tag = 'test_elite';
  elite.baseEntity = 'minecraft:zombie';
  elite.displayName = 'Test Elite';
  elite.health = 30;
  elite.damage = 6;
  elite.drops = [{ customItemId: coin.id, amount: 1, chance: 100 }];
  project.customMobs = [elite];

  const phaseBoss = createCustomMob('Test Phase Boss', 'en');
  phaseBoss.tag = 'test_phase_boss';
  phaseBoss.baseEntity = 'minecraft:zombie';
  phaseBoss.displayName = 'Phase Boss';
  phaseBoss.health = 40;
  phaseBoss.bossBar = true;
  phaseBoss.phases = [
    { ...createCustomMobPhase('Phase 1'), name: 'Phase 1' },
    {
      ...createCustomMobPhase('Phase 2'),
      name: 'Phase 2',
      atHealthPercent: 50,
      displayName: 'testspeed',
      bossBarColor: 'blue',
      effects: [{ effectId: 'minecraft:speed', amplifier: 1 }],
      equipment: [{ slot: 'feet', item: 'minecraft:diamond_boots' }],
    },
  ];
  project.customMobs.push(phaseBoss);

  // Appearance variants + scale/glowing (summon NBT path; no PNG / resource pack)
  const variantPig = createCustomMob('QA Glow Pig', 'en');
  variantPig.tag = 'qa_glow_pig';
  variantPig.baseEntity = 'minecraft:pig';
  variantPig.displayName = 'QA Glow Pig';
  variantPig.health = 20;
  variantPig.scale = 1.5;
  variantPig.glowing = true;
  variantPig.variants = { variant: 'warm' };
  project.customMobs.push(variantPig);

  configureTestJobs(project, coin.id);

  const { dimensionId } = addTestDimensionAndPads(project);
  addTestContainers(project, coin.id);
  addTestDungeon(project, elite.id);

  project.quests = buildTestQuests(project, {
    coin,
    relic,
    ration,
    pick,
    eliteId: elite.id,
    dimensionId,
  });

  const killQuest = project.quests.find((q) => q.name === '2. Kill Zombies');
  if (killQuest) {
    killQuest.objectives = [{ eliteMobId: elite.id, amount: 2, description: 'Slay test elites' }];
  }

  return project;
}

/** Datapack files with test-only functions and patched spawn_all. */
export function buildTestDatapackFiles(): {
  project: ReturnType<typeof buildTestDatapackProject>;
  files: FileMap;
} {
  const project = buildTestDatapackProject();
  const files = buildDatapackFiles(project);
  const fnRoot = `data/${TEST_DATAPACK_NAMESPACE}/function`;

  files[`${fnRoot}/place_test_stations.mcfunction`] = `${generateStationCommands().join('\n')}\n`;
  files[`${fnRoot}/place_test_world.mcfunction`] = `${generateWorldMarkerCommands().join('\n')}\n`;
  files[`${fnRoot}/give_test_kit.mcfunction`] = `${generateTestKitCommands().join('\n')}\n`;
  files[`${fnRoot}/test_guide.mcfunction`] = `${generateTestGuideLines(project).join('\n')}\n`;

  const spawnAllKey = `${fnRoot}/spawn_all.mcfunction`;
  files[spawnAllKey] =
    files[spawnAllKey].trimEnd() +
    `\nfunction ${TEST_DATAPACK_NAMESPACE}:place_test_stations` +
    `\nfunction ${TEST_DATAPACK_NAMESPACE}:place_test_world` +
    `\nfunction ${TEST_DATAPACK_NAMESPACE}:containers/place_all\n`;

  return { project, files };
}

export async function buildTestDatapackZip(): Promise<Blob> {
  const { project, files } = buildTestDatapackFiles();
  return buildDatapackZipFromFiles(project, files);
}
