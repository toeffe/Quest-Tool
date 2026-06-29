import { type Edge } from '@xyflow/react';
import { type Project, type Quest } from '../../types/quest';
import i18n, { getAppLocale } from '../../i18n';
import { type AppLocale } from '../../i18n/types';

/** Id of the synthetic terminal node every leaf quest flows into. */
export const GENERATE_NODE_ID = '__generate__';

export const BROKEN_UNLOCK_PREFIX = '__broken_unlock__';
export const BROKEN_REQUIRES_PREFIX = '__broken_requires__';

export type FlowEdgeLabelKey = 'requires' | 'unlocks' | 'autoStarts' | 'missingQuest' | 'gates';

export interface FlowEdgeData {
  label: FlowEdgeLabelKey;
  autoStart?: boolean;
  broken?: boolean;
  requiresOnly?: boolean;
}

export interface BrokenStub {
  id: string;
  label: string;
  anchorQuestId: string;
  kind: 'unlock' | 'requires';
}

function edgeLabel(key: FlowEdgeLabelKey, locale?: AppLocale): string {
  return i18n.t(`edges.${key}`, { ns: 'flow', lng: locale ?? getAppLocale() });
}

export function brokenUnlockId(questId: string): string {
  return `${BROKEN_UNLOCK_PREFIX}${questId}`;
}

export function brokenRequiresId(questId: string): string {
  return `${BROKEN_REQUIRES_PREFIX}${questId}`;
}

export function isBrokenNodeId(id: string): boolean {
  return id.startsWith(BROKEN_UNLOCK_PREFIX) || id.startsWith(BROKEN_REQUIRES_PREFIX);
}

/** Look up a quest by its (possibly stale) name reference. */
function byName(quests: Quest[], name: string | undefined): Quest | undefined {
  if (!name) return undefined;
  return quests.find((q) => q.name === name);
}

interface EdgeMeta {
  label: FlowEdgeLabelKey;
  autoStart?: boolean;
  broken?: boolean;
  requiresOnly?: boolean;
}

export function collectBrokenStubs(quests: Quest[]): BrokenStub[] {
  const stubs: BrokenStub[] = [];
  const seen = new Set<string>();

  for (const quest of quests) {
    if (quest.chain.unlocks && !byName(quests, quest.chain.unlocks)) {
      const id = brokenUnlockId(quest.id);
      if (!seen.has(id)) {
        seen.add(id);
        stubs.push({
          id,
          label: quest.chain.unlocks,
          anchorQuestId: quest.id,
          kind: 'unlock',
        });
      }
    }
    if (quest.chain.requires && !byName(quests, quest.chain.requires)) {
      const id = brokenRequiresId(quest.id);
      if (!seen.has(id)) {
        seen.add(id);
        stubs.push({
          id,
          label: quest.chain.requires,
          anchorQuestId: quest.id,
          kind: 'requires',
        });
      }
    }
  }
  return stubs;
}

/** Count incoming story edges targeting a quest (excludes broken stub sources for entry detection). */
export function getIncomingEdgeCount(questId: string, edges: Edge[]): number {
  return edges.filter(
    (e) => e.target === questId && !isBrokenNodeId(e.source) && e.source !== GENERATE_NODE_ID,
  ).length;
}

export function questsToEdges(quests: Quest[]): Edge[] {
  const seen = new Map<string, EdgeMeta>();
  const edges: Edge[] = [];

  const push = (sourceId: string, targetId: string, meta: EdgeMeta) => {
    if (sourceId === targetId) return;
    const key = `${sourceId}->${targetId}`;
    const existing = seen.get(key);
    if (existing) {
      if (meta.autoStart || meta.label === 'unlocks' || meta.broken) {
        seen.set(key, { ...existing, ...meta });
      }
      return;
    }
    seen.set(key, meta);
  };

  for (const quest of quests) {
    if (quest.chain.unlocks) {
      const unlocked = byName(quests, quest.chain.unlocks);
      if (unlocked) {
        push(quest.id, unlocked.id, {
          label: quest.chain.autoStart ? 'autoStarts' : 'unlocks',
          autoStart: quest.chain.autoStart,
        });
      } else {
        push(quest.id, brokenUnlockId(quest.id), {
          label: 'missingQuest',
          broken: true,
        });
      }
    }

    if (quest.chain.requires) {
      const required = byName(quests, quest.chain.requires);
      if (required) {
        const reciprocal = required.chain.unlocks === quest.name;
        push(required.id, quest.id, {
          label: reciprocal ? (required.chain.autoStart ? 'autoStarts' : 'unlocks') : 'requires',
          autoStart: reciprocal ? required.chain.autoStart : false,
          requiresOnly: !reciprocal,
        });
      } else {
        push(brokenRequiresId(quest.id), quest.id, {
          label: 'missingQuest',
          broken: true,
          requiresOnly: true,
        });
      }
    }
  }

  for (const [key, meta] of seen) {
    const [source, target] = key.split('->');
    edges.push({
      id: key,
      source,
      target,
      type: 'story',
      animated: !meta.broken && !meta.requiresOnly,
      className: `flow-edge ${meta.broken ? 'broken' : ''} ${meta.requiresOnly ? 'requires-only' : ''} ${meta.autoStart ? 'auto-start' : ''}`,
      data: {
        label: meta.label,
        autoStart: meta.autoStart,
        broken: meta.broken,
        requiresOnly: meta.requiresOnly,
      } satisfies FlowEdgeData,
    });
  }

  return edges;
}

export function leafQuestIds(quests: Quest[]): string[] {
  const edges = questsToEdges(quests);
  const hasOutgoing = new Set(
    edges.filter((e) => !isBrokenNodeId(e.target)).map((e) => e.source),
  );
  return quests.filter((q) => !hasOutgoing.has(q.id)).map((q) => q.id);
}

export function generateEdges(quests: Quest[]): Edge[] {
  return leafQuestIds(quests).map((id) => ({
    id: `${id}->${GENERATE_NODE_ID}`,
    source: id,
    target: GENERATE_NODE_ID,
    type: 'smoothstep',
    className: 'flow-edge generate',
  }));
}

export function wouldCreateCycle(
  quests: Quest[],
  sourceId: string,
  targetId: string,
): boolean {
  if (sourceId === targetId || isBrokenNodeId(sourceId) || isBrokenNodeId(targetId)) return true;
  const edges = questsToEdges(quests);
  const adjacency = new Map<string, string[]>();
  for (const e of edges) {
    if (isBrokenNodeId(e.target)) continue;
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

export type ConnectFailureReason = 'self' | 'generate' | 'cycle' | 'missing' | 'broken';

export function isDungeonNodeId(project: Project, id: string): boolean {
  return (project.dungeons ?? []).some((d) => d.id === id);
}

export function dungeonFlowEdges(project: Project): Edge[] {
  const edges: Edge[] = [];
  const seen = new Set<string>();
  for (const dungeon of project.dungeons ?? []) {
    for (const room of dungeon.rooms) {
      if (!room.questGate) continue;
      const quest = project.quests.find((q) => q.name === room.questGate!.questName);
      if (!quest) continue;
      const edgeId = `${quest.id}->dungeon:${dungeon.id}`;
      if (seen.has(edgeId)) continue;
      seen.add(edgeId);
      edges.push({
        id: edgeId,
        source: quest.id,
        target: dungeon.id,
        type: 'story',
        data: { label: 'gates', requiresOnly: true } satisfies FlowEdgeData,
      });
    }
  }
  return edges;
}

export function getConnectFailureReason(
  project: Project,
  sourceId: string,
  targetId: string,
): ConnectFailureReason | null {
  if (sourceId === targetId) return 'self';
  if (targetId === GENERATE_NODE_ID || isBrokenNodeId(targetId)) return 'generate';
  if (isBrokenNodeId(sourceId)) return 'broken';

  const source = project.quests.find((q) => q.id === sourceId);
  if (!source) return 'missing';

  if (isDungeonNodeId(project, targetId)) {
    return null;
  }

  const target = project.quests.find((q) => q.id === targetId);
  if (!target) return 'missing';
  if (wouldCreateCycle(project.quests, sourceId, targetId)) return 'cycle';
  return null;
}

export function connectFailureMessage(reason: ConnectFailureReason): string {
  return i18n.t(`connect.${reason}`, { ns: 'flow', lng: getAppLocale() });
}

export { edgeLabel };

export function connectQuests(
  project: Project,
  sourceId: string,
  targetId: string,
): Project {
  if (getConnectFailureReason(project, sourceId, targetId)) return project;

  if (isDungeonNodeId(project, targetId)) {
    return connectQuestToDungeon(project, sourceId, targetId);
  }

  const source = project.quests.find((q) => q.id === sourceId)!;
  const target = project.quests.find((q) => q.id === targetId)!;

  const quests = project.quests.map((q) => {
    if (q.id === sourceId) return { ...q, chain: { ...q.chain, unlocks: target.name } };
    if (q.id === targetId) return { ...q, chain: { ...q.chain, requires: source.name } };
    return q;
  });
  return { ...project, quests };
}

export function connectQuestToDungeon(
  project: Project,
  questId: string,
  dungeonId: string,
): Project {
  const quest = project.quests.find((q) => q.id === questId);
  if (!quest) return project;
  const dungeons = (project.dungeons ?? []).map((d) => {
    if (d.id !== dungeonId) return d;
    return {
      ...d,
      rooms: d.rooms.map((r) => ({
        ...r,
        questGate: { questName: quest.name, requiredState: 1 as const },
      })),
    };
  });
  return { ...project, dungeons };
}

export function disconnectQuestFromDungeon(
  project: Project,
  questId: string,
  dungeonId: string,
): Project {
  const quest = project.quests.find((q) => q.id === questId);
  if (!quest) return project;
  const dungeons = (project.dungeons ?? []).map((d) => {
    if (d.id !== dungeonId) return d;
    return {
      ...d,
      rooms: d.rooms.map((r) =>
        r.questGate?.questName === quest.name ? { ...r, questGate: undefined } : r,
      ),
    };
  });
  return { ...project, dungeons };
}

export function disconnectQuests(
  project: Project,
  sourceId: string,
  targetId: string,
): Project {
  if (isDungeonNodeId(project, targetId)) {
    return disconnectQuestFromDungeon(project, sourceId, targetId);
  }

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
