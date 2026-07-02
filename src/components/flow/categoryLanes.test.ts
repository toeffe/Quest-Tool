import { describe, expect, it } from 'vitest';
import { createQuest } from '../../types/factory';
import { computeCategoryLaneBounds } from './CategoryLanes';
import { NODE_HEIGHT_ESTIMATE, NODE_WIDTH } from './layout';

const LANE_PADDING = 16;

describe('computeCategoryLaneBounds', () => {
  it('returns one lane spanning both quests when they share a category', () => {
    const questA = createQuest('Quest A');
    questA.category = 'General';
    const questB = createQuest('Quest B');
    questB.category = 'General';

    const positions = new Map([
      [questA.id, { x: 40, y: 40 }],
      [questB.id, { x: 400, y: 340 }],
    ]);

    const lanes = computeCategoryLaneBounds([questA, questB], positions);

    expect(lanes).toHaveLength(1);
    expect(lanes[0].category).toBe('General');
    expect(lanes[0].minX).toBe(40 - LANE_PADDING);
    expect(lanes[0].minY).toBe(40 - LANE_PADDING);
    expect(lanes[0].maxX).toBe(400 + NODE_WIDTH + LANE_PADDING);
    expect(lanes[0].maxY).toBe(340 + NODE_HEIGHT_ESTIMATE + LANE_PADDING);
  });

  it('returns separate lanes for different categories', () => {
    const questA = createQuest('Quest A');
    questA.category = 'General';
    const questB = createQuest('Quest B');
    questB.category = 'Side';

    const positions = new Map([
      [questA.id, { x: 40, y: 40 }],
      [questB.id, { x: 40, y: 340 }],
    ]);

    const lanes = computeCategoryLaneBounds([questA, questB], positions);

    expect(lanes).toHaveLength(2);
    expect(lanes.map((l) => l.category).sort()).toEqual(['General', 'Side']);
  });

  it('groups empty category strings under General', () => {
    const questA = createQuest('Quest A');
    questA.category = '';
    const questB = createQuest('Quest B');
    questB.category = 'General';

    const positions = new Map([
      [questA.id, { x: 40, y: 40 }],
      [questB.id, { x: 400, y: 40 }],
    ]);

    const lanes = computeCategoryLaneBounds([questA, questB], positions);

    expect(lanes).toHaveLength(1);
    expect(lanes[0].category).toBe('General');
    expect(lanes[0].maxX).toBe(400 + NODE_WIDTH + LANE_PADDING);
  });
});
