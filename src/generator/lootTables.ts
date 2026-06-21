import { type CustomItem } from '../types/item';
import { type Project, type ZoneDrop, type ZoneDropMode } from '../types/quest';
import { namespaced } from './context';
import { findCustomItem } from './items';

export type LootTableJson = Record<string, unknown>;

export function emptyLootTablePath(namespace: string): string {
  return `data/${namespace}/loot_table/empty.json`;
}

export function zoneDropLootTablePath(
  namespace: string,
  questFnBase: string,
  objIndex: number,
): string {
  return `data/${namespace}/loot_table/quests/${questFnBase}/mob_drops_${objIndex}.json`;
}

/** Shared empty entity loot table (minecraft:empty was removed in 1.21). */
export function buildEmptyEntityLootTable(): LootTableJson {
  return { type: 'minecraft:entity', pools: [] };
}

/** Loot table id for DeathLootTable on summon, or undefined for vanilla mob drops. */
export function resolveDeathLootTableRef(
  mode: ZoneDropMode | undefined,
  namespace: string,
  questFnBase: string,
  objIndex: number,
): string | undefined {
  if (!mode || mode === 'vanilla') return undefined;
  if (mode === 'none') return `${namespace}:empty`;
  return `${namespace}:quests/${questFnBase}/mob_drops_${objIndex}`;
}

/** JSON components for minecraft:set_components on custom item drops. */
export function customItemComponentsJson(item: CustomItem): Record<string, unknown> {
  const components: Record<string, unknown> = {
    'minecraft:custom_data': { questtool_id: item.tag },
  };

  if (item.displayName.trim()) {
    components['minecraft:item_name'] = item.displayName.trim();
  }

  const loreLines = item.lore.filter((l) => l.trim());
  if (loreLines.length) {
    components['minecraft:lore'] = loreLines.map((line) => ({
      text: line.trim(),
      italic: false,
    }));
  }

  if (item.glint) components['minecraft:enchantment_glint_override'] = true;
  if (item.rarity) components['minecraft:rarity'] = item.rarity;
  if (item.maxStackSize != null && item.maxStackSize > 0) {
    components['minecraft:max_stack_size'] = item.maxStackSize;
  }
  if (item.unbreakable) components['minecraft:unbreakable'] = {};

  if (item.food) {
    const f = item.food;
    const food: Record<string, unknown> = {
      nutrition: f.nutrition,
      saturation: f.saturation,
    };
    if (f.canAlwaysEat) food.can_always_eat = true;
    components['minecraft:food'] = food;
  }

  if (item.consumable) {
    const c = item.consumable;
    const consumable: Record<string, unknown> = {};
    if (c.consumeSeconds != null) consumable.consume_seconds = c.consumeSeconds;
    if (c.effects.length) {
      consumable.on_consume_effects = [
        {
          type: 'minecraft:apply_effects',
          effects: c.effects.map((e) => ({
            id: namespaced(e.effectId),
            amplifier: e.amplifier,
            duration: e.duration,
          })),
        },
      ];
    }
    if (Object.keys(consumable).length) {
      components['minecraft:consumable'] = consumable;
    }
  }

  if (item.tool) {
    const t = item.tool;
    components['minecraft:tool'] = {
      default_mining_speed: t.defaultMiningSpeed,
      damage_per_block: t.damagePerBlock,
      rules: t.rules.map((r) => ({
        blocks: r.blocks.includes(':') ? r.blocks : `minecraft:${r.blocks}`,
        speed: r.speed,
      })),
    };
  }

  return components;
}

function dropEntry(
  project: Project,
  drop: ZoneDrop,
): Record<string, unknown> | null {
  const amount = Math.max(1, drop.amount ?? 1);
  const chance = drop.chance ?? 100;

  let name: string;
  const functions: Record<string, unknown>[] = [
    { function: 'minecraft:set_count', count: amount },
  ];

  if (drop.customItemId) {
    const item = findCustomItem(project, drop.customItemId);
    if (!item) return null;
    name = namespaced(item.baseItem);
    functions.push({
      function: 'minecraft:set_components',
      components: customItemComponentsJson(item),
    });
  } else if (drop.target?.trim()) {
    name = namespaced(drop.target.trim());
  } else {
    return null;
  }

  const entry: Record<string, unknown> = {
    type: 'minecraft:item',
    name,
    functions,
  };

  if (chance < 100) {
    entry.conditions = [
      { condition: 'minecraft:random_chance', chance: chance / 100 },
    ];
  }

  return entry;
}

/** Entity loot table with one pool per drop so multiple items can drop independently. */
export function buildZoneDropLootTable(
  project: Project,
  drops: ZoneDrop[],
): LootTableJson {
  const pools: Record<string, unknown>[] = [];

  for (const drop of drops) {
    const entry = dropEntry(project, drop);
    if (!entry) continue;
    pools.push({
      rolls: 1,
      entries: [entry],
    });
  }

  return { type: 'minecraft:entity', pools };
}

export function needsEmptyLootTable(
  quests: { type: string; objectives: { spawnZone?: boolean; zoneDropMode?: ZoneDropMode }[] }[],
): boolean {
  for (const quest of quests) {
    if (quest.type !== 'kill' && quest.type !== 'gather') continue;
    for (const o of quest.objectives) {
      if (o.spawnZone && o.zoneDropMode === 'none') return true;
    }
  }
  return false;
}
