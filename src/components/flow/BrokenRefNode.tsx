import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';

export interface BrokenRefNodeData {
  label: string;
  kind: 'unlock' | 'requires';
  [key: string]: unknown;
}

export type BrokenRefFlowNode = Node<BrokenRefNodeData, 'broken'>;

export const BrokenRefNode = memo(function BrokenRefNode({ data }: NodeProps<BrokenRefFlowNode>) {
  const { t } = useTranslation('flow');

  return (
    <div className="flow-node-broken-stub" title={t('brokenNode.title', { name: data.label })}>
      {data.kind === 'unlock' && (
        <Handle type="target" position={Position.Left} className="flow-handle" />
      )}
      <span className="flow-broken-label">{t('brokenNode.missing')}</span>
      <span className="flow-broken-name">{data.label}</span>
      {data.kind === 'requires' && (
        <Handle type="source" position={Position.Right} className="flow-handle" />
      )}
    </div>
  );
});
