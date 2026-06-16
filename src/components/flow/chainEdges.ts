import { type Edge } from '@xyflow/react';
import { type Project, type Quest } from '../../types/quest';

/** Id of the synthetic terminal node every leaf quest flows into. */
export const GENERATE_NODE_ID = '__generate__';

/** Look up a quest by its (possibly stale) name reference. */
function byName(quests: Quest[], name: string | undefined): Quest | undefined {
  if (!name) return undefined;
  return quests.find((q) => q.name === name);
}

/**
 * Derive a deduped set of quest-to-quest edges from the chain model.
 * Chain links reference quests by name (the current model), so a source/target
 * pair is keyed by quest id once resolved. Edges point source -> target where
 * the source unlocks / is required-by the target.
 */
export function questsToEdges(quests: Quest[]): Edge[] {
  const seen = new Set<string>();
  const edges: Edge[] = [];

  const push = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const key = `${sourceId}->${targetId}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({
      id: key,
      source: sourceId,
      target: targetId,
      type: 'smoothstep',
      animated: true,
      className: 'flow-edge',
    });
  };

  for (const quest of quests) {
    // quest unlocks X  => edge quest -> X
    const unlocked = byName(quests, quest.chain.unlocks);
    if (unlocked) push(quest.id, unlocked.id);

    // quest requires Y => edge Y -> quest
    const required = byName(quests, quest.chain.requires);
    if (required) push(required.id, quest.id);
  }

  return edges;
}

/** Quests that nothing else unlocks/requires onward, i.e. storyline leaves. */
export function leafQuestIds(quests: Quest[]): string[] {
  const edges = questsToEdges(quests);
  const hasOutgoing = new Set(edges.map((e) => e.source));
  return quests.filter((q) => !hasOutgoing.has(q.id)).map((q) => q.id);
}

/** Edges connecting every leaf quest into the terminal Generate node. */
export function generateEdges(quests: Quest[]): Edge[] {
  return leafQuestIds(quests).map((id) => ({
    id: `${id}->${GENERATE_NODE_ID}`,
    source: id,
    target: GENERATE_NODE_ID,
    type: 'smoothstep',
    className: 'flow-edge generate',
  }));
}

/** Would connecting source -> target introduce a prerequisite cycle? */
export function wouldCreateCycle(
  quests: Quest[],
  sourceId: string,
  targetId: string,
): boolean {
  if (sourceId === targetId) return true;
  // A cycle forms if target can already reach source.
  const edges = questsToEdges(quests);
  const adjacency = new Map<string, string[]>();
  for (const e of edges) {
    const list = adjacency.get(e.source) ?? [];
    list.push(e.target);
    adjacency.set(e.source, list);
  }
  const stack = [targetId];
  const visited = new Set<string>();
  while (stack.length) {
    const current = stack.pop()!;
    if (current === sourceId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of adjacency.get(current) ?? []) stack.push(next);
  }
  return false;
}

/**
 * Connect two quests in the chain: the source unlocks the target and the target
 * requires the source. Returns a new project (pure). Rejects self-links and
 * connections that would create a cycle by returning the project unchanged.
 */
export function connectQuests(
  project: Project,
  sourceId: string,
  targetId: string,
): Project {
  if (sourceId === targetId || targetId === GENERATE_NODE_ID) return project;
  if (wouldCreateCycle(project.quests, sourceId, targetId)) return project;

  const source = project.quests.find((q) => q.id === sourceId);
  const target = project.quests.find((q) => q.id === targetId);
  if (!source || !target) return project;

  const quests = project.quests.map((q) => {
    if (q.id === sourceId) return { ...q, chain: { ...q.chain, unlocks: target.name } };
    if (q.id === targetId) return { ...q, chain: { ...q.chain, requires: source.name } };
    return q;
  });
  return { ...project, quests };
}

/** Remove the chain link between two quests (clears both ends). */
export function disconnectQuests(
  project: Project,
  sourceId: string,
  targetId: string,
): Project {
  const source = project.quests.find((q) => q.id === sourceId);
  const target = project.quests.find((q) => q.id === targetId);
  if (!source || !target) return project;

  const quests = project.quests.map((q) => {
    if (q.id === sourceId && q.chain.unlocks === target.name) {
      return { ...q, chain: { ...q.chain, unlocks: undefined } };
    }
    if (q.id === targetId && q.chain.requires === source.name) {
      return { ...q, chain: { ...q.chain, requires: undefined } };
    }
    return q;
  });
  return { ...project, quests };
}
