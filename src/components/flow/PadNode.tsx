import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ValidationIssue } from '../../generator/validate';
import type { Dimension, TeleportPad } from '../../types/dimension';

export interface PadNodeData {
  pad: TeleportPad;
  dimensions: Dimension[];
  issues: ValidationIssue[];
  isSelected: boolean;
  [key: string]: unknown;
}

export type PadFlowNode = Node<PadNodeData, 'pad'>;

function dimensionName(dimensions: Dimension[], id: string | undefined, overworld: string): string {
  if (!id) return overworld;
  return dimensions.find((d) => d.id === id)?.name ?? overworld;
}

export const PadNode = memo(function PadNode({ data }: NodeProps<PadFlowNode>) {
  const { t } = useTranslation('flow');
  const { t: td } = useTranslation('dimensions');
  const { pad, dimensions, issues, isSelected } = data;
  const hasError = issues.some((i) => i.level === 'error');
  const hasWarning = issues.some((i) => i.level === 'warning');
  const nodeState = hasError ? 'error' : hasWarning ? 'warning' : 'ok';
  const from = dimensionName(dimensions, pad.at.dimensionId, td('overworld'));
  const to = dimensionName(dimensions, pad.to.dimensionId, td('overworld'));

  return (
    <div className={`flow-node-shell flow-node-pad ${isSelected ? 'selected' : ''} ${nodeState}`}>
      <Handle
        id="at"
        type="source"
        position={Position.Left}
        className="flow-handle flow-handle-in"
        title={t('padNode.handleFromTitle')}
        isConnectable
      />
      <Handle
        id="to"
        type="source"
        position={Position.Right}
        className="flow-handle flow-handle-out"
        title={t('padNode.handleToTitle')}
        isConnectable
      />

      <div className="flow-node">
        <div className="flow-node-header">
          <div className="flow-node-header-main">
            <span className="flow-node-title">{pad.name || t('padNode.untitled')}</span>
          </div>
          <span className="flow-node-type">{t('padNode.typeLabel')}</span>
        </div>
        <p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>
          {t('padNode.route', { from, to })}
        </p>
      </div>
    </div>
  );
});
