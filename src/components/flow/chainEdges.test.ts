import { describe, expect, it } from 'vitest';
import { createDungeon } from '../../types/dungeon';
import { createDimension, createTeleportPad } from '../../types/dimension';
import { createProject, createQuest } from '../../types/factory';
import {
  connectDungeonToDimension,
  connectPadEndpointToDimension,
  connectQuestToDungeon,
  dimensionRefToNodeId,
  needsOverworldAnchor,
  OVERWORLD_NODE_ID,
  worldFlowEdges,
} from './chainEdges';

describe('worldFlowEdges', () => {
  it('emits dungeon to dimension and pad from/to edges', () => {
    const dim = createDimension('Nether Hub');
    const dungeon = createDungeon('Boss Lair');
    dungeon.dimensionId = dim.id;
    const pad = createTeleportPad('Portal');
    pad.at.dimensionId = undefined;
    pad.to.dimensionId = dim.id;

    const project = createProject();
    project.dimensions = [dim];
    project.dungeons = [dungeon];
    project.teleportPads = [pad];

    const edges = worldFlowEdges(project);
    expect(edges).toHaveLength(3);
    expect(edges.find((e) => e.id === `world:dungeon:${dungeon.id}->${dim.id}`)).toMatchObject({
      source: dungeon.id,
      target: dim.id,
      data: { label: 'inDimension', world: true },
    });
    expect(edges.find((e) => e.id === `world:pad:${pad.id}:at->${OVERWORLD_NODE_ID}`)).toBeTruthy();
    expect(edges.find((e) => e.id === `world:pad:${pad.id}:to->${dim.id}`)).toBeTruthy();
  });

  it('uses overworld anchor when dimensionId is unset', () => {
    const dungeon = createDungeon('Cave');
    const project = createProject();
    project.dungeons = [dungeon];

    const edges = worldFlowEdges(project);
    expect(edges[0].target).toBe(OVERWORLD_NODE_ID);
    expect(dimensionRefToNodeId(undefined)).toBe(OVERWORLD_NODE_ID);
    expect(needsOverworldAnchor(project)).toBe(true);
  });
});

describe('world connect helpers', () => {
  it('assigns dungeon dimension via connectDungeonToDimension', () => {
    const dim = createDimension('Arena');
    const dungeon = createDungeon('Fight');
    const project = createProject();
    project.dimensions = [dim];
    project.dungeons = [dungeon];

    const next = connectDungeonToDimension(project, dungeon.id, dim.id);
    expect(next.dungeons![0].dimensionId).toBe(dim.id);

    const cleared = connectDungeonToDimension(next, dungeon.id, OVERWORLD_NODE_ID);
    expect(cleared.dungeons![0].dimensionId).toBeUndefined();
  });

  it('assigns pad endpoint dimension', () => {
    const dim = createDimension('Sky');
    const pad = createTeleportPad('Lift');
    const project = createProject();
    project.dimensions = [dim];
    project.teleportPads = [pad];

    const next = connectPadEndpointToDimension(project, pad.id, 'to', dim.id);
    expect(next.teleportPads![0].to.dimensionId).toBe(dim.id);
  });

  it('sets quest gate on first room only', () => {
    const quest = createQuest('Key Quest');
    const dungeon = createDungeon('Gated');
    dungeon.rooms.push({ ...dungeon.rooms[0], id: 'room-2', name: 'Room 2' });
    const project = createProject();
    project.quests = [quest];
    project.dungeons = [dungeon];

    const next = connectQuestToDungeon(project, quest.id, dungeon.id);
    expect(next.dungeons![0].rooms[0].questGate?.questName).toBe(quest.name);
    expect(next.dungeons![0].rooms[1].questGate).toBeUndefined();
  });

  it('uses preferred room when linking quest to dungeon', () => {
    const quest = createQuest('Key Quest');
    const dungeon = createDungeon('Gated');
    const room2Id = 'room-2';
    dungeon.rooms.push({ ...dungeon.rooms[0], id: room2Id, name: 'Room 2' });
    const project = createProject();
    project.quests = [quest];
    project.dungeons = [dungeon];

    const next = connectQuestToDungeon(project, quest.id, dungeon.id, room2Id);
    expect(next.dungeons![0].rooms[0].questGate).toBeUndefined();
    expect(next.dungeons![0].rooms[1].questGate?.questName).toBe(quest.name);
  });
});
