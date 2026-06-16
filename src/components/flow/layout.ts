import { type Edge } from '@xyflow/react';
import { type Quest } from '../../types/quest';
import { GENERATE_NODE_ID } from './chainEdges';

export interface XY {
  x: number;
  y: number;
}

const COLUMN_WIDTH = 320;
const ROW_HEIGHT = 220;
const ORIGIN_X = 40;
const ORIGIN_Y = 40;

/**
 * Layered (topological) layout: each node's column is its longest dependency
 * depth from a root, and rows are assigned by order within a layer. Falls back
 * gracefully when the graph contains a cycle (depths simply stop growing).
 */
export function layeredLayout(quests: Quest[], edges: Edge[]): Map<string, XY> {
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const q of quests) {
    incoming.set(q.id, []);
    outgoing.set(q.id, []);
  }
  for (const e of edges) {
    if (e.target === GENERATE_NODE_ID || e.source === GENERATE_NODE_ID) continue;
    outgoing.get(e.source)?.push(e.target);
    incoming.get(e.target)?.push(e.source);
  }

  // Longest-path depth from any root via memoized DFS with cycle protection.
  const depth = new Map<string, number>();
  const inProgress = new Set<string>();
  const computeDepth = (id: string): number => {
    if (depth.has(id)) return depth.get(id)!;
    if (inProgress.has(id)) return 0; // cycle: break the recursion
    inProgress.add(id);
    const parents = incoming.get(id) ?? [];
    const d = parents.length === 0 ? 0 : Math.max(...parents.map(computeDepth)) + 1;
    inProgress.delete(id);
    depth.set(id, d);
    return d;
  };
  for (const q of quests) computeDepth(q.id);

  // Group by column (depth), preserving project order within each column.
  const columns = new Map<number, string[]>();
  let maxDepth = 0;
  for (const q of quests) {
    const d = depth.get(q.id) ?? 0;
    maxDepth = Math.max(maxDepth, d);
    const col = columns.get(d) ?? [];
    col.push(q.id);
    columns.set(d, col);
  }

  const positions = new Map<string, XY>();
  for (const [col, ids] of columns) {
    ids.forEach((id, row) => {
      positions.set(id, {
        x: ORIGIN_X + col * COLUMN_WIDTH,
        y: ORIGIN_Y + row * ROW_HEIGHT,
      });
    });
  }

  // Place the terminal Generate node one column past the deepest quest, centered.
  const lastColumnCount = columns.get(maxDepth)?.length ?? 1;
  positions.set(GENERATE_NODE_ID, {
    x: ORIGIN_X + (maxDepth + 1) * COLUMN_WIDTH,
    y: ORIGIN_Y + (Math.max(0, lastColumnCount - 1) / 2) * ROW_HEIGHT,
  });

  return positions;
}
