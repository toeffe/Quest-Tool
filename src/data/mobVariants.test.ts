import { describe, it, expect } from 'vitest';
import { buildVariantNbt, variantFieldsFor } from './mobVariants';

describe('mob variant NBT', () => {
  it('emits a namespaced registry id for data-driven variants (cat/wolf/pig)', () => {
    expect(buildVariantNbt('minecraft:cat', { variant: 'siamese' })).toEqual([
      'variant:"minecraft:siamese"',
    ]);
    expect(buildVariantNbt('minecraft:pig', { variant: 'cold' })).toEqual([
      'variant:"minecraft:cold"',
    ]);
  });

  it('emits legacy typed fields correctly (int, byte, plain string, bool)', () => {
    expect(buildVariantNbt('minecraft:parrot', { Variant: '2' })).toEqual(['Variant:2']);
    expect(buildVariantNbt('minecraft:sheep', { Color: '14' })).toEqual(['Color:14b']);
    expect(buildVariantNbt('minecraft:fox', { Type: 'snow' })).toEqual(['Type:"snow"']);
    expect(buildVariantNbt('minecraft:creeper', { powered: '1b' })).toEqual(['powered:1b']);
  });

  it('falls back to the first option when no variant is selected', () => {
    expect(buildVariantNbt('minecraft:cat')).toEqual(['variant:"minecraft:tabby"']);
  });

  it('returns nothing for mobs without curated variants', () => {
    expect(variantFieldsFor('minecraft:enderman')).toEqual([]);
    expect(buildVariantNbt('minecraft:enderman')).toEqual([]);
  });
});
