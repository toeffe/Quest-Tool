import { describe, it, expect } from 'vitest';
import { getBalancedDefaults, applyBalancedDefaults, actionsToReachLevel } from './jobBalance';
import { type Job } from '../types/job';

describe('jobBalance', () => {
  it('returns defaults per action', () => {
    expect(getBalancedDefaults('fish')).toEqual({ xpPerAction: 10, xpPerLevel: 100, maxLevel: 50 });
    expect(getBalancedDefaults('pvp').maxLevel).toBe(20);
    expect(getBalancedDefaults('walk').distanceUnit).toBe(1000);
  });

  it('applyBalancedDefaults preserves name', () => {
    const job: Job = {
      id: '1',
      name: 'Test',
      action: 'combat',
      xpPerAction: 1,
      xpPerLevel: 1,
      maxLevel: 1,
      showActionBar: true,
    };
    const next = applyBalancedDefaults(job);
    expect(next.name).toBe('Test');
    expect(next.xpPerAction).toBe(8);
    expect(next.maxLevel).toBe(50);
  });

  it('actionsToReachLevel uses flat curve', () => {
    const job: Job = {
      id: '1',
      name: 'Fish',
      action: 'fish',
      xpPerAction: 10,
      xpPerLevel: 100,
      maxLevel: 50,
      showActionBar: false,
    };
    expect(actionsToReachLevel(job, 1)).toBe(10);
    expect(actionsToReachLevel(job, 2)).toBe(20);
  });
});
