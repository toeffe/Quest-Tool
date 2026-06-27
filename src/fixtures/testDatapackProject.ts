/**
 * Complete flat-world test datapack — quests, jobs, stations, and in-pack guide.
 */
import { createProject, createCustomItem } from '../types/factory';
import { buildDatapackFiles, buildDatapackZipFromFiles, type FileMap } from '../generator/datapack';
import { configureTestJobs } from './testDatapackJobs';
import { buildTestQuests } from './testDatapackQuests';
import {
  generateStationCommands,
  generateTestKitCommands,
} from './testDatapackStations';
import { generateTestGuideLines } from './testDatapackGuide';
import {
  TEST_DATAPACK_NAMESPACE,
} from './testDatapackConstants';

export {
  TEST_DATAPACK_NAMESPACE,
  TEST_DATAPACK_ZIP_NAME,
  TEST_DATAPACK_SURFACE_Y,
} from './testDatapackConstants';

export function buildTestDatapackProject() {
  const project = createProject('Quest Tool Test Pack');
  project.namespace = TEST_DATAPACK_NAMESPACE;
  project.platform = 'lan';
  project.name = 'Quest Tool Test Pack';

  const coin = createCustomItem('general', 'Ancient Coin');
  coin.baseItem = 'minecraft:gold_nugget';
  coin.displayName = 'Ancient Coin';
  coin.lore = ['Test custom item reward'];
  project.customItems = [coin];

  configureTestJobs(project, coin.id);
  project.quests = buildTestQuests(project, coin);

  return project;
}

/** Datapack files with test-only functions and patched spawn_all. */
export function buildTestDatapackFiles(): { project: ReturnType<typeof buildTestDatapackProject>; files: FileMap } {
  const project = buildTestDatapackProject();
  const files = buildDatapackFiles(project);
  const fnRoot = `data/${TEST_DATAPACK_NAMESPACE}/function`;

  files[`${fnRoot}/place_test_stations.mcfunction`] =
    generateStationCommands().join('\n') + '\n';
  files[`${fnRoot}/give_test_kit.mcfunction`] = generateTestKitCommands().join('\n') + '\n';
  files[`${fnRoot}/test_guide.mcfunction`] = generateTestGuideLines(project).join('\n') + '\n';

  const spawnAllKey = `${fnRoot}/spawn_all.mcfunction`;
  files[spawnAllKey] =
    files[spawnAllKey].trimEnd() + `\nfunction ${TEST_DATAPACK_NAMESPACE}:place_test_stations\n`;

  return { project, files };
}

export async function buildTestDatapackZip(): Promise<Blob> {
  const { project, files } = buildTestDatapackFiles();
  return buildDatapackZipFromFiles(project, files);
}
