import { type Coordinates, type Npc, type TargetNpc } from '../types/quest';
import { type QuestContext } from './context';
import { normalizeEntityId } from '../data/mobs';
import { buildVariantNbt } from '../data/mobVariants';
import { escapeSnbtString } from './text';
import { STR } from './strings';

/** Age value that keeps baby mobs from ever growing up. */
const PERMANENT_BABY_AGE = -2147483648;

function professionId(value: string): string {
  const v = (value || 'none').toLowerCase();
  return v.includes(':') ? v : `minecraft:${v}`;
}

/**
 * Build a mob summon command for any 1.21.11 entity used as an NPC.
 * - NoAI keeps the NPC stationary; Invulnerable/Silent/PersistenceRequired make
 *   it a stable, quiet, non-despawning fixture.
 * - For villagers, empty Offers + VillagerData set the look and prevent a trade GUI.
 * - CustomName uses the 1.21.5+ inline component form: CustomName:{text:"..."}.
 * - extraTags binds the entity to its quest so functions can find it reliably.
 */
function summonNpc(opts: {
  entityType: string;
  name: string;
  profession: string;
  variant: string;
  baby?: boolean;
  variants?: Record<string, string>;
  displayTag: string;
  extraTags: string[];
  position: string;
}): string {
  const entity = normalizeEntityId(opts.entityType);
  const tags = ['questtool', opts.displayTag, ...opts.extraTags]
    .map((t) => `"${t}"`)
    .join(',');
  const fields = [
    `Tags:[${tags}]`,
    `NoAI:1b`,
    `Invulnerable:1b`,
    `Silent:1b`,
    `PersistenceRequired:1b`,
    `CustomNameVisible:1b`,
    `CustomName:{text:"${escapeSnbtString(opts.name)}"}`,
  ];
  if (entity === 'minecraft:villager') {
    fields.push(
      `VillagerData:{profession:"${professionId(opts.profession)}",` +
        `type:"${professionId(opts.variant)}",level:2}`,
      `Offers:{Recipes:[]}`,
    );
    if (opts.baby) fields.push(`Age:${PERMANENT_BABY_AGE}`);
  } else {
    fields.push(...buildVariantNbt(entity, opts.variants));
  }
  return `summon ${entity} ${opts.position} {${fields.join(',')}}`;
}

function positionFor(mode: string, coords?: Coordinates): string {
  if (mode === 'fixed' && coords) {
    return `${coords.x} ${coords.y} ${coords.z}`;
  }
  // player / manual: spawn at the command executor's feet.
  return '~ ~ ~';
}

/** Align a freshly spawned NPC with the command executor's facing. */
function faceExecutorCommand(tag: string, position: string): string {
  return `execute at @s rotated as @s run tp @e[tag=${tag},limit=1,sort=nearest] ${position} ~ ~`;
}

/** Remove any existing copy of this quest's giver before spawning a fresh one. */
export function killGiverCommand(qc: QuestContext): string {
  return `kill @e[tag=${qc.giverTag}]`;
}

export function killTargetCommand(qc: QuestContext): string {
  return `kill @e[tag=${qc.targetTag}]`;
}

export function spawnGiverCommand(qc: QuestContext): string[] {
  const npc: Npc = qc.quest.npc;
  const position = positionFor(npc.spawnMode, npc.coordinates);
  return [
    summonNpc({
      entityType: npc.entityType,
      name: npc.name,
      profession: npc.profession,
      variant: npc.variant,
      baby: npc.baby,
      variants: npc.variants,
      displayTag: qc.npcTag,
      extraTags: [qc.giverTag],
      position,
    }),
    faceExecutorCommand(qc.giverTag, position),
  ];
}

export function spawnTargetCommand(qc: QuestContext): string[] | null {
  const target: TargetNpc | undefined = qc.quest.targetNpc;
  if (!target) return null;
  const position = positionFor(target.spawnMode, target.coordinates);
  return [
    summonNpc({
      entityType: target.entityType,
      name: target.name,
      profession: 'none',
      variant: 'plains',
      baby: target.baby,
      variants: target.variants,
      displayTag: qc.npcTargetTag,
      extraTags: [qc.targetTag],
      position,
    }),
    faceExecutorCommand(qc.targetTag, position),
  ];
}

/** Lines for the per-quest spawn function (giver + optional target). */
export function spawnFunctionLines(qc: QuestContext): string[] {
  const lines = [
    `# Spawn NPC(s) for quest: ${qc.quest.name}`,
    killGiverCommand(qc),
    ...spawnGiverCommand(qc),
  ];
  const target = spawnTargetCommand(qc);
  if (target) {
    lines.push(killTargetCommand(qc), ...target);
  }
  lines.push(`say ${STR.npcSpawned(qc.quest.name)}`);
  return lines;
}

/** Remove quest-spawned kill mobs for a given tag. */
export function killQuestMobsCommand(tag: string): string {
  return `kill @e[tag=${tag}]`;
}

/** Max live mobs in a spawn zone. Uses zoneCap when set, otherwise min(amount, 5). */
export function zonePopulationCap(amount: number, zoneCap?: number): number {
  if (zoneCap != null && zoneCap >= 1) return zoneCap;
  return Math.min(Math.max(1, amount), 5);
}

/**
 * Summon one quest mob in the zone and spread it within radius.
 * Mobs keep normal AI; the zone tick pulls them back if they leave the area.
 */
export function spawnOneInZone(
  entityType: string,
  tag: string,
  x: number,
  y: number,
  z: number,
  radius: number,
  deathLootTable?: string,
): string[] {
  const entity = normalizeEntityId(entityType);
  const tags = ['questtool', tag].map((t) => `"${t}"`).join(',');
  const spread = Math.max(1, radius);
  const lootField = deathLootTable ? `,DeathLootTable:"${deathLootTable}"` : '';
  return [
    `summon ${entity} ${x} ${y} ${z} {Tags:[${tags}],PersistenceRequired:1b${lootField}}`,
    `spreadplayers ${x} ${z} 1 ${spread} false @e[type=${entity},tag=${tag},distance=..1,limit=1]`,
  ];
}

/** Pull tagged quest mobs back into the zone if knocked or pushed outside. */
export function containMobsInZone(
  entityType: string,
  tag: string,
  x: number,
  y: number,
  z: number,
  radius: number,
): string[] {
  const entity = normalizeEntityId(entityType);
  const spread = Math.max(1, radius);
  const outsideDist = radius + 1;
  return [
    `execute positioned ${x} ${y} ${z} as @e[type=${entity},tag=${tag},distance=${outsideDist}..] run spreadplayers ${x} ${z} 1 ${spread} false @s`,
  ];
}
