import type { Quest } from '../types/quest';

function byName(quests: Quest[], name: string | undefined): Quest | undefined {
  if (!name) return undefined;
  return quests.find((q) => q.name === name);
}

/** Directed adjacency for quest chain edges (requires / unlocks), mirroring Story Flow semantics. */
export function buildQuestChainAdjacency(quests: Quest[]): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();
  const addEdge = (from: string, to: string) => {
    if (from === to) return;
    const list = adjacency.get(from) ?? [];
    if (!list.includes(to)) list.push(to);
    adjacency.set(from, list);
    if (!adjacency.has(to)) adjacency.set(to, []);
  };

  for (const quest of quests) {
    if (quest.chain.unlocks) {
      const unlocked = byName(quests, quest.chain.unlocks);
      if (unlocked) addEdge(quest.id, unlocked.id);
    }
    if (quest.chain.requires) {
      const required = byName(quests, quest.chain.requires);
      if (required) addEdge(required.id, quest.id);
    }
  }

  return adjacency;
}

function canReach(adjacency: Map<string, string[]>, from: string, to: string): boolean {
  const stack = [from];
  const visited = new Set<string>();
  while (stack.length) {
    const current = stack.pop()!;
    if (current === to) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of adjacency.get(current) ?? []) stack.push(next);
  }
  return false;
}

/** True when adding sourceId → targetId would close a directed cycle. */
export function wouldCreateCycle(quests: Quest[], sourceId: string, targetId: string): boolean {
  if (sourceId === targetId) return true;
  const adjacency = buildQuestChainAdjacency(quests);
  return canReach(adjacency, targetId, sourceId);
}

/** Quest ids that participate in at least one directed cycle in the chain graph. */
export function findQuestIdsInChainCycles(quests: Quest[]): Set<string> {
  const adjacency = buildQuestChainAdjacency(quests);
  const inCycle = new Set<string>();
  for (const [from, targets] of adjacency) {
    for (const to of targets) {
      if (canReach(adjacency, to, from)) {
        inCycle.add(from);
        inCycle.add(to);
      }
    }
  }
  return inCycle;
}
