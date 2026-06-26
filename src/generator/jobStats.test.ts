import { describe, it, expect } from 'vitest';
import { type Job, type JobAction } from '../types/job';
import {
  resolveJobStatCriteria,
  jobUsesMultiStat,
  defaultPresetForAction,
} from './jobStats';

function job(partial: Partial<Job> & { action: JobAction }): Job {
  const { action, ...rest } = partial;
  return {
    id: 'j',
    name: 'Test',
    xpPerAction: 10,
    xpPerLevel: 100,
    maxLevel: 50,
    showActionBar: false,
    action,
    ...rest,
  };
}

describe('jobStats', () => {
  it('resolves simple custom stat', () => {
    const criteria = resolveJobStatCriteria(job({ action: 'fish' }));
    expect(criteria).toEqual(['minecraft.custom:minecraft.fish_caught']);
    expect(jobUsesMultiStat(job({ action: 'fish' }))).toBe(false);
  });

  it('resolves mining ores preset to multiple mined criteria', () => {
    const j = job({ action: 'mine', statPreset: 'ores' });
    const criteria = resolveJobStatCriteria(j);
    expect(criteria.length).toBeGreaterThan(5);
    expect(criteria[0]).toMatch(/^minecraft\.mined:minecraft\./);
    expect(criteria).toContain('minecraft.mined:minecraft.coal_ore');
    expect(criteria.some((c) => c.includes('minecraft:minecraft:'))).toBe(false);
    expect(jobUsesMultiStat(j)).toBe(true);
  });

  it('resolves woodcut, farm, and craft presets with dotted resource ids', () => {
    const wood = resolveJobStatCriteria(job({ action: 'woodcut', statPreset: 'logs' }));
    expect(wood[0]).toBe('minecraft.mined:minecraft.oak_log');

    const farm = resolveJobStatCriteria(job({ action: 'farm', statPreset: 'crops' }));
    expect(farm[0]).toBe('minecraft.mined:minecraft.wheat');

    const craft = resolveJobStatCriteria(job({ action: 'craft', statPreset: 'basic_crafts' }));
    expect(craft[0]).toBe('minecraft.crafted:minecraft.bread');
  });

  it('resolves single target hunt', () => {
    const criteria = resolveJobStatCriteria(
      job({ action: 'hunt', statPreset: 'single', statTarget: 'minecraft:zombie' }),
    );
    expect(criteria).toEqual(['minecraft.killed:minecraft.zombie']);
  });

  it('resolves custom criterion', () => {
    const criteria = resolveJobStatCriteria(
      job({ action: 'custom', customCriterion: 'minecraft.custom:minecraft.jump' }),
    );
    expect(criteria).toEqual(['minecraft.custom:minecraft.jump']);
  });

  it('defaults presets by action', () => {
    expect(defaultPresetForAction('mine')).toBe('ores');
    expect(defaultPresetForAction('woodcut')).toBe('logs');
  });

  it('resolves walk distance stat', () => {
    const criteria = resolveJobStatCriteria(job({ action: 'walk' }));
    expect(criteria).toEqual(['minecraft.custom:minecraft.walk_one_cm']);
  });
});
