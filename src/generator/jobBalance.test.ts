import { describe, expect, it } from 'vitest';
import { createJob } from '../types/factory';
import type { Job, JobAction } from '../types/job';
import {
  actionsToReachLevel,
  actionsToReachMaxLevel,
  applyBalancedDefaults,
  getBalancedDefaults,
} from './jobBalance';

function balancedJob(action: JobAction): Job {
  const d = getBalancedDefaults(action);
  return {
    id: '1',
    name: 'Test',
    action,
    xpPerAction: d.xpPerAction,
    xpPerLevel: d.xpPerLevel,
    maxLevel: d.maxLevel,
    distanceUnit: d.distanceUnit,
    showActionBar: false,
  };
}

describe('jobBalance', () => {
  it('returns defaults per action', () => {
    expect(getBalancedDefaults('fish')).toEqual({ xpPerAction: 8, xpPerLevel: 1000, maxLevel: 50 });
    expect(getBalancedDefaults('pvp').maxLevel).toBe(25);
    expect(getBalancedDefaults('walk').distanceUnit).toBe(2100);
    expect(getBalancedDefaults('sprint').distanceUnit).toBe(2500);
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
    expect(next.xpPerAction).toBe(6);
    expect(next.maxLevel).toBe(50);
  });

  it('actionsToReachLevel uses flat curve', () => {
    const job: Job = {
      id: '1',
      name: 'Fish',
      action: 'fish',
      xpPerAction: 8,
      xpPerLevel: 1000,
      maxLevel: 50,
      showActionBar: false,
    };
    expect(actionsToReachLevel(job, 1)).toBe(125);
    expect(actionsToReachLevel(job, 2)).toBe(250);
  });

  it('grind-heavy jobs require 5000+ actions to max', () => {
    for (const action of ['fish', 'combat', 'hunt'] as const) {
      expect(actionsToReachMaxLevel(balancedJob(action))).toBeGreaterThanOrEqual(5000);
    }
  });

  it('farmable jobs require 12000+ actions to max', () => {
    for (const action of ['mine', 'woodcut', 'farm'] as const) {
      expect(actionsToReachMaxLevel(balancedJob(action))).toBeGreaterThanOrEqual(12000);
    }
  });

  it('walk and sprint require ~50+ hours at 4 blocks/sec', () => {
    const blocksPerSecond = 4;
    const secondsPerHour = 3600;
    const minHours = 50;

    for (const action of ['walk', 'sprint'] as const) {
      const job = balancedJob(action);
      const distanceUnits = actionsToReachMaxLevel(job);
      const unitCm = job.distanceUnit ?? 1000;
      const totalCm = distanceUnits * unitCm;
      const totalBlocks = totalCm / 100;
      const hours = totalBlocks / blocksPerSecond / secondsPerHour;
      expect(hours).toBeGreaterThanOrEqual(minHours);
    }
  });

  it('createJob uses balanced defaults', () => {
    const job = createJob('Fishing', 'fish');
    expect(job.xpPerAction).toBe(8);
    expect(job.xpPerLevel).toBe(1000);
    expect(actionsToReachMaxLevel(job)).toBeGreaterThanOrEqual(5000);
  });
});
