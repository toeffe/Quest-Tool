import JSZip from 'jszip';
import { type Project } from '../types/quest';
import { exportProjectJson, PROJECT_BACKUP_FILENAME } from '../state/projectStore';
import { buildPackMeta, MINECRAFT_VERSION } from './packFormat';
import { buildContext, type CompileContext } from './context';
import {
  buildLoadFunction,
  buildTickFunction,
  buildResetFunction,
  buildResetAllFunction,
} from './load';
import { compileQuest, buildKillZoneAdvancementFiles, buildZoneLootTableFiles } from './questFunctions';
import { compileJob, buildJobsTickFunction, buildJobsSyncAllFunction, buildJobDebugLines } from './jobFunctions';
import { buildJobBossBarSupportFiles } from './jobBossBar';
import { buildJobAdvancementFiles } from './jobAdvancements';
import { spawnFunctionLines } from './npc';
import { installGuide } from './platform';
import { tellraw, escapeSnbtString } from './text';
import { questObjectives } from './context';
import { buildGiveCustomItemsFunction } from './items';
import {
  buildEmptyEntityLootTable,
  emptyLootTablePath,
  needsEmptyLootTable,
} from './lootTables';
import { STR } from './strings';

/** A flat map of file paths (inside the ZIP) to their text contents. */
export type FileMap = Record<string, string>;

function mapJobBossBarFiles(fnRoot: string, relFiles: Record<string, string>): FileMap {
  const out: FileMap = {};
  for (const [rel, content] of Object.entries(relFiles)) {
    out[`${fnRoot}/${rel}`] = content;
  }
  return out;
}

function setupGuideFunction(ctx: CompileContext): string {
  const lines = [
    `# Setup guide - lists how to spawn each NPC`,
    tellraw('@s', [{ text: STR.setupGuideTitle, color: 'gold', bold: true }]),
  ];
  for (const qc of ctx.quests) {
    const npc = qc.quest.npc;
    let where: string;
    if (npc.spawnMode === 'fixed' && npc.coordinates) {
      where = STR.setupFixedAt(npc.coordinates.x, npc.coordinates.y, npc.coordinates.z);
    } else if (npc.spawnMode === 'manual') {
      where = STR.setupManual;
    } else {
      where = STR.setupAtPlayer;
    }
    lines.push(
      tellraw('@s', [
        { text: `${qc.quest.name}: `, color: 'yellow', bold: true },
        { text: `${npc.name} - ${where}`, color: 'white' },
      ]),
      tellraw('@s', [
        {
          text: `  > /function ${ctx.namespace}:${qc.spawnFn}`,
          color: 'aqua',
          suggestCommand: `/function ${ctx.namespace}:${qc.spawnFn}`,
          hover: STR.setupCommandHover,
        },
      ]),
    );
    if (qc.quest.type === 'kill' || qc.quest.type === 'gather') {
      for (let j = 0; j < questObjectives(qc.quest).length; j++) {
        const o = questObjectives(qc.quest)[j];
        if (!o.spawnZone || !o.location) continue;
        const r = Math.max(1, o.radius ?? 5);
        lines.push(
          tellraw('@s', [
            { text: STR.setupSpawnZone(j), color: 'gray' },
            {
              text: `${o.location.x} ${o.location.y} ${o.location.z} (r=${r})`,
              color: 'white',
            },
          ]),
        );
      }
    }
  }
  lines.push(
    tellraw('@s', [
      { text: STR.setupTipLabel, color: 'green' },
      { text: STR.setupTip(ctx.namespace), color: 'gray' },
    ]),
  );
  return lines.join('\n') + '\n';
}

function spawnAllFunction(ctx: CompileContext): string {
  const lines = [`# Spawn every NPC (player-located NPCs spawn at your feet)`];
  for (const qc of ctx.quests) {
    lines.push(`function ${ctx.namespace}:${qc.spawnFn}`);
  }
  return lines.join('\n') + '\n';
}

function debugFunction(ctx: CompileContext): string {
  const lines = [
    `# Debug - verify NPC tags and quest state`,
    tellraw('@s', [{ text: STR.debugTitle, color: 'gold', bold: true }]),
  ];
  for (const qc of ctx.quests) {
    lines.push(
      `execute if entity @e[tag=${qc.giverTag}] run tellraw @s ["",{"text":"[OK] ","color":"green"},{"text":"${escapeSnbtString(STR.debugGiverOk(qc.quest.name))}"}]`,
      `execute unless entity @e[tag=${qc.giverTag}] run tellraw @s ["",{"text":"[!!] ","color":"red"},{"text":"${escapeSnbtString(STR.debugGiverMissing(qc.quest.name))}"}]`,
      `tellraw @s ["",{"text":"${STR.debugYourState}","color":"gray"},{"score":{"name":"@s","objective":"${qc.state}"},"color":"white"},{"text":"${STR.debugStateLegend}","color":"dark_gray"}]`,
    );
  }
  if (ctx.jobs.length > 0) {
    lines.push(...buildJobDebugLines(ctx));
  }
  return lines.join('\n') + '\n';
}

function readmeText(project: Project, ctx: CompileContext): string {
  const guide = installGuide(project.platform, ctx.namespace);
  const lines: string[] = [
    `Quest Tool MC - ${project.name}`,
    `Generated for Minecraft Java Edition ${MINECRAFT_VERSION}`,
    ``,
    guide.title,
    `${'='.repeat(guide.title.length)}`,
  ];
  guide.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  lines.push(
    ``,
    `How playing works`,
    `=================`,
    `- Walk up to a quest giver NPC; dialogue appears in chat automatically.`,
    `- Click the [ Accept Quest ] message (uses /trigger, no cheats needed).`,
    `- Progress shows on your action bar. Complete the objective, then return to the giver.`,
    `- Click [ Turn In Quest ] to claim rewards. Chained quests unlock automatically.`,
    ``,
    `Jobs (passive skills)`,
    `====================`,
    `- Fishing, mining, combat, and other jobs level up automatically from player actions.`,
    `- Open Esc → Advancements → ${ctx.namespace} to see skill trees and levels.`,
    `- Milestone rewards (custom items, XP, etc.) are granted on level-up when configured on the Jobs tab.`,
    `- While working on a job, a personal boss bar at the top shows your level, total XP, and progress to the next level (each player has their own).`,
    `- Job progress is also shown in /function ${ctx.namespace}:debug.`,
    `- Use /function ${ctx.namespace}:reset to clear job XP and levels along with quest progress.`,
    ``,
    `Admin commands`,
    `==============`,
    `- /function ${ctx.namespace}:setup_guide   - list NPC spawn commands`,
    `- /function ${ctx.namespace}:spawn_all     - spawn every NPC at your feet`,
    `- /function ${ctx.namespace}:debug         - check NPCs and your quest state`,
    `- /function ${ctx.namespace}:give_custom_items - give one of each custom item (testing)`,
    ...(ctx.jobs.length > 0
      ? [
          `- /function ${ctx.namespace}:jobs/sync_all - refresh job advancement tabs for everyone online`,
        ]
      : []),
    `- /function ${ctx.namespace}:reset         - reset YOUR quest progress`,
    `- /execute as <player> run function ${ctx.namespace}:reset   - reset one player`,
    `- /function ${ctx.namespace}:reset_all     - reset everyone's quest progress`,
    `  (${STR.resetJobsNote})`,
    ``,
    `Editor project backup`,
    `=====================`,
    `This ZIP also contains ${PROJECT_BACKUP_FILENAME} — your full Quest Tool MC project`,
    `(quests, custom items, spawn zones, etc.). Import it in the app to restore or edit`,
    `your work later. Minecraft ignores this file when loading the datapack.`,
    ``,
    `Note: this pack runs "gamerule send_command_feedback false" on load so the`,
    `[ Accept ]/[ Turn In ] buttons do not spam "Triggered [..]" into chat.`,
    `To restore command feedback, run: gamerule send_command_feedback true`,
    ``,
    `Quests in this pack`,
    `===================`,
  );
  for (const qc of ctx.quests) {
    lines.push(`- ${qc.quest.name} (${qc.quest.type}) - giver: ${qc.quest.npc.name}`);
  }
  if ((project.jobs ?? []).length > 0) {
    lines.push(``, `Jobs in this pack`, `================`);
    for (const jc of ctx.jobs) {
      lines.push(`- ${jc.job.name} (${jc.job.action}) - ${jc.job.xpPerAction} XP per action, max level ${jc.job.maxLevel}`);
    }
  }
  if (project.platform !== 'paper') {
    lines.push(
      ``,
      `Note: Money is tracked on an internal "money" scoreboard and permission`,
      `rewards display a chat message only, since no plugins are available.`,
    );
  } else {
    lines.push(
      ``,
      `Note: Money/permission rewards run eco/lp commands as the player (@s).`,
      `They require an economy plugin + LuckPerms that accept target selectors.`,
      `Money also always updates an internal "money" scoreboard as a fallback.`,
    );
  }
  return lines.join('\n') + '\n';
}

/** Build every file in the datapack as a flat path -> content map. */
export function buildDatapackFiles(project: Project): FileMap {
  const ctx = buildContext(project);
  const ns = ctx.namespace;
  const fnRoot = `data/${ns}/function`;
  const files: FileMap = {};

  files['pack.mcmeta'] = buildPackMeta(`${project.name} - Quest Tool MC (${MINECRAFT_VERSION})`);

  files['data/minecraft/tags/function/load.json'] = JSON.stringify(
    { values: [`${ns}:load`] },
    null,
    2,
  );
  files['data/minecraft/tags/function/tick.json'] = JSON.stringify(
    { values: [`${ns}:tick`] },
    null,
    2,
  );

  files[`${fnRoot}/load.mcfunction`] = buildLoadFunction(ctx);
  files[`${fnRoot}/tick.mcfunction`] = buildTickFunction(ctx);

  for (const qc of ctx.quests) {
    const questFiles = compileQuest(ctx, qc);
    for (const [rel, content] of Object.entries(questFiles)) {
      files[`${fnRoot}/${rel}`] = content;
    }
    files[`${fnRoot}/${qc.spawnFn}.mcfunction`] = spawnFunctionLines(qc).join('\n') + '\n';
    Object.assign(files, buildKillZoneAdvancementFiles(ctx, qc));
    Object.assign(files, buildZoneLootTableFiles(ctx, qc));
  }

  if (ctx.jobs.length > 0) {
    files[`${fnRoot}/jobs/tick.mcfunction`] = buildJobsTickFunction(ctx);
    files[`${fnRoot}/jobs/sync_all.mcfunction`] = buildJobsSyncAllFunction(ctx);
    Object.assign(files, mapJobBossBarFiles(fnRoot, buildJobBossBarSupportFiles(ctx)));
    for (const jc of ctx.jobs) {
      const jobFiles = compileJob(ctx, jc);
      for (const [rel, content] of Object.entries(jobFiles)) {
        files[`${fnRoot}/${rel}`] = content;
      }
      Object.assign(files, buildJobAdvancementFiles(ctx, jc));
    }
  }

  if (needsEmptyLootTable(project.quests)) {
    files[emptyLootTablePath(ns)] =
      JSON.stringify(buildEmptyEntityLootTable(), null, 2) + '\n';
  }

  files[`${fnRoot}/spawn_all.mcfunction`] = spawnAllFunction(ctx);
  files[`${fnRoot}/setup_guide.mcfunction`] = setupGuideFunction(ctx);
  files[`${fnRoot}/debug.mcfunction`] = debugFunction(ctx);
  files[`${fnRoot}/reset.mcfunction`] = buildResetFunction(ctx);
  files[`${fnRoot}/reset_all.mcfunction`] = buildResetAllFunction(ctx);

  const giveCustomItems = buildGiveCustomItemsFunction(project);
  if (giveCustomItems) {
    files[`${fnRoot}/give_custom_items.mcfunction`] = giveCustomItems;
  }

  files['install.txt'] = readmeText(project, ctx);

  return files;
}

/** Plain-text dump of every generated file, for the raw-command preview / copy. */
export function buildRawCommands(project: Project): string {
  const files = buildDatapackFiles(project);
  const order = Object.keys(files).sort();
  const blocks = order.map((path) => {
    return `# ===== ${path} =====\n${files[path].trimEnd()}`;
  });
  return blocks.join('\n\n') + '\n';
}

/** Build the downloadable datapack ZIP as a Blob. */
export async function buildDatapackZip(project: Project): Promise<Blob> {
  const files = buildDatapackFiles(project);
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  zip.file(PROJECT_BACKUP_FILENAME, exportProjectJson(project));
  return zip.generateAsync({ type: 'blob' });
}

/** A safe file name for the downloaded ZIP. */
export function datapackFileName(project: Project): string {
  const base = (project.name || 'quest-pack').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${base || 'quest-pack'}-datapack.zip`;
}
