import type { Edge } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import type { Project } from '../../types/quest';
import { type FlowEdgeData, GENERATE_NODE_ID, isBrokenNodeId, isDungeonNodeId } from './chainEdges';

interface Props {
  edge: Edge;
  project: Project;
  x: number;
  y: number;
  onToggleAutoStart: (sourceQuestId: string, enabled: boolean) => void;
  onDisconnect: (sourceId: string, targetId: string) => void;
  onClose: () => void;
}

export function ChainEdgePopover({
  edge,
  project,
  x,
  y,
  onToggleAutoStart,
  onDisconnect,
  onClose,
}: Props) {
  const { t } = useTranslation('flow');
  const { t: tc } = useTranslation('common');
  const edgeData = edge.data as FlowEdgeData | undefined;

  const sourceQuest = project.quests.find((q) => q.id === edge.source);
  const targetQuest = project.quests.find((q) => q.id === edge.target);
  const targetDungeon = (project.dungeons ?? []).find((d) => d.id === edge.target);

  const isQuestChain =
    sourceQuest && targetQuest && !isBrokenNodeId(edge.source) && !isBrokenNodeId(edge.target);
  const isQuestGate = sourceQuest && targetDungeon && edgeData?.label === 'gates';

  if (!isQuestChain && !isQuestGate) return null;

  if (isQuestGate) {
    return (
      <div
        className="flow-edge-popover"
        style={{ left: x, top: y }}
        role="dialog"
        aria-label={t('edges.gatePopoverAria')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flow-edge-popover-head">
          <strong>{t('edges.gatePopoverTitle')}</strong>
          <button
            type="button"
            className="flow-tip-dismiss"
            onClick={onClose}
            aria-label={tc('actions.close')}
          >
            ×
          </button>
        </div>
        <p className="flow-edge-popover-route muted">
          {t('edges.gatePopoverRoute', {
            quest: sourceQuest.name || t('edges.untitled'),
            dungeon: targetDungeon.name || t('edges.untitled'),
          })}
        </p>
        <button
          type="button"
          className="btn small danger flow-edge-popover-disconnect"
          onClick={() => {
            onDisconnect(sourceQuest.id, targetDungeon.id);
            onClose();
          }}
        >
          {t('edges.unlinkGate')}
        </button>
        <p className="flow-edge-popover-hint muted">{t('edges.unlinkHint')}</p>
      </div>
    );
  }

  const reciprocal = sourceQuest!.chain.unlocks === targetQuest!.name;
  const autoStart = sourceQuest!.chain.autoStart;

  return (
    <div
      className="flow-edge-popover"
      style={{ left: x, top: y }}
      role="dialog"
      aria-label={t('edges.popoverAria')}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flow-edge-popover-head">
        <strong>{t('edges.popoverTitle')}</strong>
        <button
          type="button"
          className="flow-tip-dismiss"
          onClick={onClose}
          aria-label={tc('actions.close')}
        >
          ×
        </button>
      </div>
      <p className="flow-edge-popover-route muted">
        {t('edges.popoverRoute', {
          source: sourceQuest!.name || t('edges.untitled'),
          target: targetQuest!.name || t('edges.untitled'),
        })}
      </p>
      {reciprocal && (
        <label className="flow-edge-popover-check">
          <input
            type="checkbox"
            checked={autoStart}
            onChange={(e) => onToggleAutoStart(sourceQuest!.id, e.target.checked)}
          />
          {t('edges.autoStartNext')}
        </label>
      )}
      <button
        type="button"
        className="btn small danger flow-edge-popover-disconnect"
        onClick={() => {
          onDisconnect(sourceQuest!.id, targetQuest!.id);
          onClose();
        }}
      >
        {t('edges.unlinkQuests')}
      </button>
      <p className="flow-edge-popover-hint muted">{t('edges.unlinkHint')}</p>
    </div>
  );
}

export function isChainStoryEdge(edge: Edge): boolean {
  const data = edge.data as FlowEdgeData | undefined;
  if (data?.world) return false;
  return (
    edge.type === 'story' &&
    !isBrokenNodeId(edge.source) &&
    !isBrokenNodeId(edge.target) &&
    edge.target !== GENERATE_NODE_ID &&
    edge.source !== GENERATE_NODE_ID
  );
}

export function isGateStoryEdge(edge: Edge, project: Project): boolean {
  const data = edge.data as FlowEdgeData | undefined;
  return edge.type === 'story' && data?.label === 'gates' && isDungeonNodeId(project, edge.target);
}

export function isEditableStoryEdge(edge: Edge, project: Project): boolean {
  return isChainStoryEdge(edge) || isGateStoryEdge(edge, project);
}
