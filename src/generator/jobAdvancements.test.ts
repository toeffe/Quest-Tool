import { describe, expect, it } from 'vitest';
import { createProject } from '../types/factory';
import { buildContext } from './context';
import {
  buildJobAdvancementFiles,
  buildJobRevokeAdvancementLines,
  buildJobSyncAdvancementLines,
  jobAdvancementId,
  normalizeAdvancementBackground,
} from './jobAdvancements';

describe('jobAdvancements', () => {
  it('emits root and level chain with impossible criteria', () => {
    const project = createProject('Adv', 'en');
    project.namespace = 'adv';
    project.jobs![0].maxLevel = 3;
    const ctx = buildContext(project);
    const jc = ctx.jobs[0];
    const files = buildJobAdvancementFiles(ctx, jc);

    expect(Object.keys(files)).toHaveLength(4);
    expect(files['data/adv/advancement/jobs/0_fishing/root.json']).toBeDefined();

    const root = JSON.parse(files['data/adv/advancement/jobs/0_fishing/root.json']);
    expect(root.criteria.unlock.trigger).toBe('minecraft:impossible');
    expect(root.display.title.text).toBe('Fishing');
    expect(root.display.background).toBe('minecraft:gui/advancements/backgrounds/husbandry');

    const level2 = JSON.parse(files['data/adv/advancement/jobs/0_fishing/level_2.json']);
    expect(level2.parent).toBe(jobAdvancementId(ctx, jc, 'level_1'));
    expect(level2.display.title.text).toContain('Level 2');
  });

  it('level_1 parent is root', () => {
    const project = createProject('Adv', 'en');
    project.namespace = 'adv';
    project.jobs![0].maxLevel = 2;
    const ctx = buildContext(project);
    const jc = ctx.jobs[0];
    const files = buildJobAdvancementFiles(ctx, jc);
    const level1 = JSON.parse(files['data/adv/advancement/jobs/0_fishing/level_1.json']);
    expect(level1.parent).toBe(jobAdvancementId(ctx, jc, 'root'));
  });

  it('sync always grants root and levels up to current score', () => {
    const project = createProject('Adv', 'en');
    project.namespace = 'adv';
    project.jobs![0].maxLevel = 2;
    const ctx = buildContext(project);
    const jc = ctx.jobs[0];
    const lines = buildJobSyncAdvancementLines(ctx, jc);
    expect(lines).toContain(`advancement grant @s only ${jobAdvancementId(ctx, jc, 'root')}`);
    expect(lines.some((l) => l.includes('level_1'))).toBe(true);
    expect(lines.some((l) => l.includes('level_2'))).toBe(true);
    expect(lines.some((l) => l.includes('matches 2..'))).toBe(true);
  });

  it('revoke uses from root to clear branch', () => {
    const project = createProject('Adv', 'en');
    project.namespace = 'adv';
    const ctx = buildContext(project);
    const jc = ctx.jobs[0];
    const lines = buildJobRevokeAdvancementLines(ctx, jc);
    expect(lines[0]).toContain('advancement revoke @s from adv:jobs/0_fishing/root');
  });

  it('normalizes legacy background paths to 1.21.11 ids', () => {
    expect(
      normalizeAdvancementBackground(
        'minecraft:textures/gui/advancements/backgrounds/husbandry.png',
      ),
    ).toBe('minecraft:gui/advancements/backgrounds/husbandry');
  });

  it('uses custom advancement background on root', () => {
    const project = createProject('Adv', 'en');
    project.namespace = 'adv';
    project.jobs![0].advancementBackground = 'minecraft:gui/advancements/backgrounds/end';
    const ctx = buildContext(project);
    const jc = ctx.jobs[0];
    const files = buildJobAdvancementFiles(ctx, jc);
    const root = JSON.parse(files['data/adv/advancement/jobs/0_fishing/root.json']);
    expect(root.display.background).toBe('minecraft:gui/advancements/backgrounds/end');
  });

  it('uses custom level title template', () => {
    const project = createProject('Adv', 'en');
    project.namespace = 'adv';
    const job = project.jobs![0];
    job.maxLevel = 1;
    job.levelTitle = '{name} rank {n}';
    const ctx = buildContext(project);
    const jc = ctx.jobs[0];
    const files = buildJobAdvancementFiles(ctx, jc);
    const level1 = JSON.parse(files['data/adv/advancement/jobs/0_fishing/level_1.json']);
    expect(level1.display.title.text).toBe('Fishing rank 1');
  });
});
