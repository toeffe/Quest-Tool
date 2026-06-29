import { describe, expect, it } from 'vitest';
import { buildContext } from './context';
import { buildLoadFunction, buildTickFunction } from './load';
import { createCustomMob, createProject } from '../types/factory';
import {
  buildCustomMobBossBarSetupLines,
  buildCustomMobBossBarSupportFiles,
  buildCustomMobBossBarTickHook,
  customMobBossBarId,
  customMobsUseBossBar,
} from './customMobBossBar';
import { buildDatapackFiles } from './datapack';

function ctxWithBossBarMob() {
  const project = createProject('BossMob');
  project.namespace = 'mobpack';
  const mob = {
    ...createCustomMob('Undead Captain'),
    tag: 'undead_captain',
    displayName: 'Undead Captain',
    health: 40,
    bossBar: true,
  };
  project.customMobs = [mob];
  return { project, ctx: buildContext(project), mob };
}

describe('customMobBossBar', () => {
  it('detects when any mob has boss bar enabled', () => {
    const { project } = ctxWithBossBarMob();
    expect(customMobsUseBossBar(project)).toBe(true);
    project.customMobs![0].bossBar = false;
    expect(customMobsUseBossBar(project)).toBe(false);
  });

  it('uses namespace-scoped boss bar ids', () => {
    const { ctx } = ctxWithBossBarMob();
    expect(customMobBossBarId(ctx.namespace, 'undead_captain')).toBe(
      'mobpack:boss_undead_captain',
    );
  });

  it('registers boss bars on load with max health constant', () => {
    const { ctx } = ctxWithBossBarMob();
    const lines = buildCustomMobBossBarSetupLines(ctx);
    expect(lines.some((l) => l.includes('bossbar add mobpack:boss_undead_captain'))).toBe(true);
    expect(lines.some((l) => l.includes('Undead Captain'))).toBe(true);
    expect(lines.some((l) => l.includes('#boss_undead_captain_max qt_sys 40'))).toBe(true);
    expect(lines.some((l) => l.includes('#qt_mob_bb_scale qt_sys 1000'))).toBe(true);
  });

  it('emits per-mob update functions and tick dispatcher', () => {
    const { ctx } = ctxWithBossBarMob();
    const files = buildCustomMobBossBarSupportFiles(ctx);
    const update = files['mobs/bossbar/undead_captain.mcfunction'];
    expect(update).toContain('bossbar set mobpack:boss_undead_captain visible false');
    expect(update).toContain('data get entity @e[tag=questtool_mob,tag=undead_captain,limit=1,sort=nearest] Health');
    expect(update).toContain('bossbar set mobpack:boss_undead_captain players @a[distance=..64]');
    expect(files['mobs/bossbar_tick.mcfunction']).toContain(
      'function mobpack:mobs/bossbar/undead_captain',
    );
  });

  it('reads phase index via execute as entity for phased boss bars', () => {
    const project = createProject('BossPhases');
    project.namespace = 'mobpack';
    const mob = {
      ...createCustomMob('Phased Boss'),
      tag: 'phased_boss',
      displayName: 'Phased Boss',
      health: 40,
      bossBar: true,
      phases: [
        { name: 'Phase 1', id: 'p1' },
        { name: 'Phase 2', id: 'p2', atHealthPercent: 50 },
      ],
    };
    project.customMobs = [mob];
    const ctx = buildContext(project);
    const update = buildCustomMobBossBarSupportFiles(ctx)['mobs/bossbar/phased_boss.mcfunction'];
    expect(update).toContain(
      'execute as @e[tag=questtool_mob,tag=phased_boss,limit=1,sort=nearest] store result score #phase_read qt_sys run scoreboard players get @s qt_mphase',
    );
    expect(update).not.toContain(
      'run scoreboard players get @e[tag=questtool_mob,tag=phased_boss',
    );
  });

  it('hooks into root load and tick functions', () => {
    const { ctx } = ctxWithBossBarMob();
    expect(buildLoadFunction(ctx)).toContain('bossbar add mobpack:boss_undead_captain');
    expect(buildTickFunction(ctx)).toContain('function mobpack:mobs/bossbar_tick');
    expect(buildCustomMobBossBarTickHook(ctx)).toEqual([
      'function mobpack:mobs/bossbar_tick',
    ]);
  });

  it('does not emit boss bar files when disabled', () => {
    const project = createProject();
    project.customMobs = [{ ...createCustomMob('Plain'), tag: 'plain', bossBar: false }];
    const ctx = buildContext(project);
    expect(buildCustomMobBossBarSetupLines(ctx)).toEqual([]);
    expect(buildCustomMobBossBarSupportFiles(ctx)).toEqual({});
    expect(buildCustomMobBossBarTickHook(ctx)).toEqual([]);
  });

  it('integrates into full datapack export', () => {
    const { project } = ctxWithBossBarMob();
    const files = buildDatapackFiles(project);
    expect(files['data/mobpack/function/mobs/bossbar_tick.mcfunction']).toBeDefined();
    expect(files['data/mobpack/function/tick.mcfunction']).toContain(
      'function mobpack:mobs/bossbar_tick',
    );
    expect(files['data/mobpack/function/load.mcfunction']).toContain(
      'bossbar add mobpack:boss_undead_captain',
    );
  });
});
