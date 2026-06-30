import { describe, it, expect } from 'vitest';
import { createProject } from '../types/factory';
import { createDimension } from '../types/dimension';
import { buildContext } from './context';
import { buildVoidDimensionJson, compileDimensions } from './dimensions';

describe('dimensions generator', () => {
  it('emits vanilla overworld void dimension JSON without dimension_type file', () => {
    const project = createProject('Test');
    project.namespace = 'questpack';
    const dim = createDimension('Void Realm');
    dim.tag = 'void_realm';
    project.dimensions = [dim];

    const ctx = buildContext(project);
    const files = compileDimensions(ctx);

    const dimPath = 'data/questpack/dimension/void_realm.json';
    expect(files[dimPath]).toBe(buildVoidDimensionJson());
    expect(Object.keys(files).some((p) => p.includes('dimension_type/'))).toBe(false);

    const dimJson = JSON.parse(files[dimPath]);
    expect(dimJson.type).toBe('minecraft:overworld');
    expect(dimJson.generator.type).toBe('minecraft:flat');
    expect(dimJson.generator.settings.biome).toBe('minecraft:the_void');
    expect(dimJson.generator.settings.features).toBe(true);
    expect(dimJson.generator.settings.lakes).toBe(false);
    expect(dimJson.generator.settings.layers).toEqual([
      { block: 'minecraft:air', height: 1 },
    ]);
    expect(dimJson.generator.settings.structure_overrides).toEqual([]);
  });
});
