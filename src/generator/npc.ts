import { type Coordinates, type Npc, type TargetNpc } from '../types/quest';
import { type QuestContext } from './context';
import { buildVariantNbt } from '../data/mobVariants';
import { escapeSnbtString } from './text';

function professionId(value: string): string {
  const v = (value || 'none').toLowerCase();
  return v.includes(':') ? v : `minecraft:${v}`;
}

/** Ensure an entity id has a namespace, defaulting to a villager if blank. */
function entityId(value: string): string {
  const v = (value || '').trim() || 'minecraft:villager';
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
  variants?: Record<string, string>;
  displayTag: string;
  extraTags: string[];
  position: string;
}): string {
  const entity = entityId(opts.entityType);
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

/** Remove any existing copy of this quest's giver before spawning a fresh one. */
export function killGiverCommand(qc: QuestContext): string {
  return `kill @e[tag=${qc.giverTag}]`;
}

export function killTargetCommand(qc: QuestContext): string {
  return `kill @e[tag=${qc.targetTag}]`;
}

export function spawnGiverCommand(qc: QuestContext): string {
  const npc: Npc = qc.quest.npc;
  return summonNpc({
    entityType: npc.entityType,
    name: npc.name,
    profession: npc.profession,
    variant: npc.variant,
    variants: npc.variants,
    displayTag: qc.npcTag,
    extraTags: [qc.giverTag],
    position: positionFor(npc.spawnMode, npc.coordinates),
  });
}

export function spawnTargetCommand(qc: QuestContext): string | null {
  const target: TargetNpc | undefined = qc.quest.targetNpc;
  if (!target) return null;
  return summonNpc({
    entityType: target.entityType,
    name: target.name,
    profession: 'none',
    variant: 'plains',
    variants: target.variants,
    displayTag: qc.npcTargetTag,
    extraTags: [qc.targetTag],
    position: positionFor(target.spawnMode, target.coordinates),
  });
}

/** Lines for the per-quest spawn function (giver + optional target). */
export function spawnFunctionLines(qc: QuestContext): string[] {
  const lines = [
    `# Spawn NPC(s) for quest: ${qc.quest.name}`,
    killGiverCommand(qc),
    spawnGiverCommand(qc),
  ];
  const target = spawnTargetCommand(qc);
  if (target) {
    lines.push(killTargetCommand(qc), target);
  }
  lines.push(`say [Quest Tool] Spawned NPC(s) for "${qc.quest.name}".`);
  return lines;
}
