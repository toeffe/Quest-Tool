import { describe, expect, it } from 'vitest';
import { createCustomMob, createProject } from '../types/factory';
import { summonCustomMob } from './customMobs';
import { buildMobVariantFiles, summonOnlySpawnConditions, variantSummonSnbt } from './mobSkins';

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('mobSkins generator', () => {
  const mob = {
    ...createCustomMob('Undead Boar'),
    tag: 'undead_boar',
    baseEntity: 'minecraft:pig',
    displayName: 'Undead Boar',
    skinTexture: TINY_PNG,
  };

  it('emits pig_variant JSON with asset_id and model', () => {
    const project = createProject();
    project.namespace = 'testpack';
    project.customMobs = [mob];
    const files = buildMobVariantFiles(project, 'testpack');
    expect(files['data/testpack/pig_variant/undead_boar.json']).toBeDefined();
    const json = JSON.parse(files['data/testpack/pig_variant/undead_boar.json']);
    expect(json.asset_id).toBe('testpack:entity/pig/undead_boar');
    expect(json.model).toBe('normal');
    expect(json.spawn_conditions).toEqual(summonOnlySpawnConditions());
    expect(json.spawn_conditions[0].condition.type).toBe('minecraft:moon_brightness');
    expect(json.spawn_conditions[0].condition.range).toBe(2.0);
    expect(files['data/testpack/tags/worldgen/biome/questtool_never_spawn.json']).toBeUndefined();
  });

  it('variantSummonSnbt uses namespace and mob tag', () => {
    expect(variantSummonSnbt('testpack', 'undead_boar')).toBe('variant:"testpack:undead_boar"');
  });

  it('summonCustomMob includes variant when skin and namespace provided', () => {
    const cmd = summonCustomMob(mob, '~', '~1', '~', { namespace: 'testpack' });
    expect(cmd).toContain('variant:"testpack:undead_boar"');
    expect(cmd).not.toContain('variant:"minecraft:');
  });

  it('emits variant JSON when only a phase has skinTexture', () => {
    const phaseOnly = {
      ...createCustomMob('Phase Skin Boar'),
      tag: 'phase_skin_boar',
      baseEntity: 'minecraft:pig',
      skinTexture: undefined,
      phases: [
        {
          id: 'p1',
          name: 'Phase 1',
          thresholdPercent: 100,
          skinTexture: TINY_PNG,
        },
      ],
    };
    const project = createProject();
    project.namespace = 'testpack';
    project.customMobs = [phaseOnly];
    const files = buildMobVariantFiles(project, 'testpack');
    expect(files['data/testpack/pig_variant/phase_skin_boar.json']).toBeDefined();
  });
});
