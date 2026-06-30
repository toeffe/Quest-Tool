import { type CompileContext, questObjectives, statId } from './context';
import { findCustomMob } from './customMobs';
import { buildJobLoadLines, buildJobResetLines } from './jobFunctions';
import { buildCustomMobBossBarSetupLines, buildCustomMobBossBarTickHook } from './customMobBossBar';
import { buildCustomMobPhaseSetupLines, buildCustomMobPhaseTickHook } from './customMobPhases';
import { buildJobBossBarSetupLines, buildHideJobBossBarLines, jobsUseProgressBar } from './jobBossBar';
import { buildDungeonLoadLines, buildDungeonInitCalls } from './dungeons';
import { buildPadLoadLines, buildPadsTickHook } from './pads';
import { NOW_HOLDER, SYS_OBJECTIVE } from './sys';
import { escapeSnbtString } from './text';

export { NOW_HOLDER, SYS_OBJECTIVE } from './sys';

function spawnZoneEntityTag(
  ctx: CompileContext,
  qc: CompileContext['quests'][number],
  o: ReturnType<typeof questObjectives>[number],
  j: number,
): string {
  if (qc.quest.type === 'kill' && o.eliteMobId) {
    const mob = findCustomMob(ctx.project, o.eliteMobId);
    if (mob) return mob.tag;
  }
  return qc.objectives[j].mobTag;
}

/**
 * The load function: declares every scoreboard objective the pack needs and
 * prints a confirmation line. Runs on world load and every /reload.
 */
export function buildLoadFunction(ctx: CompileContext): string {
  const STR = ctx.str;
  const lines: string[] = [
    `# Quest Tool MC - load`,
    `# Project: ${ctx.project.name} | Minecraft 1.21.11 | Platform: ${ctx.project.platform}`,
    // Hide the "Triggered [..]" / "Gave .." command feedback that /trigger and reward
    // commands print to chat. 1.21.11 renamed this gamerule to snake_case.
    `gamerule send_command_feedback false`,
    `scoreboard objectives add money dummy`,
    `scoreboard objectives add ${SYS_OBJECTIVE} dummy`,
  ];

  for (const qc of ctx.quests) {
    const isInstantTalk = qc.quest.type === 'talk' && !qc.quest.targetNpc;
    lines.push(`scoreboard objectives add ${qc.state} dummy`);
    lines.push(`scoreboard objectives add ${qc.near} dummy`);
    lines.push(`scoreboard objectives add ${qc.trigger} trigger`);
    if (!isInstantTalk) {
      lines.push(`scoreboard objectives add ${qc.done} dummy`);
    }
    const objs = questObjectives(qc.quest);
    objs.forEach((o, j) => {
      const score = qc.objectives[j];
      switch (qc.quest.type) {
        case 'kill': {
          if (o.spawnZone || o.eliteMobId) {
            lines.push(`scoreboard objectives add ${score.killed} dummy`);
          } else {
            const mob = statId(o.target ?? 'minecraft:zombie');
            lines.push(`scoreboard objectives add ${score.killed} minecraft.killed:${mob}`);
          }
          break;
        }
        case 'gather':
        case 'delivery':
        case 'daily':
          lines.push(`scoreboard objectives add ${score.progress} dummy`);
          break;
        case 'exploration':
          lines.push(`scoreboard objectives add ${score.reached} dummy`);
          break;
        case 'talk':
          break;
      }
    });
    if (qc.quest.type === 'daily') {
      lines.push(`scoreboard objectives add ${qc.state}cd dummy`);
    }
  }

  for (const jc of ctx.jobs) {
    lines.push(...buildJobLoadLines(ctx, jc));
  }

  lines.push(...buildJobBossBarSetupLines(ctx));
  lines.push(...buildCustomMobBossBarSetupLines(ctx));
  lines.push(...buildCustomMobPhaseSetupLines(ctx));
  lines.push(...buildDungeonLoadLines(ctx));
  lines.push(...buildPadLoadLines(ctx));

  if (jobsUseProgressBar(ctx)) {
    lines.push(`execute as @a run function ${ctx.namespace}:jobs/ensure_pid`);
  }

  for (const jc of ctx.jobs) {
    lines.push(
      `execute as @a run function ${ctx.namespace}:${jc.fnBase}/sync_advancements`,
    );
  }

  for (const initCall of buildDungeonInitCalls(ctx)) {
    lines.push(initCall);
  }

  lines.push(`tellraw @a {"text":"${escapeSnbtString(STR.packLoaded(ctx.project.name))}","color":"green"}`);
  return lines.join('\n') + '\n';
}

/**
 * The tick function: reads the global gametime once (for cooldowns) then runs
 * each quest's per-tick logic.
 */
export function buildTickFunction(ctx: CompileContext): string {
  const lines: string[] = [
    `# Quest Tool MC - tick`,
    `execute store result score ${NOW_HOLDER} ${SYS_OBJECTIVE} run time query gametime`,
  ];
  for (const qc of ctx.quests) {
    lines.push(`function ${ctx.namespace}:${qc.fnBase}/tick`);
  }
  if (ctx.jobs.length > 0) {
    lines.push(`function ${ctx.namespace}:jobs/tick`);
  }
  if ((ctx.project.dungeons ?? []).length > 0) {
    lines.push(`function ${ctx.namespace}:dungeons/tick`);
  }
  const padsTick = buildPadsTickHook(ctx);
  if (padsTick) lines.push(padsTick);
  lines.push(...buildCustomMobBossBarTickHook(ctx));
  lines.push(...buildCustomMobPhaseTickHook(ctx));
  return lines.join('\n') + '\n';
}

/** A quest's starting state: locked (-1) if it requires another quest or job level, else available (0). */
function initialState(ctx: CompileContext, qc: CompileContext['quests'][number]): number {
  const requires = qc.quest.chain.requires;
  const questLocked = !!(requires && ctx.byName.has(requires));
  const jobReq = qc.quest.chain.requiresJob;
  const jobLocked = !!(jobReq && ctx.jobsById.has(jobReq.jobId));
  return questLocked || jobLocked ? -1 : 0;
}

/**
 * Reset the executing player's (@s) quest progress and completion back to the
 * starting state. Run via /function <ns>:reset (resets yourself) or
 * /execute as <player> run function <ns>:reset to reset someone else.
 */
export function buildResetFunction(ctx: CompileContext): string {
  const STR = ctx.str;
  const lines: string[] = [`# Reset all quest progress for the executing player (@s)`];
  for (const qc of ctx.quests) {
    const isInstantTalk = qc.quest.type === 'talk' && !qc.quest.targetNpc;
    lines.push(`scoreboard players set @s ${qc.state} ${initialState(ctx, qc)}`);
    lines.push(`scoreboard players set @s ${qc.near} 0`);
    lines.push(`scoreboard players set @s ${qc.trigger} 0`);
    if (!isInstantTalk) lines.push(`scoreboard players set @s ${qc.done} 0`);
    for (let j = 0; j < questObjectives(qc.quest).length; j++) {
      const score = qc.objectives[j];
      const o = questObjectives(qc.quest)[j];
      switch (qc.quest.type) {
        case 'kill':
          lines.push(`scoreboard players set @s ${score.killed} 0`);
          if (o.spawnZone) {
            lines.push(`kill @e[tag=${spawnZoneEntityTag(ctx, qc, o, j)}]`);
            lines.push(`scoreboard players set ${score.timerHolder} ${SYS_OBJECTIVE} 0`);
          }
          break;
        case 'gather':
          lines.push(`scoreboard players set @s ${score.progress} 0`);
          if (o.spawnZone) {
            lines.push(`kill @e[tag=${spawnZoneEntityTag(ctx, qc, o, j)}]`);
            lines.push(`scoreboard players set ${score.timerHolder} ${SYS_OBJECTIVE} 0`);
          }
          break;
        case 'delivery':
        case 'daily':
          lines.push(`scoreboard players set @s ${score.progress} 0`);
          break;
        case 'exploration':
          lines.push(`scoreboard players set @s ${score.reached} 0`);
          break;
        case 'talk':
          break;
      }
    }
    if (qc.quest.type === 'daily') lines.push(`scoreboard players set @s ${qc.state}cd 0`);
  }
  for (const jc of ctx.jobs) {
    lines.push(...buildJobResetLines(ctx, jc));
  }
  lines.push(...buildHideJobBossBarLines(ctx));
  lines.push(
    `tellraw @s {"text":"${STR.resetSelf}","color":"yellow"}`,
  );
  return lines.join('\n') + '\n';
}

/** Reset quest progress for every online player. */
export function buildResetAllFunction(ctx: CompileContext): string {
  const STR = ctx.str;
  return (
    [
      `# Reset quest progress for all online players`,
      `execute as @a run function ${ctx.namespace}:reset`,
      `tellraw @a {"text":"${STR.resetAll}","color":"yellow"}`,
    ].join('\n') + '\n'
  );
}
