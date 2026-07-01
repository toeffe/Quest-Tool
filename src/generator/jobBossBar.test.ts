import { describe, expect, it } from 'vitest';
import { createProject, createStarterJobs } from '../types/factory';
import { buildContext } from './context';
import {
  buildBossBarExtendVisibilityLines,
  buildBossBarTickLines,
  buildJobBossBarSetupLines,
  buildJobBossBarSupportFiles,
  buildUpdateProgressBarLines,
  MAX_PLAYER_PROGRESS_BARS,
  playerBossBarId,
  QT_BB_UNTIL_OBJECTIVE,
} from './jobBossBar';
import { buildJobsTickFunction, compileJob } from './jobFunctions';

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
    expect(
      lines.some((l) => l.includes(`scoreboard objectives add ${QT_BB_UNTIL_OBJECTIVE}`)),
    ).toBe(true);
    expect(lines.filter((l) => l.includes('bossbar add')).length).toBe(MAX_PLAYER_PROGRESS_BARS);
    expect(lines.some((l) => l.includes('unless score #qt_next_pid'))).toBe(true);
  });

  it('emits shared ensure_pid, hide, and tick functions', () => {
    const ctx = ctxWithJobs();
    const files = buildJobBossBarSupportFiles(ctx);
    expect(files['jobs/ensure_pid.mcfunction']).toContain('assign_pid');
    expect(files['jobs/bossbar_hide_player.mcfunction']).toContain('job_prog_1');
    expect(files['jobs/bossbar_tick.mcfunction']).toContain('bossbar_hide_player');
    expect(files['jobs/bossbar_tick.mcfunction']).toContain(QT_BB_UNTIL_OBJECTIVE);
  });

  it('generates update_progress_bar with bossbar_apply subfunction', () => {
    const ctx = ctxWithJobs();
    const jc = ctx.jobs[0];
    const files = compileJob(ctx, jc);
    const body = files[`${jc.fnBase}/update_progress_bar.mcfunction`];
    expect(body).toContain('ensure_pid');
    expect(body).toContain('bossbar_apply');
    expect(body).toContain(QT_BB_UNTIL_OBJECTIVE);
    expect(files[`${jc.fnBase}/bossbar_apply.mcfunction`]).toContain('job_prog_1');
    expect(files[`${jc.fnBase}/bossbar_apply.mcfunction`]).toContain(jc.job.name);
  });

  it('does not show progress bar on job init', () => {
    const ctx = ctxWithJobs();
    const jc = ctx.jobs[0];
    const files = compileJob(ctx, jc);
    expect(files[`${jc.fnBase}/init.mcfunction`]).not.toContain('update_progress_bar');
    expect(files[`${jc.fnBase}/init.mcfunction`]).not.toContain('bossbar');
  });

  it('extends visibility deadline on update', () => {
    const lines = buildBossBarExtendVisibilityLines();
    expect(lines.some((l) => l.includes('#now'))).toBe(true);
    expect(lines.some((l) => l.includes(QT_BB_UNTIL_OBJECTIVE))).toBe(true);
  });

  it('jobs tick dispatcher calls bossbar_tick', () => {
    const ctx = ctxWithJobs();
    const tick = buildJobsTickFunction(ctx);
    expect(tick).toContain('function bb:jobs/bossbar_tick');
    expect(buildBossBarTickLines(ctx).length).toBeGreaterThan(0);
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
