import { normalizeEntityId } from '../data/mobs';
import { buildVariantNbt } from '../data/mobVariants';
import type {
  CustomMob,
  CustomMobBossBarColor,
  CustomMobEquipmentSlot,
  CustomMobPhaseEffect,
} from '../types/customMob';
import type { Project } from '../types/quest';
import { type CompileContext, namespaced } from './context';
import {
  CUSTOM_MOB_REGISTRY_TAG,
  MC_ATTR_ATTACK_DAMAGE,
  MC_ATTR_MAX_HEALTH,
  MC_ATTR_SCALE,
} from './customMobs';
import { shouldUseDataDrivenVariant, variantSummonSnbtForMob } from './mobSkins';
import { SYS_OBJECTIVE } from './sys';
import { escapeSnbtString, sanitizeMcComment } from './text';

const SYS = SYS_OBJECTIVE;
const SCALE100 = '#qt_mphase_scale100';
const PHASE_INIT_TAG = 'qt_mphase_init';

/** Per-entity score tracking the active phase index (0 = first phase). */
export const QT_MPHASE_OBJECTIVE = 'qt_mphase';

/** Temporary per-entity score for health-percent math during phase checks. */
export const QT_MPHASE_TMP_OBJECTIVE = 'qt_mphase_tmp';

/** Per-entity score for live max-health reads during phase checks. */
export const QT_MPHASE_MAX_OBJECTIVE = 'qt_mphase_max';

const ITEM_REPLACE_SLOT: Record<CustomMobEquipmentSlot, string> = {
  head: 'armor.head',
  chest: 'armor.chest',
  legs: 'armor.legs',
  feet: 'armor.feet',
  mainhand: 'weapon.mainhand',
  offhand: 'weapon.offhand',
};

export interface ResolvedPhaseConfig {
  displayName: string;
  health?: number;
  damage?: number;
  scale?: number;
  glowing?: boolean;
  bossBarColor?: CustomMobBossBarColor;
  variants?: Record<string, string>;
  skinTexture?: string;
  equipment?: CustomMob['equipment'];
  effects: CustomMobPhaseEffect[];
  announceMessage?: string;
}

export function mobHasPhaseTransitions(mob: CustomMob): boolean {
  const phases = mob.phases ?? [];
  return phases.length >= 2 && phases.some((p, i) => i > 0 && p.atHealthPercent != null);
}

export function customMobsUsePhases(project: Project): boolean {
  return (project.customMobs ?? []).some((m) => mobHasPhaseTransitions(m));
}

export function phaseMobs(project: Project): CustomMob[] {
  return (project.customMobs ?? []).filter((m) => mobHasPhaseTransitions(m));
}

function thresholdConst(tag: string, phaseIndex: number): string {
  return `#ph_${tag}_t${phaseIndex}`;
}

function mobSelector(tag: string): string {
  return `@e[tag=${CUSTOM_MOB_REGISTRY_TAG},tag=${tag}]`;
}

function uninittedMobSelector(tag: string, extra = ''): string {
  return `@e[tag=${CUSTOM_MOB_REGISTRY_TAG},tag=${tag},tag=!${PHASE_INIT_TAG}${extra}]`;
}

/** Scale for phase apply: phase 0 uses mob default; later phases only when explicitly set. */
export function resolvePhaseScale(mob: CustomMob, phaseIndex: number): number | undefined {
  const phase = mob.phases?.[phaseIndex];
  if (phaseIndex === 0) return phase?.scale ?? mob.scale;
  return phase?.scale;
}

export function resolvePhaseConfig(mob: CustomMob, phaseIndex: number): ResolvedPhaseConfig {
  const phase = mob.phases?.[phaseIndex];
  return {
    displayName: phase?.displayName ?? mob.displayName ?? mob.name,
    health: phase?.health ?? mob.health,
    damage: phase?.damage ?? mob.damage,
    scale: resolvePhaseScale(mob, phaseIndex),
    glowing: phase?.glowing ?? mob.glowing,
    bossBarColor: phase?.bossBarColor,
    variants: phase?.variants ?? mob.variants,
    skinTexture: phase?.skinTexture ?? mob.skinTexture,
    equipment: phase?.equipment ?? mob.equipment,
    effects: phase?.effects ?? [],
    announceMessage: phase?.announceMessage,
  };
}

export function mobMaxHealthForPhases(mob: CustomMob): number {
  const base = mob.health != null && mob.health > 0 ? mob.health : 20;
  const phase0 = mob.phases?.[0]?.health;
  if (phase0 != null && phase0 > 0) return phase0;
  return base;
}

function displayNameSnbt(name: string): string {
  return `{text:"${escapeSnbtString(name)}",color:"red",bold:true}`;
}

function effectGiveLines(effect: CustomMobPhaseEffect): string {
  const id = namespaced(effect.effectId.trim());
  if (!id || id === 'minecraft:') return '';
  const amp = effect.amplifier ?? 0;
  const duration = effect.duration ?? 0;
  if (duration > 0) {
    return `effect give @s ${id} ${duration} ${amp} true`;
  }
  return `effect give @s ${id} infinite ${amp} true`;
}

function equipmentReplaceLines(config: ResolvedPhaseConfig): string[] {
  const lines: string[] = [];
  for (const entry of config.equipment ?? []) {
    const itemId = namespaced(entry.item.trim());
    if (!itemId || itemId === 'minecraft:') continue;
    const slot = ITEM_REPLACE_SLOT[entry.slot];
    if (!slot) continue;
    lines.push(`item replace entity @s ${slot} with ${itemId}`);
  }
  return lines;
}

function buildHealthPercentLines(mobTag: string): string[] {
  const maxConst = `#boss_${mobTag}_max`;
  return [
    `# Compute health % for @s (0-100): Health*100 / max_health`,
    `execute store result score @s ${QT_MPHASE_TMP_OBJECTIVE} run data get entity @s Health 100`,
    `execute store result score @s ${QT_MPHASE_MAX_OBJECTIVE} run attribute @s ${MC_ATTR_MAX_HEALTH} base get 1`,
    `execute unless score @s ${QT_MPHASE_MAX_OBJECTIVE} matches 1.. run scoreboard players operation @s ${QT_MPHASE_MAX_OBJECTIVE} = ${maxConst} ${SYS}`,
    `execute unless score @s ${QT_MPHASE_MAX_OBJECTIVE} matches 1.. run return 0`,
    `scoreboard players operation @s ${QT_MPHASE_TMP_OBJECTIVE} /= @s ${QT_MPHASE_MAX_OBJECTIVE}`,
  ];
}

function buildApplyPhaseLines(mob: CustomMob, phaseIndex: number, namespace?: string): string[] {
  const config = resolvePhaseConfig(mob, phaseIndex);
  const entity = normalizeEntityId(mob.baseEntity);
  const lines: string[] = [
    `# Apply phase ${phaseIndex + 1}: ${sanitizeMcComment(mob.phases?.[phaseIndex]?.name ?? 'default')}`,
  ];

  lines.push(
    `data merge entity @s {CustomName:${displayNameSnbt(config.displayName)},CustomNameVisible:1b}`,
  );

  if (config.glowing) {
    lines.push('data merge entity @s {Glowing:1b}');
  } else {
    lines.push('data merge entity @s {Glowing:0b}');
  }

  if (namespace && shouldUseDataDrivenVariant(mob, config.skinTexture)) {
    const variantField = variantSummonSnbtForMob(mob, namespace, config.skinTexture);
    if (variantField) {
      lines.push(`data merge entity @s {${variantField}}`);
    }
  } else if (!shouldUseDataDrivenVariant(mob, config.skinTexture)) {
    const variantFields = buildVariantNbt(entity, config.variants);
    if (variantFields.length) {
      lines.push(`data merge entity @s {${variantFields.join(',')}}`);
    }
  }

  if (config.damage != null && config.damage > 0) {
    lines.push(`attribute @s ${MC_ATTR_ATTACK_DAMAGE} base set ${config.damage}`);
  }

  const phaseScale = resolvePhaseScale(mob, phaseIndex);
  if (phaseScale != null && phaseScale > 0) {
    lines.push(`attribute @s ${MC_ATTR_SCALE} base set ${phaseScale}`);
  }

  lines.push(...equipmentReplaceLines(config));

  for (const effect of config.effects) {
    const line = effectGiveLines(effect);
    if (line) lines.push(line);
  }

  return lines;
}

function buildEnterPhaseLines(ctx: CompileContext, mob: CustomMob, phaseIndex: number): string[] {
  const ns = ctx.namespace;
  const config = resolvePhaseConfig(mob, phaseIndex);
  const lines: string[] = [
    `# Enter phase ${phaseIndex + 1} for ${sanitizeMcComment(mob.name)}`,
    `scoreboard players set @s ${QT_MPHASE_OBJECTIVE} ${phaseIndex}`,
  ];

  lines.push(...buildApplyPhaseLines(mob, phaseIndex, ns));

  if (config.announceMessage?.trim()) {
    const msg = escapeSnbtString(config.announceMessage.trim());
    lines.push(`tellraw @a[distance=..48] {"text":"${msg}","color":"gold","bold":true}`);
  }

  if (mob.bossBar) {
    const id = `${ns}:boss_${mob.tag}`;
    const name = escapeSnbtString(config.displayName);
    lines.push(`bossbar set ${id} name {"text":"${name}","color":"red","bold":true}`);
    if (config.bossBarColor) {
      lines.push(`bossbar set ${id} color ${config.bossBarColor}`);
    }
  }

  return lines;
}

function buildPhaseCheckLines(
  ctx: CompileContext,
  mob: CustomMob,
): {
  lines: string[];
  entityLines: string[];
} {
  const ns = ctx.namespace;
  const phases = mob.phases ?? [];
  const tag = mob.tag;
  const lines: string[] = [
    `# Phase checks for ${sanitizeMcComment(mob.displayName || mob.name)}`,
    `execute unless entity ${mobSelector(tag)} run return 0`,
    `execute as ${mobSelector(tag)} run function ${ns}:mobs/phases/${tag}/check_entity`,
  ];

  const entityLines: string[] = [
    `# Auto-init if spawned without datapack init hook (e.g. copied summon command)`,
    `execute unless entity @s[tag=${PHASE_INIT_TAG}] run function ${ns}:mobs/phases/${tag}/init`,
    ...buildHealthPercentLines(tag),
  ];

  for (let i = phases.length - 1; i >= 1; i--) {
    const phase = phases[i];
    if (phase.atHealthPercent == null) continue;
    const thresh = thresholdConst(tag, i);
    const requiredPhase = i - 1;
    entityLines.push(
      `execute if score @s ${QT_MPHASE_TMP_OBJECTIVE} <= ${thresh} ${SYS} if score @s ${QT_MPHASE_OBJECTIVE} matches ${requiredPhase} run function ${ns}:mobs/phases/${tag}/enter_${i}`,
    );
  }

  return { lines, entityLines };
}

/** Lines appended after summon to initialize phase tracking on new entities. */
export function buildMobPhaseInitHook(
  mob: CustomMob,
  namespace: string,
  opts?: { x?: number | string; y?: number | string; z?: number | string; atExecutor?: boolean },
): string[] {
  if (!mobHasPhaseTransitions(mob)) return [];
  const fn = `${namespace}:mobs/phases/${mob.tag}/init`;
  if (opts?.atExecutor) {
    return [
      `execute at @s as ${uninittedMobSelector(mob.tag, ',distance=..4')} run function ${fn}`,
    ];
  }
  if (opts?.x != null && opts?.y != null && opts?.z != null) {
    return [
      `execute positioned ${opts.x} ${opts.y} ${opts.z} as ${uninittedMobSelector(mob.tag, ',distance=..4')} run function ${fn}`,
    ];
  }
  return [`execute as ${uninittedMobSelector(mob.tag, ',distance=..4')} run function ${fn}`];
}

/** One-time setup in load.mcfunction. */
export function buildCustomMobPhaseSetupLines(ctx: CompileContext): string[] {
  const mobs = phaseMobs(ctx.project);
  if (!mobs.length) return [];

  const lines: string[] = [
    `scoreboard objectives add ${QT_MPHASE_OBJECTIVE} dummy`,
    `scoreboard objectives add ${QT_MPHASE_TMP_OBJECTIVE} dummy`,
    `scoreboard objectives add ${QT_MPHASE_MAX_OBJECTIVE} dummy`,
    `scoreboard players set ${SCALE100} ${SYS} 100`,
  ];

  for (const mob of mobs) {
    const max = mobMaxHealthForPhases(mob);
    lines.push(`scoreboard players set #boss_${mob.tag}_max ${SYS} ${max}`);
    for (let i = 1; i < (mob.phases?.length ?? 0); i++) {
      const pct = mob.phases![i].atHealthPercent;
      if (pct == null) continue;
      lines.push(`scoreboard players set ${thresholdConst(mob.tag, i)} ${SYS} ${pct}`);
    }
  }

  return lines;
}

function mobSelectorNearExecutor(tag: string, range = 64): string {
  return `@e[tag=${CUSTOM_MOB_REGISTRY_TAG},tag=${tag},distance=..${range},limit=1,sort=nearest]`;
}

function buildDebugLines(ctx: CompileContext, mob: CustomMob): string[] {
  const ns = ctx.namespace;
  const tag = mob.tag;
  const near = mobSelectorNearExecutor(tag);
  const maxConst = `#boss_${tag}_max`;
  const mobName = escapeSnbtString(mob.displayName || mob.name);
  const thresholds = (mob.phases ?? [])
    .map((p, i) => (i > 0 && p.atHealthPercent != null ? `P${i + 1}<=${p.atHealthPercent}%` : null))
    .filter(Boolean)
    .join(', ');
  return [
    `# Debug nearest ${sanitizeMcComment(mob.name)} phase state (within 64 blocks of you)`,
    `execute unless entity ${near} run tellraw @s [{"text":"No ${escapeSnbtString(tag)} custom mob within 64 blocks.","color":"red"},{"text":" Needs tags questtool_mob + ${escapeSnbtString(tag)}. Use /function ${ns}:spawn_mob/${tag}","color":"gray"}]`,
    `execute store result score #dbg_hp ${SYS} run data get entity ${near} Health 100`,
    `execute store result score #dbg_max ${SYS} run attribute ${near} ${MC_ATTR_MAX_HEALTH} base get 1`,
    `execute unless score #dbg_max ${SYS} matches 1.. run scoreboard players operation #dbg_max ${SYS} = ${maxConst} ${SYS}`,
    `execute unless score #dbg_max ${SYS} matches 1.. run tellraw @s {"text":"Could not read max health for ${mobName}.","color":"red"}`,
    `execute unless score #dbg_max ${SYS} matches 1.. run return 0`,
    `scoreboard players operation #dbg_hp ${SYS} /= #dbg_max ${SYS}`,
    `execute as ${near} store result score #dbg_phase ${SYS} run scoreboard players get @s ${QT_MPHASE_OBJECTIVE}`,
    `tellraw @s ["",{"text":"[${mobName}] ","color":"gold","bold":true},{"text":"HP% ","color":"gray"},{"score":{"name":"#dbg_hp","objective":"${SYS}"},"color":"white"},{"text":" | phase idx ","color":"gray"},{"score":{"name":"#dbg_phase","objective":"${SYS}"},"color":"white"},{"text":" | thresholds: ${escapeSnbtString(thresholds || 'none')}","color":"dark_gray"}]`,
  ];
}

export function buildCustomMobPhaseSupportFiles(ctx: CompileContext): Record<string, string> {
  const mobs = phaseMobs(ctx.project);
  if (!mobs.length) return {};

  const ns = ctx.namespace;
  const files: Record<string, string> = {};

  for (const mob of mobs) {
    const { lines, entityLines } = buildPhaseCheckLines(ctx, mob);
    files[`mobs/phases/${mob.tag}/tick.mcfunction`] = lines.join('\n') + '\n';
    files[`mobs/phases/${mob.tag}/check_entity.mcfunction`] = entityLines.join('\n') + '\n';

    files[`mobs/phases/${mob.tag}/init.mcfunction`] =
      [
        `# Initialize phase tracking for ${sanitizeMcComment(mob.name)}`,
        `scoreboard players set @s ${QT_MPHASE_OBJECTIVE} 0`,
        `tag @s add ${PHASE_INIT_TAG}`,
        ...buildApplyPhaseLines(mob, 0, ns),
      ].join('\n') + '\n';

    for (let i = 1; i < (mob.phases?.length ?? 0); i++) {
      files[`mobs/phases/${mob.tag}/enter_${i}.mcfunction`] =
        buildEnterPhaseLines(ctx, mob, i).join('\n') + '\n';
    }

    files[`mobs/phases/${mob.tag}/debug.mcfunction`] = buildDebugLines(ctx, mob).join('\n') + '\n';
  }

  files['mobs/phases_tick.mcfunction'] =
    [
      '# Check custom mob phase transitions',
      ...mobs.map((mob) => `function ${ns}:mobs/phases/${mob.tag}/tick`),
    ].join('\n') + '\n';

  return files;
}

export function buildCustomMobPhaseTickHook(ctx: CompileContext): string[] {
  if (!customMobsUsePhases(ctx.project)) return [];
  return [`function ${ctx.namespace}:mobs/phases_tick`];
}

export function bossBarNameForMobPhase(mob: CustomMob, phaseIndex: number): string {
  const config = resolvePhaseConfig(mob, phaseIndex);
  const name = escapeSnbtString(config.displayName);
  return `{"text":"${name}","color":"red","bold":true}`;
}

export function bossBarColorForMobPhase(
  mob: CustomMob,
  phaseIndex: number,
): CustomMobBossBarColor | undefined {
  return resolvePhaseConfig(mob, phaseIndex).bossBarColor;
}
