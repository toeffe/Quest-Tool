import { type CustomMob, type CustomMobEquipmentSlot, type CustomMobBossBarColor } from '../types/customMob';
import { type Project } from '../types/quest';
import { toIdentifier } from '../types/ids';
import { normalizeEntityId } from '../data/mobs';
import { buildVariantNbt } from '../data/mobVariants';
import { escapeSnbtString } from './text';
import { namespaced } from './context';
import { buildZoneDropLootTable, type LootTableJson } from './lootTables';
import { buildMobPhaseInitHook, resolvePhaseConfig } from './customMobPhases';

/** Shared entity tag identifying project custom mobs. */
export const CUSTOM_MOB_REGISTRY_TAG = 'questtool_mob';

export function findCustomMob(
  project: Project,
  id: string | undefined,
): CustomMob | undefined {
  if (!id) return undefined;
  return (project.customMobs ?? []).find((m) => m.id === id);
}

export function customMobTags(mob: CustomMob): string[] {
  return ['questtool', CUSTOM_MOB_REGISTRY_TAG, mob.tag];
}

export function customMobAdvancementNbt(mob: CustomMob): string {
  return `{Tags:["${CUSTOM_MOB_REGISTRY_TAG}","${escapeSnbtString(mob.tag)}"]}`;
}

export function customMobLootTablePath(namespace: string, tag: string): string {
  return `data/${namespace}/loot_table/mobs/${tag}.json`;
}

export function customMobLootTableId(namespace: string, tag: string): string {
  return `${namespace}:mobs/${tag}`;
}

function formatCoord(value: number | string): string {
  return typeof value === 'number' ? String(value) : value;
}

function datapackNamespace(project: Project, namespace?: string): string {
  return namespace ?? toIdentifier(project.namespace || project.name, 'questpack');
}

/** 1.21.2+ attribute command ids (generic. prefix removed). */
export const MC_ATTR_MAX_HEALTH = 'minecraft:max_health';
export const MC_ATTR_ATTACK_DAMAGE = 'minecraft:attack_damage';

/** 1.21.5+ entity attribute list (lowercase keys, no generic. prefix). */
function attributeFieldsFromConfig(config: ReturnType<typeof resolvePhaseConfig>): string[] {
  const attrs: string[] = [];
  if (config.health != null && config.health > 0) {
    attrs.push(`{id:"max_health",base:${config.health}}`);
  }
  if (config.damage != null && config.damage > 0) {
    attrs.push(`{id:"attack_damage",base:${config.damage}}`);
  }
  return attrs.length ? [`attributes:[${attrs.join(',')}]`] : [];
}

/** 1.21.5+ equipment map (replaces HandItems / ArmorItems). */
function equipmentFieldsFromConfig(config: ReturnType<typeof resolvePhaseConfig>): string[] {
  const equipment = config.equipment ?? [];
  if (!equipment.length) return [];

  const slotEntries: string[] = [];
  const dropEntries: string[] = [];

  for (const entry of equipment) {
    const itemId = namespaced(entry.item.trim());
    if (!itemId || itemId === 'minecraft:') continue;
    slotEntries.push(`${entry.slot}:{id:"${itemId}",count:1}`);
    dropEntries.push(`${entry.slot}:0.0f`);
  }

  if (!slotEntries.length) return [];
  return [
    `equipment:{${slotEntries.join(',')}}`,
    `drop_chances:{${dropEntries.join(',')}}`,
  ];
}

function summonConfig(mob: CustomMob, phaseIndex?: number) {
  if (mob.phases?.length) {
    return resolvePhaseConfig(mob, phaseIndex ?? 0);
  }
  return resolvePhaseConfig(mob, 0);
}

/** Build a summon command for a project custom mob. */
export function summonCustomMob(
  mob: CustomMob,
  x: number | string,
  y: number | string,
  z: number | string,
  opts?: { deathLootTable?: string; extraTags?: string[]; phaseIndex?: number },
): string {
  const entity = normalizeEntityId(mob.baseEntity);
  const config = summonConfig(mob, opts?.phaseIndex);
  const allTags = [...customMobTags(mob), ...(opts?.extraTags ?? [])];
  const tags = allTags
    .map((t) => `"${escapeSnbtString(t)}"`)
    .join(',');
  const fields = [
    `Tags:[${tags}]`,
    `PersistenceRequired:1b`,
    `CustomNameVisible:1b`,
    `CustomName:{text:"${escapeSnbtString(config.displayName)}"}`,
    ...buildVariantNbt(entity, config.variants),
    ...attributeFieldsFromConfig(config),
    ...equipmentFieldsFromConfig(config),
  ];
  if (config.glowing) fields.push('Glowing:1b');
  if (config.health != null && config.health > 0) {
    fields.push(`Health:${config.health}f`);
  }
  if (opts?.deathLootTable) {
    fields.push(`DeathLootTable:"${opts.deathLootTable}"`);
  }
  return `summon ${entity} ${formatCoord(x)} ${formatCoord(y)} ${formatCoord(z)} {${fields.join(',')}}`;
}

/** Advancement JSON for counting kills of a tagged custom mob. */
export function buildCustomMobKillAdvancement(
  mob: CustomMob,
  namespace: string,
  creditFn: string,
): object {
  return {
    criteria: {
      killed_custom_mob: {
        trigger: 'minecraft:player_killed_entity',
        conditions: {
          entity: {
            type: normalizeEntityId(mob.baseEntity),
            nbt: customMobAdvancementNbt(mob),
          },
        },
      },
    },
    rewards: {
      function: `${namespace}:${creditFn}`,
    },
    requirements: [['killed_custom_mob']],
  };
}

/** Spawn one custom mob in a quest spawn zone (summon + spreadplayers). */
export function spawnCustomMobInZone(
  mob: CustomMob,
  x: number,
  y: number,
  z: number,
  radius: number,
  deathLootTable?: string,
  namespace?: string,
): string[] {
  const entity = normalizeEntityId(mob.baseEntity);
  const spread = Math.max(1, radius);
  const lines = [
    summonCustomMob(mob, x, y, z, { deathLootTable }),
    `spreadplayers ${x} ${z} 1 ${spread} false @e[type=${entity},tag=${mob.tag},distance=..1,limit=1]`,
  ];
  if (namespace) {
    lines.push(...buildMobPhaseInitHook(mob, namespace, { x, y, z }));
  }
  return lines;
}

export function buildCustomMobLootTable(
  project: Project,
  mob: CustomMob,
): LootTableJson | null {
  const drops = mob.drops ?? [];
  if (!drops.length) return null;
  return buildZoneDropLootTable(project, drops);
}

export function buildCustomMobLootTableFiles(
  project: Project,
  namespace: string,
): Record<string, string> {
  const files: Record<string, string> = {};
  for (const mob of project.customMobs ?? []) {
    const table = buildCustomMobLootTable(project, mob);
    if (!table) continue;
    files[customMobLootTablePath(namespace, mob.tag)] =
      JSON.stringify(table, null, 2) + '\n';
  }
  return files;
}

export function resolveCustomMobDeathLootTable(
  mob: CustomMob,
  namespace: string,
): string | undefined {
  if (!mob.drops?.length) return undefined;
  return customMobLootTableId(namespace, mob.tag);
}

export function buildGiveCustomMobsFunction(
  project: Project,
  namespace?: string,
): string | null {
  const mobs = project.customMobs ?? [];
  if (!mobs.length) return null;
  const ns = datapackNamespace(project, namespace);
  const lines = ['# Spawn one of each custom mob in front of the executing player (testing)'];
  for (const mob of mobs) {
    const loot = resolveCustomMobDeathLootTable(mob, ns);
    lines.push(summonCustomMob(mob, '~', '~1', '~', { deathLootTable: loot }));
    lines.push(...buildMobPhaseInitHook(mob, ns, { atExecutor: true }));
  }
  return lines.join('\n') + '\n';
}

export function buildSpawnMobFunctions(
  project: Project,
  namespace?: string,
): Record<string, string> {
  const files: Record<string, string> = {};
  const ns = datapackNamespace(project, namespace);
  for (const mob of project.customMobs ?? []) {
    const loot = resolveCustomMobDeathLootTable(mob, ns);
    const content =
      [
        `# Spawn custom mob "${mob.name}" at the executing player`,
        summonCustomMob(mob, '~', '~1', '~', { deathLootTable: loot }),
        ...buildMobPhaseInitHook(mob, ns, { atExecutor: true }),
      ].join('\n') + '\n';
    files[`spawn_mob/${mob.tag}.mcfunction`] = content;
  }
  return files;
}

/** Human-readable label for kill objectives referencing a custom mob. */
export function customMobDisplayLabel(
  project: Project,
  eliteMobId: string | undefined,
): string {
  if (!eliteMobId) return 'custom mob';
  const mob = findCustomMob(project, eliteMobId);
  return mob?.displayName || mob?.name || 'custom mob';
}

export const EQUIPMENT_SLOT_OPTIONS: { value: CustomMobEquipmentSlot; label: string }[] = [
  { value: 'head', label: 'Head' },
  { value: 'chest', label: 'Chest' },
  { value: 'legs', label: 'Legs' },
  { value: 'feet', label: 'Feet' },
  { value: 'mainhand', label: 'Main hand' },
  { value: 'offhand', label: 'Off hand' },
];

export const BOSS_BAR_COLOR_OPTIONS: { value: CustomMobBossBarColor; label: string }[] = [
  { value: 'red', label: 'Red' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' },
  { value: 'white', label: 'White' },
];
