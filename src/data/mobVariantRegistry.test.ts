import { describe, expect, it } from 'vitest';
import {
  supportsCustomSkin,
  texturePathForSkin,
  variantAssetId,
  variantId,
  variantJsonPath,
} from './mobVariantRegistry';

describe('mobVariantRegistry', () => {
  it('supports variant-capable entities', () => {
    expect(supportsCustomSkin('minecraft:pig')).toBe(true);
    expect(supportsCustomSkin('minecraft:wolf')).toBe(true);
    expect(supportsCustomSkin('minecraft:zombie')).toBe(false);
  });

  it('builds consistent variant and texture paths', () => {
    expect(variantId('myquest', 'undead_boar')).toBe('myquest:undead_boar');
    expect(variantAssetId('myquest', 'pig', 'undead_boar')).toBe('myquest:entity/pig/undead_boar');
    expect(variantJsonPath('myquest', 'pig_variant', 'undead_boar')).toBe(
      'data/myquest/pig_variant/undead_boar.json',
    );
    expect(texturePathForSkin('myquest', 'pig', 'undead_boar')).toBe(
      'assets/myquest/textures/entity/pig/undead_boar.png',
    );
  });
});
