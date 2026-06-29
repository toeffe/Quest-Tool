import { describe, expect, it } from 'vitest';
import { buildContext } from './context';
import { buildLoadFunction, buildTickFunction } from './load';
import { createCustomMob, createCustomMobPhase, createProject } from '../types/factory';
import { buildCommandReference } from './commands';
import { buildDatapackFiles } from './datapack';
import {
  buildCustomMobPhaseSetupLines,
  buildCustomMobPhaseSupportFiles,
  mobHasPhaseTransitions,
  resolvePhaseConfig,
  QT_MPHASE_MAX_OBJECTIVE,
  QT_MPHASE_OBJECTIVE,
  QT_MPHASE_TMP_OBJECTIVE,
} from './customMobPhases';
import { summonCustomMob, MC_ATTR_MAX_HEALTH } from './customMobs';

function bossMobWithPhases() {
  const project = createProject('Phases');
  project.namespace = 'phasepack';
  const mob = {
    ...createCustomMob('Undead Captain'),
    tag: 'undead_captain',
    displayName: 'Undead Captain',
    health: 100,
    damage: 6,
    bossBar: true,
    phases: [
      { ...createCustomMobPhase('Phase 1'), name: 'Phase 1' },
      {
        ...createCustomMobPhase('Enraged'),
        name: 'Enraged',
        atHealthPercent: 50,
        displayName: 'Enraged Captain',
        damage: 12,
        glowing: true,
        bossBarColor: 'yellow' as const,
        announceMessage: 'The captain enrages!',
        effects: [{ effectId: 'minecraft:strength', amplifier: 1 }],
      },
      {
        ...createCustomMobPhase('Desperate'),
        name: 'Desperate',
        atHealthPercent: 25,
        displayName: 'Desperate Captain',
        damage: 16,
        bossBarColor: 'red' as const,
      },
    ],
  };
  project.customMobs = [mob];
  return { project, mob, ctx: buildContext(project) };
}

function phaseTwoScenarioMob() {
  const project = createProject('Phase2 QA');
  project.namespace = 'phase2pack';
  const mob = {
    ...createCustomMob('Speed Boss'),
    tag: 'speed_boss',
    displayName: 'Phase Boss',
    health: 40,
    bossBar: true,
    phases: [
      { ...createCustomMobPhase('Phase 1'), name: 'Phase 1' },
      {
        ...createCustomMobPhase('Phase 2'),
        name: 'Phase 2',
        atHealthPercent: 50,
        displayName: 'testspeed',
        bossBarColor: 'blue' as const,
        effects: [{ effectId: 'minecraft:speed', amplifier: 1 }],
        equipment: [{ slot: 'feet' as const, item: 'minecraft:diamond_boots' }],
      },
    ],
  };
  project.customMobs = [mob];
  return { project, mob, ctx: buildContext(project) };
}

describe('customMobPhases', () => {
  it('detects mobs with two or more phases and thresholds', () => {
    const { mob } = bossMobWithPhases();
    expect(mobHasPhaseTransitions(mob)).toBe(true);
    mob.phases = [{ ...createCustomMobPhase('Only') }];
    expect(mobHasPhaseTransitions(mob)).toBe(false);
  });

  it('resolvePhaseConfig merges phase overrides with mob defaults', () => {
    const { mob } = bossMobWithPhases();
    expect(resolvePhaseConfig(mob, 0).displayName).toBe('Undead Captain');
    expect(resolvePhaseConfig(mob, 1).displayName).toBe('Enraged Captain');
    expect(resolvePhaseConfig(mob, 1).damage).toBe(12);
    expect(resolvePhaseConfig(mob, 0).damage).toBe(6);
  });

  it('summon uses phase 0 resolved stats when phases exist', () => {
    const { mob } = bossMobWithPhases();
    const cmd = summonCustomMob(mob, '~', '~1', '~');
    expect(cmd).toContain('Undead Captain');
    expect(cmd).toContain('id:"attack_damage",base:6');
    expect(cmd).toContain('id:"max_health",base:100');
  });

  it('registers phase objectives and thresholds on load', () => {
    const { ctx } = bossMobWithPhases();
    const lines = buildCustomMobPhaseSetupLines(ctx);
    expect(lines.some((l) => l.includes(`scoreboard objectives add ${QT_MPHASE_OBJECTIVE}`))).toBe(
      true,
    );
    expect(lines.some((l) => l.includes(`scoreboard objectives add ${QT_MPHASE_TMP_OBJECTIVE}`))).toBe(
      true,
    );
    expect(lines.some((l) => l.includes(`scoreboard objectives add ${QT_MPHASE_MAX_OBJECTIVE}`))).toBe(
      true,
    );
    expect(lines.some((l) => l.includes('#ph_undead_captain_t1 qt_sys 50'))).toBe(true);
    expect(lines.some((l) => l.includes('#ph_undead_captain_t2 qt_sys 25'))).toBe(true);
    expect(lines.some((l) => l.includes('#boss_undead_captain_max qt_sys 100'))).toBe(true);
  });

  it('emits tick, check, init, and enter functions', () => {
    const { ctx, mob } = bossMobWithPhases();
    const files = buildCustomMobPhaseSupportFiles(ctx);
    expect(files['mobs/phases_tick.mcfunction']).toContain(
      'function phasepack:mobs/phases/undead_captain/tick',
    );
    expect(files['mobs/phases/undead_captain/check_entity.mcfunction']).toContain(
      'enter_2',
    );
    expect(files['mobs/phases/undead_captain/enter_1.mcfunction']).toContain('Enraged Captain');
    expect(files['mobs/phases/undead_captain/enter_1.mcfunction']).toContain(
      'The captain enrages!',
    );
    expect(files['mobs/phases/undead_captain/enter_1.mcfunction']).toContain(
      'effect give @s minecraft:strength infinite 1 true',
    );
    expect(files['mobs/phases/undead_captain/init.mcfunction']).toContain(
      `scoreboard players set @s ${QT_MPHASE_OBJECTIVE} 0`,
    );
    expect(files['mobs/phases/undead_captain/check_entity.mcfunction']).toContain(
      'unless entity @s[tag=qt_mphase_init]',
    );
    const checkEntity = files['mobs/phases/undead_captain/check_entity.mcfunction'];
    expect(checkEntity).toContain(`attribute @s ${MC_ATTR_MAX_HEALTH} base get 1`);
    expect(checkEntity).not.toContain('generic.max_health');
    expect(checkEntity).toContain(`scoreboard players operation @s ${QT_MPHASE_TMP_OBJECTIVE} /= @s ${QT_MPHASE_MAX_OBJECTIVE}`);
    expect(checkEntity).toContain('#boss_undead_captain_max');
    expect(files['mobs/phases/undead_captain/enter_2.mcfunction']).toContain('Desperate Captain');
    expect(files['mobs/phases/undead_captain/debug.mcfunction']).toContain('#dbg_hp');
    expect(files['mobs/phases/undead_captain/debug.mcfunction']).toContain('tellraw @s');
    expect(files['mobs/phases/undead_captain/debug.mcfunction']).not.toContain('debug_entity');
    expect(mob.phases?.length).toBe(3);
  });

  it('computes HP percent without double-scaling max health', () => {
    const { ctx } = phaseTwoScenarioMob();
    const checkEntity = buildCustomMobPhaseSupportFiles(ctx)['mobs/phases/speed_boss/check_entity.mcfunction'];
    // Health*100 / max (scale 1): at 20/40 HP → 2000/40 = 50, not 2000/4000 = 0
    expect(checkEntity).toMatch(/Health 100/);
    expect(checkEntity).toMatch(/max_health base get 1/);
    expect(checkEntity).not.toMatch(/generic\.max_health/);
  });

  it('uses item replace for phase equipment and applies phase 2 scenario', () => {
    const { ctx, mob } = phaseTwoScenarioMob();
    const files = buildCustomMobPhaseSupportFiles(ctx);
    const enter1 = files['mobs/phases/speed_boss/enter_1.mcfunction'];
    expect(enter1).toContain('testspeed');
    expect(enter1).toContain('effect give @s minecraft:speed infinite 1 true');
    expect(enter1).toContain('minecraft:speed');
    expect(enter1).not.toContain('generic.attack_damage');
    expect(enter1).toContain('item replace entity @s armor.feet with minecraft:diamond_boots');
    expect(enter1).toContain('bossbar set phase2pack:boss_speed_boss color blue');
    expect(enter1).not.toContain('data merge entity @s {equipment:');
    expect(mob.phases?.[1]?.atHealthPercent).toBe(50);
  });

  it('hooks into root load and tick', () => {
    const { ctx } = bossMobWithPhases();
    expect(buildLoadFunction(ctx)).toContain('scoreboard objectives add qt_mphase');
    expect(buildTickFunction(ctx)).toContain('function phasepack:mobs/phases_tick');
  });

  it('integrates spawn init hooks in datapack export', () => {
    const { project } = bossMobWithPhases();
    const files = buildDatapackFiles(project);
    const spawn = files['data/phasepack/function/spawn_mob/undead_captain.mcfunction'];
    expect(spawn).toContain('function phasepack:mobs/phases/undead_captain/init');
    expect(spawn).toContain('tag=!qt_mphase_init,distance=..4');
    expect(spawn).not.toContain('][tag=');
    expect(files['data/phasepack/function/mobs/phases_tick.mcfunction']).toBeDefined();
  });

  it('exposes debug command in command reference for phased mobs', () => {
    const { project } = phaseTwoScenarioMob();
    const groups = buildCommandReference(project);
    const customMobGroup = groups.find((g) => g.title.includes('Custom mobs') || g.commands.some((c) => c.command.includes('spawn_mob')));
    const debugEntry = customMobGroup?.commands.find((c) =>
      c.command.includes('mobs/phases/speed_boss/debug'),
    );
    expect(debugEntry).toBeDefined();
  });
});
