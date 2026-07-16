import { describe, expect, it } from 'vitest';
import { createProject, createQuest } from '../types/factory';
import { buildCommandReference } from './commands';
import { buildContext } from './context';
import { buildDatapackFiles } from './datapack';
import { buildLoadFunction, buildTickFunction } from './load';
import {
  buildQuestLogFiles,
  buildQuestLogLoadLines,
  buildQuestLogTickHook,
  isQuestLogEnabled,
  QUESTLOG_CUSTOM_DATA,
  QUESTLOG_MAX_QUEST_PAGES,
  QUESTLOG_TITLE_MAX,
  QUESTLOG_TRIGGER,
  questLogClearCommand,
} from './questBook';
import { compileQuest } from './questFunctions';

function enabledProject(name = 'Quest Log Pack') {
  const project = createProject(name, 'en');
  project.namespace = 'qlogpack';
  project.questLog = { enabled: true };
  return project;
}

describe('quest log book', () => {
  it('emits nothing when quest log is disabled', () => {
    const project = createProject('Off', 'en');
    project.namespace = 'off';
    expect(isQuestLogEnabled(project)).toBe(false);
    const ctx = buildContext(project);
    expect(buildQuestLogFiles(ctx)).toEqual({});
    expect(buildQuestLogLoadLines(ctx)).toEqual([]);
    expect(buildQuestLogTickHook(ctx)).toEqual([]);
    const files = buildDatapackFiles(project);
    expect(files[`data/off/function/give_questlog.mcfunction`]).toBeUndefined();
  });

  it('registers trigger and silent sync on load/tick', () => {
    const project = enabledProject();
    const ctx = buildContext(project);
    const load = buildLoadFunction(ctx);
    expect(load).toContain(`scoreboard objectives add ${QUESTLOG_TRIGGER} trigger`);
    expect(load).toContain(`scoreboard objectives add qlog_fp dummy`);
    expect(load).toContain(`data modify storage ${ctx.namespace}:questlog pages set value []`);

    const tick = buildTickFunction(ctx);
    expect(tick).toContain(`scoreboard players enable @a ${QUESTLOG_TRIGGER}`);
    expect(tick).toContain(
      `execute as @a[scores={${QUESTLOG_TRIGGER}=1..}] at @s run function ${ctx.namespace}:questlog/on_trigger`,
    );
    expect(tick).toContain(
      `execute as @a if items entity @s container.* minecraft:written_book[custom_data=${QUESTLOG_CUSTOM_DATA}] run function ${ctx.namespace}:questlog/sync`,
    );
  });

  it('rebuild assembles SNBT pages and give is silent', () => {
    const project = enabledProject();
    const ctx = buildContext(project);
    const files = buildQuestLogFiles(ctx);

    const assemble = files['questlog/assemble.mcfunction'];
    expect(assemble).toContain(
      `data modify storage ${ctx.namespace}:questlog pages set value [{raw:[{text:`,
    );
    expect(assemble).toContain(`function ${ctx.namespace}:questlog/quest_0`);

    const rebuild = files['questlog/rebuild.mcfunction'];
    expect(rebuild).toContain(`function ${ctx.namespace}:questlog/assemble`);
    expect(rebuild).toContain(
      `function ${ctx.namespace}:questlog/give with storage ${ctx.namespace}:questlog`,
    );
    expect(rebuild).not.toContain('Quest log received');

    const sync = files['questlog/sync.mcfunction'];
    expect(sync).toContain(`function ${ctx.namespace}:questlog/compute_fp`);
    expect(sync).toContain(`execute if score @s qlog_tmp = @s qlog_fp run return 0`);
    expect(sync).toContain(`function ${ctx.namespace}:questlog/rebuild`);

    const give = files['questlog/give.mcfunction'];
    expect(give).toContain(questLogClearCommand());
    expect(give).toContain(
      `$give @s minecraft:written_book[custom_data=${QUESTLOG_CUSTOM_DATA},written_book_content={title:"Quest Log",author:"Quest Tool",resolved:1b,pages:$(pages)}] 1`,
    );
    expect(give).not.toContain('tellraw');
    expect(give).not.toContain('clickEvent');

    const missing = files['questlog/give_missing.mcfunction'];
    expect(missing).toContain('Quest log received');
  });

  it('bakes active kill progress via function macros', () => {
    const project = enabledProject();
    const q = createQuest('Slay', 'kill', 'en');
    q.objectives = [{ target: 'minecraft:zombie', amount: 5, description: 'Slay zombies' }];
    project.quests = [q];
    const ctx = buildContext(project);
    const files = buildQuestLogFiles(ctx);

    const active = files['questlog/quest_0_active.mcfunction'];
    expect(active).toContain(
      `execute store result storage ${ctx.namespace}:qltmp p0 int 1 run scoreboard players get @s q0k0`,
    );
    expect(active).toContain(
      `function ${ctx.namespace}:questlog/quest_0_active_page with storage ${ctx.namespace}:qltmp`,
    );

    const page = files['questlog/quest_0_active_page.mcfunction'];
    expect(page.startsWith('#')).toBe(true);
    expect(page).toContain(
      `$data modify storage ${ctx.namespace}:questlog pages append value {raw:[{text:`,
    );
    expect(page).not.toContain(`append value '`);
    expect(page).toContain('$(p0)');
    expect(page).toContain('/5');
    expect(page).toContain('Slay zombies');
  });

  it('branches on quest state for available/ready/completed/locked pages', () => {
    const project = enabledProject();
    const ctx = buildContext(project);
    const branch = buildQuestLogFiles(ctx)['questlog/quest_0.mcfunction'];
    expect(branch).toContain(
      `execute if score @s q0 matches 1 run function ${ctx.namespace}:questlog/quest_0_active`,
    );
    expect(branch).toContain(`execute if score @s q0 matches 0 run data modify storage`);
    expect(branch).toContain(`execute if score @s q0 matches 2 run data modify storage`);
    expect(branch).toContain(`execute if score @s q0 matches 3..4 run data modify storage`);
    expect(branch).toContain(`execute if score @s q0 matches -1 run data modify storage`);
    expect(branch).toContain('Available');
    expect(branch).toContain('Ready to turn in');
    expect(branch).toContain('Completed');
    expect(branch).toContain('Locked');
  });

  it('adds an overflow page when quest count exceeds the page budget', () => {
    const project = enabledProject();
    project.quests = Array.from({ length: QUESTLOG_MAX_QUEST_PAGES + 3 }, (_, i) =>
      createQuest(`Q${i}`, 'kill', 'en'),
    );
    const ctx = buildContext(project);
    const assemble = buildQuestLogFiles(ctx)['questlog/assemble.mcfunction'];
    expect(assemble).toContain(`function ${ctx.namespace}:questlog/quest_0`);
    expect(assemble).toContain(
      `function ${ctx.namespace}:questlog/quest_${QUESTLOG_MAX_QUEST_PAGES - 1}`,
    );
    expect(assemble).not.toContain(
      `function ${ctx.namespace}:questlog/quest_${QUESTLOG_MAX_QUEST_PAGES}`,
    );
    expect(assemble).toContain('and 3 more quests');
  });

  it('clamps custom book titles to 32 characters', () => {
    const project = enabledProject();
    project.questLog = {
      enabled: true,
      title: 'A'.repeat(QUESTLOG_TITLE_MAX + 10),
    };
    const ctx = buildContext(project);
    const give = buildQuestLogFiles(ctx)['questlog/give.mcfunction'];
    const match = give.match(/title:"([^"]+)"/);
    expect(match?.[1].length).toBe(QUESTLOG_TITLE_MAX);
  });

  it('wires give_questlog into the datapack, commands, and accept/turn-in', () => {
    const project = enabledProject();
    const files = buildDatapackFiles(project);
    expect(files[`data/qlogpack/function/give_questlog.mcfunction`]).toContain(
      'function qlogpack:questlog/give_missing',
    );
    expect(files[`data/qlogpack/function/setup_guide.mcfunction`]).toContain(
      'function qlogpack:give_questlog',
    );
    expect(files['install.txt']).toContain('give_questlog');

    const groups = buildCommandReference(project, 'en');
    const setup = groups.find((g) => g.title.includes('Setup'));
    expect(setup?.commands.some((c) => c.command.includes('give_questlog'))).toBe(true);

    const ctx = buildContext(project);
    const questFiles = compileQuest(ctx, ctx.quests[0]);
    const acceptPath = Object.keys(questFiles).find((p) => p.endsWith('/accept.mcfunction'));
    const acceptBody = acceptPath ? questFiles[acceptPath] : '';
    expect(acceptBody).toContain('questlog/sync');
    expect(acceptBody).toContain('questlog/give_missing');
    expect(acceptBody).toContain(`trigger ${QUESTLOG_TRIGGER}`);

    const completePath = Object.keys(questFiles).find((p) => p.endsWith('/complete.mcfunction'));
    const completeBody = completePath ? questFiles[completePath] : '';
    expect(completeBody).toContain('questlog/sync');

    const turninPath = Object.keys(questFiles).find((p) => p.endsWith('/turnin.mcfunction'));
    const turninBody = turninPath ? questFiles[turninPath] : '';
    expect(turninBody).toContain('questlog/sync');
    expect(turninBody).toContain('questlog/give_missing');
  });

  it('escapes quotes in quest names used inside book pages', () => {
    const project = enabledProject();
    const q = createQuest('Say "hi"', 'kill', 'en');
    project.quests = [q];
    const ctx = buildContext(project);
    const branch = buildQuestLogFiles(ctx)['questlog/quest_0.mcfunction'];
    expect(branch).toContain('\\"hi\\"');
    expect(branch).toContain('{raw:[{text:');
    expect(branch).not.toContain(`'["",{"text":`);
  });
});
