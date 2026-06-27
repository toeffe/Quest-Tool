import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';

export interface GenerateNodeData {
  questCount: number;
  errorCount: number;
  warningCount: number;
  isSelected: boolean;
  onOpen: () => void;
  [key: string]: unknown;
}

export type GenerateFlowNode = Node<GenerateNodeData, 'generate'>;

export const GenerateNode = memo(function GenerateNode({ data }: NodeProps<GenerateFlowNode>) {
  const { t } = useTranslation('flow');
  const { questCount, errorCount, warningCount, isSelected, onOpen } = data;
  const state = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'ok';

  return (
    <div
      className={`flow-node generate ${isSelected ? 'selected' : ''} ${state}`}
      onClick={onOpen}
    >
      <Handle type="target" position={Position.Left} className="flow-handle" />
      <div className="flow-generate-icon">{t('generateNode.pack')}</div>
      <div className="flow-generate-title">{t('generateNode.title')}</div>
      <div className="flow-generate-status">
        {t('generateNode.questCount', { count: questCount })}
      </div>
      <div className="flow-generate-substatus">
        {errorCount > 0
          ? t('generateNode.errorsToFix', { count: errorCount })
          : warningCount > 0
            ? t('generateNode.warnings', { count: warningCount })
            : t('generateNode.ready')}
      </div>
    </div>
  );
});
