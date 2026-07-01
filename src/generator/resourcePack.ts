import { texturePathForSkin, variantRegistryForEntity } from '../data/mobVariantRegistry';
import { toIdentifier } from '../types/ids';
import type { Project } from '../types/quest';
import { effectiveSkinTexture, mobsWithSkinTextures } from './mobSkins';

/** Resource pack format for Minecraft 1.21.11. */
export const RESOURCE_PACK_FORMAT = 75;

function datapackNamespace(project: Project, namespace?: string): string {
  return namespace ?? toIdentifier(project.namespace || project.name, 'questpack');
}

function buildPackMeta(description: string): string {
  return (
    JSON.stringify(
      {
        pack: {
          description,
          min_format: RESOURCE_PACK_FORMAT,
          max_format: RESOURCE_PACK_FORMAT,
        },
      },
      null,
      2,
    ) + '\n'
  );
}

/** Decode a PNG data URL to raw bytes for the ZIP. */
export function decodePngDataUrl(dataUrl: string): Uint8Array | null {
  const match = /^data:image\/png;base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) return null;
  try {
    const binary = atob(match[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

/**
 * Resource pack files (paths relative to resourcepack/ root).
 * Binary values are Uint8Array; text values are strings.
 */
export type ResourcePackFileMap = Record<string, string | Uint8Array>;

export function buildResourcePackFiles(project: Project, namespace?: string): ResourcePackFileMap {
  const ns = datapackNamespace(project, namespace);
  const files: ResourcePackFileMap = {};
  const mobs = mobsWithSkinTextures(project);
  if (!mobs.length) return files;

  files['pack.mcmeta'] = buildPackMeta(`${project.name} - Quest Tool MC mob skins`);

  for (const mob of mobs) {
    const registry = variantRegistryForEntity(mob.baseEntity);
    const skin = effectiveSkinTexture(mob);
    if (!registry || !skin) continue;

    const bytes = decodePngDataUrl(skin);
    if (!bytes) continue;

    files[texturePathForSkin(ns, registry.textureFolder, mob.tag)] = bytes;
  }

  return files;
}

export function projectNeedsResourcePack(project: Project): boolean {
  return Object.keys(buildResourcePackFiles(project)).length > 0;
}
