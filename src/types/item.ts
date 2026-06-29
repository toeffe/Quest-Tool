/**
 * Project-level custom item definitions for Minecraft 1.21.11 item components.
 */

export type CustomItemKind = 'general' | 'collectible' | 'food' | 'tool';

export const CUSTOM_ITEM_KIND_LABELS: Record<CustomItemKind, string> = {
  general: 'General',
  collectible: 'Collectible',
  food: 'Food',
  tool: 'Tool',
};

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export interface CustomItemFood {
  nutrition: number;
  saturation: number;
  canAlwaysEat?: boolean;
}

export interface CustomItemConsumableEffect {
  effectId: string;
  amplifier: number;
  duration: number;
}

export interface CustomItemConsumable {
  consumeSeconds?: number;
  effects: CustomItemConsumableEffect[];
}

export interface CustomItemToolRule {
  blocks: string;
  speed: number;
}

export interface CustomItemTool {
  defaultMiningSpeed: number;
  damagePerBlock: number;
  rules: CustomItemToolRule[];
}

export interface CustomItemEnchantment {
  enchantmentId: string;
  level: number;
}

export interface CustomItem {
  id: string;
  /** Editor label. */
  name: string;
  /** Slug stored in custom_data.questtool_id. */
  tag: string;
  kind: CustomItemKind;
  /** Vanilla base item id (e.g. minecraft:stick). */
  baseItem: string;
  displayName: string;
  lore: string[];
  glint?: boolean;
  rarity?: ItemRarity;
  maxStackSize?: number;
  unbreakable?: boolean;
  food?: CustomItemFood;
  consumable?: CustomItemConsumable;
  tool?: CustomItemTool;
  enchantments?: CustomItemEnchantment[];
}
