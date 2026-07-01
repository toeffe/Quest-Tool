/**
 * Minecraft 1.21.5+ data-driven mob variant registries (Java Edition).
 * Custom skins use these registries + a bundled resource pack texture.
 */

import { normalizeEntityId } from './mobs';

export type MobVariantModel = 'normal' | 'cold' | 'warm';

export interface MobVariantRegistryEntry {
  /** Datapack folder under data/<namespace>/, e.g. pig_variant */
  registryFolder: string;
  /** Subfolder under assets/<ns>/textures/entity/ */
  textureFolder: string;
  /** Requires model field in variant JSON (pig, cow, chicken, zombie_nautilus). */
  model?: MobVariantModel;
  /** Wolf uses assets.angry/tame/wild instead of asset_id. */
  wolfAssets?: boolean;
  /** Cat supports baby_asset_id (reuse adult texture in v1). */
  babyTexture?: boolean;
}

const REGISTRY: Record<string, MobVariantRegistryEntry> = {
  'minecraft:cat': {
    registryFolder: 'cat_variant',
    textureFolder: 'cat',
    babyTexture: true,
  },
  'minecraft:chicken': {
    registryFolder: 'chicken_variant',
    textureFolder: 'chicken',
    model: 'normal',
    babyTexture: true,
  },
  'minecraft:cow': {
    registryFolder: 'cow_variant',
    textureFolder: 'cow',
    model: 'normal',
    babyTexture: true,
  },
  'minecraft:frog': {
    registryFolder: 'frog_variant',
    textureFolder: 'frog',
  },
  'minecraft:pig': {
    registryFolder: 'pig_variant',
    textureFolder: 'pig',
    model: 'normal',
    babyTexture: true,
  },
  'minecraft:wolf': {
    registryFolder: 'wolf_variant',
    textureFolder: 'wolf',
    wolfAssets: true,
    babyTexture: true,
  },
  'minecraft:zombie_nautilus': {
    registryFolder: 'zombie_nautilus_variant',
    textureFolder: 'zombie_nautilus',
    model: 'normal',
  },
};

export function variantRegistryForEntity(baseEntity: string): MobVariantRegistryEntry | null {
  return REGISTRY[normalizeEntityId(baseEntity)] ?? null;
}

export function supportsCustomSkin(baseEntity: string): boolean {
  return variantRegistryForEntity(baseEntity) != null;
}

/** Variant registry id, e.g. myquest:undead_boar */
export function variantId(namespace: string, mobTag: string): string {
  return `${namespace}:${mobTag}`;
}

/** asset_id path without namespace prefix for textures, e.g. myquest:entity/pig/undead_boar */
export function variantAssetId(namespace: string, textureFolder: string, mobTag: string): string {
  return `${namespace}:entity/${textureFolder}/${mobTag}`;
}

/** Resource pack texture path relative to pack root. */
export function texturePathForSkin(
  namespace: string,
  textureFolder: string,
  mobTag: string,
): string {
  return `assets/${namespace}/textures/entity/${textureFolder}/${mobTag}.png`;
}

/** Datapack variant JSON path relative to datapack root. */
export function variantJsonPath(namespace: string, registryFolder: string, mobTag: string): string {
  return `data/${namespace}/${registryFolder}/${mobTag}.json`;
}
