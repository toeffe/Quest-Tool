import { describe, expect, it } from 'vitest';
import { buildContext } from './context';
import {
  buildJobBossBarSetupLines,
  buildJobBossBarSupportFiles,
  buildUpdateProgressBarLines,
  playerBossBarId,
  MAX_PLAYER_PROGRESS_BARS,
} from './jobBossBar';
import { compileJob } from './jobFunctions';
import { createProject, createStarterJobs } from '../types/factory';

function ctxWithJobs() {
  const project = createProject('BossBar');
  project.jobs = createStarterJobs().slice(0, 1);
  project.namespace = 'bb';
  return buildContext(project);
}

describe('jobBossBar', () => {
  it('uses per-player boss bar ids', () => {
    const ctx = ctxWithJobs();
    expect(playerBossBarId(ctx, 1)).toBe(`${ctx.namespace}:job_prog_1`);
    expect(playerBossBarId(ctx, MAX_PLAYER_PROGRESS_BARS)).toBe(
      `${ctx.namespace}:job_prog_${MAX_PLAYER_PROGRESS_BARS}`,
    );
  });

  it('pre-creates one boss bar per player slot on load', () => {
    const ctx = ctxWithJobs();
    const lines = buildJobBossBarSetupLines(ctx);
    expect(lines.some((l) => l.includes('scoreboard objectives add qt_pid'))).toBe(true);
    expect(lines.filter((l) => l.includes('bossbar add')).length).toBe(MAX_PLAYER_PROGRESS_BARS);
  });

  it('emits shared ensure_pid and macro hide functions', () => {
    const ctx = ctxWithJobs();
    const files = buildJobBossBarSupportFiles(ctx);
    expect(files['jobs/ensure_pid.mcfunction']).toContain('assign_pid');
    expect(files['jobs/bossbar_hide.mcfunction']).toContain('job_prog_$(pid)');
  });

  it('generates per-player update_progress_bar and prog_bar macro', () => {
    const ctx = ctxWithJobs();
    const jc = ctx.jobs[0];
    const files = compileJob(ctx, jc);
    const body = files[`${jc.fnBase}/update_progress_bar.mcfunction`];
    expect(body).toContain('ensure_pid');
    expect(body).toContain('prog_bar with storage');
    expect(files[`${jc.fnBase}/prog_bar.mcfunction`]).toContain('job_prog_$(pid)');
    expect(files[`${jc.fnBase}/prog_bar.mcfunction`]).toContain(jc.job.name);
  });

  it('buildUpdateProgressBarLines returns empty when disabled', () => {
    const ctx = ctxWithJobs();
    const jc = { ...ctx.jobs[0], job: { ...ctx.jobs[0].job, showProgressBar: false } };
    expect(buildUpdateProgressBarLines(ctx, jc)).toEqual([]);
  });

  it('credit calls update_progress_bar when enabled', () => {
    const ctx = ctxWithJobs();
    const jc = ctx.jobs[0];
    const files = compileJob(ctx, jc);
    expect(files[`${jc.fnBase}/credit.mcfunction`]).toContain('update_progress_bar');
  });

  it('credit skips update_progress_bar when disabled', () => {
    const ctx = ctxWithJobs();
    const jc = ctx.jobs[0];
    jc.job.showProgressBar = false;
    const files = compileJob(ctx, jc);
    expect(files[`${jc.fnBase}/credit.mcfunction`]).not.toContain('update_progress_bar');
    expect(files[`${jc.fnBase}/update_progress_bar.mcfunction`]).toBeUndefined();
  });
});
