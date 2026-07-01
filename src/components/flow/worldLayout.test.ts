import { describe, expect, it } from 'vitest';
import { createDimension, createTeleportPad } from '../../types/dimension';
import { createDungeon } from '../../types/dungeon';
import { createProject } from '../../types/factory';
import { OVERWORLD_NODE_ID } from './chainEdges';
import { fullFlowLayout, worldClusterLayout } from './layout';

describe('worldClusterLayout', () => {
  it('clusters dungeons and pads under their dimension', () => {
    const dim = createDimension('Custom');
    const dungeon = createDungeon('Boss');
    dungeon.dimensionId = dim.id;
    const pad = createTeleportPad('Entry');
    pad.at.dimensionId = dim.id;

    const project = createProject();
    project.dimensions = [dim];
    project.dungeons = [dungeon];
    project.teleportPads = [pad];

    const questLayout = fullFlowLayout(project, []);
    const world = worldClusterLayout(project, questLayout);

    const dimY = world.get(dim.id)!.y;
    const dungeonY = world.get(dungeon.id)!.y;
    const padY = world.get(pad.id)!.y;
    expect(dungeonY).toBeGreaterThan(dimY);
    expect(padY).toBeGreaterThan(dungeonY);
    expect(world.get(dim.id)!.x).toBe(world.get(dungeon.id)!.x);
  });

  it('places overworld bucket before custom dimensions', () => {
    const dim = createDimension('Custom');
    const dungeon = createDungeon('Surface');
    const project = createProject();
    project.dimensions = [dim];
    project.dungeons = [dungeon];

    const questLayout = fullFlowLayout(project, []);
    const world = worldClusterLayout(project, questLayout);

    expect(world.has(OVERWORLD_NODE_ID)).toBe(true);
    const owY = world.get(OVERWORLD_NODE_ID)!.y;
    const dimY = world.get(dim.id)!.y;
    expect(dimY).toBeGreaterThan(owY);
  });
});
