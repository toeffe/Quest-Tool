import { describe, expect, it } from 'vitest';
import {
  endpointToSelector,
  padDetectionDistance,
  scopePadDetection,
  scopePadDetectionAt,
} from './coordinates';

describe('coordinates', () => {
  it('enforces minimum detection radius of 1 for selectors', () => {
    const s = endpointToSelector({ x: 10, y: 64, z: 10, radius: 0 });
    expect(s).toEqual({ x: 9, y: 63, z: 9, dx: 2, dy: 2, dz: 2 });
  });

  it('defaults missing radius to 1 (avoids NaN box coords)', () => {
    const s = endpointToSelector({ x: 10, y: 64, z: 10, radius: undefined as unknown as number });
    expect(s).toEqual({ x: 9, y: 63, z: 9, dx: 2, dy: 2, dz: 2 });
    expect(Number.isNaN(s.x)).toBe(false);
  });

  it('adds vertical slack for walking players in pad detection distance', () => {
    expect(padDetectionDistance(1)).toBe(2);
    expect(padDetectionDistance(2)).toBe(3);
  });

  it('wraps pad detection with execute in for every dimension', () => {
    expect(scopePadDetection('minecraft:overworld', 'say hi')).toBe(
      'execute in minecraft:overworld run say hi',
    );
    expect(scopePadDetection('questpack:void', 'say hi')).toBe(
      'execute in questpack:void run say hi',
    );
    expect(scopePadDetectionAt('minecraft:overworld', 0, 64, 0, 'as @a[distance=..2] run say hi')).toBe(
      'execute in minecraft:overworld positioned 0 64 0 as @a[distance=..2] run say hi',
    );
  });
});
