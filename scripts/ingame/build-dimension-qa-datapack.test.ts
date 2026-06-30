import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProject } from '../../src/types/factory';
import { createDimension, createTeleportPad } from '../../src/types/dimension';
import { buildDatapackFiles, buildDatapackZip } from '../../src/generator/datapack';

const outputDir = join(dirname(fileURLToPath(import.meta.url)), 'output');
const NAMESPACE = 'dimqa';

function buildDimensionQaProject() {
  const project = createProject('Dimension QA', 'en');
  project.namespace = NAMESPACE;

  const dim = createDimension('Void Test');
  dim.tag = 'void_test';
  project.dimensions = [dim];

  const toVoid = createTeleportPad('To Void');
  toVoid.at = { x: 0, y: 64, z: 0, radius: 2 };
  toVoid.to = { dimensionId: dim.id, x: 10, y: 64, z: 10 };
  toVoid.cooldownSeconds = 1;

  const toOverworld = createTeleportPad('To Overworld');
  toOverworld.at = { dimensionId: dim.id, x: 10, y: 64, z: 10, radius: 1 };
  toOverworld.to = { x: 5, y: 64, z: 5 };
  toOverworld.cooldownSeconds = 1;

  project.teleportPads = [toVoid, toOverworld];
  return project;
}

/**
 * Manual QA (Minecraft 1.21.11):
 * 1. npm run ingame:dimensions
 * 2. Install scripts/ingame/output/dimension-qa.zip in a fresh creative superflat world
 * 3. Leave world and re-enter (accept experimental prompt if shown)
 * 4. Confirm world loads without datapack errors
 * 5. /execute in dimqa:void_test run tp @s 0 64 0
 * 6. Step on pad at overworld 0 64 0 — teleports to void 10 64 10
 * 7. Step on pad at void 10 64 10 — teleports back to overworld 5 64 5
 */
describe('dimension QA fixture export', () => {
  it('builds dimension + pad datapack for manual verification', async () => {
    const project = buildDimensionQaProject();
    const files = buildDatapackFiles(project);
    const fnRoot = `data/${NAMESPACE}/function`;

    expect(files[`data/${NAMESPACE}/dimension/void_test.json`]).toBeDefined();
    expect(Object.keys(files).some((p) => p.includes('dimension_type/'))).toBe(false);
    expect(Object.keys(files).some((p) => p.includes('/portals/'))).toBe(false);
    expect(files[`${fnRoot}/pads/tick.mcfunction`]).toContain('pad0_cd');
    expect(files[`${fnRoot}/pads/tick.mcfunction`]).toContain('pad1_cd');
    expect(files[`${fnRoot}/pads/tick.mcfunction`]).toContain('init_scores');
    expect(files[`${fnRoot}/load.mcfunction`]).toContain('qt_pad_grace');
    expect(files['install.txt']).toContain('Restart the world');

    const blob = await buildDatapackZip(project);
    expect(blob.size).toBeGreaterThan(0);

    if (process.env.QA_EXPORT === '1') {
      mkdirSync(outputDir, { recursive: true });
      const outPath = join(outputDir, 'dimension-qa.zip');
      writeFileSync(outPath, Buffer.from(await blob.arrayBuffer()));
      console.log(`Wrote ${outPath}`);
    }
  });
});
