import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  MarkerType,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type NodeTypes,
} from '@xyflow/react';
import { type Project, type Quest } from '../../types/quest';
import { validateProject } from '../../generator/validate';
import { QuestNode, type FlowStage } from './QuestNode';
import { GenerateNode } from './GenerateNode';
import { InspectorPanel, type InspectorTarget } from './InspectorPanel';
import {
  GENERATE_NODE_ID,
  connectQuests,
  disconnectQuests,
  generateEdges,
  questsToEdges,
} from './chainEdges';
import { layeredLayout, type XY } from './layout';

interface Props {
  project: Project;
  onChangeQuest: (quest: Quest) => void;
  onChangeProject: (project: Project) => void;
  selectedId: string;
  onSelect: (id: string) => void;
}

const nodeTypes: NodeTypes = {
  quest: QuestNode,
  generate: GenerateNode,
} as unknown as NodeTypes;

/** Build a positions map, preferring stored project positions over auto-layout. */
function seedPositions(project: Project, edges: Edge[]): Map<string, XY> {
  const layout = layeredLayout(project.quests, edges);
  const stored = project.flowPositions ?? {};
  const ids = [...project.quests.map((q) => q.id), GENERATE_NODE_ID];
  const map = new Map<string, XY>();
  for (const id of ids) {
    map.set(id, stored[id] ?? layout.get(id) ?? { x: 0, y: 0 });
  }
  return map;
}

function positionsToRecord(map: Map<string, XY>): Record<string, XY> {
  const record: Record<string, XY> = {};
  for (const [id, pos] of map) record[id] = pos;
  return record;
}

export function FlowCanvas({
  project,
  onChangeQuest,
  onChangeProject,
  selectedId,
  onSelect,
}: Props) {
  const issues = useMemo(() => validateProject(project), [project]);
  const edges = useMemo<Edge[]>(
    () => [...questsToEdges(project.quests), ...generateEdges(project.quests)],
    [project.quests],
  );

  const [positions, setPositions] = useState<Map<string, XY>>(() =>
    seedPositions(project, edges),
  );
  const [inspector, setInspector] = useState<InspectorTarget>(null);

  // Ensure every quest (and the Generate node) has a position; reconcile when
  // the set of nodes changes (quests added/removed) while preserving drags and
  // any stored project positions.
  useEffect(() => {
    setPositions((prev) => {
      const needed = [...project.quests.map((q) => q.id), GENERATE_NODE_ID];
      const missing = needed.some((id) => !prev.has(id));
      const stale = prev.size > needed.length;
      if (!missing && !stale) return prev;
      const fresh = layeredLayout(project.quests, edges);
      const stored = project.flowPositions ?? {};
      const next = new Map<string, XY>();
      for (const id of needed) {
        next.set(id, prev.get(id) ?? stored[id] ?? fresh.get(id) ?? { x: 0, y: 0 });
      }
      return next;
    });
  }, [project.quests, project.flowPositions, edges]);

  const persistPositions = useCallback(
    (map: Map<string, XY>) => {
      onChangeProject({ ...project, flowPositions: positionsToRecord(map) });
    },
    [project, onChangeProject],
  );

  const openStage = useCallback(
    (questId: string, stage: FlowStage) => {
      onSelect(questId);
      setInspector({ kind: 'quest', questId, stage });
    },
    [onSelect],
  );

  const selectedStage =
    inspector?.kind === 'quest' ? inspector.stage : undefined;

  const nodes = useMemo<Node[]>(() => {
    const questNodes: Node[] = project.quests.map((quest) => ({
      id: quest.id,
      type: 'quest',
      position: positions.get(quest.id) ?? { x: 0, y: 0 },
      data: {
        quest,
        issues: issues.filter((i) => i.questId === quest.id),
        selectedStage: selectedId === quest.id ? selectedStage : undefined,
        isSelected: selectedId === quest.id,
        onOpenStage: openStage,
      },
    }));

    const generateNode: Node = {
      id: GENERATE_NODE_ID,
      type: 'generate',
      position: positions.get(GENERATE_NODE_ID) ?? { x: 0, y: 0 },
      data: {
        errorCount: issues.filter((i) => i.level === 'error').length,
        warningCount: issues.filter((i) => i.level === 'warning').length,
        isSelected: inspector?.kind === 'generate',
        onOpen: () => setInspector({ kind: 'generate' }),
      },
    };

    return [...questNodes, generateNode];
  }, [project.quests, positions, issues, selectedId, selectedStage, openStage, inspector]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setPositions((prev) => {
      let next = prev;
      let mutated = false;
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          if (!mutated) {
            next = new Map(prev);
            mutated = true;
          }
          next.set(change.id, change.position);
        }
      }
      return mutated ? next : prev;
    });
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (connection.target === GENERATE_NODE_ID) return;
      onChangeProject(connectQuests(project, connection.source, connection.target));
    },
    [project, onChangeProject],
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      let next = project;
      for (const edge of deleted) {
        next = disconnectQuests(next, edge.source, edge.target);
      }
      if (next !== project) onChangeProject(next);
    },
    [project, onChangeProject],
  );

  const relayout = useCallback(() => {
    const fresh = layeredLayout(project.quests, edges);
    setPositions(fresh);
    persistPositions(fresh);
  }, [project.quests, edges, persistPositions]);

  return (
    <div className="flow-wrap">
      <div className="flow-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeDragStop={() => persistPositions(positions)}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          onNodeClick={(_, node) => {
            if (node.id === GENERATE_NODE_ID) {
              setInspector({ kind: 'generate' });
            } else {
              onSelect(node.id);
            }
          }}
          defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed } }}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} />
          <Controls />
          <MiniMap pannable zoomable />
          <Panel position="top-right">
            <button className="btn small" onClick={relayout} title="Re-layout all quests">
              Auto-arrange
            </button>
          </Panel>
          <Panel position="top-left">
            <div className="flow-tip">
              {project.quests.length <= 1
                ? 'Add more quests in the sidebar, then drag from one card to another to link them into a storyline.'
                : 'Drag from a card\u2019s right edge to another card to link quests. Click a stage to edit it.'}
            </div>
          </Panel>
        </ReactFlow>
      </div>

      <InspectorPanel
        target={inspector}
        project={project}
        onChangeQuest={onChangeQuest}
        onSelectStage={(stage) =>
          setInspector((prev) =>
            prev?.kind === 'quest' ? { ...prev, stage } : prev,
          )
        }
        onClose={() => setInspector(null)}
      />
    </div>
  );
}
