import { describe, expect, it } from 'vitest';
import { createDimension, createTeleportPad } from '../types/dimension';
import { createProject } from '../types/factory';
import { buildContext } from './context';
import { buildLoadFunction, buildTickFunction } from './load';
import { compilePads } from './pads';
import { PAD_GRACE_OBJECTIVE, PAD_INIT_OBJECTIVE, PAD_REQ_OBJECTIVE } from './sys';

function buildRoundTripProject() {
  const project = createProject('Round Trip', 'en');
  project.namespace = 'questpack';
  const dim = createDimension('Void');
  dim.tag = 'void';
  project.dimensions = [dim];

  const toVoid = createTeleportPad('To Void');
  toVoid.at = { x: 0, y: 64, z: 0, radius: 2 };
  toVoid.to = { dimensionId: dim.id, x: 10, y: 64, z: 10 };
  toVoid.cooldownSeconds = 1;

  const toOverworld = createTeleportPad('To Overworld');
  toOverworld.at = { dimensionId: dim.id, x: 10, y: 64, z: 10, radius: 1 };
  toOverworld.to = { x: 5, y: 64, z: 5 };
  toOverworld.cooldownSeconds = 1;

  project.teleportPads = [toVoid, toOverworld];
  return project;
}

function buildUserLayoutProject() {
  const project = createProject('Mit questpakke', 'en');
  project.namespace = 'questpack';
  const dim = createDimension('Dimension 1');
  dim.tag = 'dimension_1';
  dim.id = 'hh5f83li80rw';
  project.dimensions = [dim];

  const enter = createTeleportPad('Pad 1 Enter');
  enter.id = '3zjkuwio82yf';
  enter.at = { x: 10, y: -60, z: 10, radius: 1 };
  enter.to = { x: 12, y: -60, z: 12, dimensionId: dim.id };
  enter.cooldownSeconds = 1;

  const exit = createTeleportPad('Pad 1 Exit');
  exit.id = 'lfghl7yuvq2a';
  exit.at = { x: 8, y: -60, z: 8, radius: 1, dimensionId: dim.id };
  exit.to = { x: 0, y: -60, z: 0 };
  exit.cooldownSeconds = 1;

  project.teleportPads = [enter, exit];
  return project;
}

describe('pads generator', () => {
  it('generates pad tick with dimension-scoped detection and cooldown', () => {
    const project = createProject('Test');
    project.namespace = 'questpack';
    const dim = createDimension('Arena');
    dim.tag = 'arena';
    project.dimensions = [dim];

    const pad = createTeleportPad('Jump Pad');
    pad.at = { x: 5, y: 64, z: 5, radius: 1 };
    pad.to = { dimensionId: dim.id, x: 100, y: 64, z: 100 };
    pad.cooldownSeconds = 3;
    project.teleportPads = [pad];

    const ctx = buildContext(project);
    const files = compilePads(ctx);
    const tick = files['data/questpack/function/pads/tick.mcfunction'];
    const teleport = files['data/questpack/function/pads/jump_pad/teleport.mcfunction'];

    expect(tick).toContain(`scores={${PAD_REQ_OBJECTIVE}=0..}`);
    expect(tick).toContain('function questpack:pads/init_scores');
    expect(tick).toContain('# --- detect phase ---');
    expect(tick).toContain('# --- execute phase ---');
    expect(tick).toContain(
      `execute in minecraft:overworld positioned 5 64 5 run execute as @a[scores={${PAD_REQ_OBJECTIVE}=-1},distance=..2] if score @s ${PAD_GRACE_OBJECTIVE} <= #now qt_sys if score @s pad0_cd <= #now qt_sys run scoreboard players set @s ${PAD_REQ_OBJECTIVE} 0`,
    );
    expect(tick).toContain(
      `execute as @a[scores={${PAD_REQ_OBJECTIVE}=0}] run function questpack:pads/jump_pad/teleport`,
    );
    expect(teleport).toContain(
      `scoreboard players operation @s ${PAD_GRACE_OBJECTIVE} = #now qt_sys`,
    );
    expect(teleport).toContain(`scoreboard players add @s ${PAD_GRACE_OBJECTIVE} 80`);
    expect(teleport).toContain('execute in questpack:arena run tp @s 100.5 64 100.5');
    expect(teleport).toContain('scoreboard players add @s pad0_cd 60');

    const load = buildLoadFunction(ctx);
    expect(load).toContain(`scoreboard objectives add ${PAD_GRACE_OBJECTIVE} dummy`);
    expect(load).toContain(`scoreboard objectives add ${PAD_REQ_OBJECTIVE} dummy`);
    expect(load).toContain(`scoreboard players set @a ${PAD_GRACE_OBJECTIVE} 0`);
    expect(load).toContain(`scoreboard objectives add ${PAD_INIT_OBJECTIVE} dummy`);
    expect(load).toContain('scoreboard objectives add pad0_cd dummy');
    expect(load).toContain('scoreboard players set @a pad0_cd 0');

    const globalTick = buildTickFunction(ctx);
    expect(globalTick).toContain('function questpack:pads/tick');
  });

  it('wraps custom-dimension pad detection with execute in positioned', () => {
    const project = createProject('Test');
    project.namespace = 'questpack';
    const dim = createDimension('Void');
    dim.tag = 'void';
    project.dimensions = [dim];

    const pad = createTeleportPad('Exit');
    pad.at = { dimensionId: dim.id, x: 10, y: 64, z: 10, radius: 2 };
    pad.to = { x: 0, y: 64, z: 0 };
    pad.cooldownSeconds = 1;
    project.teleportPads = [pad];

    const ctx = buildContext(project);
    const tick = compilePads(ctx)['data/questpack/function/pads/tick.mcfunction'];
    expect(tick).toContain(
      `execute in questpack:void positioned 10 64 10 run execute as @a[scores={${PAD_REQ_OBJECTIVE}=-1},distance=..3] if score @s ${PAD_GRACE_OBJECTIVE} <= #now qt_sys if score @s pad0_cd <= #now qt_sys run scoreboard players set @s ${PAD_REQ_OBJECTIVE} 0`,
    );
  });

  it('blocks same-tick chain teleports and nudges landing away from nearby pads', () => {
    const project = buildRoundTripProject();
    const ctx = buildContext(project);
    const files = compilePads(ctx);
    const tick = files['data/questpack/function/pads/tick.mcfunction'];
    const toVoidTeleport = files['data/questpack/function/pads/to_void/teleport.mcfunction'];

    expect(tick).toContain(`scores={${PAD_REQ_OBJECTIVE}=-1}`);
    expect(tick).toContain(`if score @s ${PAD_GRACE_OBJECTIVE} <= #now qt_sys`);
    expect(tick.indexOf('# --- detect phase ---')).toBeLessThan(
      tick.indexOf('# --- execute phase ---'),
    );
    expect(tick.indexOf('run scoreboard players set @s qt_pad_req 0')).toBeLessThan(
      tick.indexOf('function questpack:pads/to_void/teleport'),
    );
    expect(toVoidTeleport).toContain(`scoreboard players add @s ${PAD_GRACE_OBJECTIVE} 40`);
    expect(toVoidTeleport).toContain('scoreboard players add @s pad1_cd 40');
    expect(toVoidTeleport).not.toContain('tp @s 10 64 10');
    expect(toVoidTeleport).not.toContain('tp @s 10.5 64 10.5');
  });

  it('nudges user round-trip enter destination away from exit pad zone', () => {
    const project = buildUserLayoutProject();
    const ctx = buildContext(project);
    const files = compilePads(ctx);
    const teleport = files['data/questpack/function/pads/pad_1_enter/teleport.mcfunction'];
    const tick = files['data/questpack/function/pads/tick.mcfunction'];

    expect(teleport).not.toContain('tp @s 12 -60 12');
    expect(teleport).not.toContain('tp @s 12.5 -60 12.5');
    expect(teleport).toContain('execute in questpack:dimension_1 run tp @s 15.5 -60 15.5');
    expect(teleport).toContain('scoreboard players add @s pad1_cd 40');
    expect(tick).toContain('positioned 10 -60 10 run execute as @a');
    expect(tick.indexOf('pad_1_enter/teleport')).toBeGreaterThan(
      tick.indexOf('run scoreboard players set @s qt_pad_req 1'),
    );
  });
});
