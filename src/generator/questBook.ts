import type { Project, Quest } from '../types/quest';
import { type CompileContext, type QuestContext, questObjectives } from './context';
import { itemDisplayLabel } from './items';
import { SYS_OBJECTIVE } from './sys';
import { escapeSnbtString, sanitizeMcComment, tellraw } from './text';

/** Max pages a written book can hold. */
export const QUESTLOG_MAX_PAGES = 100;
/** Cover + optional overflow leave this many slots for quest pages. */
export const QUESTLOG_MAX_QUEST_PAGES = QUESTLOG_MAX_PAGES - 2;
/** Minecraft written_book title limit. */
export const QUESTLOG_TITLE_MAX = 32;
/** Practical visible text length per book page block. */
export const QUESTLOG_PAGE_TEXT_MAX = 180;

export const QUESTLOG_TRIGGER = 'qlog';
export const QUESTLOG_CUSTOM_DATA = '{questtool_qlog:1b}';
/** Last baked fingerprint for the held quest log. */
export const QUESTLOG_FP = 'qlog_fp';
/** Scratch fingerprint computed each sync tick. */
export const QUESTLOG_FP_TMP = 'qlog_tmp';
const QUESTLOG_MUL_HOLDER = '#qlog_mul';

export function isQuestLogEnabled(project: Project): boolean {
  return !!project.questLog?.enabled;
}

function storagePages(ns: string): string {
  return `${ns}:questlog`;
}

function storageTmp(ns: string): string {
  return `${ns}:qltmp`;
}

/** Strip characters that break single-quoted SNBT page strings. Keep newlines for page layout. */
function sanitizeBookText(value: string): string {
  return value.replace(/'/g, '');
}

function clampText(value: string, max: number): string {
  const flat = sanitizeBookText(value);
  if (flat.length <= max) return flat;
  return `${flat.slice(0, Math.max(0, max - 1))}…`;
}

function bookTitle(ctx: CompileContext): string {
  const custom = ctx.project.questLog?.title?.trim();
  const raw = custom || ctx.str.questLogTitle;
  return clampText(raw, QUESTLOG_TITLE_MAX);
}

function bookAuthor(ctx: CompileContext): string {
  return clampText(ctx.str.questLogAuthor, QUESTLOG_TITLE_MAX);
}

/** SNBT page entry for written_book_content (1.21.5+): {raw:[{text:...},...]}. */
function pageSnbt(
  parts: Array<{ text: string; color?: string; bold?: boolean; macro?: boolean }>,
): string {
  const comps = parts.map((p) => {
    const text = p.macro ? p.text : escapeSnbtString(clampText(p.text, QUESTLOG_PAGE_TEXT_MAX));
    const fields = [`text:"${text}"`];
    if (p.color) fields.push(`color:"${p.color}"`);
    if (p.bold) fields.push('bold:1b');
    return `{${fields.join(',')}}`;
  });
  return `{raw:[${comps.join(',')}]}`;
}

function appendPageCommand(ns: string, page: string): string {
  return `data modify storage ${storagePages(ns)} pages append value ${page}`;
}

function macroAppendPageCommand(ns: string, page: string): string {
  return `$data modify storage ${storagePages(ns)} pages append value ${page}`;
}

export function questLogClearCommand(): string {
  return `clear @s minecraft:written_book[custom_data=${QUESTLOG_CUSTOM_DATA}]`;
}

export function questLogItemPredicate(): string {
  return `minecraft:written_book[custom_data=${QUESTLOG_CUSTOM_DATA}]`;
}

/**
 * Silent refresh when the player already holds the quest log.
 * Used after state/progress changes (accept, complete, kill credit, etc.).
 */
export function buildQuestLogRefreshIfHeld(ctx: CompileContext): string[] {
  if (!isQuestLogEnabled(ctx.project)) return [];
  const ns = ctx.namespace;
  return [
    `execute if items entity @s container.* ${questLogItemPredicate()} run function ${ns}:questlog/sync`,
  ];
}

/**
 * Give the book if missing (with a short notice), otherwise silently sync.
 * Used on quest accept so players get a log without clicking chat.
 */
export function buildQuestLogEnsure(ctx: CompileContext): string[] {
  if (!isQuestLogEnabled(ctx.project)) return [];
  const ns = ctx.namespace;
  return [
    `execute if items entity @s container.* ${questLogItemPredicate()} run function ${ns}:questlog/sync`,
    `execute unless items entity @s container.* ${questLogItemPredicate()} run function ${ns}:questlog/give_missing`,
  ];
}

/** Chat button to recover a lost quest log (not for refresh). */
export function buildQuestLogOpenButton(ctx: CompileContext): string | null {
  if (!isQuestLogEnabled(ctx.project)) return null;
  return tellraw('@s', [
    {
      text: ctx.str.questLogOpenButton,
      color: 'aqua',
      bold: true,
      runCommand: `trigger ${QUESTLOG_TRIGGER}`,
      hover: ctx.str.questLogOpenHover,
    },
  ]);
}

/** Show the recover button only when the player does not already hold the book. */
export function buildQuestLogOpenButtonIfMissing(ctx: CompileContext): string[] {
  const btn = buildQuestLogOpenButton(ctx);
  if (!btn) return [];
  return [`execute unless items entity @s container.* ${questLogItemPredicate()} run ${btn}`];
}

export function buildQuestLogLoadLines(ctx: CompileContext): string[] {
  if (!isQuestLogEnabled(ctx.project)) return [];
  return [
    `# Quest log book`,
    `scoreboard objectives add ${QUESTLOG_TRIGGER} trigger`,
    `scoreboard objectives add ${QUESTLOG_FP} dummy`,
    `scoreboard objectives add ${QUESTLOG_FP_TMP} dummy`,
    `scoreboard players set ${QUESTLOG_MUL_HOLDER} ${SYS_OBJECTIVE} 31`,
    `data modify storage ${storagePages(ctx.namespace)} pages set value []`,
  ];
}

export function buildQuestLogTickHook(ctx: CompileContext): string[] {
  if (!isQuestLogEnabled(ctx.project)) return [];
  const ns = ctx.namespace;
  return [
    `scoreboard players enable @a ${QUESTLOG_TRIGGER}`,
    `execute as @a[scores={${QUESTLOG_TRIGGER}=1..}] at @s run function ${ns}:questlog/on_trigger`,
    // Keep held books current whenever quest state/progress changes (no chat click).
    `execute as @a if items entity @s container.* ${questLogItemPredicate()} run function ${ns}:questlog/sync`,
  ];
}

function objectiveDesc(qc: QuestContext, j: number): string {
  const o = questObjectives(qc.quest)[j];
  return clampText(o?.description ?? qc.quest.name, QUESTLOG_PAGE_TEXT_MAX);
}

function progressScoreName(qc: QuestContext, quest: Quest, j: number): string | null {
  const score = qc.objectives[j];
  switch (quest.type) {
    case 'kill':
      return score.killed;
    case 'gather':
    case 'delivery':
    case 'daily':
      return score.progress;
    case 'exploration':
      return score.reached;
    case 'talk':
      return null;
  }
}

function progressAmount(quest: Quest, j: number): number {
  if (quest.type === 'talk' || quest.type === 'exploration') return 1;
  const o = questObjectives(quest)[j];
  return Math.max(1, o?.amount ?? 1);
}

function buildStatusPage(qc: QuestContext, status: string, detail: string): string {
  const name = clampText(qc.quest.name, QUESTLOG_PAGE_TEXT_MAX);
  return pageSnbt([
    { text: `${name}\n`, bold: true, color: 'gold' },
    { text: `${status}\n`, color: 'yellow' },
    { text: detail, color: 'gray' },
  ]);
}

function buildActivePageLiteral(
  ctx: CompileContext,
  qc: QuestContext,
  lines: Array<{ text: string; color?: string; bold?: boolean; macro?: boolean }>,
): string {
  const name = clampText(qc.quest.name, QUESTLOG_PAGE_TEXT_MAX);
  const giver = clampText(ctx.str.questLogGiver(qc.quest.npc.name), QUESTLOG_PAGE_TEXT_MAX);
  return pageSnbt([
    { text: `${name}\n`, bold: true, color: 'gold' },
    { text: `${ctx.str.questLogStatusActive}\n`, color: 'yellow' },
    { text: `${giver}\n`, color: 'gray' },
    ...lines,
  ]);
}

function buildCoverPageJson(ctx: CompileContext): string {
  const projectName = clampText(ctx.str.questLogCover(ctx.project.name), QUESTLOG_PAGE_TEXT_MAX);
  const hint = ctx.str.questLogCoverHint.replace(/\\n/g, '\n');
  return pageSnbt([
    { text: `${projectName}\n\n`, bold: true, color: 'gold' },
    { text: `${ctx.str.questLogTitle}\n\n`, color: 'yellow' },
    { text: hint, color: 'gray' },
  ]);
}

function buildOverflowPageJson(ctx: CompileContext, remaining: number): string {
  const text = ctx.str.questLogOverflow(remaining).replace(/\\n/g, '\n');
  return pageSnbt([{ text, color: 'dark_gray' }]);
}

function buildQuestActiveFiles(ctx: CompileContext, qc: QuestContext): Record<string, string> {
  const ns = ctx.namespace;
  const files: Record<string, string> = {};
  const quest = qc.quest;
  const objs = questObjectives(quest);
  const isInstantTalk = quest.type === 'talk' && !quest.targetNpc;

  if (isInstantTalk) {
    const page = buildActivePageLiteral(ctx, qc, [
      { text: ctx.str.questLogObjectivePlain(objectiveDesc(qc, 0)), color: 'black' },
    ]);
    files[`questlog/quest_${qc.index}_active.mcfunction`] =
      [`# Active page (instant talk)`, appendPageCommand(ns, page)].join('\n') + '\n';
    return files;
  }

  const storeLines: string[] = [`# Bake live scores for "${sanitizeMcComment(quest.name)}"`];
  const bodyParts: Array<{ text: string; color?: string; bold?: boolean; macro?: boolean }> = [];
  let macroIndex = 0;
  let needsMacro = false;

  for (let j = 0; j < objs.length; j++) {
    const desc = objectiveDesc(qc, j);
    const scoreName = progressScoreName(qc, quest, j);
    const amount = progressAmount(quest, j);
    const newline = j < objs.length - 1;

    if (scoreName == null) {
      bodyParts.push({
        text: `${ctx.str.questLogObjectivePlain(desc)}${newline ? '\n' : ''}`,
        color: 'black',
      });
      continue;
    }

    const holder = `p${macroIndex}`;
    storeLines.push(
      `execute store result storage ${storageTmp(ns)} ${holder} int 1 run scoreboard players get @s ${scoreName}`,
    );
    // Escape description; keep $(pN) as a literal macro placeholder.
    const safeDesc = escapeSnbtString(clampText(desc, QUESTLOG_PAGE_TEXT_MAX));
    const line = ctx.str
      .questLogObjectiveLine('__DESC__', '__CUR__', amount)
      .replace('__DESC__', safeDesc)
      .replace('__CUR__', `$(${holder})`);
    bodyParts.push({
      text: `${line}${newline ? '\\n' : ''}`,
      color: 'black',
      macro: true,
    });
    macroIndex += 1;
    needsMacro = true;
  }

  if (!needsMacro) {
    const page = buildActivePageLiteral(ctx, qc, bodyParts);
    files[`questlog/quest_${qc.index}_active.mcfunction`] =
      [`# Active page`, appendPageCommand(ns, page)].join('\n') + '\n';
    return files;
  }

  const name = escapeSnbtString(clampText(qc.quest.name, QUESTLOG_PAGE_TEXT_MAX));
  const status = escapeSnbtString(ctx.str.questLogStatusActive);
  const giver = escapeSnbtString(
    clampText(ctx.str.questLogGiver(qc.quest.npc.name), QUESTLOG_PAGE_TEXT_MAX),
  );
  const normalizedBody = bodyParts.map((p) => {
    if (p.macro) return p;
    return {
      ...p,
      text: escapeSnbtString(p.text).replace(/\n/g, '\\n'),
      macro: true as const,
    };
  });
  const pageSnbtValue = pageSnbt([
    { text: `${name}\\n`, bold: true, color: 'gold', macro: true },
    { text: `${status}\\n`, color: 'yellow', macro: true },
    { text: `${giver}\\n`, color: 'gray', macro: true },
    ...normalizedBody,
  ]);

  storeLines.push(
    `function ${ns}:questlog/quest_${qc.index}_active_page with storage ${storageTmp(ns)}`,
  );
  files[`questlog/quest_${qc.index}_active.mcfunction`] = storeLines.join('\n') + '\n';
  files[`questlog/quest_${qc.index}_active_page.mcfunction`] =
    [`# Macro page append`, macroAppendPageCommand(ns, pageSnbtValue)].join('\n') + '\n';

  return files;
}

function buildQuestBranchFunction(ctx: CompileContext, qc: QuestContext): string {
  const ns = ctx.namespace;
  const STR = ctx.str;
  const giverName = qc.quest.npc.name;
  const available = buildStatusPage(qc, STR.questLogStatusAvailable, STR.questLogSeeNpc(giverName));
  const ready = buildStatusPage(qc, STR.questLogStatusReady, STR.questLogReturnToNpc(giverName));
  const completed = buildStatusPage(qc, STR.questLogStatusCompleted, '');
  const locked = buildStatusPage(qc, STR.questLogStatusLocked, '');

  return (
    [
      `# Quest log page: ${sanitizeMcComment(qc.quest.name)}`,
      `execute if score @s ${qc.state} matches 1 run function ${ns}:questlog/quest_${qc.index}_active`,
      `execute if score @s ${qc.state} matches 0 run ${appendPageCommand(ns, available)}`,
      `execute if score @s ${qc.state} matches 2 run ${appendPageCommand(ns, ready)}`,
      `execute if score @s ${qc.state} matches 3..4 run ${appendPageCommand(ns, completed)}`,
      `execute if score @s ${qc.state} matches -1 run ${appendPageCommand(ns, locked)}`,
    ].join('\n') + '\n'
  );
}

function fingerprintScores(qc: QuestContext): string[] {
  const scores = [qc.state];
  const isInstantTalk = qc.quest.type === 'talk' && !qc.quest.targetNpc;
  if (isInstantTalk) return scores;
  for (let j = 0; j < qc.objectives.length; j++) {
    const score = qc.objectives[j];
    switch (qc.quest.type) {
      case 'kill':
        scores.push(score.killed);
        break;
      case 'gather':
      case 'delivery':
      case 'daily':
        scores.push(score.progress);
        break;
      case 'exploration':
        scores.push(score.reached);
        break;
      case 'talk':
        break;
    }
  }
  return scores;
}

function buildComputeFingerprintFunction(ctx: CompileContext): string {
  const lines: string[] = [
    `# Hash quest states + progress into ${QUESTLOG_FP_TMP}`,
    `scoreboard players set @s ${QUESTLOG_FP_TMP} 0`,
  ];
  for (const qc of ctx.quests) {
    for (const score of fingerprintScores(qc)) {
      lines.push(`scoreboard players add @s ${score} 0`);
      lines.push(
        `scoreboard players operation @s ${QUESTLOG_FP_TMP} *= ${QUESTLOG_MUL_HOLDER} ${SYS_OBJECTIVE}`,
      );
      lines.push(`scoreboard players operation @s ${QUESTLOG_FP_TMP} += @s ${score}`);
    }
  }
  return lines.join('\n') + '\n';
}

function buildAssembleFunction(ctx: CompileContext): string {
  const ns = ctx.namespace;
  const cover = buildCoverPageJson(ctx);
  const included = ctx.quests.slice(0, QUESTLOG_MAX_QUEST_PAGES);
  const remaining = Math.max(0, ctx.quests.length - included.length);

  const lines: string[] = [
    `# Assemble quest log pages into storage (no give)`,
    `data modify storage ${storagePages(ns)} pages set value [${cover}]`,
  ];
  for (const qc of included) {
    lines.push(`function ${ns}:questlog/quest_${qc.index}`);
  }
  if (remaining > 0) {
    lines.push(appendPageCommand(ns, buildOverflowPageJson(ctx, remaining)));
  }
  return lines.join('\n') + '\n';
}

function buildGiveMacroFunction(ctx: CompileContext): string {
  const title = escapeSnbtString(bookTitle(ctx));
  const author = escapeSnbtString(bookAuthor(ctx));
  return (
    [
      `# Give quest log book (macro — pages from storage; silent)`,
      questLogClearCommand(),
      `$give @s minecraft:written_book[custom_data=${QUESTLOG_CUSTOM_DATA},written_book_content={title:"${title}",author:"${author}",resolved:1b,pages:$(pages)}] 1`,
    ].join('\n') + '\n'
  );
}

function buildRebuildFunction(ctx: CompileContext): string {
  const ns = ctx.namespace;
  return (
    [
      `# Rebuild quest log book for @s (silent)`,
      `function ${ns}:questlog/assemble`,
      `function ${ns}:questlog/give with storage ${storagePages(ns)}`,
      `function ${ns}:questlog/compute_fp`,
      `scoreboard players operation @s ${QUESTLOG_FP} = @s ${QUESTLOG_FP_TMP}`,
    ].join('\n') + '\n'
  );
}

function buildSyncFunction(ctx: CompileContext): string {
  const ns = ctx.namespace;
  return (
    [
      `# Silently rebuild held book when quest state/progress changed`,
      `function ${ns}:questlog/compute_fp`,
      `execute if score @s ${QUESTLOG_FP_TMP} = @s ${QUESTLOG_FP} run return 0`,
      `function ${ns}:questlog/rebuild`,
    ].join('\n') + '\n'
  );
}

function buildGiveMissingFunction(ctx: CompileContext): string {
  const ns = ctx.namespace;
  return (
    [
      `# First-time / recovered quest log`,
      `function ${ns}:questlog/rebuild`,
      tellraw('@s', [{ text: ctx.str.questLogUpdated, color: 'green' }]),
    ].join('\n') + '\n'
  );
}

function buildOnTriggerFunction(ctx: CompileContext): string {
  const ns = ctx.namespace;
  return (
    [
      `# Player requested quest log (recover / admin trigger)`,
      `scoreboard players set @s ${QUESTLOG_TRIGGER} 0`,
      `function ${ns}:questlog/give_missing`,
    ].join('\n') + '\n'
  );
}

function buildGiveQuestlogFunction(ctx: CompileContext): string {
  const ns = ctx.namespace;
  return (
    [
      `# Admin / player entry: give or refresh quest log`,
      `function ${ns}:questlog/give_missing`,
    ].join('\n') + '\n'
  );
}

/** All quest-log mcfunction files (empty when disabled). */
export function buildQuestLogFiles(ctx: CompileContext): Record<string, string> {
  if (!isQuestLogEnabled(ctx.project)) return {};

  const files: Record<string, string> = {
    'give_questlog.mcfunction': buildGiveQuestlogFunction(ctx),
    'questlog/assemble.mcfunction': buildAssembleFunction(ctx),
    'questlog/compute_fp.mcfunction': buildComputeFingerprintFunction(ctx),
    'questlog/rebuild.mcfunction': buildRebuildFunction(ctx),
    'questlog/sync.mcfunction': buildSyncFunction(ctx),
    'questlog/give.mcfunction': buildGiveMacroFunction(ctx),
    'questlog/give_missing.mcfunction': buildGiveMissingFunction(ctx),
    'questlog/on_trigger.mcfunction': buildOnTriggerFunction(ctx),
  };

  for (const qc of ctx.quests.slice(0, QUESTLOG_MAX_QUEST_PAGES)) {
    files[`questlog/quest_${qc.index}.mcfunction`] = buildQuestBranchFunction(ctx, qc);
    Object.assign(files, buildQuestActiveFiles(ctx, qc));
  }

  return files;
}

/** Exported for tests — cover page always present in rebuild. */
export function buildQuestLogCoverPageForTest(ctx: CompileContext): string {
  return buildCoverPageJson(ctx);
}

/** Exported for tests — overflow page text. */
export function buildQuestLogOverflowPageForTest(ctx: CompileContext, remaining: number): string {
  return buildOverflowPageJson(ctx, remaining);
}

/** Label helper kept for tests / future UI. */
export function questLogObjectiveLabel(ctx: CompileContext, qc: QuestContext, j: number): string {
  const o = questObjectives(qc.quest)[j];
  if (!o) return qc.quest.name;
  if (qc.quest.type === 'kill' || qc.quest.type === 'gather' || qc.quest.type === 'delivery') {
    return o.description ?? itemDisplayLabel(ctx.project, o);
  }
  return o.description ?? qc.quest.name;
}
