import { describe, expect, it } from 'vitest';
import { createQuest } from '../types/factory';
import {
  buildQuestChainAdjacency,
  findQuestIdsInChainCycles,
  wouldCreateCycle,
} from './chainGraph';

function questChain(name: string, requires?: string, unlocks?: string) {
  const q = createQuest(name, 'kill');
  q.chain = { requires, unlocks, autoStart: false, announce: true };
  return q;
}

describe('chainGraph', () => {
  it('builds adjacency from requires and unlocks', () => {
    const quests = [
      questChain('A', undefined, 'B'),
      questChain('B', 'A', 'C'),
      questChain('C', 'B'),
    ];
    const adj = buildQuestChainAdjacency(quests);
    expect(adj.get(quests[0].id)).toEqual([quests[1].id]);
    expect(adj.get(quests[1].id)).toEqual([quests[2].id]);
  });

  it('detects when a new link would create a cycle', () => {
    const quests = [questChain('A', undefined, 'B'), questChain('B', 'A')];
    expect(wouldCreateCycle(quests, quests[1].id, quests[0].id)).toBe(true);
  });

  it('finds all quest ids in an existing cycle', () => {
    const quests = [
      questChain('A', undefined, 'B'),
      questChain('B', 'A', 'C'),
      questChain('C', 'B', 'A'),
    ];
    const cyclic = findQuestIdsInChainCycles(quests);
    expect(cyclic.size).toBe(3);
    for (const q of quests) expect(cyclic.has(q.id)).toBe(true);
  });

  it('returns empty when the chain is acyclic', () => {
    const quests = [questChain('A', undefined, 'B'), questChain('B', 'A')];
    expect(findQuestIdsInChainCycles(quests).size).toBe(0);
  });
});
