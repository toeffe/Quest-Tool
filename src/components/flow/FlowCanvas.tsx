import {
  Background,
  type Connection,
  Controls,
  type Edge,
  type EdgeTypes,
  MarkerType,
  MiniMap,
  type Node,
  type NodeChange,
  type NodeTypes,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ValidationIssue } from '../../generator/validate';
import { registerFlowShortcuts } from '../../hooks/flowShortcuts';
import type { Project, Quest } from '../../types/quest';
import type { EditorTab } from '../editor/ValidationBar';
import { BrokenRefNode } from './BrokenRefNode';
import { CategoryLanes } from './CategoryLanes';
import { ChainEdgePopover, isEditableStoryEdge } from './ChainEdgePopover';
import {
  collectBrokenStubs,
  connectFailureMessage,
  connectQuests,
  disconnectQuests,
  disconnectWorldEdge,
  dungeonFlowEdges,
  type FlowEdgeData,
  GENERATE_NODE_ID,
  generateEdges,
  getConnectFailureReason,
  isAuxiliaryFlowNodeId,
  isBrokenNodeId,
  isDimensionNodeId,
  isDungeonNodeId,
  isOverworldNodeId,
  isPadNodeId,
  isWorldStoryEdge,
  needsOverworldAnchor,
  OVERWORLD_NODE_ID,
  questsToEdges,
  worldFlowEdges,
} from './chainEdges';
import { DimensionNode } from './DimensionNode';
import { DungeonNode } from './DungeonNode';
import { FlowToolbar } from './FlowToolbar';
import { showFlowToast } from './flowToast';
import { GenerateNode } from './GenerateNode';
import { InspectorPanel, type InspectorTarget } from './InspectorPanel';
import { fullFlowLayout, placeBrokenStubs, type XY } from './layout';
import { OverworldNode } from './OverworldNode';
import { PadNode } from './PadNode';
import { QuestNode } from './QuestNode';
import { isStoryStart, type PlaythroughStep } from './questPlaythrough';
import { StoryEdge } from './StoryEdge';

interface Props {
  project: Project;
  issues: ValidationIssue[];
  onChangeQuest: (quest: Quest) => void;
  onChangeProject: (project: Project) => void;
  selectedId: string;
  onSelect: (id: string) => void;
}

const nodeTypes: NodeTypes = {
  quest: QuestNode,
  dungeon: DungeonNode,
  dimension: DimensionNode,
  pad: PadNode,
  overworld: OverworldNode,
  generate: GenerateNode,
  broken: BrokenRefNode,
} as unknown as NodeTypes;

const edgeTypes: EdgeTypes = {
  story: StoryEdge,
} as unknown as EdgeTypes;

function seedPositions(project: Project, edges: Edge[]): Map<string, XY> {
  const layout = fullFlowLayout(project, edges);
  const stored = project.flowPositions ?? {};
  const stubs = collectBrokenStubs(project.quests);
  const ids = [
    ...project.quests.map((q) => q.id),
    ...(project.dungeons ?? []).map((d) => d.id),
    ...(project.dimensions ?? []).map((d) => d.id),
    ...(project.teleportPads ?? []).map((p) => p.id),
    ...stubs.map((s) => s.id),
    GENERATE_NODE_ID,
  ];
  if (needsOverworldAnchor(project)) ids.push(OVERWORLD_NODE_ID);
  const map = new Map<string, XY>();
  for (const id of ids) {
    map.set(id, stored[id] ?? layout.get(id) ?? { x: 0, y: 0 });
  }
  placeBrokenStubs(map, stubs);
  return map;
}

function positionsToRecord(map: Map<string, XY>): Record<string, XY> {
  const record: Record<string, XY> = {};
  for (const [id, pos] of map) record[id] = pos;
  return record;
}

function FlowCanvasInner({
  project,
  issues,
  onChangeQuest,
  onChangeProject,
  selectedId,
  onSelect,
}: Props) {
  const { t } = useTranslation('flow');
  const { fitView } = useReactFlow();
  const storyEdges = useMemo(() => questsToEdges(project.quests), [project.quests]);
  const dungeonEdges = useMemo(() => dungeonFlowEdges(project), [project]);
  const worldEdges = useMemo(() => worldFlowEdges(project), [project]);
  const edges = useMemo<Edge[]>(
    () => [...storyEdges, ...dungeonEdges, ...worldEdges, ...generateEdges(project.quests)],
    [project, storyEdges, dungeonEdges, worldEdges],
  );
  const brokenStubs = useMemo(() => collectBrokenStubs(project.quests), [project.quests]);

  const [positions, setPositions] = useState<Map<string, XY>>(() => seedPositions(project, edges));
  const [inspector, setInspector] = useState<InspectorTarget>(null);
  const [showMinimap, setShowMinimap] = useState(true);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [tipDismissed, setTipDismissed] = useState(false);
  const [legendDismissed, setLegendDismissed] = useState(false);
  const [errorIndex, setErrorIndex] = useState(0);
  const [edgeMenu, setEdgeMenu] = useState<{ edge: Edge; x: number; y: number } | null>(null);
  const prevSelectedRef = useRef(selectedId);
  const canvasRef = useRef<HTMLDivElement>(null);

  const errorQuestIds = useMemo(
    () =>
      project.quests
        .filter((q) => issues.some((i) => i.questId === q.id && i.level === 'error'))
        .map((q) => q.id),
    [project.quests, issues],
  );

  const errorCount = issues.filter((i) => i.level === 'error').length;
  const warningCount = issues.filter((i) => i.level === 'warning').length;

  const questHasError = useCallback(
    (questId: string) => issues.some((i) => i.questId === questId && i.level === 'error'),
    [issues],
  );

  const worldNodeHasError = useCallback(
    (nodeId: string) => {
      if (isOverworldNodeId(nodeId)) return false;
      if (isDungeonNodeId(project, nodeId)) {
        return issues.some((i) => i.dungeonId === nodeId && i.level === 'error');
      }
      if (isDimensionNodeId(project, nodeId)) {
        return issues.some(
          (i) => i.dimensionId === nodeId && !i.teleportPadId && i.level === 'error',
        );
      }
      if (isPadNodeId(project, nodeId)) {
        return issues.some((i) => i.teleportPadId === nodeId && i.level === 'error');
      }
      return false;
    },
    [project, issues],
  );

  useEffect(() => {
    setPositions((prev) => {
      const needed = [
        ...project.quests.map((q) => q.id),
        ...(project.dungeons ?? []).map((d) => d.id),
        ...(project.dimensions ?? []).map((d) => d.id),
        ...(project.teleportPads ?? []).map((p) => p.id),
        ...brokenStubs.map((s) => s.id),
        GENERATE_NODE_ID,
      ];
      if (needsOverworldAnchor(project)) needed.push(OVERWORLD_NODE_ID);
      const missing = needed.some((id) => !prev.has(id));
      const stale = [...prev.keys()].some((id) => !needed.includes(id) && !isBrokenNodeId(id));
      if (!missing && !stale) return prev;
      const fresh = fullFlowLayout(project, edges);
      const stored = project.flowPositions ?? {};
      const next = new Map<string, XY>();
      for (const id of needed) {
        if (isBrokenNodeId(id)) continue;
        next.set(id, prev.get(id) ?? stored[id] ?? fresh.get(id) ?? { x: 0, y: 0 });
      }
      placeBrokenStubs(next, brokenStubs);
      for (const stub of brokenStubs) {
        if (!next.has(stub.id)) {
          const anchor = next.get(stub.anchorQuestId) ?? fresh.get(stub.anchorQuestId);
          if (anchor) {
            const tmp = new Map(next);
            placeBrokenStubs(tmp, [stub]);
            next.set(stub.id, tmp.get(stub.id)!);
          }
        }
      }
      if (!next.has(GENERATE_NODE_ID)) {
        next.set(
          GENERATE_NODE_ID,
          prev.get(GENERATE_NODE_ID) ?? fresh.get(GENERATE_NODE_ID) ?? { x: 0, y: 0 },
        );
      }
      return next;
    });
  }, [project, project.flowPositions, edges, brokenStubs]);

  const visibleWorldNodeIds = useMemo(() => {
    if (!errorsOnly) return null;
    const visible = new Set<string>();
    for (const edge of [...dungeonEdges, ...worldEdges]) {
      const srcErr = questHasError(edge.source) || worldNodeHasError(edge.source);
      const tgtErr = questHasError(edge.target) || worldNodeHasError(edge.target);
      if (srcErr || tgtErr) {
        visible.add(edge.source);
        visible.add(edge.target);
      }
    }
    return visible;
  }, [errorsOnly, dungeonEdges, worldEdges, questHasError, worldNodeHasError]);

  const panToQuest = useCallback(
    (questId: string) => {
      if (!questId || isBrokenNodeId(questId)) return;
      if (errorsOnly && !questHasError(questId)) return;
      window.setTimeout(() => {
        fitView({ nodes: [{ id: questId }], padding: 0.4, duration: 280, maxZoom: 1.2 });
      }, 50);
    },
    [fitView, errorsOnly, questHasError],
  );

  const focusQuest = useCallback(
    (questId: string, tab?: EditorTab, stepId?: string) => {
      onSelect(questId);
      setInspector({ kind: 'quest', questId, tab, stepId });
      panToQuest(questId);
    },
    [onSelect, panToQuest],
  );

  useEffect(() => {
    if (selectedId !== prevSelectedRef.current) {
      prevSelectedRef.current = selectedId;
      if (selectedId && inspector?.kind !== 'generate') {
        setInspector((prev) =>
          prev?.kind === 'quest' && prev.questId === selectedId
            ? prev
            : { kind: 'quest', questId: selectedId },
        );
        panToQuest(selectedId);
      }
    }
  }, [selectedId, inspector?.kind, panToQuest]);

  const persistPositions = useCallback(
    (map: Map<string, XY>) => {
      const record = positionsToRecord(map);
      for (const stub of brokenStubs) {
        delete record[stub.id];
      }
      onChangeProject({ ...project, flowPositions: record });
    },
    [project, onChangeProject, brokenStubs],
  );

  const openStep = useCallback(
    (questId: string, step: PlaythroughStep) => {
      focusQuest(questId, step.editorTab as EditorTab, step.id);
    },
    [focusQuest],
  );

  const nodes = useMemo<Node[]>(() => {
    const inspectorQuestId = inspector?.kind === 'quest' ? inspector.questId : null;
    const selectedStepId = inspector?.kind === 'quest' ? inspector.stepId : undefined;

    const isWorldHidden = (nodeId: string) =>
      errorsOnly &&
      !worldNodeHasError(nodeId) &&
      visibleWorldNodeIds !== null &&
      !visibleWorldNodeIds.has(nodeId);

    const questNodes: Node[] = project.quests.map((quest) => ({
      id: quest.id,
      type: 'quest',
      position: positions.get(quest.id) ?? { x: 0, y: 0 },
      hidden: errorsOnly && !questHasError(quest.id),
      data: {
        quest,
        project,
        issues: issues.filter((i) => i.questId === quest.id),
        selectedStepId: inspectorQuestId === quest.id ? selectedStepId : undefined,
        isSelected: selectedId === quest.id,
        isStoryEntry: isStoryStart(quest, project, storyEdges),
        onOpenStep: openStep,
      },
    }));

    const stubNodes: Node[] = brokenStubs.map((stub) => ({
      id: stub.id,
      type: 'broken',
      position: positions.get(stub.id) ?? { x: 0, y: 0 },
      draggable: false,
      selectable: false,
      data: { label: stub.label, kind: stub.kind },
    }));

    const generateNode: Node = {
      id: GENERATE_NODE_ID,
      type: 'generate',
      position: positions.get(GENERATE_NODE_ID) ?? { x: 0, y: 0 },
      data: {
        questCount: project.quests.length,
        errorCount,
        warningCount,
        isSelected: inspector?.kind === 'generate',
        onOpen: () => setInspector({ kind: 'generate' }),
      },
    };

    const dungeonNodes: Node[] = (project.dungeons ?? []).map((dungeon) => ({
      id: dungeon.id,
      type: 'dungeon',
      position: positions.get(dungeon.id) ?? { x: 400, y: 80 },
      hidden: isWorldHidden(dungeon.id),
      data: {
        dungeon,
        project,
        issues: issues.filter((i) => i.dungeonId === dungeon.id),
        isSelected: inspector?.kind === 'dungeon' && inspector.dungeonId === dungeon.id,
      },
    }));

    const dimensionNodes: Node[] = (project.dimensions ?? []).map((dimension) => ({
      id: dimension.id,
      type: 'dimension',
      position: positions.get(dimension.id) ?? { x: 720, y: 80 },
      hidden: isWorldHidden(dimension.id),
      data: {
        dimension,
        issues: issues.filter((i) => i.dimensionId === dimension.id && !i.teleportPadId),
        isSelected: inspector?.kind === 'dimension' && inspector.dimensionId === dimension.id,
      },
    }));

    const padNodes: Node[] = (project.teleportPads ?? []).map((pad) => ({
      id: pad.id,
      type: 'pad',
      position: positions.get(pad.id) ?? { x: 720, y: 320 },
      hidden: isWorldHidden(pad.id),
      data: {
        pad,
        dimensions: project.dimensions ?? [],
        issues: issues.filter((i) => i.teleportPadId === pad.id),
        isSelected: inspector?.kind === 'pad' && inspector.padId === pad.id,
      },
    }));

    const overworldNode: Node | null = needsOverworldAnchor(project)
      ? {
          id: OVERWORLD_NODE_ID,
          type: 'overworld',
          position: positions.get(OVERWORLD_NODE_ID) ?? { x: 720, y: 80 },
          draggable: false,
          selectable: false,
          hidden: isWorldHidden(OVERWORLD_NODE_ID),
          data: {
            isSelected: false,
          },
        }
      : null;

    return [
      ...questNodes,
      ...dungeonNodes,
      ...dimensionNodes,
      ...padNodes,
      ...(overworldNode ? [overworldNode] : []),
      ...stubNodes,
      generateNode,
    ];
  }, [
    project,
    positions,
    issues,
    selectedId,
    openStep,
    inspector,
    errorsOnly,
    questHasError,
    worldNodeHasError,
    visibleWorldNodeIds,
    errorCount,
    warningCount,
    brokenStubs,
    storyEdges,
  ]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setPositions((prev) => {
      let next = prev;
      let mutated = false;
      for (const change of changes) {
        if (change.type === 'position' && change.position && !isBrokenNodeId(change.id)) {
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
      const reason = getConnectFailureReason(
        project,
        connection.source,
        connection.target,
        connection.sourceHandle,
      );
      if (reason) {
        showFlowToast(connectFailureMessage(reason));
        return;
      }
      const preferredRoomId =
        inspector?.kind === 'dungeon' && inspector.dungeonId === connection.target
          ? inspector.roomId
          : undefined;
      onChangeProject(
        connectQuests(
          project,
          connection.source,
          connection.target,
          connection.sourceHandle,
          preferredRoomId,
        ),
      );
    },
    [project, onChangeProject, inspector],
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      setEdgeMenu(null);
      let next = project;
      for (const edge of deleted) {
        if (isBrokenNodeId(edge.source) || isBrokenNodeId(edge.target)) continue;
        if (isWorldStoryEdge(edge)) {
          const data = edge.data as FlowEdgeData | undefined;
          next = disconnectWorldEdge(next, edge.source, edge.target, data?.worldEndpoint);
          continue;
        }
        if (isDungeonNodeId(project, edge.target)) {
          next = disconnectQuests(next, edge.source, edge.target);
          continue;
        }
        next = disconnectQuests(next, edge.source, edge.target);
      }
      if (next !== project) onChangeProject(next);
    },
    [project, onChangeProject],
  );

  const relayout = useCallback(() => {
    const fresh = fullFlowLayout(project, edges);
    placeBrokenStubs(fresh, brokenStubs);
    setPositions(fresh);
    persistPositions(fresh);
    window.setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
  }, [project, edges, brokenStubs, persistPositions, fitView]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 });
  }, [fitView]);

  const handleFitErrors = useCallback(() => {
    if (errorQuestIds.length === 0) return;
    fitView({
      nodes: errorQuestIds.map((id) => ({ id })),
      padding: 0.3,
      duration: 300,
    });
  }, [fitView, errorQuestIds]);

  const handleNextError = useCallback(() => {
    if (errorQuestIds.length === 0) return;
    const next = (errorIndex + 1) % errorQuestIds.length;
    setErrorIndex(next);
    focusQuest(errorQuestIds[next]);
  }, [errorQuestIds, errorIndex, focusQuest]);

  useEffect(() => {
    if (errorIndex >= errorQuestIds.length) setErrorIndex(0);
  }, [errorQuestIds.length, errorIndex]);

  const handleToggleAutoStart = useCallback(
    (sourceQuestId: string, enabled: boolean) => {
      const quest = project.quests.find((q) => q.id === sourceQuestId);
      if (!quest) return;
      onChangeQuest({ ...quest, chain: { ...quest.chain, autoStart: enabled } });
    },
    [project.quests, onChangeQuest],
  );

  const handleDisconnectEdge = useCallback(
    (sourceId: string, targetId: string) => {
      onChangeProject(disconnectQuests(project, sourceId, targetId));
    },
    [project, onChangeProject],
  );

  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (!isEditableStoryEdge(edge, project)) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      setEdgeMenu({
        edge,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    },
    [project],
  );

  useEffect(() => {
    return registerFlowShortcuts({
      onEscape: () => {
        if (edgeMenu) {
          setEdgeMenu(null);
          return true;
        }
        if (inspector) {
          setInspector(null);
          return true;
        }
        return false;
      },
      onAutoArrange: relayout,
      onFitView: handleFitView,
      onNextError: handleNextError,
    });
  }, [edgeMenu, inspector, relayout, handleFitView, handleNextError]);

  const errorNavLabel =
    errorQuestIds.length > 0
      ? t('toolbar.errorNav', {
          current: Math.min(errorIndex + 1, errorQuestIds.length),
          total: errorQuestIds.length,
        })
      : '';

  return (
    <div className="flow-wrap">
      <div className="flow-canvas" ref={canvasRef}>
        <CategoryLanes quests={project.quests} positions={positions} />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onPaneClick={() => setEdgeMenu(null)}
          onNodeDragStop={() => {
            setPositions((current) => {
              persistPositions(current);
              return current;
            });
          }}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          onEdgeClick={handleEdgeClick}
          connectionRadius={32}
          deleteKeyCode={['Backspace', 'Delete']}
          onNodeClick={(_, node) => {
            setEdgeMenu(null);
            if (isBrokenNodeId(node.id)) {
              showFlowToast(t('connect.fixBrokenRef'));
              return;
            }
            if (node.id === GENERATE_NODE_ID) {
              setInspector({ kind: 'generate' });
            } else if (isOverworldNodeId(node.id)) {
              return;
            } else if (isDungeonNodeId(project, node.id)) {
              setInspector({ kind: 'dungeon', dungeonId: node.id });
            } else if (isDimensionNodeId(project, node.id)) {
              setInspector({ kind: 'dimension', dimensionId: node.id });
            } else if (isPadNodeId(project, node.id)) {
              setInspector({ kind: 'pad', padId: node.id });
            } else if (!isAuxiliaryFlowNodeId(project, node.id)) {
              focusQuest(node.id);
            }
          }}
          defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed } }}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} />
          <Controls />
          {showMinimap && <MiniMap pannable zoomable />}
          <FlowToolbar
            questCount={project.quests.length}
            errorCount={errorCount}
            warningCount={warningCount}
            errorNavLabel={errorNavLabel}
            showMinimap={showMinimap}
            errorsOnly={errorsOnly}
            tipDismissed={tipDismissed}
            legendDismissed={legendDismissed}
            onAutoArrange={relayout}
            onFitView={handleFitView}
            onFitErrors={handleFitErrors}
            onNextError={handleNextError}
            onToggleMinimap={() => setShowMinimap((v) => !v)}
            onToggleErrorsOnly={() => setErrorsOnly((v) => !v)}
            onDismissTip={() => setTipDismissed(true)}
            onDismissLegend={() => setLegendDismissed(true)}
          />
        </ReactFlow>
        {edgeMenu && (
          <ChainEdgePopover
            edge={edgeMenu.edge}
            project={project}
            x={edgeMenu.x}
            y={edgeMenu.y}
            onToggleAutoStart={handleToggleAutoStart}
            onDisconnect={handleDisconnectEdge}
            onClose={() => setEdgeMenu(null)}
          />
        )}
      </div>

      <InspectorPanel
        target={inspector}
        project={project}
        issues={issues}
        onChangeQuest={onChangeQuest}
        onChangeProject={onChangeProject}
        onClose={() => setInspector(null)}
      />
    </div>
  );
}

export function FlowCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
