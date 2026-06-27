import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const result = spawnSync(
  'npx',
  ['vitest', 'run', 'scripts/ingame/build-qa-datapack.test.ts'],
  {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, QA_EXPORT: '1' },
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
  },
);

process.exit(result.status ?? 1);
