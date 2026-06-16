import {
  type CompileContext,
  type QuestContext,
  namespaced,
  questObjectives,
} from './context';
import { rewardCommands } from './platform';
import { NOW_HOLDER, SYS_OBJECTIVE } from './load';
import { tellraw, type TextPart } from './text';

const RANGE_ALL = '-2147483648..2147483647';

function esc(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function npcSay(name: string, message: string, color: TextPart['color'] = 'white'): TextPart[] {
  return [
    { text: `<${name}> `, color: 'gold', bold: true },
    { text: message, color },
  ];
}

/** Selector for this quest's giver NPC. */
function giver(qc: QuestContext): string {
  return `@e[tag=${qc.giverTag},limit=1]`;
}

interface ObjectiveInfo {
  amount: number;
  item: string;
  desc: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  /** Per-objective scoreboard names. */
  progress: string;
  killed: string;
  reached: string;
}

function objectiveInfos(qc: QuestContext): ObjectiveInfo[] {
  return questObjectives(qc.quest).map((o, j) => ({
    amount: Math.max(1, o.amount ?? 1),
    item: namespaced(o.target ?? 'minecraft:stone'),
    desc: o.description ?? qc.quest.name,
    x: o.location?.x ?? 0,
    y: o.location?.y ?? 64,
    z: o.location?.z ?? 0,
    radius: Math.max(1, o.radius ?? 5),
    progress: qc.objectives[j].progress,
    killed: qc.objectives[j].killed,
    reached: qc.objectives[j].reached,
  }));
}

/** Action-bar progress for a single objective with a live score, e.g. "Slay zombies: 3/5". */
function progressActionbar(scoreName: string, info: ObjectiveInfo): string {
  return (
    `title @s actionbar ["",` +
    `{"text":"${esc(info.desc)}: ","color":"yellow"},` +
    `{"score":{"name":"@s","objective":"${scoreName}"},"color":"gold"},` +
    `{"text":"/${info.amount}","color":"yellow"}]`
  );
}

/** Action-bar progress across multiple objectives, e.g. "Objectives: 2/3". */
function doneActionbar(qc: QuestContext, total: number): string {
  return (
    `title @s actionbar ["",` +
    `{"text":"Objectives: ","color":"yellow"},` +
    `{"score":{"name":"@s","objective":"${qc.done}"},"color":"gold"},` +
    `{"text":"/${total}","color":"yellow"}]`
  );
}

/** Quests that should be unlocked when this quest completes (requires-graph + explicit unlocks). */
function unlockTargets(ctx: CompileContext, qc: QuestContext): QuestContext[] {
  const names = new Set<string>();
  for (const other of ctx.quests) {
    if (other.quest.chain.requires === qc.quest.name) names.add(other.quest.name);
  }
  if (qc.quest.chain.unlocks) names.add(qc.quest.chain.unlocks);
  return [...names]
    .map((n) => ctx.byName.get(n))
    .filter((x): x is QuestContext => !!x && x !== qc);
}

/** Reward + completion + chain + done lines, shared by turn-in and instant talk quests. */
function completionBody(ctx: CompileContext, qc: QuestContext): string[] {
  const quest = qc.quest;
  const lines: string[] = ['# Grant rewards'];
  for (const reward of quest.rewards) {
    lines.push(...rewardCommands(ctx.project.platform, reward));
  }

  lines.push(tellraw('@s', npcSay(quest.npc.name, quest.npc.dialogue.completion, 'green')));

  if (quest.chain.announce) {
    lines.push(
      `tellraw @a ["",` +
        `{"text":"[Quests] ","color":"gold"},` +
        `{"selector":"@s","color":"white"},` +
        `{"text":" completed ","color":"yellow"},` +
        `{"text":"${esc(quest.name)}","color":"white"},` +
        `{"text":"!","color":"yellow"}]`,
    );
  }

  if (quest.type === 'daily') {
    const cooldownTicks = Math.max(1, quest.cooldownSeconds * 20);
    lines.push(`scoreboard players operation @s ${qc.state}cd = ${NOW_HOLDER} ${SYS_OBJECTIVE}`);
    lines.push(`scoreboard players add @s ${qc.state}cd ${cooldownTicks}`);
    lines.push(`scoreboard players set @s ${qc.state} 4`);
  } else {
    lines.push(`scoreboard players set @s ${qc.state} 3`);
  }
  lines.push(`scoreboard players set @s ${qc.near} 0`);

  for (const next of unlockTargets(ctx, qc)) {
    lines.push(`# Chain: unlock "${next.quest.name}"`);
    if (next.quest.chain.autoStart) {
      lines.push(`scoreboard players set @s ${next.state} 1`);
      lines.push(`scoreboard players set @s ${next.near} 0`);
      lines.push(`scoreboard players set @s ${next.done} 0`);
      for (const score of next.objectives) {
        switch (next.quest.type) {
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
        }
      }
      lines.push(
        tellraw('@s', [
          { text: 'New quest started: ', color: 'aqua' },
          { text: next.quest.name, color: 'white', bold: true },
        ]),
      );
    } else {
      lines.push(`scoreboard players set @s ${next.state} 0`);
      lines.push(
        tellraw('@s', [
          { text: 'New quest available: ', color: 'aqua' },
          { text: next.quest.name, color: 'white', bold: true },
          { text: ` (see ${next.quest.npc.name})`, color: 'gray' },
        ]),
      );
    }
  }
  return lines;
}

/** Build all mcfunction files for one quest, keyed by path under the function root. */
export function compileQuest(ctx: CompileContext, qc: QuestContext): Record<string, string> {
  const ns = ctx.namespace;
  const quest = qc.quest;
  const infos = objectiveInfos(qc);
  const objCount = infos.length;
  const files: Record<string, string> = {};
  const isInstantTalk = quest.type === 'talk' && !quest.targetNpc;

  const requiresValid =
    !!quest.chain.requires && ctx.byName.has(quest.chain.requires);
  const initState = requiresValid ? -1 : 0;

  // ---- tick.mcfunction (dispatcher per quest) ----
  const tick: string[] = [
    `# ${quest.name} (${quest.type}) - tick`,
    `scoreboard players enable @a ${qc.trigger}`,
    `execute as @a unless score @s ${qc.state} matches ${RANGE_ALL} run scoreboard players set @s ${qc.state} ${initState}`,
    `execute as @a at @s unless entity @e[tag=${qc.giverTag},distance=..4] run scoreboard players set @s ${qc.near} 0`,
    `# AVAILABLE: offer + accept near giver`,
    `execute as ${giver(qc)} at @s as @a[distance=..4,scores={${qc.state}=0}] at @s run function ${ns}:${qc.fnBase}/offer`,
    `execute as ${giver(qc)} at @s as @a[distance=..6,scores={${qc.state}=0,${qc.trigger}=1..}] at @s run function ${ns}:${qc.fnBase}/accept`,
  ];

  if (!isInstantTalk) {
    tick.push(`# ACTIVE: progress tracking`);

    if (quest.type === 'talk') {
      // Talk completes by reaching the target NPC; a single objective only.
      tick.push(
        `execute as @a[scores={${qc.state}=1}] run title @s actionbar ["",{"text":"${esc(infos[0].desc)}","color":"yellow"}]`,
        `execute as @e[tag=${qc.targetTag},limit=1] at @s as @a[distance=..4,scores={${qc.state}=1}] at @s run function ${ns}:${qc.fnBase}/complete`,
      );
    } else {
      // Count satisfied objectives into the `done` aggregate each tick.
      tick.push(`execute as @a[scores={${qc.state}=1}] run scoreboard players set @s ${qc.done} 0`);
      for (const info of infos) {
        switch (quest.type) {
          case 'kill':
            tick.push(
              `execute as @a[scores={${qc.state}=1,${info.killed}=${info.amount}..}] run scoreboard players add @s ${qc.done} 1`,
            );
            break;
          case 'gather':
          case 'delivery':
          case 'daily':
            tick.push(
              `execute as @a[scores={${qc.state}=1}] store result score @s ${info.progress} run clear @s ${info.item} 0`,
              `execute as @a[scores={${qc.state}=1,${info.progress}=${info.amount}..}] run scoreboard players add @s ${qc.done} 1`,
            );
            break;
          case 'exploration':
            tick.push(
              `execute positioned ${info.x} ${info.y} ${info.z} as @a[scores={${qc.state}=1},distance=..${info.radius}] run scoreboard players set @s ${info.reached} 1`,
              `execute as @a[scores={${qc.state}=1,${info.reached}=1..}] run scoreboard players add @s ${qc.done} 1`,
            );
            break;
        }
      }

      // Action bar: live single-objective count, or aggregate for multiple.
      if (objCount === 1 && quest.type === 'exploration') {
        tick.push(
          `execute as @a[scores={${qc.state}=1}] run title @s actionbar ["",{"text":"${esc(infos[0].desc)}","color":"yellow"}]`,
        );
      } else if (objCount === 1) {
        const live = quest.type === 'kill' ? infos[0].killed : infos[0].progress;
        tick.push(`execute as @a[scores={${qc.state}=1}] run ${progressActionbar(live, infos[0])}`);
      } else {
        tick.push(`execute as @a[scores={${qc.state}=1}] run ${doneActionbar(qc, objCount)}`);
      }

      tick.push(
        `execute as @a[scores={${qc.state}=1,${qc.done}=${objCount}..}] run function ${ns}:${qc.fnBase}/complete`,
      );
    }

    tick.push(
      `# ACTIVE dialogue + READY turn-in near giver`,
      `execute as ${giver(qc)} at @s as @a[distance=..4,scores={${qc.state}=1}] at @s run function ${ns}:${qc.fnBase}/active`,
      `execute as ${giver(qc)} at @s as @a[distance=..4,scores={${qc.state}=2}] at @s run function ${ns}:${qc.fnBase}/ready`,
      `execute as ${giver(qc)} at @s as @a[distance=..6,scores={${qc.state}=2,${qc.trigger}=1..}] at @s run function ${ns}:${qc.fnBase}/turnin`,
    );
  }

  if (quest.type === 'daily') {
    tick.push(
      `# Daily cooldown: make available again once elapsed`,
      `execute as @a[scores={${qc.state}=4}] if score @s ${qc.state}cd <= ${NOW_HOLDER} ${SYS_OBJECTIVE} run scoreboard players set @s ${qc.state} 0`,
      `execute as @a[scores={${qc.state}=4}] if score @s ${qc.state}cd <= ${NOW_HOLDER} ${SYS_OBJECTIVE} run scoreboard players set @s ${qc.near} 0`,
    );
  }

  files[`${qc.fnBase}/tick.mcfunction`] = tick.join('\n') + '\n';

  // ---- offer.mcfunction ----
  files[`${qc.fnBase}/offer.mcfunction`] =
    [
      `# Offer dialogue (fires once per approach)`,
      `execute if score @s ${qc.near} matches 0 run ${tellraw('@s', npcSay(quest.npc.name, quest.npc.dialogue.greeting))}`,
      `execute if score @s ${qc.near} matches 0 run ${tellraw('@s', npcSay(quest.npc.name, quest.npc.dialogue.offer, 'yellow'))}`,
      `execute if score @s ${qc.near} matches 0 run ${tellraw('@s', [
        {
          text: '[ Accept Quest ]',
          color: 'green',
          bold: true,
          runCommand: `trigger ${qc.trigger}`,
          hover: 'Click to accept this quest',
        },
      ])}`,
      `scoreboard players set @s ${qc.near} 1`,
    ].join('\n') + '\n';

  // ---- accept.mcfunction ----
  const accept: string[] = [
    `# Accept`,
    `scoreboard players set @s ${qc.trigger} 0`,
  ];
  if (isInstantTalk) {
    accept.push(...completionBody(ctx, qc));
  } else {
    accept.push(
      `scoreboard players set @s ${qc.state} 1`,
      `scoreboard players set @s ${qc.near} 0`,
      `scoreboard players set @s ${qc.done} 0`,
    );
    for (const info of infos) {
      switch (quest.type) {
        case 'kill':
          accept.push(`scoreboard players set @s ${info.killed} 0`);
          break;
        case 'gather':
        case 'delivery':
        case 'daily':
          accept.push(`scoreboard players set @s ${info.progress} 0`);
          break;
        case 'exploration':
          accept.push(`scoreboard players set @s ${info.reached} 0`);
          break;
      }
    }
    accept.push(
      tellraw('@s', [
        { text: 'Quest accepted: ', color: 'green' },
        { text: quest.name, color: 'white', bold: true },
      ]),
      tellraw('@s', [
        {
          text:
            objCount === 1
              ? `Objective: ${infos[0].desc}`
              : `Objectives: ${objCount} to complete`,
          color: 'gray',
        },
      ]),
    );
  }
  files[`${qc.fnBase}/accept.mcfunction`] = accept.join('\n') + '\n';

  if (isInstantTalk) return files;

  // ---- complete.mcfunction (objectives done -> ready to turn in) ----
  files[`${qc.fnBase}/complete.mcfunction`] =
    [
      `# Objectives complete -> ready to turn in`,
      `scoreboard players set @s ${qc.state} 2`,
      `scoreboard players set @s ${qc.near} 0`,
      tellraw('@s', [
        { text: 'Objective complete! ', color: 'green', bold: true },
        { text: `Return to ${quest.npc.name}.`, color: 'yellow' },
      ]),
    ].join('\n') + '\n';

  // ---- active.mcfunction (in-progress dialogue near giver) ----
  files[`${qc.fnBase}/active.mcfunction`] =
    [
      `# In-progress dialogue (fires once per approach)`,
      `execute if score @s ${qc.near} matches 0 run ${tellraw('@s', npcSay(quest.npc.name, quest.npc.dialogue.inProgress))}`,
      `scoreboard players set @s ${qc.near} 1`,
    ].join('\n') + '\n';

  // ---- ready.mcfunction (objectives done, near giver) ----
  files[`${qc.fnBase}/ready.mcfunction`] =
    [
      `# Ready-to-claim prompt (fires once per approach)`,
      `execute if score @s ${qc.near} matches 0 run ${tellraw('@s', npcSay(quest.npc.name, 'You have done it! Let me reward you.', 'green'))}`,
      `execute if score @s ${qc.near} matches 0 run ${tellraw('@s', [
        {
          text: '[ Turn In Quest ]',
          color: 'gold',
          bold: true,
          runCommand: `trigger ${qc.trigger}`,
          hover: 'Click to claim your reward',
        },
      ])}`,
      `scoreboard players set @s ${qc.near} 1`,
    ].join('\n') + '\n';

  // ---- turnin.mcfunction ----
  const turnin: string[] = [`# Turn in`, `scoreboard players set @s ${qc.trigger} 0`];
  if (quest.type === 'delivery') {
    // Verify every delivery objective still has its items before consuming any.
    for (const info of infos) {
      turnin.push(
        `execute store result score @s ${info.progress} run clear @s ${info.item} 0`,
        `execute if score @s ${info.progress} matches ..${info.amount - 1} run ${tellraw('@s', [
          { text: `You still need ${info.amount}x ${info.item}.`, color: 'red' },
        ])}`,
        `execute if score @s ${info.progress} matches ..${info.amount - 1} run return 0`,
      );
    }
    for (const info of infos) {
      turnin.push(`clear @s ${info.item} ${info.amount}`);
    }
  }
  turnin.push(...completionBody(ctx, qc));
  files[`${qc.fnBase}/turnin.mcfunction`] = turnin.join('\n') + '\n';

  return files;
}
