import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';

export interface GenerateNodeData {
  errorCount: number;
  warningCount: number;
  isSelected: boolean;
  onOpen: () => void;
  [key: string]: unknown;
}

export type GenerateFlowNode = Node<GenerateNodeData, 'generate'>;

export function GenerateNode({ data }: NodeProps<GenerateFlowNode>) {
  const { errorCount, warningCount, isSelected, onOpen } = data;
  const state = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'ok';

  return (
    <div
      className={`flow-node generate ${isSelected ? 'selected' : ''} ${state}`}
      onClick={onOpen}
    >
      <Handle type="target" position={Position.Left} className="flow-handle" />
      <div className="flow-generate-icon">PACK</div>
      <div className="flow-generate-title">Generate &amp; Export</div>
      <div className="flow-generate-status">
        {errorCount > 0
          ? `${errorCount} error${errorCount === 1 ? '' : 's'} to fix`
          : warningCount > 0
            ? `${warningCount} warning${warningCount === 1 ? '' : 's'}`
            : 'Ready to export'}
      </div>
    </div>
  );
}
