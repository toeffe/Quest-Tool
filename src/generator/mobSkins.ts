import {
  variantAssetId,
  variantId,
  variantJsonPath,
  variantRegistryForEntity,
} from '../data/mobVariantRegistry';
import type { CustomMob } from '../types/customMob';
import { toIdentifier } from '../types/ids';
import type { Project } from '../types/quest';

function datapackNamespace(project: Project, namespace?: string): string {
  return namespace ?? toIdentifier(project.namespace || project.name, 'questpack');
}

/** True when a skin texture should emit a data-driven variant. */
export function hasCustomSkin(skinTexture?: string, baseEntity?: string): boolean {
  if (!skinTexture?.trim() || !baseEntity) return false;
  return variantRegistryForEntity(baseEntity) != null;
}

/** SNBT fragment for summon / data merge, e.g. variant:"myquest:undead_boar" */
export function variantSummonSnbt(namespace: string, mobTag: string): string {
  return `variant:"${variantId(namespace, mobTag)}"`;
}

/**
 * Spawn conditions that never match natural spawning (moon brightness is always 0–1).
 * No extra datapack files — avoids invalid biome refs and empty tag edge cases.
 * Custom skins apply only via explicit variant NBT on summon (Quest Tool custom mobs).
 */
export function summonOnlySpawnConditions(): object[] {
  return [
    {
      condition: {
        type: 'minecraft:moon_brightness',
        range: 2.0,
      },
      priority: 0,
    },
  ];
}

/** Mob-level skin or first phase override used for variant JSON + resource pack PNG. */
export function effectiveSkinTexture(mob: CustomMob): string | undefined {
  if (mob.skinTexture?.trim()) return mob.skinTexture;
  for (const phase of mob.phases ?? []) {
    if (phase.skinTexture?.trim()) return phase.skinTexture;
  }
  return undefined;
}

function buildVariantJson(namespace: string, mob: CustomMob): object | null {
  const registry = variantRegistryForEntity(mob.baseEntity);
  const skin = effectiveSkinTexture(mob);
  if (!registry || !skin) return null;

  const asset = variantAssetId(namespace, registry.textureFolder, mob.tag);
  const spawnConditions = summonOnlySpawnConditions();

  if (registry.wolfAssets) {
    return {
      assets: {
        angry: asset,
        tame: asset,
        wild: asset,
      },
      baby_assets: {
        angry: asset,
        tame: asset,
        wild: asset,
      },
      spawn_conditions: spawnConditions,
    };
  }

  const body: Record<string, unknown> = {
    asset_id: asset,
    spawn_conditions: spawnConditions,
  };

  if (registry.model) {
    body.model = registry.model;
  }

  if (registry.babyTexture) {
    body.baby_asset_id = asset;
  }

  return body;
}

/** Collect mob variant JSON files for the datapack (paths relative to datapack root). */
export function buildMobVariantFiles(project: Project, namespace?: string): Record<string, string> {
  const ns = datapackNamespace(project, namespace);
  const files: Record<string, string> = {};
  const seen = new Set<string>();

  for (const mob of project.customMobs ?? []) {
    if (!effectiveSkinTexture(mob)) continue;
    const registry = variantRegistryForEntity(mob.baseEntity);
    if (!registry) continue;

    const path = variantJsonPath(ns, registry.registryFolder, mob.tag);
    if (seen.has(path)) continue;
    seen.add(path);

    const json = buildVariantJson(ns, mob);
    if (!json) continue;
    files[path] = JSON.stringify(json, null, 2) + '\n';
  }

  return files;
}

/** Mobs that contribute a skin texture to the resource pack. */
export function mobsWithSkinTextures(project: Project): CustomMob[] {
  return (project.customMobs ?? []).filter((m) => {
    if (!effectiveSkinTexture(m)) return false;
    return variantRegistryForEntity(m.baseEntity) != null;
  });
}

export function projectHasSkinTextures(project: Project): boolean {
  return mobsWithSkinTextures(project).length > 0;
}

/** Whether summon should use data-driven variant. */
export function shouldUseDataDrivenVariant(mob: CustomMob, skinTexture?: string): boolean {
  return hasCustomSkin(skinTexture ?? mob.skinTexture, mob.baseEntity);
}

export function variantSummonSnbtForMob(
  mob: CustomMob,
  namespace: string,
  skinTexture?: string,
): string | null {
  const skin = skinTexture ?? mob.skinTexture;
  if (!hasCustomSkin(skin, mob.baseEntity)) return null;
  return variantSummonSnbt(namespace, mob.tag);
}
