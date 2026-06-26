import { jobIsDistance } from '../types/job';
import { type CompileContext, type JobContext } from './context';
import { totalXpForLevel } from '../types/job';
import { SYS_OBJECTIVE } from './sys';
import {
  buildJobRevokeAdvancementLines,
  buildJobSyncAdvancementLines,
} from './jobAdvancements';
import { jobMilestoneRewardCommands, milestoneAnnouncement } from './jobMilestones';
import { buildUpdateProgressBarLines, buildJobProgressBarMacro } from './jobBossBar';
import { escapeSnbtString, tellraw } from './text';
import { STR } from './strings';

const SYS = SYS_OBJECTIVE;

function constName(jc: JobContext, suffix: string): string {
  return `${jc.constPrefix}_${suffix}`;
}

/** Lines to register job scoreboard objectives and constants in load.mcfunction. */
export function buildJobLoadLines(_ctx: CompileContext, jc: JobContext): string[] {
  const { job } = jc;
  const lines: string[] = [];
  for (let i = 0; i < jc.statObjectives.length; i++) {
    lines.push(
      `scoreboard objectives add ${jc.statObjectives[i]} ${jc.statCriteria[i]}`,
    );
  }
  if (jc.multiStat) {
    lines.push(`scoreboard objectives add ${jc.stat} dummy`);
  }
  lines.push(
    `scoreboard objectives add ${jc.xp} dummy`,
    `scoreboard objectives add ${jc.level} dummy`,
    `scoreboard objectives add ${jc.last} dummy`,
    `scoreboard objectives add ${jc.init} dummy`,
    `scoreboard players set ${constName(jc, 'xp_per_action')} ${SYS} ${Math.max(1, job.xpPerAction)}`,
    `scoreboard players set ${constName(jc, 'xp_per_level')} ${SYS} ${Math.max(1, job.xpPerLevel)}`,
    `scoreboard players set ${constName(jc, 'max_level')} ${SYS} ${Math.max(1, job.maxLevel)}`,
    `scoreboard players set ${constName(jc, 'next_thresh')} ${SYS} 0`,
  );
  if (jobIsDistance(job.action)) {
    const unit = Math.max(1, job.distanceUnit ?? 1000);
    lines.push(`scoreboard players set ${constName(jc, 'distance_unit')} ${SYS} ${unit}`);
  }
  for (let lvl = 1; lvl <= job.maxLevel; lvl++) {
    lines.push(
      `scoreboard players set ${constName(jc, `thresh_${lvl}`)} ${SYS} ${totalXpForLevel(job, lvl)}`,
    );
  }
  return lines;
}

/** Lines to reset job progress for the executing player. */
export function buildJobResetLines(ctx: CompileContext, jc: JobContext): string[] {
  return [
    ...buildJobRevokeAdvancementLines(ctx, jc),
    `scoreboard players set @s ${jc.xp} 0`,
    `scoreboard players set @s ${jc.level} 0`,
    `scoreboard players set @s ${jc.last} 0`,
    `scoreboard players set @s ${jc.init} 0`,
  ];
}

function buildSumStatLines(jc: JobContext): string[] {
  const lines = [
    `# ${jc.job.name} - sum stat objectives into ${jc.stat}`,
    `scoreboard players set ${jc.sumHolder} ${SYS} 0`,
  ];
  for (const obj of jc.statObjectives) {
    lines.push(`scoreboard players operation ${jc.sumHolder} ${SYS} += @s ${obj}`);
  }
  lines.push(`scoreboard players operation @s ${jc.stat} = ${jc.sumHolder} ${SYS}`);
  return lines;
}

function buildUpdateStatTickLines(jc: JobContext, ns: string): string[] {
  if (jc.multiStat) {
    const lines = jc.statObjectives.map(
      (obj) =>
        `execute as @a store result score @s ${obj} run scoreboard players get @s ${obj}`,
    );
    lines.push(`execute as @a run function ${ns}:${jc.fnBase}/sum_stat`);
    return lines;
  }
  return [
    `execute as @a store result score @s ${jc.stat} run scoreboard players get @s ${jc.stat}`,
  ];
}

function buildInitStatLines(jc: JobContext, ns: string): string[] {
  if (jc.multiStat) {
    return [
      ...jc.statObjectives.map(
        (obj) =>
          `execute store result score @s ${obj} run scoreboard players get @s ${obj}`,
      ),
      `function ${ns}:${jc.fnBase}/sum_stat`,
      `scoreboard players operation @s ${jc.last} = @s ${jc.stat}`,
    ];
  }
  return [
    `execute store result score @s ${jc.stat} run scoreboard players get @s ${jc.stat}`,
    `scoreboard players operation @s ${jc.last} = @s ${jc.stat}`,
  ];
}

function buildCreditDeltaLines(jc: JobContext): string[] {
  const lines = [
    `scoreboard players operation ${jc.grantHolder} ${SYS} = @s ${jc.stat}`,
    `scoreboard players operation ${jc.grantHolder} ${SYS} -= @s ${jc.last}`,
  ];
  if (jobIsDistance(jc.job.action)) {
    const distUnit = constName(jc, 'distance_unit');
    lines.push(`scoreboard players operation ${jc.grantHolder} ${SYS} /= ${distUnit} ${SYS}`);
  }
  return lines;
}

function buildMilestoneFiles(ctx: CompileContext, jc: JobContext): Record<string, string> {
  const ns = ctx.namespace;
  const files: Record<string, string> = {};
  const milestones = (jc.job.milestones ?? []).filter(
    (m) => m.rewards.length > 0 && m.level >= 1 && m.level <= jc.job.maxLevel,
  );

  const rewardLines: string[] = [`# ${jc.job.name} - milestone rewards`];
  for (const m of milestones) {
    rewardLines.push(
      `execute if score @s ${jc.level} matches ${m.level} run function ${ns}:${jc.fnBase}/grant_milestone_${m.level}`,
    );
  }
  files[`${jc.fnBase}/milestone_rewards.mcfunction`] = rewardLines.join('\n') + '\n';

  for (const m of milestones) {
    const grant: string[] = [
      `# ${jc.job.name} - milestone level ${m.level}`,
      milestoneAnnouncement(jc.job.name, m.level),
      ...jobMilestoneRewardCommands(ctx, m.rewards),
    ];
    files[`${jc.fnBase}/grant_milestone_${m.level}.mcfunction`] = grant.join('\n') + '\n';
  }

  return files;
}

/** Build all mcfunction files for one job. */
export function compileJob(ctx: CompileContext, jc: JobContext): Record<string, string> {
  const ns = ctx.namespace;
  const { job } = jc;
  const files: Record<string, string> = {};
  const maxLvl = constName(jc, 'max_level');
  const xpPerLevel = constName(jc, 'xp_per_level');
  const xpPerAction = constName(jc, 'xp_per_action');
  const nextThresh = constName(jc, 'next_thresh');
  const hasMilestones = (job.milestones ?? []).some((m) => m.rewards.length > 0);

  if (jc.multiStat) {
    files[`${jc.fnBase}/sum_stat.mcfunction`] = buildSumStatLines(jc).join('\n') + '\n';
  }

  files[`${jc.fnBase}/init.mcfunction`] =
    [
      `# ${job.name} - sync stat baseline (no retroactive XP)`,
      ...buildInitStatLines(jc, ns),
      `scoreboard players set @s ${jc.init} 1`,
      `function ${ns}:${jc.fnBase}/sync_advancements`,
    ].join('\n') + '\n';

  const tickLines = [
    `# ${job.name} - tick`,
    ...buildUpdateStatTickLines(jc, ns),
    `execute as @a unless score @s ${jc.init} matches 1 run function ${ns}:${jc.fnBase}/init`,
    `execute as @a if score @s ${jc.stat} > @s ${jc.last} run function ${ns}:${jc.fnBase}/credit`,
  ];
  files[`${jc.fnBase}/tick.mcfunction`] = tickLines.join('\n') + '\n';

  const credit: string[] = [
    `# ${job.name} - grant XP for new actions`,
    ...buildCreditDeltaLines(jc),
    `scoreboard players operation ${jc.grantHolder} ${SYS} *= ${xpPerAction} ${SYS}`,
    `scoreboard players operation @s ${jc.xp} += ${jc.grantHolder} ${SYS}`,
    `scoreboard players operation @s ${jc.last} = @s ${jc.stat}`,
  ];
  if (job.showActionBar) {
    credit.push(
      `title @s actionbar ["",` +
        `{"text":"${escapeSnbtString(STR.jobXpGained(job.name))}","color":"aqua"},` +
        `{"text":" +","color":"gray"},` +
        `{"score":{"name":"${jc.grantHolder}","objective":"${SYS}"},"color":"gold"},` +
        `{"text":" XP","color":"gray"}]`,
    );
  }
  credit.push(`function ${ns}:${jc.fnBase}/check_level`);
  if (job.showProgressBar !== false) {
    credit.push(`function ${ns}:${jc.fnBase}/update_progress_bar`);
  }
  files[`${jc.fnBase}/credit.mcfunction`] = credit.join('\n') + '\n';

  files[`${jc.fnBase}/sync_advancements.mcfunction`] =
    buildJobSyncAdvancementLines(ctx, jc).join('\n') + '\n';

  const checkLevel: string[] = [
    `# ${job.name} - level up while XP meets next threshold`,
    `execute if score @s ${jc.level} < ${maxLvl} ${SYS} run scoreboard players operation ${nextThresh} ${SYS} = @s ${jc.level}`,
    `execute if score @s ${jc.level} < ${maxLvl} ${SYS} run scoreboard players add ${nextThresh} ${SYS} 1`,
    `execute if score @s ${jc.level} < ${maxLvl} ${SYS} run scoreboard players operation ${nextThresh} ${SYS} *= ${xpPerLevel} ${SYS}`,
    `execute if score @s ${jc.level} < ${maxLvl} ${SYS} if score @s ${jc.xp} >= ${nextThresh} ${SYS} run function ${ns}:${jc.fnBase}/level_up`,
  ];
  files[`${jc.fnBase}/check_level.mcfunction`] = checkLevel.join('\n') + '\n';

  const levelUp: string[] = [
    `# ${job.name} - level up`,
    `scoreboard players add @s ${jc.level} 1`,
    `tellraw @s ["",` +
      `{"text":"${escapeSnbtString(STR.jobLevelUpPrefix)}","color":"gold"},` +
      `{"text":"${escapeSnbtString(job.name)}","color":"aqua","bold":true},` +
      `{"text":"${escapeSnbtString(STR.jobLevelUpSuffix)}","color":"gold"},` +
      `{"score":{"name":"@s","objective":"${jc.level}"},"color":"yellow","bold":true},` +
      `{"text":"!","color":"gold"}]`,
  ];
  if (hasMilestones) {
    levelUp.push(`function ${ns}:${jc.fnBase}/milestone_rewards`);
  }
  levelUp.push(
    `function ${ns}:${jc.fnBase}/sync_advancements`,
    `function ${ns}:${jc.fnBase}/check_level`,
  );
  if (job.showProgressBar !== false) {
    levelUp.push(`function ${ns}:${jc.fnBase}/update_progress_bar`);
  }
  files[`${jc.fnBase}/level_up.mcfunction`] = levelUp.join('\n') + '\n';

  if (job.showProgressBar !== false) {
    files[`${jc.fnBase}/update_progress_bar.mcfunction`] =
      buildUpdateProgressBarLines(ctx, jc).join('\n') + '\n';
    files[`${jc.fnBase}/prog_bar.mcfunction`] = buildJobProgressBarMacro(ctx, jc);
  }

  files[`${jc.fnBase}/add_xp.mcfunction`] =
    [
      `# ${job.name} - add bonus XP from quest reward`,
      `scoreboard players operation @s ${jc.xp} += ${jc.grantHolder} ${SYS}`,
      `function ${ns}:${jc.fnBase}/check_level`,
      `function ${ns}:${jc.fnBase}/sync_advancements`,
      ...(job.showProgressBar !== false
        ? [`function ${ns}:${jc.fnBase}/update_progress_bar`]
        : []),
    ].join('\n') + '\n';

  Object.assign(files, buildMilestoneFiles(ctx, jc));

  return files;
}

/** Top-level jobs/tick dispatcher. */
export function buildJobsTickFunction(ctx: CompileContext): string {
  const lines = [`# Quest Tool MC - jobs tick`];
  for (const jc of ctx.jobs) {
    lines.push(`function ${ctx.namespace}:${jc.fnBase}/tick`);
  }
  return lines.join('\n') + '\n';
}

/** Admin helper: re-grant job advancements for all online players. */
export function buildJobsSyncAllFunction(ctx: CompileContext): string {
  const lines = [`# Quest Tool MC - sync job advancements for all players`];
  for (const jc of ctx.jobs) {
    lines.push(`execute as @a run function ${ctx.namespace}:${jc.fnBase}/sync_advancements`);
  }
  return lines.join('\n') + '\n';
}

/** Debug lines for job levels (appended to debug.mcfunction). */
export function buildJobDebugLines(ctx: CompileContext): string[] {
  const lines: string[] = [
    tellraw('@s', [{ text: STR.debugJobsTitle, color: 'gold', bold: true }]),
  ];
  for (const jc of ctx.jobs) {
    lines.push(
      `tellraw @s ["",` +
        `{"text":"  ${escapeSnbtString(jc.job.name)}: ","color":"yellow"},` +
        `{"text":"Lv ","color":"gray"},` +
        `{"score":{"name":"@s","objective":"${jc.level}"},"color":"white"},` +
        `{"text":" (","color":"gray"},` +
        `{"score":{"name":"@s","objective":"${jc.xp}"},"color":"white"},` +
        `{"text":" XP)","color":"gray"}]`,
    );
  }
  return lines;
}
