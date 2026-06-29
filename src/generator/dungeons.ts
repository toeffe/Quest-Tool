import {
  type Dungeon,
  type RoomTrigger,
  type BoundingBox,
  normalizeBounds,
} from '../types/dungeon';
import { type CompileContext } from './context';
import { toIdentifier } from '../types/ids';
import { normalizeEntityId } from '../data/mobs';
import { summonCustomMob, customMobLootTableId } from './customMobs';
import { tellraw, escapeSnbtString } from './text';

export type FileMap = Record<string, string>;

export interface DungeonRoomContext {
  dungeon: Dungeon;
  room: import('../types/dungeon').DungeonRoom;
  dungeonIndex: number;
  roomIndex: number;
  roomSlug: string;
  mobTag: string;
  occObjective: string;
  visObjective: string;
  mobsObjective: string;
  fnBase: string;
}

export function boundsToSelector(box: BoundingBox): {
  x: number;
  y: number;
  z: number;
  dx: number;
  dy: number;
  dz: number;
} {
  const b = normalizeBounds(box);
  return {
    x: b.x1,
    y: b.y1,
    z: b.z1,
    dx: b.x2 - b.x1,
    dy: b.y2 - b.y1,
    dz: b.z2 - b.z1,
  };
}

export function boundsCenter(box: BoundingBox): { x: number; y: number; z: number } {
  const b = normalizeBounds(box);
  return {
    x: (b.x1 + b.x2) / 2,
    y: (b.y1 + b.y2) / 2,
    z: (b.z1 + b.z2) / 2,
  };
}

function roomSelector(rc: DungeonRoomContext): string {
  const s = boundsToSelector(rc.room.bounds);
  return `@a[x=${s.x},y=${s.y},z=${s.z},dx=${s.dx},dy=${s.dy},dz=${s.dz}]`;
}

export function buildDungeonRoomContexts(ctx: CompileContext): DungeonRoomContext[] {
  const dungeons = ctx.project.dungeons ?? [];
  const out: DungeonRoomContext[] = [];
  dungeons.forEach((dungeon, di) => {
    dungeon.rooms.forEach((room, ri) => {
      const roomSlug = toIdentifier(room.name, `room_${di}_${ri}`);
      const prefix = `dr${di}r${ri}`;
      out.push({
        dungeon,
        room,
        dungeonIndex: di,
        roomIndex: ri,
        roomSlug,
        mobTag: `questtool_room_${prefix}`,
        occObjective: `${prefix}_occ`,
        visObjective: `${prefix}_vis`,
        mobsObjective: `${prefix}_mobs`,
        fnBase: `dungeons/${toIdentifier(dungeon.tag, `dungeon_${di}`)}/rooms/${roomSlug}`,
      });
    });
  });
  return out;
}

export function buildDungeonLoadLines(ctx: CompileContext): string[] {
  const lines: string[] = [];
  for (const rc of buildDungeonRoomContexts(ctx)) {
    lines.push(`scoreboard objectives add ${rc.occObjective} dummy`);
    lines.push(`scoreboard objectives add ${rc.visObjective} dummy`);
    lines.push(`scoreboard objectives add ${rc.mobsObjective} dummy`);
  }
  return lines;
}

export function buildDungeonInitCalls(ctx: CompileContext): string[] {
  const dungeons = ctx.project.dungeons ?? [];
  return dungeons.map(
    (d) => `function ${ctx.namespace}:dungeons/${toIdentifier(d.tag, 'dungeon')}/init`,
  );
}

function questStateObjective(ctx: CompileContext, questName: string): string | undefined {
  return ctx.byName.get(questName)?.state;
}

function buildTriggerActionLines(
  ctx: CompileContext,
  rc: DungeonRoomContext,
  trigger: RoomTrigger,
): string[] {
  const roomSel = roomSelector(rc);
  const action = trigger.action;
  switch (action.type) {
    case 'set_quest_state': {
      const stateObj = questStateObjective(ctx, action.questName);
      if (!stateObj) return [`# Missing quest: ${action.questName}`];
      return [`scoreboard players set ${roomSel} ${stateObj} ${action.state}`];
    }
    case 'dialogue': {
      const target = action.targets === 'all' ? '@a' : roomSel;
      return [tellraw(target, [{ text: action.message, color: 'yellow' }])];
    }
    case 'unlock_chest':
      return [`data merge block ${action.x} ${action.y} ${action.z} {Lock:""}`];
    case 'custom_command': {
      const cmd = action.command.replace(/\{player\}/g, roomSel);
      return [cmd.startsWith('/') ? cmd.slice(1) : cmd];
    }
    default:
      return [];
  }
}

function buildTriggerFunction(
  ctx: CompileContext,
  rc: DungeonRoomContext,
  triggers: RoomTrigger[],
): string[] {
  const lines: string[] = [`# Triggers for ${rc.room.name}`];
  for (const trigger of triggers) {
    const actionLines = buildTriggerActionLines(ctx, rc, trigger);
    if (!actionLines.length) continue;
    if (trigger.fireOnce) {
      lines.push(
        `execute if score #vis ${rc.visObjective} matches 0 run function ${ctx.namespace}:${rc.fnBase}/trigger_${trigger.id.slice(0, 8)}`,
      );
      continue;
    }
    lines.push(...actionLines);
  }
  return lines;
}

function buildSingleTriggerFn(
  ctx: CompileContext,
  rc: DungeonRoomContext,
  trigger: RoomTrigger,
): string {
  const lines = buildTriggerActionLines(ctx, rc, trigger);
  if (trigger.fireOnce) {
    return [...lines, `scoreboard players set #vis ${rc.visObjective} 1`].join('\n') + '\n';
  }
  return lines.join('\n') + '\n';
}

export function buildRoomSpawnFunction(ctx: CompileContext, rc: DungeonRoomContext): string {
  const center = boundsCenter(rc.room.bounds);
  const lines: string[] = [`# Spawn maintenance for ${rc.room.name}`];

  for (const spawn of rc.room.spawns) {
    const holder = `#spawn_${spawn.id.slice(0, 8)}`;
    let entityType: string;
    let summonLine: string;

    if (spawn.sourceType === 'customMob' && spawn.customMobId) {
      const mob = ctx.customMobsById.get(spawn.customMobId);
      if (!mob) continue;
      entityType = normalizeEntityId(mob.baseEntity);
      const lootId = mob.drops?.length
        ? customMobLootTableId(ctx.namespace, mob.tag)
        : undefined;
      summonLine = summonCustomMob(mob, center.x, center.y, center.z, {
        deathLootTable: lootId,
        extraTags: [rc.mobTag],
      });
    } else {
      entityType = normalizeEntityId(spawn.vanillaEntity ?? 'minecraft:zombie');
      summonLine = `summon ${entityType} ${center.x} ${center.y} ${center.z} {Tags:["questtool","${escapeSnbtString(rc.mobTag)}"],PersistenceRequired:1b}`;
    }

    lines.push(
      `execute store result score ${holder} ${rc.mobsObjective} run execute if entity @e[tag=${rc.mobTag},type=${entityType}]`,
      `execute if score ${holder} ${rc.mobsObjective} matches ..${spawn.count - 1} run ${summonLine}`,
    );
  }

  return lines.join('\n') + '\n';
}

export function buildRoomDespawnFunction(rc: DungeonRoomContext): string {
  return `kill @e[tag=${rc.mobTag}]\n`;
}

export function buildRoomOnEntryFunction(
  ctx: CompileContext,
  rc: DungeonRoomContext,
): string {
  const triggers = rc.room.triggers.filter((t) => t.event === 'on_entry');
  const lines = buildTriggerFunction(ctx, rc, triggers);
  if (rc.room.spawns.some((s) => s.spawnOnEntry)) {
    lines.push(`function ${ctx.namespace}:${rc.fnBase}/spawn`);
  }
  return (lines.length ? lines : ['# No on_entry triggers']).join('\n') + '\n';
}

export function buildRoomOnExitFunction(
  ctx: CompileContext,
  rc: DungeonRoomContext,
): string {
  const triggers = rc.room.triggers.filter((t) => t.event === 'on_exit');
  const lines = buildTriggerFunction(ctx, rc, triggers);
  return (lines.length ? lines : ['# No on_exit triggers']).join('\n') + '\n';
}

export function buildRoomOnAllKilledFunction(
  ctx: CompileContext,
  rc: DungeonRoomContext,
): string {
  const triggers = rc.room.triggers.filter((t) => t.event === 'on_all_mobs_killed');
  const lines = buildTriggerFunction(ctx, rc, triggers);
  return (lines.length ? lines : ['# No on_all_killed triggers']).join('\n') + '\n';
}

export function buildRoomTickFunction(ctx: CompileContext, rc: DungeonRoomContext): string {
  const s = boundsToSelector(rc.room.bounds);
  const ns = ctx.namespace;
  const lines: string[] = [
    `# Tick for ${rc.room.name}`,
    `scoreboard players set #prev ${rc.occObjective} 0`,
    `execute if entity @a[x=${s.x},y=${s.y},z=${s.z},dx=${s.dx},dy=${s.dy},dz=${s.dz}] run scoreboard players set #prev ${rc.occObjective} 1`,
    `execute if score #occ ${rc.occObjective} matches 0 if score #prev ${rc.occObjective} matches 1 run function ${ns}:${rc.fnBase}/on_entry`,
    `execute if score #occ ${rc.occObjective} matches 1 if score #prev ${rc.occObjective} matches 0 run function ${ns}:${rc.fnBase}/on_exit`,
    `scoreboard players operation #occ ${rc.occObjective} = #prev ${rc.occObjective}`,
    `execute if score #occ ${rc.occObjective} matches 1 run function ${ns}:${rc.fnBase}/spawn`,
    `execute store result score #alive ${rc.mobsObjective} run execute if entity @e[tag=${rc.mobTag}]`,
    `execute if score #alive ${rc.mobsObjective} matches 0 if score #occ ${rc.occObjective} matches 1 run function ${ns}:${rc.fnBase}/on_all_killed`,
  ];

  for (const trigger of rc.room.triggers.filter((t) => t.event === 'on_quest_complete')) {
    const questName =
      rc.room.questGate?.questName ??
      (trigger.action.type === 'set_quest_state' ? trigger.action.questName : undefined);
    const stateObj = questName ? questStateObjective(ctx, questName) : undefined;
    if (!stateObj) continue;
    if (trigger.fireOnce) {
      lines.push(
        `execute if score #vis ${rc.visObjective} matches 0 if score #occ ${rc.occObjective} matches 1 if entity ${roomSelector(rc)}[scores={${stateObj}=3}] run function ${ns}:${rc.fnBase}/trigger_${trigger.id.slice(0, 8)}`,
      );
    } else {
      lines.push(
        `execute if score #occ ${rc.occObjective} matches 1 if entity ${roomSelector(rc)}[scores={${stateObj}=3}] run function ${ns}:${rc.fnBase}/on_quest_complete_${trigger.id.slice(0, 8)}`,
      );
    }
  }

  return lines.join('\n') + '\n';
}

function buildRoomTickCall(ctx: CompileContext, rc: DungeonRoomContext): string {
  const s = boundsToSelector(rc.room.bounds);
  const ns = ctx.namespace;
  const gate = rc.room.questGate;
  if (gate) {
    const stateObj = questStateObjective(ctx, gate.questName);
    if (!stateObj) return `function ${ns}:${rc.fnBase}/tick`;
    return `execute as @a if score @s ${stateObj} matches ${gate.requiredState} if entity @s[x=${s.x},y=${s.y},z=${s.z},dx=${s.dx},dy=${s.dy},dz=${s.dz}] run function ${ns}:${rc.fnBase}/tick`;
  }
  return `execute if entity @a[x=${s.x},y=${s.y},z=${s.z},dx=${s.dx},dy=${s.dy},dz=${s.dz}] run function ${ns}:${rc.fnBase}/tick`;
}

export function buildDungeonsTickFunction(ctx: CompileContext): string {
  const rooms = buildDungeonRoomContexts(ctx);
  if (!rooms.length) return '# No dungeons\n';
  return [`# Dungeon room ticks`, ...rooms.map((rc) => buildRoomTickCall(ctx, rc))].join('\n') + '\n';
}

export function buildDungeonInitFunction(ctx: CompileContext, dungeon: Dungeon): string {
  const rooms = buildDungeonRoomContexts(ctx).filter((rc) => rc.dungeon.id === dungeon.id);
  const lines: string[] = [`# Init ${dungeon.name}`];
  for (const rc of rooms) {
    lines.push(`scoreboard players set #occ ${rc.occObjective} 0`);
    lines.push(`scoreboard players set #vis ${rc.visObjective} 0`);
    lines.push(`scoreboard players set #alive ${rc.mobsObjective} 0`);
    if (rc.room.spawns.some((s) => !s.spawnOnEntry)) {
      lines.push(`function ${ctx.namespace}:${rc.fnBase}/spawn`);
    }
  }
  return lines.join('\n') + '\n';
}

export function buildDungeonResetFunction(ctx: CompileContext, dungeon: Dungeon): string {
  const rooms = buildDungeonRoomContexts(ctx).filter((rc) => rc.dungeon.id === dungeon.id);
  const lines: string[] = [`# Reset ${dungeon.name}`];
  for (const rc of rooms) {
    lines.push(`function ${ctx.namespace}:${rc.fnBase}/despawn`);
    lines.push(`scoreboard players set #occ ${rc.occObjective} 0`);
    lines.push(`scoreboard players set #vis ${rc.visObjective} 0`);
    lines.push(`scoreboard players set #alive ${rc.mobsObjective} 0`);
  }
  return lines.join('\n') + '\n';
}

export function compileDungeons(ctx: CompileContext): FileMap {
  const files: FileMap = {};
  const dungeons = ctx.project.dungeons ?? [];
  if (!dungeons.length) return files;

  const ns = ctx.namespace;
  const fnRoot = `data/${ns}/function`;

  files[`${fnRoot}/dungeons/tick.mcfunction`] = buildDungeonsTickFunction(ctx);

  for (const dungeon of dungeons) {
    const dungeonTag = toIdentifier(dungeon.tag, 'dungeon');
    const base = `${fnRoot}/dungeons/${dungeonTag}`;
    files[`${base}/init.mcfunction`] = buildDungeonInitFunction(ctx, dungeon);
    files[`${base}/reset.mcfunction`] = buildDungeonResetFunction(ctx, dungeon);
  }

  for (const rc of buildDungeonRoomContexts(ctx)) {
    const base = `${fnRoot}/${rc.fnBase}`;
    files[`${base}/tick.mcfunction`] = buildRoomTickFunction(ctx, rc);
    files[`${base}/spawn.mcfunction`] = buildRoomSpawnFunction(ctx, rc);
    files[`${base}/despawn.mcfunction`] = buildRoomDespawnFunction(rc);
    files[`${base}/on_entry.mcfunction`] = buildRoomOnEntryFunction(ctx, rc);
    files[`${base}/on_exit.mcfunction`] = buildRoomOnExitFunction(ctx, rc);
    files[`${base}/on_all_killed.mcfunction`] = buildRoomOnAllKilledFunction(ctx, rc);

    for (const trigger of rc.room.triggers) {
      if (trigger.fireOnce) {
        files[`${base}/trigger_${trigger.id.slice(0, 8)}.mcfunction`] =
          buildSingleTriggerFn(ctx, rc, trigger);
      }
      if (trigger.event === 'on_quest_complete') {
        files[`${base}/on_quest_complete_${trigger.id.slice(0, 8)}.mcfunction`] =
          buildTriggerFunction(ctx, rc, [trigger]).join('\n') + '\n';
      }
    }
  }

  return files;
}

export function buildDungeonCommandEntries(ctx: CompileContext): {
  command: string;
  description: string;
}[] {
  const entries: { command: string; description: string }[] = [];
  for (const dungeon of ctx.project.dungeons ?? []) {
    const tag = toIdentifier(dungeon.tag, 'dungeon');
    entries.push({
      command: `/function ${ctx.namespace}:dungeons/${tag}/init`,
      description: `Initialize dungeon "${dungeon.name}"`,
    });
    entries.push({
      command: `/function ${ctx.namespace}:dungeons/${tag}/reset`,
      description: `Reset dungeon "${dungeon.name}"`,
    });
    for (const rc of buildDungeonRoomContexts(ctx).filter((r) => r.dungeon.id === dungeon.id)) {
      entries.push({
        command: `/function ${ctx.namespace}:${rc.fnBase}/spawn`,
        description: `Force-spawn mobs in "${rc.room.name}"`,
      });
      entries.push({
        command: `/function ${ctx.namespace}:${rc.fnBase}/despawn`,
        description: `Despawn mobs in "${rc.room.name}"`,
      });
    }
  }
  return entries;
}
