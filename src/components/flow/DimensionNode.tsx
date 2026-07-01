import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ValidationIssue } from '../../generator/validate';
import type { Dimension } from '../../types/dimension';

export interface DimensionNodeData {
  dimension: Dimension;
  issues: ValidationIssue[];
  isSelected: boolean;
  [key: string]: unknown;
}

export type DimensionFlowNode = Node<DimensionNodeData, 'dimension'>;

export const DimensionNode = memo(function DimensionNode({ data }: NodeProps<DimensionFlowNode>) {
  const { t } = useTranslation('flow');
  const { dimension, issues, isSelected } = data;
  const hasError = issues.some((i) => i.level === 'error');
  const hasWarning = issues.some((i) => i.level === 'warning');
  const nodeState = hasError ? 'error' : hasWarning ? 'warning' : 'ok';

  return (
    <div
      className={`flow-node-shell flow-node-dimension ${isSelected ? 'selected' : ''} ${nodeState}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="flow-handle flow-handle-in"
        title={t('dimensionNode.handleInTitle')}
        isConnectable
      />

      <div className="flow-node">
        <div className="flow-node-header">
          <div className="flow-node-header-main">
            <span className="flow-node-title">{dimension.name || t('dimensionNode.untitled')}</span>
          </div>
          <span className="flow-node-type">{t('dimensionNode.typeLabel')}</span>
        </div>
        {dimension.tag && (
          <p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>
            {dimension.tag}
          </p>
        )}
      </div>
    </div>
  );
});
