import { type CompileContext, questObjectives, statId } from './context';

/** System objective + score holder used for the global gametime read (daily cooldowns). */
export const SYS_OBJECTIVE = 'qt_sys';
export const NOW_HOLDER = '#now';

/**
 * The load function: declares every scoreboard objective the pack needs and
 * prints a confirmation line. Runs on world load and every /reload.
 */
export function buildLoadFunction(ctx: CompileContext): string {
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
          const mob = statId(o.target ?? 'minecraft:zombie');
          lines.push(`scoreboard objectives add ${score.killed} minecraft.killed:${mob}`);
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

  lines.push(`tellraw @a {"text":"[Quest Tool] ${ctx.project.name} loaded.","color":"green"}`);
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
  return lines.join('\n') + '\n';
}

/** A quest's starting state: locked (-1) if it requires another quest, else available (0). */
function initialState(ctx: CompileContext, qc: CompileContext['quests'][number]): number {
  const requires = qc.quest.chain.requires;
  return requires && ctx.byName.has(requires) ? -1 : 0;
}

/**
 * Reset the executing player's (@s) quest progress and completion back to the
 * starting state. Run via /function <ns>:reset (resets yourself) or
 * /execute as <player> run function <ns>:reset to reset someone else.
 */
export function buildResetFunction(ctx: CompileContext): string {
  const lines: string[] = [`# Reset all quest progress for the executing player (@s)`];
  for (const qc of ctx.quests) {
    const isInstantTalk = qc.quest.type === 'talk' && !qc.quest.targetNpc;
    lines.push(`scoreboard players set @s ${qc.state} ${initialState(ctx, qc)}`);
    lines.push(`scoreboard players set @s ${qc.near} 0`);
    lines.push(`scoreboard players set @s ${qc.trigger} 0`);
    if (!isInstantTalk) lines.push(`scoreboard players set @s ${qc.done} 0`);
    for (const score of qc.objectives) {
      switch (qc.quest.type) {
        case 'kill':
          lines.push(`scoreboard players set @s ${score.killed} 0`);
          break;
        case 'gather':
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
  lines.push(
    `tellraw @s {"text":"[Quest Tool] Your quest progress has been reset.","color":"yellow"}`,
  );
  return lines.join('\n') + '\n';
}

/** Reset quest progress for every online player. */
export function buildResetAllFunction(ctx: CompileContext): string {
  return (
    [
      `# Reset quest progress for all online players`,
      `execute as @a run function ${ctx.namespace}:reset`,
      `tellraw @a {"text":"[Quest Tool] All quest progress has been reset.","color":"yellow"}`,
    ].join('\n') + '\n'
  );
}
