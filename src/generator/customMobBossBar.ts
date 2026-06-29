import { type CompileContext } from './context';
import { type CustomMob } from '../types/customMob';
import { type Project } from '../types/quest';
import { CUSTOM_MOB_REGISTRY_TAG } from './customMobs';
import {
  bossBarColorForMobPhase,
  bossBarNameForMobPhase,
  mobMaxHealthForPhases,
  QT_MPHASE_OBJECTIVE,
} from './customMobPhases';
import { SYS_OBJECTIVE } from './sys';
import { escapeSnbtString } from './text';

const SYS = SYS_OBJECTIVE;
const BOSSBAR_SCALE = 1000;
const BOSSBAR_VIEW_DISTANCE = 64;

export function customMobsUseBossBar(project: Project): boolean {
  return (project.customMobs ?? []).some((m) => m.bossBar);
}

export function customMobBossBarId(namespace: string, tag: string): string {
  return `${namespace}:boss_${tag}`;
}

function bossBarMobs(project: Project): CustomMob[] {
  return (project.customMobs ?? []).filter((m) => m.bossBar);
}

function maxHealthConst(tag: string): string {
  return `#boss_${tag}_max`;
}

function currentHealthConst(tag: string): string {
  return `#boss_${tag}_hp`;
}

function valueConst(tag: string): string {
  return `#boss_${tag}_val`;
}

function mobMaxHealth(mob: CustomMob): number {
  return mobMaxHealthForPhases(mob);
}

function mobSelector(tag: string): string {
  return `@e[tag=${CUSTOM_MOB_REGISTRY_TAG},tag=${tag}]`;
}

function mobSelectorOne(tag: string): string {
  return `@e[tag=${CUSTOM_MOB_REGISTRY_TAG},tag=${tag},limit=1,sort=nearest]`;
}

function bossBarNameJson(mob: CustomMob): string {
  const name = escapeSnbtString(mob.displayName || mob.name);
  return `{"text":"${name}","color":"red","bold":true}`;
}

function buildCustomMobBossBarUpdateLines(ctx: CompileContext, mob: CustomMob): string[] {
  const ns = ctx.namespace;
  const id = customMobBossBarId(ns, mob.tag);
  const max = maxHealthConst(mob.tag);
  const hp = currentHealthConst(mob.tag);
  const val = valueConst(mob.tag);
  const selector = mobSelector(mob.tag);
  const one = mobSelectorOne(mob.tag);
  const phaseCount = mob.phases?.length ?? 1;

  const lines: string[] = [
    `# Boss bar: ${mob.displayName || mob.name}`,
    `execute unless entity ${selector} run bossbar set ${id} visible false`,
    `execute unless entity ${selector} run return 0`,
    `execute store result score ${hp} ${SYS} run data get entity ${one} Health`,
    `scoreboard players operation ${val} ${SYS} = ${hp} ${SYS}`,
    `scoreboard players operation ${val} ${SYS} *= #qt_mob_bb_scale ${SYS}`,
    `scoreboard players operation ${val} ${SYS} /= ${max} ${SYS}`,
    `execute store result bossbar ${id} value run scoreboard players get ${val} ${SYS}`,
    `execute at ${one} run bossbar set ${id} players @a[distance=..${BOSSBAR_VIEW_DISTANCE}]`,
    `execute at ${one} run bossbar set ${id} visible true`,
  ];

  if (phaseCount > 1 && mob.bossBar) {
    lines.push(
      `execute as ${one} store result score #phase_read ${SYS} run scoreboard players get @s ${QT_MPHASE_OBJECTIVE}`,
    );
    for (let i = 0; i < phaseCount; i++) {
      lines.push(
        `execute if score #phase_read ${SYS} matches ${i} run bossbar set ${id} name ${bossBarNameForMobPhase(mob, i)}`,
      );
      const color = bossBarColorForMobPhase(mob, i);
      if (color) {
        lines.push(
          `execute if score #phase_read ${SYS} matches ${i} run bossbar set ${id} color ${color}`,
        );
      }
    }
  }

  return lines;
}

/** One-time boss bar setup in load.mcfunction. */
export function buildCustomMobBossBarSetupLines(ctx: CompileContext): string[] {
  const mobs = bossBarMobs(ctx.project);
  if (!mobs.length) return [];

  const lines: string[] = [
    `scoreboard players set #qt_mob_bb_scale ${SYS} ${BOSSBAR_SCALE}`,
  ];

  for (const mob of mobs) {
    const id = customMobBossBarId(ctx.namespace, mob.tag);
    const max = maxHealthConst(mob.tag);
    lines.push(
      `bossbar add ${id} ${bossBarNameJson(mob)}`,
      `bossbar set ${id} max ${BOSSBAR_SCALE}`,
      `bossbar set ${id} color red`,
      `bossbar set ${id} style notched_10`,
      `bossbar set ${id} visible false`,
      `scoreboard players set ${max} ${SYS} ${mobMaxHealth(mob)}`,
    );
  }

  return lines;
}

/** Per-mob boss bar tick functions and dispatcher. */
export function buildCustomMobBossBarSupportFiles(ctx: CompileContext): Record<string, string> {
  const mobs = bossBarMobs(ctx.project);
  if (!mobs.length) return {};

  const ns = ctx.namespace;
  const files: Record<string, string> = {};

  for (const mob of mobs) {
    files[`mobs/bossbar/${mob.tag}.mcfunction`] =
      buildCustomMobBossBarUpdateLines(ctx, mob).join('\n') + '\n';
  }

  files['mobs/bossbar_tick.mcfunction'] =
    [
      '# Update custom mob boss bars',
      ...mobs.map((mob) => `function ${ns}:mobs/bossbar/${mob.tag}`),
    ].join('\n') + '\n';

  return files;
}

/** Hook for root tick.mcfunction. */
export function buildCustomMobBossBarTickHook(ctx: CompileContext): string[] {
  if (!customMobsUseBossBar(ctx.project)) return [];
  return [`function ${ctx.namespace}:mobs/bossbar_tick`];
}
