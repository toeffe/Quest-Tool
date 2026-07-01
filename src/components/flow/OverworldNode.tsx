import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

export interface OverworldNodeData {
  isSelected: boolean;
  [key: string]: unknown;
}

export type OverworldFlowNode = Node<OverworldNodeData, 'overworld'>;

export const OverworldNode = memo(function OverworldNode({ data }: NodeProps<OverworldFlowNode>) {
  const { t } = useTranslation('flow');
  const { isSelected } = data;

  return (
    <div
      className={`flow-node-shell flow-node-overworld ${isSelected ? 'selected' : ''} ok`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="flow-handle flow-handle-in"
        title={t('overworldNode.handleInTitle')}
        isConnectable
      />

      <div className="flow-node">
        <div className="flow-node-header">
          <div className="flow-node-header-main">
            <span className="flow-node-title">{t('overworldNode.title')}</span>
          </div>
          <span className="flow-node-type">{t('overworldNode.typeLabel')}</span>
        </div>
        <p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>
          {t('overworldNode.hint')}
        </p>
      </div>
    </div>
  );
});
