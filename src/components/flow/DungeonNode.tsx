import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { type Dungeon } from '../../types/dungeon';
import { type Project } from '../../types/quest';
import { type ValidationIssue } from '../../generator/validate';

export interface DungeonNodeData {
  dungeon: Dungeon;
  project: Project;
  issues: ValidationIssue[];
  isSelected: boolean;
  [key: string]: unknown;
}

export type DungeonFlowNode = Node<DungeonNodeData, 'dungeon'>;

export const DungeonNode = memo(function DungeonNode({ data }: NodeProps<DungeonFlowNode>) {
  const { t } = useTranslation('flow');
  const { dungeon, issues, isSelected } = data;
  const hasError = issues.some((i) => i.level === 'error');
  const hasWarning = issues.some((i) => i.level === 'warning');
  const nodeState = hasError ? 'error' : hasWarning ? 'warning' : 'ok';
  const roomCount = dungeon.rooms.length;
  const missingMob = dungeon.rooms.some((r) =>
    r.spawns.some((s) => s.sourceType === 'customMob' && s.customMobId && !(data.project.customMobs ?? []).some((m) => m.id === s.customMobId)),
  );

  return (
    <div
      className={`flow-node-shell flow-node-dungeon ${isSelected ? 'selected' : ''} ${nodeState}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="flow-handle flow-handle-in"
        title={t('dungeonNode.handleInTitle')}
        isConnectable
      />

      <div className="flow-node">
        <div className="flow-node-header">
          <div className="flow-node-header-main">
            <span className="flow-node-title">{dungeon.name || t('dungeonNode.untitled')}</span>
            <div className="flow-node-badges">
              {missingMob && (
                <span className="flow-node-badge broken" title={t('dungeonNode.missingMobTitle')}>
                  !
                </span>
              )}
            </div>
          </div>
          <span className="flow-node-type">{t('dungeonNode.typeLabel')}</span>
        </div>
        <p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>
          {t('dungeonNode.roomCount', { count: roomCount })}
        </p>
      </div>
    </div>
  );
});
