import type { CustomItem } from '../types/item';
import type { Objective, Project, Reward } from '../types/quest';
import { namespaced } from './context';
import { escapeSnbtString } from './text';

/** SNBT for the stable identity tag on every custom item stack. */
export function customDataSnbt(item: CustomItem): string {
  return `{questtool_id:"${escapeSnbtString(item.tag)}"}`;
}

/** Minimal stack arg for clear/count — only custom_data is required for matching. */
export function buildClearStackArg(item: CustomItem): string {
  return `${namespaced(item.baseItem)}[custom_data=${customDataSnbt(item)}]`;
}

/** Full stack arg with all components for give commands. */
export function buildItemStackArg(item: CustomItem): string {
  const parts: string[] = [`custom_data=${customDataSnbt(item)}`];

  if (item.displayName.trim()) {
    parts.push(`item_name="${escapeSnbtString(item.displayName.trim())}"`);
  }

  const loreLines = item.lore.filter((l) => l.trim());
  if (loreLines.length) {
    const lore = loreLines
      .map((line) => `{text:"${escapeSnbtString(line.trim())}",italic:false}`)
      .join(',');
    parts.push(`lore=[${lore}]`);
  }

  if (item.glint) parts.push('enchantment_glint_override=true');
  if (item.rarity) parts.push(`rarity="${item.rarity}"`);
  if (item.maxStackSize != null && item.maxStackSize > 0) {
    parts.push(`max_stack_size=${item.maxStackSize}`);
  }
  if (item.unbreakable) parts.push('unbreakable={}');

  if (item.enchantments?.length) {
    const levels = item.enchantments
      .map((e) => `"${namespaced(e.enchantmentId)}":${e.level}`)
      .join(',');
    parts.push(`enchantments={levels:{${levels}}}`);
  }

  if (item.food) {
    const f = item.food;
    const foodParts = [`nutrition:${f.nutrition}`, `saturation:${f.saturation}`];
    if (f.canAlwaysEat) foodParts.push('can_always_eat:true');
    parts.push(`food={${foodParts.join(',')}}`);
  }

  if (item.consumable) {
    const c = item.consumable;
    const consumableParts: string[] = [];
    if (c.consumeSeconds != null) {
      consumableParts.push(`consume_seconds:${c.consumeSeconds}`);
    }
    if (c.effects.length) {
      const effects = c.effects.map((e) => {
        const id = namespaced(e.effectId);
        return `{id:"${id}",amplifier:${e.amplifier},duration:${e.duration}}`;
      });
      consumableParts.push(
        `on_consume_effects:[{type:"minecraft:apply_effects",effects:[${effects.join(',')}]}]`,
      );
    }
    if (consumableParts.length) {
      parts.push(`consumable={${consumableParts.join(',')}}`);
    }
  }

  if (item.tool) {
    const t = item.tool;
    const rules = t.rules.map((r) => {
      const blocks = r.blocks.includes(':') ? r.blocks : `minecraft:${r.blocks}`;
      return `{blocks:"${escapeSnbtString(blocks)}",speed:${r.speed}}`;
    });
    parts.push(
      `tool={default_mining_speed:${t.defaultMiningSpeed},damage_per_block:${t.damagePerBlock},rules:[${rules.join(',')}]}`,
    );
  }

  return `${namespaced(item.baseItem)}[${parts.join(',')}]`;
}

export function buildGiveCommand(item: CustomItem, target: string, amount: number): string {
  return `give ${target} ${buildItemStackArg(item)} ${amount}`;
}

export function findCustomItem(project: Project, id: string | undefined): CustomItem | undefined {
  if (!id) return undefined;
  return (project.customItems ?? []).find((i) => i.id === id);
}

export function resolveObjectiveStack(project: Project, objective: Objective): string | null {
  if (objective.customItemId) {
    const item = findCustomItem(project, objective.customItemId);
    return item ? buildClearStackArg(item) : null;
  }
  if (objective.target?.trim()) {
    return namespaced(objective.target.trim());
  }
  return null;
}

export function resolveRewardStack(
  project: Project,
  reward: Reward,
): { stack: string; customItem?: CustomItem } | null {
  if (reward.type !== 'item') return null;
  if (reward.customItemId) {
    const item = findCustomItem(project, reward.customItemId);
    if (!item) return null;
    return { stack: buildItemStackArg(item), customItem: item };
  }
  const value = (reward.value ?? '').trim();
  if (!value) return null;
  return { stack: namespaced(value) };
}

/** Human-readable label for quest messages (delivery errors, etc.). */
export function itemDisplayLabel(project: Project, objective: Objective): string {
  if (objective.customItemId) {
    const item = findCustomItem(project, objective.customItemId);
    return item?.displayName || item?.name || 'custom item';
  }
  return objective.target ?? 'item';
}

export function buildGiveCustomItemsFunction(project: Project): string | null {
  const items = project.customItems ?? [];
  if (!items.length) return null;
  const lines = ['# Give one of each custom item (for testing)'];
  for (const item of items) {
    lines.push(buildGiveCommand(item, '@s', 1));
  }
  return lines.join('\n') + '\n';
}
