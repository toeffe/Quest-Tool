import { type CompileContext, type JobContext } from './context';
import { SYS_OBJECTIVE } from './sys';
import { escapeSnbtString } from './text';

const SYS = SYS_OBJECTIVE;

/** Scoreboard slot id — each online player gets a unique 1..N boss bar. */
export const QT_PID_OBJECTIVE = 'qt_pid';

/** Pre-allocated per-player boss bar slots (supports up to this many concurrent players). */
export const MAX_PLAYER_PROGRESS_BARS = 64;

export function bossBarStorageId(ctx: CompileContext): string {
  return `${ctx.namespace}:bb`;
}

/** Boss bar id for player slot 1..MAX_PLAYER_PROGRESS_BARS. */
export function playerBossBarId(ctx: CompileContext, slot: number): string {
  return `${ctx.namespace}:job_prog_${slot}`;
}

export function jobsUseProgressBar(ctx: CompileContext): boolean {
  return ctx.jobs.some((jc) => jc.job.showProgressBar !== false);
}

/** One-time boss bar setup in load.mcfunction. */
export function buildJobBossBarSetupLines(ctx: CompileContext): string[] {
  if (!jobsUseProgressBar(ctx)) return [];
  const lines: string[] = [
    `scoreboard objectives add ${QT_PID_OBJECTIVE} dummy`,
    `scoreboard players set #qt_bb_scale ${SYS} 1000`,
    `scoreboard players set #qt_next_pid ${SYS} 1`,
  ];
  for (let slot = 1; slot <= MAX_PLAYER_PROGRESS_BARS; slot++) {
    const id = playerBossBarId(ctx, slot);
    lines.push(
      `bossbar add ${id} {"text":"Job"}`,
      `bossbar set ${id} max 1000`,
      `bossbar set ${id} color green`,
      `bossbar set ${id} style notched_10`,
      `bossbar set ${id} visible false`,
    );
  }
  return lines;
}

/** Shared mcfunctions for per-player boss bar slots (macros). */
export function buildJobBossBarSupportFiles(ctx: CompileContext): Record<string, string> {
  if (!jobsUseProgressBar(ctx)) return {};
  const ns = ctx.namespace;
  const storage = bossBarStorageId(ctx);
  return {
    'jobs/ensure_pid.mcfunction':
      [
        `# Ensure @s has a dedicated boss bar player slot`,
        `execute unless score @s ${QT_PID_OBJECTIVE} matches 1..${MAX_PLAYER_PROGRESS_BARS} run function ${ns}:jobs/assign_pid`,
      ].join('\n') + '\n',
    'jobs/assign_pid.mcfunction':
      [
        `# Assign the next free boss bar slot (max ${MAX_PLAYER_PROGRESS_BARS} players)`,
        `execute if score #qt_next_pid ${SYS} matches ${MAX_PLAYER_PROGRESS_BARS + 1}.. run return 0`,
        `scoreboard players operation @s ${QT_PID_OBJECTIVE} = #qt_next_pid ${SYS}`,
        `scoreboard players add #qt_next_pid ${SYS} 1`,
      ].join('\n') + '\n',
    'jobs/bossbar_hide.mcfunction': `$bossbar set ${ns}:job_prog_$(pid) visible false\n`,
    'jobs/bossbar_hide_player.mcfunction':
      [
        `# Hide the executing player's job progress boss bar`,
        `execute unless score @s ${QT_PID_OBJECTIVE} matches 1..${MAX_PLAYER_PROGRESS_BARS} run return 0`,
        `execute store result storage ${storage} pid int 1 run scoreboard players get @s ${QT_PID_OBJECTIVE}`,
        `function ${ns}:jobs/bossbar_hide with storage ${storage}`,
      ].join('\n') + '\n',
  };
}

/** Hide the job progress boss bar for the executing player. */
export function buildHideJobBossBarLines(ctx: CompileContext): string[] {
  if (!jobsUseProgressBar(ctx)) return [];
  return [`function ${ctx.namespace}:jobs/bossbar_hide_player`];
}

/** Macro function: apply name, value, and visibility to @s's boss bar slot. */
export function buildJobProgressBarMacro(ctx: CompileContext, jc: JobContext): string {
  const ns = ctx.namespace;
  const maxLvl = `${jc.constPrefix}_max_level`;
  const val = `${jc.constPrefix}_bb_val`;
  const name = escapeSnbtString(jc.job.name);
  const bar = `${ns}:job_prog_$(pid)`;

  return (
    [
      `# Boss bar macro: ${jc.job.name}`,
      `$bossbar set ${bar} name ["",` +
        `{"text":"${name}","color":"aqua","bold":true},` +
        `{"text":" — Lv ","color":"gray"},` +
        `{"score":{"name":"@s","objective":"${jc.level}"},"color":"white"},` +
        `{"text":" · ","color":"gray"},` +
        `{"score":{"name":"@s","objective":"${jc.xp}"},"color":"gold"},` +
        `{"text":" XP","color":"gray"}]`,
      `$execute if score @s ${jc.level} >= ${maxLvl} ${SYS} run bossbar set ${bar} value 1000`,
      `$execute if score @s ${jc.level} < ${maxLvl} ${SYS} store result bossbar ${bar} value run scoreboard players get ${val} ${SYS}`,
      `$bossbar set ${bar} players @s`,
      `$bossbar set ${bar} visible true`,
    ].join('\n') + '\n'
  );
}

/** mcfunction lines to refresh the top progress boss bar for @s. */
export function buildUpdateProgressBarLines(ctx: CompileContext, jc: JobContext): string[] {
  if (jc.job.showProgressBar === false) return [];
  const ns = ctx.namespace;
  const storage = bossBarStorageId(ctx);
  const maxLvl = `${jc.constPrefix}_max_level`;
  const xpPerLvl = `${jc.constPrefix}_xp_per_level`;
  const base = `${jc.constPrefix}_bb_base`;
  const prog = `${jc.constPrefix}_bb_prog`;
  const val = `${jc.constPrefix}_bb_val`;

  return [
    `# Boss bar: ${jc.job.name} — per-player slot`,
    `function ${ns}:jobs/ensure_pid`,
    `execute unless score @s ${QT_PID_OBJECTIVE} matches 1..${MAX_PLAYER_PROGRESS_BARS} run return 0`,
    `execute if score @s ${jc.level} < ${maxLvl} ${SYS} run scoreboard players operation ${base} ${SYS} = @s ${jc.level}`,
    `execute if score @s ${jc.level} < ${maxLvl} ${SYS} run scoreboard players operation ${base} ${SYS} *= ${xpPerLvl} ${SYS}`,
    `execute if score @s ${jc.level} < ${maxLvl} ${SYS} run scoreboard players operation ${prog} ${SYS} = @s ${jc.xp}`,
    `execute if score @s ${jc.level} < ${maxLvl} ${SYS} run scoreboard players operation ${prog} ${SYS} -= ${base} ${SYS}`,
    `execute if score @s ${jc.level} < ${maxLvl} ${SYS} run scoreboard players operation ${val} ${SYS} = ${prog} ${SYS}`,
    `execute if score @s ${jc.level} < ${maxLvl} ${SYS} run scoreboard players operation ${val} ${SYS} *= #qt_bb_scale ${SYS}`,
    `execute if score @s ${jc.level} < ${maxLvl} ${SYS} run scoreboard players operation ${val} ${SYS} /= ${xpPerLvl} ${SYS}`,
    `execute store result storage ${storage} pid int 1 run scoreboard players get @s ${QT_PID_OBJECTIVE}`,
    `function ${ns}:${jc.fnBase}/prog_bar with storage ${storage}`,
  ];
}
