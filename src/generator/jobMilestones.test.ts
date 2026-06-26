import { describe, it, expect } from 'vitest';
import { createProject, createCustomItem, createJob } from '../types/factory';
import { buildContext } from './context';
import { jobMilestoneRewardCommands } from './jobMilestones';

describe('jobMilestones', () => {
  it('emits give for custom item rewards', () => {
    const project = createProject('M');
    const item = createCustomItem('collectible', 'Angler Trophy');
    project.customItems = [item];
    project.jobs = [createJob()];
    const ctx = buildContext(project);
    const lines = jobMilestoneRewardCommands(ctx, [
      { type: 'item', customItemId: item.id, amount: 1 },
    ]);
    expect(lines.some((l) => l.startsWith('give @s'))).toBe(true);
    expect(lines[0]).toContain('custom_data');
  });

  it('emits xp and vanilla item commands', () => {
    const project = createProject('M');
    project.jobs = [createJob()];
    const ctx = buildContext(project);
    const lines = jobMilestoneRewardCommands(ctx, [
      { type: 'xp', amount: 25 },
      { type: 'item', value: 'minecraft:diamond', amount: 2 },
    ]);
    expect(lines).toContain('xp add @s 25 points');
    expect(lines.some((l) => l.includes('minecraft:diamond'))).toBe(true);
  });
});
