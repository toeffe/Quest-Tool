import { describe, it, expect } from 'vitest';
import { createProject, createJob, createStarterJobs, mergeStarterJobs } from '../types/factory';
import { buildContext } from './context';
import {
  compileJob,
  buildJobLoadLines,
  buildJobsTickFunction,
  buildJobResetLines,
} from './jobFunctions';
import { totalXpForLevel } from '../types/job';
import { createCustomItem } from '../types/factory';

describe('jobFunctions', () => {
  it('registers fishing stat and dummy objectives in load', () => {
    const project = createProject('Jobs');
    project.jobs = [createJob('Fishing', 'fish')];
    project.namespace = 'j';
    const ctx = buildContext(project);
    const jc = ctx.jobs[0];
    const lines = buildJobLoadLines(ctx, jc);
    expect(lines.some((l) => l.includes('j0stat minecraft.custom:minecraft.fish_caught'))).toBe(
      true,
    );
    expect(lines.some((l) => l.includes('j0xp dummy'))).toBe(true);
    expect(lines.some((l) => l.includes('j0lvl dummy'))).toBe(true);
  });

  it('registers multiple mined objectives for mining preset', () => {
    const project = createProject('Jobs');
    project.jobs = [createJob('Mining', 'mine', { statPreset: 'ores' })];
    project.namespace = 'j';
    const ctx = buildContext(project);
    const jc = ctx.jobs[0];
    expect(jc.multiStat).toBe(true);
    const lines = buildJobLoadLines(ctx, jc);
    expect(lines.filter((l) => l.includes('minecraft.mined:')).length).toBeGreaterThan(5);
    const files = compileJob(ctx, jc);
    expect(files['jobs/0_mining/sum_stat.mcfunction']).toBeDefined();
    expect(files['jobs/0_mining/tick.mcfunction']).toContain('sum_stat');
  });

  it('emits tick, credit, check_level, add_xp, and init functions', () => {
    const project = createProject('Jobs');
    project.jobs = [createJob('Fishing', 'fish')];
    project.namespace = 'j';
    const ctx = buildContext(project);
    const jc = ctx.jobs[0];
    const files = compileJob(ctx, jc);

    expect(files['jobs/0_fishing/tick.mcfunction']).toContain('function j:jobs/0_fishing/credit');
    expect(files['jobs/0_fishing/credit.mcfunction']).toContain('j0xp');
    expect(files['jobs/0_fishing/credit.mcfunction']).toContain('function j:jobs/0_fishing/check_level');
    expect(files['jobs/0_fishing/add_xp.mcfunction']).toContain('#j0grant');
    expect(files['jobs/0_fishing/init.mcfunction']).toContain('j0last');
    expect(files['jobs/0_fishing/sync_advancements.mcfunction']).toContain('advancement grant');
    expect(files['jobs/0_fishing/level_up.mcfunction']).toContain('sync_advancements');
  });

  it('emits milestone grant functions when configured', () => {
    const project = createProject('Jobs');
    const item = createCustomItem('collectible', 'Trophy');
    project.customItems = [item];
    project.jobs = [
      createJob('Fishing', 'fish', {
        milestones: [
          {
            level: 5,
            rewards: [{ type: 'item', customItemId: item.id, amount: 1 }],
          },
        ],
      }),
    ];
    project.namespace = 'j';
    const ctx = buildContext(project);
    const files = compileJob(ctx, ctx.jobs[0]);
    expect(files['jobs/0_fishing/milestone_rewards.mcfunction']).toContain('grant_milestone_5');
    expect(files['jobs/0_fishing/grant_milestone_5.mcfunction']).toContain('give @s');
    expect(files['jobs/0_fishing/level_up.mcfunction']).toContain('milestone_rewards');
  });

  it('reset revokes job advancements', () => {
    const project = createProject('Jobs');
    project.jobs = [createJob('Fishing', 'fish')];
    project.namespace = 'j';
    const ctx = buildContext(project);
    const jc = ctx.jobs[0];
    const lines = buildJobResetLines(ctx, jc);
    expect(lines.some((l) => l.includes('advancement revoke @s from j:jobs/0_fishing/root'))).toBe(
      true,
    );
  });

  it('builds jobs tick dispatcher for starter pack', () => {
    const project = createProject('Jobs');
    project.namespace = 'j';
    const ctx = buildContext(project);
    const tick = buildJobsTickFunction(ctx);
    expect(tick).toContain('function j:jobs/0_fishing/tick');
    expect(ctx.jobs.length).toBeGreaterThan(5);
  });

  it('computes flat level thresholds', () => {
    const job = createJob();
    job.xpPerLevel = 100;
    expect(totalXpForLevel(job, 1)).toBe(100);
    expect(totalXpForLevel(job, 5)).toBe(500);
  });

  it('distance jobs set distance_unit in load', () => {
    const project = createProject('Jobs');
    project.jobs = [createJob('Walk', 'walk')];
    project.namespace = 'j';
    const ctx = buildContext(project);
    const lines = buildJobLoadLines(ctx, ctx.jobs[0]);
    expect(lines.some((l) => l.includes('distance_unit'))).toBe(true);
    expect(compileJob(ctx, ctx.jobs[0])['jobs/0_walk/credit.mcfunction']).toContain('distance_unit');
  });
});

describe('starter jobs', () => {
  it('createStarterJobs returns 11 balanced jobs', () => {
    const jobs = createStarterJobs();
    expect(jobs).toHaveLength(11);
    expect(jobs.every((j) => (j.milestones ?? []).length > 0)).toBe(true);
  });

  it('mergeStarterJobs appends missing starters', () => {
    const existing = [createJob('Fishing', 'fish', { starterKey: 'starter_fishing' })];
    const merged = mergeStarterJobs(existing);
    expect(merged.length).toBe(11);
  });
});
