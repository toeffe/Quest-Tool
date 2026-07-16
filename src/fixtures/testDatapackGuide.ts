import { tellraw } from '../generator/text';
import { defaultsT } from '../i18n/useLabels';
import type { Project } from '../types/quest';
import { TEST_DATAPACK_NAMESPACE, TEST_DATAPACK_SURFACE_Y } from './testDatapackConstants';
import { JOB_STATION_LABELS, JOB_STATION_X } from './testDatapackStations';
import {
  TEST_CONTAINER_BARREL,
  TEST_CONTAINER_CHEST,
  TEST_DUNGEON_ENTRANCE,
  TEST_PAD_OVERWORLD,
  TEST_PAD_VOID_LANDING,
  TEST_PAD_VOID_RETURN,
} from './testDatapackWorld';

const NS = TEST_DATAPACK_NAMESPACE;
const tEn = defaultsT('en');

function line(text: string, color = 'gray'): string {
  return tellraw('@s', [{ text, color }]);
}

/** In-game master checklist for the complete test suite. */
export function generateTestGuideLines(project: Project): string[] {
  const lines: string[] = [
    '# Quest Tool — complete test guide',
    line('=== Quest Tool Test Suite ===', 'gold'),
    line('Setup: spawn_all, give_test_kit, jobs/sync_all', 'yellow'),
    line(`/function ${NS}:spawn_all`, 'aqua'),
    line(`/function ${NS}:give_test_kit`, 'aqua'),
    line(`/function ${NS}:jobs/sync_all`, 'aqua'),
    line(`/function ${NS}:debug — quest state + job Lv/XP`, 'aqua'),
    line(`/function ${NS}:give_questlog — get quest log (auto-updates while held)`, 'aqua'),
    line(''),
    line(`--- Quests 1-${project.quests.length} ---`, 'gold'),
  ];

  for (const q of project.quests) {
    lines.push(line(`• ${q.name}: ${q.description}`, 'white'));
  }

  lines.push(line(''), line(`--- Jobs (stations at X=${JOB_STATION_X}) ---`, 'gold'));

  for (const station of JOB_STATION_LABELS) {
    lines.push(
      line(
        `• ${tEn(`starterJobs.${station.nameKey}`)} @ ${JOB_STATION_X}, ${TEST_DATAPACK_SURFACE_Y}, ${station.z}`,
        'yellow',
      ),
      line(`  ${station.action}`, 'gray'),
    );
  }

  lines.push(
    line(''),
    line('--- World containers ---', 'gold'),
    line(
      `Chest @ ${TEST_CONTAINER_CHEST.x} ${TEST_CONTAINER_CHEST.y} ${TEST_CONTAINER_CHEST.z} (vanilla stock)`,
      'white',
    ),
    line(
      `Barrel @ ${TEST_CONTAINER_BARREL.x} ${TEST_CONTAINER_BARREL.y} ${TEST_CONTAINER_BARREL.z} (custom coin)`,
      'white',
    ),
    line(`/function ${NS}:containers/place_all`, 'aqua'),
    line(`/function ${NS}:containers/refill_all`, 'aqua'),
  );

  const dim = (project.dimensions ?? [])[0];
  const dimId = dim ? `${NS}:${dim.tag}` : `${NS}:qa_void`;
  lines.push(
    line(''),
    line('--- Dimensions & teleport pads ---', 'gold'),
    line(`Void dimension: ${dimId} (restart world after first install)`, 'white'),
    line(
      `Overworld pad @ ${TEST_PAD_OVERWORLD.x} ${TEST_PAD_OVERWORLD.y} ${TEST_PAD_OVERWORLD.z} → void ${TEST_PAD_VOID_LANDING.x} ${TEST_PAD_VOID_LANDING.y} ${TEST_PAD_VOID_LANDING.z}`,
      'white',
    ),
    line(
      `Void return pad @ ${TEST_PAD_VOID_RETURN.x} ${TEST_PAD_VOID_RETURN.y} ${TEST_PAD_VOID_RETURN.z}`,
      'white',
    ),
    line(`/execute in ${dimId} run tp @s ${TEST_PAD_VOID_LANDING.x} 65 ${TEST_PAD_VOID_LANDING.z}`, 'aqua'),
  );

  const dungeon = (project.dungeons ?? [])[0];
  if (dungeon) {
    lines.push(
      line(''),
      line('--- Dungeon ---', 'gold'),
      line(
        `${dungeon.name} entrance near ${TEST_DUNGEON_ENTRANCE.x1},${TEST_DUNGEON_ENTRANCE.z1}`,
        'white',
      ),
      line(`/function ${NS}:dungeons/${dungeon.tag}/init`, 'aqua'),
      line(`/function ${NS}:dungeons/${dungeon.tag}/reset`, 'aqua'),
    );
  }

  lines.push(
    line(''),
    line(`Custom mobs: /function ${NS}:give_custom_mobs`, 'yellow'),
    line('PvP: requires a second player — skip in solo.', 'red'),
    line(`Reset: /function ${NS}:reset`, 'green'),
  );

  return lines;
}
