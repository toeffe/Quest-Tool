import JSZip from 'jszip';
import i18n from '../i18n';
import { exportProjectJson, PROJECT_BACKUP_FILENAME } from '../state/projectStore';
import type { Project } from '../types/quest';
import { compileContainers } from './containers';
import { buildContext, type CompileContext, questObjectives } from './context';
import { buildCustomMobBossBarSupportFiles } from './customMobBossBar';
import { buildCustomMobPhaseSupportFiles } from './customMobPhases';
import {
  buildCustomMobLootTableFiles,
  buildGiveCustomMobsFunction,
  buildSpawnMobFunctions,
} from './customMobs';
import { compileDimensions, dimensionResourceId } from './dimensions';
import { compileDungeons } from './dungeons';
import { buildGiveCustomItemsFunction } from './items';
import { buildJobAdvancementFiles } from './jobAdvancements';
import { buildJobBossBarSupportFiles } from './jobBossBar';
import {
  buildJobDebugLines,
  buildJobsSyncAllFunction,
  buildJobsTickFunction,
  compileJob,
} from './jobFunctions';
import {
  buildLoadFunction,
  buildResetAllFunction,
  buildResetFunction,
  buildTickFunction,
} from './load';
import { buildEmptyEntityLootTable, emptyLootTablePath, needsEmptyLootTable } from './lootTables';
import { buildMobVariantFiles, projectHasSkinTextures } from './mobSkins';
import { spawnFunctionLines } from './npc';
import { buildPackMeta, MINECRAFT_VERSION } from './packFormat';
import { compilePads } from './pads';
import { installGuide } from './platform';
import {
  buildKillZoneAdvancementFiles,
  buildZoneLootTableFiles,
  compileQuest,
} from './questFunctions';
import {
  buildQuestLogFiles,
  isQuestLogEnabled,
} from './questBook';
import { buildResourcePackFiles } from './resourcePack';
import { escapeSnbtString, tellraw } from './text';

/** A flat map of file paths (inside the ZIP) to their text contents. */
export type FileMap = Record<string, string>;

/** Export ZIP may include binary PNG textures. */
export type ExportFileMap = Record<string, string | Uint8Array>;

function mapJobBossBarFiles(fnRoot: string, relFiles: Record<string, string>): FileMap {
  const out: FileMap = {};
  for (const [rel, content] of Object.entries(relFiles)) {
    out[`${fnRoot}/${rel}`] = content;
  }
  return out;
}

function setupGuideFunction(ctx: CompileContext): string {
  const STR = ctx.str;
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
  const dimensions = ctx.project.dimensions ?? [];
  if (dimensions.length > 0) {
    lines.push(
      tellraw('@s', [{ text: 'Custom dimensions', color: 'gold', bold: true }]),
      tellraw('@s', [
        {
          text: 'Restart the world after installing this pack (not just /reload).',
          color: 'yellow',
        },
      ]),
    );
    for (const dim of dimensions) {
      const id = dimensionResourceId(ctx, dim);
      lines.push(
        tellraw('@s', [
          { text: `${dim.name} (${id}): `, color: 'yellow' },
          {
            text: `/execute in ${id} run tp @s 0 64 0`,
            color: 'aqua',
            suggestCommand: `/execute in ${id} run tp @s 0 64 0`,
          },
        ]),
      );
    }
    lines.push(
      tellraw('@s', [
        {
          text: 'Build a small platform in void dimensions before testing dungeons or pads.',
          color: 'gray',
        },
      ]),
    );
  }
  const containers = ctx.project.containers ?? [];
  if (containers.length > 0) {
    lines.push(
      tellraw('@s', [{ text: 'World containers', color: 'gold', bold: true }]),
      tellraw('@s', [
        {
          text: 'Place and fill every configured chest/barrel at its coordinates:',
          color: 'white',
        },
      ]),
      tellraw('@s', [
        {
          text: `  > /function ${ctx.namespace}:containers/place_all`,
          color: 'aqua',
          suggestCommand: `/function ${ctx.namespace}:containers/place_all`,
          hover: STR.setupCommandHover,
        },
      ]),
      tellraw('@s', [
        {
          text: `Force refill without replacing blocks: /function ${ctx.namespace}:containers/refill_all`,
          color: 'gray',
        },
      ]),
    );
    for (const c of containers) {
      const { x, y, z } = c.location;
      lines.push(
        tellraw('@s', [
          { text: `${c.name}: `, color: 'yellow' },
          { text: `${c.blockType} @ ${x} ${y} ${z}`, color: 'white' },
        ]),
      );
    }
  }
  if (isQuestLogEnabled(ctx.project)) {
    lines.push(
      tellraw('@s', [{ text: 'Quest log', color: 'gold', bold: true }]),
      tellraw('@s', [
        {
          text: 'Give or refresh the quest log book:',
          color: 'white',
        },
      ]),
      tellraw('@s', [
        {
          text: `  > /function ${ctx.namespace}:give_questlog`,
          color: 'aqua',
          suggestCommand: `/function ${ctx.namespace}:give_questlog`,
          hover: STR.setupCommandHover,
        },
      ]),
    );
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
  if ((ctx.project.containers ?? []).length > 0) {
    lines.push(`function ${ctx.namespace}:containers/place_all`);
  }
  return lines.join('\n') + '\n';
}

function debugFunction(ctx: CompileContext): string {
  const STR = ctx.str;
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
  const STR = ctx.str;
  const t = i18n.getFixedT(ctx.locale, 'datapack');
  const ns = ctx.namespace;
  const guide = installGuide(project.platform, ns, ctx.locale);
  const section = (title: string) => [`${title}`, `${'='.repeat(title.length)}`];

  const lines: string[] = [
    t('readme.header', { projectName: project.name }),
    t('readme.generatedFor', { version: MINECRAFT_VERSION }),
    ``,
    guide.title,
    `${'='.repeat(guide.title.length)}`,
  ];
  for (let i = 0; i < guide.steps.length; i++) {
    lines.push(`${i + 1}. ${guide.steps[i]}`);
  }
  lines.push(
    ``,
    ...section(t('readme.playingTitle')),
    t('readme.playingStep1'),
    t('readme.playingStep2'),
    t('readme.playingStep3'),
    t('readme.playingStep4'),
    ``,
    ...section(t('readme.jobsTitle')),
    t('readme.jobsStep1'),
    t('readme.jobsStep2', { namespace: ns }),
    t('readme.jobsStep3'),
    t('readme.jobsStep4'),
    t('readme.jobsStep5', { namespace: ns }),
    t('readme.jobsStep6', { namespace: ns }),
    ``,
    ...section(t('readme.adminTitle')),
    t('readme.adminSetupGuide', { namespace: ns }),
    t('readme.adminSpawnAll', { namespace: ns }),
    t('readme.adminDebug', { namespace: ns }),
    t('readme.adminGiveItems', { namespace: ns }),
    ...(project.customMobs?.length ? [t('readme.adminGiveMobs', { namespace: ns })] : []),
    ...(isQuestLogEnabled(project) ? [t('readme.adminGiveQuestlog', { namespace: ns })] : []),
    ...(ctx.jobs.length > 0 ? [t('readme.adminJobsSync', { namespace: ns })] : []),
    t('readme.adminReset', { namespace: ns }),
    t('readme.adminResetPlayer', { namespace: ns }),
    t('readme.adminResetAll', { namespace: ns }),
    `  (${STR.resetJobsNote})`,
    ``,
    ...section(t('readme.backupTitle')),
    t('readme.backupLine1', { filename: PROJECT_BACKUP_FILENAME }),
    t('readme.backupLine2'),
    t('readme.backupLine3'),
    ``,
    t('readme.feedbackNote1'),
    t('readme.feedbackNote2'),
    t('readme.feedbackNote3'),
    ``,
    ...section(t('readme.questsTitle')),
  );
  for (const qc of ctx.quests) {
    lines.push(
      t('readme.questLine', {
        name: qc.quest.name,
        type: qc.quest.type,
        giver: qc.quest.npc.name,
      }),
    );
  }
  if ((project.jobs ?? []).length > 0) {
    lines.push(``, ...section(t('readme.jobsListTitle')));
    for (const jc of ctx.jobs) {
      lines.push(
        t('readme.jobLine', {
          name: jc.job.name,
          action: jc.job.action,
          xp: jc.job.xpPerAction,
          maxLevel: jc.job.maxLevel,
        }),
      );
    }
  }
  const dimensions = project.dimensions ?? [];
  if (dimensions.length > 0) {
    lines.push(
      ``,
      ...section(t('readme.dimensionsTitle')),
      t('readme.dimensionsStep1'),
      t('readme.dimensionsStep2'),
      t('readme.dimensionsStep3'),
    );
    for (const dim of dimensions) {
      const id = dimensionResourceId(ctx, dim);
      lines.push(t('readme.dimensionLine', { name: dim.name, id }));
    }
  }
  if (projectHasSkinTextures(project)) {
    lines.push(
      ``,
      ...section(t('readme.skinsTitle')),
      t('readme.skinsStep1'),
      t('readme.skinsStep2'),
      t('readme.skinsStep3'),
      t('readme.skinsStep4'),
      t('readme.skinsStep5'),
      t('readme.skinsStep6'),
      t('readme.skinsStep7'),
      t('readme.skinsStep8'),
      t('readme.skinsStep9'),
    );
  }
  if (project.platform !== 'paper') {
    lines.push(``, t('readme.platformVanillaNote1'), t('readme.platformVanillaNote2'));
  } else {
    lines.push(
      ``,
      t('readme.platformPaperNote1'),
      t('readme.platformPaperNote2'),
      t('readme.platformPaperNote3'),
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
    files[`${fnRoot}/${qc.spawnFn}.mcfunction`] =
      spawnFunctionLines(ctx, qc, ctx.str).join('\n') + '\n';
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
    files[emptyLootTablePath(ns)] = JSON.stringify(buildEmptyEntityLootTable(), null, 2) + '\n';
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

  Object.assign(files, buildCustomMobLootTableFiles(project, ns));

  const giveCustomMobs = buildGiveCustomMobsFunction(project, ns);
  if (giveCustomMobs) {
    files[`${fnRoot}/give_custom_mobs.mcfunction`] = giveCustomMobs;
  }

  Object.assign(files, mapJobBossBarFiles(fnRoot, buildSpawnMobFunctions(project, ns)));
  Object.assign(files, mapJobBossBarFiles(fnRoot, buildCustomMobBossBarSupportFiles(ctx)));
  Object.assign(files, mapJobBossBarFiles(fnRoot, buildCustomMobPhaseSupportFiles(ctx)));

  Object.assign(files, compileDimensions(ctx));
  Object.assign(files, compilePads(ctx));
  Object.assign(files, compileContainers(ctx));
  Object.assign(files, compileDungeons(ctx));

  const questLogFiles = buildQuestLogFiles(ctx);
  for (const [rel, content] of Object.entries(questLogFiles)) {
    files[`${fnRoot}/${rel}`] = content;
  }

  Object.assign(files, buildMobVariantFiles(project, ns));

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
  return buildDatapackZipFromFiles(project, buildDatapackFiles(project));
}

/** Build the downloadable resource pack ZIP as a Blob (empty when no skins). */
export async function buildResourcePackZip(project: Project): Promise<Blob> {
  const files = buildResourcePackFiles(project);
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  return zip.generateAsync({ type: 'blob' });
}

/** Build a ZIP from a pre-built file map (used by the test datapack export). */
export async function buildDatapackZipFromFiles(
  project: Project,
  files: ExportFileMap,
): Promise<Blob> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  zip.file(PROJECT_BACKUP_FILENAME, exportProjectJson(project));
  return zip.generateAsync({ type: 'blob' });
}

function exportZipBaseName(project: Project): string {
  const base = (project.name || 'quest-pack').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return base || 'quest-pack';
}

/** A safe file name for the downloaded datapack ZIP. */
export function datapackFileName(project: Project): string {
  return `${exportZipBaseName(project)}-datapack.zip`;
}

/** A safe file name for the downloaded resource pack ZIP. */
export function resourcePackFileName(project: Project): string {
  return `${exportZipBaseName(project)}-resourcepack.zip`;
}
