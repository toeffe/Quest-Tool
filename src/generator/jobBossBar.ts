import type { CompileContext, JobContext } from './context';
import { NOW_HOLDER, SYS_OBJECTIVE } from './sys';
import { escapeSnbtString, sanitizeMcComment } from './text';

const SYS = SYS_OBJECTIVE;

/** Scoreboard slot id — each online player gets a unique 1..N boss bar. */
export const QT_PID_OBJECTIVE = 'qt_pid';

/** Gametime tick when the job progress boss bar should hide (0 = hidden / never shown). */
export const QT_BB_UNTIL_OBJECTIVE = 'qt_bb_until';

/** Last job index that updated the progress boss bar. */
export const QT_ACTIVE_JOB_OBJECTIVE = 'qt_active_job';

/** Boss bar stays visible this many ticks after the last job XP gain (~5s at 20 TPS). */
export const BOSSBAR_VISIBILITY_TICKS = 100;

/** Pre-allocated per-player boss bar slots (supports up to this many concurrent players). */
export const MAX_PLAYER_PROGRESS_BARS = 64;

/** Boss bar id for player slot 1..MAX_PLAYER_PROGRESS_BARS. */
export function playerBossBarId(ctx: CompileContext, slot: number): string {
  return `${ctx.namespace}:job_prog_${slot}`;
}

export function jobsUseProgressBar(ctx: CompileContext): boolean {
  return ctx.jobs.some((jc) => jc.job.showProgressBar !== false);
}

function bossBarNameJson(jc: JobContext): string {
  const name = escapeSnbtString(jc.job.name);
  return (
    `["",` +
    `{"text":"${name}","color":"aqua","bold":true},` +
    `{"text":" — Lv ","color":"gray"},` +
    `{"score":{"name":"@s","objective":"${jc.level}"},"color":"white"},` +
    `{"text":" · ","color":"gray"},` +
    `{"score":{"name":"@s","objective":"${jc.xp}"},"color":"gold"},` +
    `{"text":" XP","color":"gray"}]`
  );
}

/** Apply boss bar updates for the player's slot only (one matching branch runs). */
export function buildBossBarApplyLines(ctx: CompileContext, jc: JobContext): string[] {
  const maxLvl = `${jc.constPrefix}_max_level`;
  const val = `${jc.constPrefix}_bb_val`;
  const nameJson = bossBarNameJson(jc);
  const lines: string[] = [];

  for (let slot = 1; slot <= MAX_PLAYER_PROGRESS_BARS; slot++) {
    const id = playerBossBarId(ctx, slot);
    const match = `execute if score @s ${QT_PID_OBJECTIVE} matches ${slot} as @s`;
    lines.push(`${match} run bossbar set ${id} name ${nameJson}`);
    lines.push(
      `${match} if score @s ${jc.level} >= ${maxLvl} ${SYS} run bossbar set ${id} value 1000`,
    );
    lines.push(
      `${match} if score @s ${jc.level} < ${maxLvl} ${SYS} store result bossbar ${id} value run scoreboard players get ${val} ${SYS}`,
    );
    lines.push(`${match} run bossbar set ${id} players @s`);
    lines.push(`${match} run bossbar set ${id} visible true`);
  }
  return lines;
}

function buildBossBarHidePlayerLines(ctx: CompileContext): string[] {
  const lines: string[] = [
    `# Hide the executing player's job progress boss bar`,
    `scoreboard players set @s ${QT_BB_UNTIL_OBJECTIVE} 0`,
    `execute unless score @s ${QT_PID_OBJECTIVE} matches 1..${MAX_PLAYER_PROGRESS_BARS} run return 0`,
  ];
  for (let slot = 1; slot <= MAX_PLAYER_PROGRESS_BARS; slot++) {
    const id = playerBossBarId(ctx, slot);
    lines.push(
      `execute if score @s ${QT_PID_OBJECTIVE} matches ${slot} run bossbar set ${id} visible false`,
    );
  }
  return lines;
}

/** Extend boss bar visibility deadline from current gametime. */
export function buildBossBarExtendVisibilityLines(): string[] {
  return [
    `scoreboard players operation @s ${QT_BB_UNTIL_OBJECTIVE} = ${NOW_HOLDER} ${SYS}`,
    `scoreboard players add @s ${QT_BB_UNTIL_OBJECTIVE} ${BOSSBAR_VISIBILITY_TICKS}`,
  ];
}

/** Per-tick: hide boss bar when visibility deadline has passed. */
export function buildBossBarTickLines(ctx: CompileContext): string[] {
  if (!jobsUseProgressBar(ctx)) return [];
  const ns = ctx.namespace;
  return [
    `# Hide job progress boss bars after idle timeout`,
    `execute as @a if score @s ${QT_BB_UNTIL_OBJECTIVE} matches 1.. if score @s ${QT_BB_UNTIL_OBJECTIVE} < ${NOW_HOLDER} ${SYS} run function ${ns}:jobs/bossbar_hide_player`,
  ];
}

/** One-time boss bar setup in load.mcfunction. */
export function buildJobBossBarSetupLines(ctx: CompileContext): string[] {
  if (!jobsUseProgressBar(ctx)) return [];
  const lines: string[] = [
    `scoreboard objectives add ${QT_PID_OBJECTIVE} dummy`,
    `scoreboard objectives add ${QT_BB_UNTIL_OBJECTIVE} dummy`,
    `scoreboard objectives add ${QT_ACTIVE_JOB_OBJECTIVE} dummy`,
    `scoreboard players set #qt_bb_scale ${SYS} 1000`,
    `execute unless score #qt_next_pid ${SYS} matches 1.. run scoreboard players set #qt_next_pid ${SYS} 1`,
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

/** Shared mcfunctions for per-player boss bar slots. */
export function buildJobBossBarSupportFiles(ctx: CompileContext): Record<string, string> {
  if (!jobsUseProgressBar(ctx)) return {};
  const ns = ctx.namespace;
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
    'jobs/bossbar_hide_player.mcfunction': buildBossBarHidePlayerLines(ctx).join('\n') + '\n',
    'jobs/bossbar_tick.mcfunction': buildBossBarTickLines(ctx).join('\n') + '\n',
  };
}

/** Hide the job progress boss bar for the executing player. */
export function buildHideJobBossBarLines(ctx: CompileContext): string[] {
  if (!jobsUseProgressBar(ctx)) return [];
  return [`function ${ctx.namespace}:jobs/bossbar_hide_player`];
}

/** Compute progress values and refresh visibility timer (call bossbar_apply after). */
export function buildBossBarComputeLines(ctx: CompileContext, jc: JobContext): string[] {
  if (jc.job.showProgressBar === false) return [];
  const ns = ctx.namespace;
  const maxLvl = `${jc.constPrefix}_max_level`;
  const xpPerLvl = `${jc.constPrefix}_xp_per_level`;
  const base = `${jc.constPrefix}_bb_base`;
  const prog = `${jc.constPrefix}_bb_prog`;
  const val = `${jc.constPrefix}_bb_val`;

  return [
    `# Boss bar: ${sanitizeMcComment(jc.job.name)} — per-player slot`,
    `function ${ns}:jobs/ensure_pid`,
    `execute unless score @s ${QT_PID_OBJECTIVE} matches 1..${MAX_PLAYER_PROGRESS_BARS} run return 0`,
    `scoreboard players set @s ${QT_ACTIVE_JOB_OBJECTIVE} ${jc.index}`,
    `execute if score @s ${jc.level} < ${maxLvl} ${SYS} run scoreboard players operation ${base} ${SYS} = @s ${jc.level}`,
    `execute if score @s ${jc.level} < ${maxLvl} ${SYS} run scoreboard players operation ${base} ${SYS} *= ${xpPerLvl} ${SYS}`,
    `execute if score @s ${jc.level} < ${maxLvl} ${SYS} run scoreboard players operation ${prog} ${SYS} = @s ${jc.xp}`,
    `execute if score @s ${jc.level} < ${maxLvl} ${SYS} run scoreboard players operation ${prog} ${SYS} -= ${base} ${SYS}`,
    `execute if score @s ${jc.level} < ${maxLvl} ${SYS} run scoreboard players operation ${val} ${SYS} = ${prog} ${SYS}`,
    `execute if score @s ${jc.level} < ${maxLvl} ${SYS} run scoreboard players operation ${val} ${SYS} *= #qt_bb_scale ${SYS}`,
    `execute if score @s ${jc.level} < ${maxLvl} ${SYS} run scoreboard players operation ${val} ${SYS} /= ${xpPerLvl} ${SYS}`,
  ];
}

/** mcfunction lines to refresh the top progress boss bar for @s. */
export function buildUpdateProgressBarLines(ctx: CompileContext, jc: JobContext): string[] {
  if (jc.job.showProgressBar === false) return [];
  const ns = ctx.namespace;
  return [
    ...buildBossBarComputeLines(ctx, jc),
    `function ${ns}:${jc.fnBase}/bossbar_apply`,
    ...buildBossBarExtendVisibilityLines(),
  ];
}
