import { type CompileContext } from './context';
import { type Dimension } from '../types/dimension';
import { toIdentifier } from '../types/ids';
import { type FileMap } from './dungeons';

/** Flat void generator settings — matches vanilla 1.21.11 "The Void" superflat preset. */
export const VOID_FLAT_SETTINGS = {
  biome: 'minecraft:the_void',
  features: true,
  lakes: false,
  layers: [{ block: 'minecraft:air', height: 1 }],
  structure_overrides: [] as string[],
} as const;

/**
 * Minecraft 1.21.11 void dimension JSON.
 * Uses vanilla `minecraft:overworld` dimension type (no custom dimension_type file).
 */
export function buildVoidDimensionJson(): string {
  return (
    JSON.stringify(
      {
        type: 'minecraft:overworld',
        generator: {
          type: 'minecraft:flat',
          settings: VOID_FLAT_SETTINGS,
        },
      },
      null,
      2,
    ) + '\n'
  );
}

export function compileDimensions(ctx: CompileContext): FileMap {
  const files: FileMap = {};
  const dimensions = ctx.project.dimensions ?? [];
  const ns = ctx.namespace;
  const dimensionJson = buildVoidDimensionJson();

  for (const dimension of dimensions) {
    const tag = toIdentifier(dimension.tag, 'dimension');
    files[`data/${ns}/dimension/${tag}.json`] = dimensionJson;
  }

  return files;
}

export function dimensionResourceId(ctx: CompileContext, dimension: Dimension): string {
  const tag = toIdentifier(dimension.tag, 'dimension');
  return `${ctx.namespace}:${tag}`;
}
