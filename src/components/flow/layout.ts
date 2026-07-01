import type { Edge } from '@xyflow/react';
import type { Project, Quest } from '../../types/quest';
import {
  type BrokenStub,
  GENERATE_NODE_ID,
  isBrokenNodeId,
  needsOverworldAnchor,
  OVERWORLD_NODE_ID,
} from './chainEdges';

export interface XY {
  x: number;
  y: number;
}

export const COLUMN_WIDTH = 360;
export const ROW_HEIGHT = 300;
export const WORLD_ROW_HEIGHT = 130;
export const NODE_WIDTH = 280;
export const NODE_HEIGHT_ESTIMATE = 320;
export const STUB_OFFSET_X = 300;
const ORIGIN_X = 40;
const ORIGIN_Y = 40;

export function placeBrokenStubs(positions: Map<string, XY>, stubs: BrokenStub[]): void {
  for (const stub of stubs) {
    const anchor = positions.get(stub.anchorQuestId);
    if (!anchor) continue;
    const x =
      stub.kind === 'unlock' ? anchor.x + STUB_OFFSET_X : Math.max(ORIGIN_X, anchor.x - 140);
    positions.set(stub.id, { x, y: anchor.y + 48 });
  }
}

/**
 * Layered layout with category grouping within each column.
 */
export function layeredLayout(quests: Quest[], edges: Edge[]): Map<string, XY> {
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const q of quests) {
    incoming.set(q.id, []);
    outgoing.set(q.id, []);
  }
  for (const e of edges) {
    if (
      e.target === GENERATE_NODE_ID ||
      e.source === GENERATE_NODE_ID ||
      isBrokenNodeId(e.target)
    ) {
      continue;
    }
    if (isBrokenNodeId(e.source)) {
      incoming.get(e.target)?.push(e.source);
      continue;
    }
    outgoing.get(e.source)?.push(e.target);
    incoming.get(e.target)?.push(e.source);
  }

  const depth = new Map<string, number>();
  const inProgress = new Set<string>();
  const computeDepth = (id: string): number => {
    if (depth.has(id)) return depth.get(id)!;
    if (inProgress.has(id)) return 0;
    inProgress.add(id);
    const parents = (incoming.get(id) ?? []).filter((p) => !isBrokenNodeId(p));
    const d = parents.length === 0 ? 0 : Math.max(...parents.map(computeDepth)) + 1;
    inProgress.delete(id);
    depth.set(id, d);
    return d;
  };
  for (const q of quests) computeDepth(q.id);

  const columns = new Map<number, string[]>();
  let maxDepth = 0;
  for (const q of quests) {
    const d = depth.get(q.id) ?? 0;
    maxDepth = Math.max(maxDepth, d);
    const col = columns.get(d) ?? [];
    col.push(q.id);
    columns.set(d, col);
  }

  const questById = new Map(quests.map((q) => [q.id, q]));
  const orderIndex = new Map(quests.map((q, i) => [q.id, i]));

  const positions = new Map<string, XY>();
  for (const [col, ids] of columns) {
    const sorted = [...ids].sort((a, b) => {
      const ca = questById.get(a)?.category ?? 'General';
      const cb = questById.get(b)?.category ?? 'General';
      if (ca !== cb) return ca.localeCompare(cb);
      return (orderIndex.get(a) ?? 0) - (orderIndex.get(b) ?? 0);
    });
    sorted.forEach((id, row) => {
      positions.set(id, {
        x: ORIGIN_X + col * COLUMN_WIDTH,
        y: ORIGIN_Y + row * ROW_HEIGHT,
      });
    });
  }

  const lastColumnCount = columns.get(maxDepth)?.length ?? 1;
  positions.set(GENERATE_NODE_ID, {
    x: ORIGIN_X + (maxDepth + 1) * COLUMN_WIDTH,
    y: ORIGIN_Y + (Math.max(0, lastColumnCount - 1) / 2) * ROW_HEIGHT,
  });

  return positions;
}

function maxQuestX(questPositions: Map<string, XY>): number {
  let maxX = ORIGIN_X;
  for (const [id, pos] of questPositions) {
    if (id === GENERATE_NODE_ID || isBrokenNodeId(id)) continue;
    maxX = Math.max(maxX, pos.x);
  }
  return maxX;
}

/**
 * Place dimension, dungeon, pad, and overworld nodes in a world column grouped by dimension.
 */
export function worldClusterLayout(project: Project, questPositions: Map<string, XY>): Map<string, XY> {
  const world = new Map<string, XY>();
  const worldX = maxQuestX(questPositions) + COLUMN_WIDTH;
  let y = ORIGIN_Y;

  const place = (id: string) => {
    world.set(id, { x: worldX, y });
    y += WORLD_ROW_HEIGHT;
  };

  if (needsOverworldAnchor(project)) {
    place(OVERWORLD_NODE_ID);
    for (const dungeon of project.dungeons ?? []) {
      if (!dungeon.dimensionId) place(dungeon.id);
    }
    for (const pad of project.teleportPads ?? []) {
      if (!pad.at.dimensionId) place(pad.id);
    }
  }

  for (const dimension of project.dimensions ?? []) {
    place(dimension.id);
    for (const dungeon of project.dungeons ?? []) {
      if (dungeon.dimensionId === dimension.id) place(dungeon.id);
    }
    for (const pad of project.teleportPads ?? []) {
      if (pad.at.dimensionId === dimension.id) place(pad.id);
    }
  }

  return world;
}

/** Combined quest + world layout for auto-arrange. */
export function fullFlowLayout(project: Project, edges: Edge[]): Map<string, XY> {
  const questLayout = layeredLayout(project.quests, edges);
  const worldLayout = worldClusterLayout(project, questLayout);
  const combined = new Map<string, XY>([...questLayout, ...worldLayout]);
  return combined;
}
