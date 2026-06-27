import { useTranslation } from 'react-i18next';
import { type Edge } from '@xyflow/react';
import { type Project } from '../../types/quest';
import { GENERATE_NODE_ID, isBrokenNodeId } from './chainEdges';

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
  const source = project.quests.find((q) => q.id === edge.source);
  const target = project.quests.find((q) => q.id === edge.target);
  const canEdit = source && target && !isBrokenNodeId(edge.source) && !isBrokenNodeId(edge.target);

  if (!canEdit) return null;

  const reciprocal = source.chain.unlocks === target.name;
  const autoStart = source.chain.autoStart;

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
        <button type="button" className="flow-tip-dismiss" onClick={onClose} aria-label={tc('actions.close')}>
          ×
        </button>
      </div>
      <p className="flow-edge-popover-route muted">
        {t('edges.popoverRoute', {
          source: source.name || t('edges.untitled'),
          target: target.name || t('edges.untitled'),
        })}
      </p>
      {reciprocal && (
        <label className="flow-edge-popover-check">
          <input
            type="checkbox"
            checked={autoStart}
            onChange={(e) => onToggleAutoStart(source.id, e.target.checked)}
          />
          {t('edges.autoStartNext')}
        </label>
      )}
      <button
        type="button"
        className="btn small danger flow-edge-popover-disconnect"
        onClick={() => {
          onDisconnect(source.id, target.id);
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
  return (
    edge.type === 'story' &&
    !isBrokenNodeId(edge.source) &&
    !isBrokenNodeId(edge.target) &&
    edge.target !== GENERATE_NODE_ID &&
    edge.source !== GENERATE_NODE_ID
  );
}
