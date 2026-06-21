import {
  type CompileContext,
  type QuestContext,
  namespaced,
  questObjectives,
} from './context';
import { type Quest } from '../types/quest';
import { killQuestMobsCommand, spawnOneInZone, zonePopulationCap, containMobsInZone } from './npc';
import { normalizeEntityId } from '../data/mobs';
import { rewardCommands } from './platform';
import { resolveObjectiveStack, itemDisplayLabel } from './items';
import {
  resolveDeathLootTableRef,
  buildZoneDropLootTable,
  zoneDropLootTablePath,
} from './lootTables';
import { type ZoneDropMode } from '../types/quest';
import { NOW_HOLDER, SYS_OBJECTIVE } from './load';
import { escapeSnbtString, tellraw, type TextPart } from './text';
import { STR } from './strings';

const RANGE_ALL = '-2147483648..2147483647';

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
  /** Human-readable item name for player messages. */
  label: string;
  desc: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  spawnZone: boolean;
  /** Resolved max live mobs in spawn zone. */
  cap: number;
  /** Per-objective scoreboard names. */
  progress: string;
  killed: string;
  reached: string;
  mobTag: string;
  timerHolder: string;
  liveHolder: string;
  /** Remove this objective's items from inventory on turn-in. */
  consumeOnTurnIn: boolean;
  /** Resolved drop behavior for spawn zones. */
  zoneDropMode?: ZoneDropMode;
  /** DeathLootTable id on summon, when not vanilla. */
  deathLootTable?: string;
}

function objectiveInfos(ctx: CompileContext, qc: QuestContext): ObjectiveInfo[] {
  return questObjectives(qc.quest).map((o, j) => {
    const amount = Math.max(1, o.amount ?? 1);
    const item =
      resolveObjectiveStack(ctx.project, o) ?? namespaced(o.target ?? 'minecraft:stone');
    const zoneDropMode = o.spawnZone ? (o.zoneDropMode ?? 'vanilla') : undefined;
    return {
      amount,
      item,
      label: itemDisplayLabel(ctx.project, o),
      desc: o.description ?? qc.quest.name,
      x: o.location?.x ?? 0,
      y: o.location?.y ?? 64,
      z: o.location?.z ?? 0,
      radius: Math.max(1, o.radius ?? 5),
      spawnZone: !!o.spawnZone,
      cap: zonePopulationCap(amount, o.zoneCap),
      progress: qc.objectives[j].progress,
      killed: qc.objectives[j].killed,
      reached: qc.objectives[j].reached,
      mobTag: qc.objectives[j].mobTag,
      timerHolder: qc.objectives[j].timerHolder,
      liveHolder: qc.objectives[j].liveHolder,
      consumeOnTurnIn:
        qc.quest.type === 'delivery' || !!(o.consumeOnTurnIn && usesItemTarget(qc.quest.type)),
      zoneDropMode,
      deathLootTable: zoneDropMode
        ? resolveDeathLootTableRef(zoneDropMode, ctx.namespace, qc.fnBase, j)
        : undefined,
    };
  });
}

function usesItemTarget(type: Quest['type']): boolean {
  return type === 'gather' || type === 'delivery' || type === 'daily';
}

function killAdvancementId(ctx: CompileContext, qc: QuestContext, j: number): string {
  return `${ctx.namespace}:${qc.fnBase}/kill_${j}`;
}

/** Advancement JSON for counting tagged quest mob kills. */
export function buildKillZoneAdvancement(
  ctx: CompileContext,
  qc: QuestContext,
  j: number,
  entityType: string,
  mobTag: string,
): object {
  return {
    criteria: {
      killed_quest_mob: {
        trigger: 'minecraft:player_killed_entity',
        conditions: {
          entity: {
            type: normalizeEntityId(entityType),
            nbt: `{Tags:["${mobTag}"]}`,
          },
        },
      },
    },
    rewards: {
      function: `${ctx.namespace}:${qc.fnBase}/kill_credit_${j}`,
    },
    requirements: [['killed_quest_mob']],
  };
}

/** Advancement file paths for zoned kill objectives. */
export function buildKillZoneAdvancementFiles(
  ctx: CompileContext,
  qc: QuestContext,
): Record<string, string> {
  const files: Record<string, string> = {};
  if (qc.quest.type !== 'kill') return files;
  const infos = objectiveInfos(ctx, qc);
  for (let j = 0; j < infos.length; j++) {
    if (!infos[j].spawnZone) continue;
    const path = `data/${ctx.namespace}/advancement/${qc.fnBase}/kill_${j}.json`;
    files[path] = JSON.stringify(buildKillZoneAdvancement(ctx, qc, j, infos[j].item, infos[j].mobTag), null, 2) + '\n';
  }
  return files;
}

/** Loot table JSON files for spawn zone custom drops. */
export function buildZoneLootTableFiles(
  ctx: CompileContext,
  qc: QuestContext,
): Record<string, string> {
  const files: Record<string, string> = {};
  if (qc.quest.type !== 'kill') return files;
  const objectives = questObjectives(qc.quest);
  for (let j = 0; j < objectives.length; j++) {
    const o = objectives[j];
    if (!o.spawnZone || o.zoneDropMode !== 'custom') continue;
    const drops = o.zoneDrops ?? [];
    if (!drops.length) continue;
    const path = zoneDropLootTablePath(ctx.namespace, qc.fnBase, j);
    files[path] =
      JSON.stringify(buildZoneDropLootTable(ctx.project, drops), null, 2) + '\n';
  }
  return files;
}

function cleanupSpawnZoneLines(ctx: CompileContext, qc: QuestContext): string[] {
  if (qc.quest.type !== 'kill') return [];
  const lines: string[] = [];
  for (const info of objectiveInfos(ctx, qc)) {
    if (info.spawnZone) lines.push(killQuestMobsCommand(info.mobTag));
  }
  return lines;
}

function countLiveMobsInZone(info: ObjectiveInfo): string[] {
  return [
    `scoreboard players set ${info.liveHolder} ${SYS_OBJECTIVE} 0`,
    // Count all tagged quest mobs (not distance-filtered) so wanderers don't break the cap.
    `execute as @e[type=${info.item},tag=${info.mobTag}] run scoreboard players add ${info.liveHolder} ${SYS_OBJECTIVE} 1`,
  ];
}

function containZoneMobs(info: ObjectiveInfo): string[] {
  return containMobsInZone(info.item, info.mobTag, info.x, info.y, info.z, info.radius);
}

function buildZoneTickLines(ctx: CompileContext, qc: QuestContext, infos: ObjectiveInfo[]): string[] {
  const lines: string[] = [];
  const ns = ctx.namespace;
  for (let j = 0; j < infos.length; j++) {
    const info = infos[j];
    if (!info.spawnZone) continue;
    const cap = info.cap;
    const capMinus1 = cap - 1;
    lines.push(`# Spawn zone objective ${j + 1} (max ${cap} live)`);
    lines.push(...containZoneMobs(info));
    lines.push(...countLiveMobsInZone(info));
    // Count down respawn timer only while below cap and timer is still running.
    lines.push(
      `execute if entity @a[scores={${qc.state}=1}] if score ${info.liveHolder} ${SYS_OBJECTIVE} matches ..${capMinus1} if score ${info.timerHolder} ${SYS_OBJECTIVE} matches 1.. run scoreboard players remove ${info.timerHolder} ${SYS_OBJECTIVE} 1`,
    );
    // Spawn exactly once when timer hits 0 — not on every tick while timer <= 0.
    lines.push(
      `execute if entity @a[scores={${qc.state}=1}] if score ${info.liveHolder} ${SYS_OBJECTIVE} matches ..${capMinus1} if score ${info.timerHolder} ${SYS_OBJECTIVE} matches 0 run function ${ns}:${qc.fnBase}/spawn_mob_${j}`,
    );
  }
  return lines;
}

function buildSpawnMobFunction(info: ObjectiveInfo): string {
  const cap = info.cap;
  return (
    [
      `# Spawn one quest mob in the zone (max ${cap} live)`,
      ...countLiveMobsInZone(info),
      `execute if score ${info.liveHolder} ${SYS_OBJECTIVE} matches ${cap}.. run return 0`,
      ...spawnOneInZone(
        info.item,
        info.mobTag,
        info.x,
        info.y,
        info.z,
        info.radius,
        info.deathLootTable,
      ),
      `execute store result score ${info.timerHolder} ${SYS_OBJECTIVE} run random value 60..160`,
    ].join('\n') + '\n'
  );
}

function buildKillCreditFunction(ctx: CompileContext, qc: QuestContext, j: number, info: ObjectiveInfo): string {
  const advId = killAdvancementId(ctx, qc, j);
  return (
    [
      `# Credit a tagged kill for objective ${j + 1}`,
      `execute unless score @s ${qc.state} matches 1 run advancement revoke @s only ${advId}`,
      `execute unless score @s ${qc.state} matches 1 run return 0`,
      `execute if score @s ${info.killed} matches ${info.amount}.. run advancement revoke @s only ${advId}`,
      `execute if score @s ${info.killed} matches ${info.amount}.. run return 0`,
      `scoreboard players add @s ${info.killed} 1`,
      `advancement revoke @s only ${advId}`,
    ].join('\n') + '\n'
  );
}

/** Action-bar progress for a single objective with a live score, e.g. "Slay zombies: 3/5". */
function progressActionbar(scoreName: string, info: ObjectiveInfo): string {
  return (
    `title @s actionbar ["",` +
    `{"text":"${escapeSnbtString(info.desc)}: ","color":"yellow"},` +
    `{"score":{"name":"@s","objective":"${scoreName}"},"color":"gold"},` +
    `{"text":"/${info.amount}","color":"yellow"}]`
  );
}

/** Action-bar progress across multiple objectives, e.g. "Objectives: 2/3". */
function doneActionbar(qc: QuestContext, total: number): string {
  return (
    `title @s actionbar ["",` +
    `{"text":"${STR.objectivesProgress}","color":"yellow"},` +
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
  const lines: string[] = [];
  const cleanup = cleanupSpawnZoneLines(ctx, qc);
  if (cleanup.length) {
    lines.push('# Cleanup spawn zone mobs', ...cleanup);
  }
  lines.push('# Grant rewards');
  for (const reward of quest.rewards) {
    lines.push(...rewardCommands(ctx.project.platform, reward, ctx.customItemsById));
  }

  lines.push(tellraw('@s', npcSay(quest.npc.name, quest.npc.dialogue.completion, 'green')));

  if (quest.chain.announce) {
    lines.push(
      `tellraw @a ["",` +
        `{"text":"${STR.questsAnnouncePrefix}","color":"gold"},` +
        `{"selector":"@s","color":"white"},` +
        `{"text":"${STR.questsAnnounceCompleted}","color":"yellow"},` +
        `{"text":"${escapeSnbtString(quest.name)}","color":"white"},` +
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
      for (let oi = 0; oi < next.objectives.length; oi++) {
        const score = next.objectives[oi];
        switch (next.quest.type) {
          case 'kill': {
            lines.push(`scoreboard players set @s ${score.killed} 0`);
            const nextObjs = questObjectives(next.quest);
            if (nextObjs[oi]?.spawnZone) {
              lines.push(killQuestMobsCommand(score.mobTag));
              lines.push(`scoreboard players set ${score.timerHolder} ${SYS_OBJECTIVE} 0`);
            }
            break;
          }
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
          { text: STR.newQuestStarted, color: 'aqua' },
          { text: next.quest.name, color: 'white', bold: true },
        ]),
      );
    } else {
      lines.push(`scoreboard players set @s ${next.state} 0`);
      lines.push(
        tellraw('@s', [
          { text: STR.newQuestAvailable, color: 'aqua' },
          { text: next.quest.name, color: 'white', bold: true },
          { text: STR.seeNpc(next.quest.npc.name), color: 'gray' },
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
  const infos = objectiveInfos(ctx, qc);
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
        `execute as @a[scores={${qc.state}=1}] run title @s actionbar ["",{"text":"${escapeSnbtString(infos[0].desc)}","color":"yellow"}]`,
        `execute as @e[tag=${qc.targetTag},limit=1] at @s as @a[distance=..4,scores={${qc.state}=1}] at @s run function ${ns}:${qc.fnBase}/complete`,
      );
    } else {
      // Count satisfied objectives into the `done` aggregate each tick.
      tick.push(`execute as @a[scores={${qc.state}=1}] run scoreboard players set @s ${qc.done} 0`);
      if (quest.type === 'kill' && infos.some((i) => i.spawnZone)) {
        tick.push(...buildZoneTickLines(ctx, qc, infos));
      }
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
          `execute as @a[scores={${qc.state}=1}] run title @s actionbar ["",{"text":"${escapeSnbtString(infos[0].desc)}","color":"yellow"}]`,
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
          text: STR.acceptQuestButton,
          color: 'green',
          bold: true,
          runCommand: `trigger ${qc.trigger}`,
          hover: STR.acceptQuestHover,
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
          if (info.spawnZone) {
            accept.push(killQuestMobsCommand(info.mobTag));
            accept.push(`scoreboard players set ${info.timerHolder} ${SYS_OBJECTIVE} 0`);
          }
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
        { text: STR.questAccepted, color: 'green' },
        { text: quest.name, color: 'white', bold: true },
      ]),
      tellraw('@s', [
        {
          text:
            objCount === 1
              ? STR.objectiveSingle(infos[0].desc)
              : STR.objectivesMultiple(objCount),
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
        { text: STR.objectiveComplete, color: 'green', bold: true },
        { text: STR.returnToNpc(quest.npc.name), color: 'yellow' },
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
      `execute if score @s ${qc.near} matches 0 run ${tellraw('@s', npcSay(quest.npc.name, STR.readyForReward, 'green'))}`,
      `execute if score @s ${qc.near} matches 0 run ${tellraw('@s', [
        {
          text: STR.turnInQuestButton,
          color: 'gold',
          bold: true,
          runCommand: `trigger ${qc.trigger}`,
          hover: STR.turnInQuestHover,
        },
      ])}`,
      `scoreboard players set @s ${qc.near} 1`,
    ].join('\n') + '\n';

  // ---- turnin.mcfunction ----
  const turnin: string[] = [`# Turn in`, `scoreboard players set @s ${qc.trigger} 0`];
  const consumeInfos = infos.filter((info) => info.consumeOnTurnIn);
  if (consumeInfos.length) {
    // Verify every consuming objective still has its items before removing any.
    for (const info of consumeInfos) {
      turnin.push(
        `execute store result score @s ${info.progress} run clear @s ${info.item} 0`,
        `execute if score @s ${info.progress} matches ..${info.amount - 1} run ${tellraw('@s', [
          { text: STR.deliveryStillNeed(info.amount, info.label), color: 'red' },
        ])}`,
        `execute if score @s ${info.progress} matches ..${info.amount - 1} run return 0`,
      );
    }
    for (const info of consumeInfos) {
      turnin.push(`clear @s ${info.item} ${info.amount}`);
    }
  }
  turnin.push(...completionBody(ctx, qc));
  files[`${qc.fnBase}/turnin.mcfunction`] = turnin.join('\n') + '\n';

  for (let j = 0; j < infos.length; j++) {
    if (!infos[j].spawnZone) continue;
    files[`${qc.fnBase}/spawn_mob_${j}.mcfunction`] = buildSpawnMobFunction(infos[j]);
    files[`${qc.fnBase}/kill_credit_${j}.mcfunction`] = buildKillCreditFunction(ctx, qc, j, infos[j]);
  }

  return files;
}
