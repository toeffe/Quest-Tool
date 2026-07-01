import { tellraw } from '../generator/text';
import { defaultsT } from '../i18n/useLabels';
import type { Project } from '../types/quest';
import { TEST_DATAPACK_NAMESPACE, TEST_DATAPACK_SURFACE_Y } from './testDatapackConstants';
import { JOB_STATION_LABELS, JOB_STATION_X } from './testDatapackStations';

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
    line(''),
    line('--- Quests 1-18 ---', 'gold'),
  ];

  for (const q of project.quests) {
    lines.push(line(`• ${q.name}: ${q.description}`, 'white'));
  }

  lines.push(line(''), line('--- Jobs (stations at X=' + JOB_STATION_X + ') ---', 'gold'));

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
    line('PvP: requires a second player — skip in solo.', 'red'),
    line('Reset: /function ' + NS + ':reset', 'green'),
  );

  return lines;
}
