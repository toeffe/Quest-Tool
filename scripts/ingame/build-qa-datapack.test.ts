import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TEST_DATAPACK_NAMESPACE } from '../../src/fixtures/testDatapackConstants';
import {
  buildTestDatapackFiles,
  buildTestDatapackZip,
} from '../../src/fixtures/testDatapackProject';

const outputDir = join(dirname(fileURLToPath(import.meta.url)), 'output');
const fnRoot = `data/${TEST_DATAPACK_NAMESPACE}/function`;

describe('ingame QA fixture export', () => {
  it('builds the complete test datapack with all quests and injected functions', async () => {
    const { project, files } = buildTestDatapackFiles();
    expect(project.quests).toHaveLength(24);
    expect(project.jobs).toHaveLength(11);
    expect(project.containers?.length).toBeGreaterThanOrEqual(2);
    expect(project.dimensions?.length).toBeGreaterThanOrEqual(1);
    expect(project.dungeons?.length).toBeGreaterThanOrEqual(1);

    expect(files[`${fnRoot}/debug.mcfunction`]).toBeDefined();
    expect(files[`${fnRoot}/spawn_all.mcfunction`]).toContain('place_test_stations');
    expect(files[`${fnRoot}/spawn_all.mcfunction`]).toContain('containers/place_all');
    expect(files[`${fnRoot}/place_test_stations.mcfunction`]).toContain('minecraft:water');
    expect(files[`${fnRoot}/place_test_world.mcfunction`]).toBeDefined();
    expect(files[`${fnRoot}/give_test_kit.mcfunction`]).toContain('fishing_rod');
    expect(files[`${fnRoot}/test_guide.mcfunction`]).toContain('Quests 1-24');
    expect(files[`${fnRoot}/containers/place_all.mcfunction`]).toBeDefined();
    expect(files[`${fnRoot}/dungeons/qa_crypt/init.mcfunction`]).toBeDefined();

    const blob = await buildTestDatapackZip();
    expect(blob.size).toBeGreaterThan(0);

    if (process.env.QA_EXPORT === '1') {
      mkdirSync(outputDir, { recursive: true });
      const outPath = join(outputDir, 'qa-suite.zip');
      writeFileSync(outPath, Buffer.from(await blob.arrayBuffer()));
      console.log(`Wrote ${outPath}`);
    }
  });
});
