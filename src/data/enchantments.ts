/** Vanilla enchantments for Minecraft Java 1.21.11 custom item components. */
export interface EnchantmentDef {
  id: string;
  label: string;
  maxLevel: number;
}

export const ENCHANTMENTS: EnchantmentDef[] = [
  // Tool / mining
  { id: 'minecraft:efficiency', label: 'Efficiency', maxLevel: 5 },
  { id: 'minecraft:fortune', label: 'Fortune', maxLevel: 3 },
  { id: 'minecraft:silk_touch', label: 'Silk Touch', maxLevel: 1 },
  // Weapon
  { id: 'minecraft:sharpness', label: 'Sharpness', maxLevel: 5 },
  { id: 'minecraft:smite', label: 'Smite', maxLevel: 5 },
  { id: 'minecraft:bane_of_arthropods', label: 'Bane of Arthropods', maxLevel: 5 },
  { id: 'minecraft:knockback', label: 'Knockback', maxLevel: 2 },
  { id: 'minecraft:fire_aspect', label: 'Fire Aspect', maxLevel: 2 },
  { id: 'minecraft:looting', label: 'Looting', maxLevel: 3 },
  { id: 'minecraft:sweeping_edge', label: 'Sweeping Edge', maxLevel: 3 },
  // Bow / crossbow / trident
  { id: 'minecraft:power', label: 'Power', maxLevel: 5 },
  { id: 'minecraft:punch', label: 'Punch', maxLevel: 2 },
  { id: 'minecraft:flame', label: 'Flame', maxLevel: 1 },
  { id: 'minecraft:infinity', label: 'Infinity', maxLevel: 1 },
  { id: 'minecraft:multishot', label: 'Multishot', maxLevel: 1 },
  { id: 'minecraft:quick_charge', label: 'Quick Charge', maxLevel: 3 },
  { id: 'minecraft:piercing', label: 'Piercing', maxLevel: 4 },
  { id: 'minecraft:loyalty', label: 'Loyalty', maxLevel: 3 },
  { id: 'minecraft:channeling', label: 'Channeling', maxLevel: 1 },
  { id: 'minecraft:riptide', label: 'Riptide', maxLevel: 3 },
  { id: 'minecraft:impaling', label: 'Impaling', maxLevel: 5 },
  // Armor
  { id: 'minecraft:protection', label: 'Protection', maxLevel: 4 },
  { id: 'minecraft:fire_protection', label: 'Fire Protection', maxLevel: 4 },
  { id: 'minecraft:blast_protection', label: 'Blast Protection', maxLevel: 4 },
  { id: 'minecraft:projectile_protection', label: 'Projectile Protection', maxLevel: 4 },
  { id: 'minecraft:feather_falling', label: 'Feather Falling', maxLevel: 4 },
  { id: 'minecraft:respiration', label: 'Respiration', maxLevel: 3 },
  { id: 'minecraft:aqua_affinity', label: 'Aqua Affinity', maxLevel: 1 },
  { id: 'minecraft:depth_strider', label: 'Depth Strider', maxLevel: 3 },
  { id: 'minecraft:frost_walker', label: 'Frost Walker', maxLevel: 2 },
  { id: 'minecraft:thorns', label: 'Thorns', maxLevel: 3 },
  { id: 'minecraft:soul_speed', label: 'Soul Speed', maxLevel: 3 },
  { id: 'minecraft:swift_sneak', label: 'Swift Sneak', maxLevel: 3 },
  // Fishing
  { id: 'minecraft:lure', label: 'Lure', maxLevel: 3 },
  { id: 'minecraft:luck_of_the_sea', label: 'Luck of the Sea', maxLevel: 3 },
  // Universal
  { id: 'minecraft:unbreaking', label: 'Unbreaking', maxLevel: 3 },
  { id: 'minecraft:mending', label: 'Mending', maxLevel: 1 },
  { id: 'minecraft:vanishing_curse', label: 'Curse of Vanishing', maxLevel: 1 },
  { id: 'minecraft:binding_curse', label: 'Curse of Binding', maxLevel: 1 },
  { id: 'minecraft:breach', label: 'Breach', maxLevel: 4 },
  { id: 'minecraft:density', label: 'Density', maxLevel: 5 },
  { id: 'minecraft:wind_burst', label: 'Wind Burst', maxLevel: 3 },
];

const byId = new Map(ENCHANTMENTS.map((e) => [e.id, e]));

export const ENCHANTMENT_OPTIONS = ENCHANTMENTS.map((e) => ({
  value: e.id,
  label: e.label,
}));

export function normalizeEnchantmentId(id: string): string {
  const trimmed = id.trim();
  if (!trimmed) return '';
  return trimmed.includes(':') ? trimmed : `minecraft:${trimmed}`;
}

export function getEnchantmentMaxLevel(id: string): number | undefined {
  return byId.get(normalizeEnchantmentId(id))?.maxLevel;
}

export function isKnownEnchantment(id: string): boolean {
  return byId.has(normalizeEnchantmentId(id));
}
