import { useStore } from '@xyflow/react';
import { useMemo } from 'react';
import type { Quest } from '../../types/quest';
import { brokenRequiresId, brokenUnlockId } from './chainEdges';
import { NODE_HEIGHT_ESTIMATE, NODE_WIDTH, type XY } from './layout';

const LANE_PADDING = 16;
const BROKEN_STUB_WIDTH = 120;

interface Props {
  quests: Quest[];
  positions: Map<string, XY>;
}

interface LaneBounds {
  category: string;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function extendBoundsForRelatedNodes(
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  positions: Map<string, XY>,
  questId: string,
): void {
  const unlockStub = positions.get(brokenUnlockId(questId));
  if (unlockStub) {
    bounds.minX = Math.min(bounds.minX, unlockStub.x);
    bounds.minY = Math.min(bounds.minY, unlockStub.y);
    bounds.maxX = Math.max(bounds.maxX, unlockStub.x + BROKEN_STUB_WIDTH);
    bounds.maxY = Math.max(bounds.maxY, unlockStub.y + 48);
  }

  const requiresStub = positions.get(brokenRequiresId(questId));
  if (requiresStub) {
    bounds.minX = Math.min(bounds.minX, requiresStub.x);
    bounds.minY = Math.min(bounds.minY, requiresStub.y);
    bounds.maxX = Math.max(bounds.maxX, requiresStub.x + BROKEN_STUB_WIDTH);
    bounds.maxY = Math.max(bounds.maxY, requiresStub.y + 48);
  }
}

export function CategoryLanes({ quests, positions }: Props) {
  const transform = useStore((s) => s.transform);

  const lanes = useMemo(() => {
    const categories = [...new Set(quests.map((q) => q.category || 'General'))];
    if (categories.length <= 1) return [];

    const bounds: LaneBounds[] = [];
    for (const category of categories) {
      const categoryQuests = quests.filter((q) => (q.category || 'General') === category);
      if (categoryQuests.length === 0) continue;

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      let hasNode = false;

      for (const quest of categoryQuests) {
        const pos = positions.get(quest.id);
        if (!pos) continue;
        hasNode = true;
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x + NODE_WIDTH);
        maxY = Math.max(maxY, pos.y + NODE_HEIGHT_ESTIMATE);

        const related = { minX, minY, maxX, maxY };
        extendBoundsForRelatedNodes(related, positions, quest.id);
        minX = related.minX;
        minY = related.minY;
        maxX = related.maxX;
        maxY = related.maxY;
      }

      if (!hasNode) continue;

      bounds.push({
        category,
        minX: minX - LANE_PADDING,
        minY: minY - LANE_PADDING,
        maxX: maxX + LANE_PADDING,
        maxY: maxY + LANE_PADDING,
      });
    }

    return bounds.sort((a, b) => a.minY - b.minY);
  }, [quests, positions]);

  if (lanes.length === 0) return null;

  const [tx, ty, zoom] = transform;

  return (
    <div className="flow-category-lanes" aria-hidden>
      {lanes.map((lane) => {
        const left = lane.minX * zoom + tx;
        const top = lane.minY * zoom + ty;
        const width = (lane.maxX - lane.minX) * zoom;
        const height = (lane.maxY - lane.minY) * zoom;
        return (
          <div
            key={lane.category}
            className="flow-category-lane"
            style={{ left, top, width, height }}
          >
            <span className="flow-category-label">{lane.category}</span>
          </div>
        );
      })}
    </div>
  );
}
