import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { type Quest } from '../../types/quest';
import { type ValidationIssue } from '../../generator/validate';
import { useQuestTypeLabels } from '../../i18n/useLabels';
import { type PlaythroughStep } from './questPlaythrough';
import { isStoryLocked, prerequisiteResolved } from './questPlaythrough';
import { PlaythroughTimeline } from './PlaythroughTimeline';
import { type Project } from '../../types/quest';

export interface QuestNodeData {
  quest: Quest;
  project: Project;
  issues: ValidationIssue[];
  selectedStepId?: string;
  isSelected: boolean;
  isStoryEntry?: boolean;
  onOpenStep: (questId: string, step: PlaythroughStep) => void;
  [key: string]: unknown;
}

export type QuestFlowNode = Node<QuestNodeData, 'quest'>;

export const QuestNode = memo(function QuestNode({ data }: NodeProps<QuestFlowNode>) {
  const { t } = useTranslation('flow');
  const questTypeLabels = useQuestTypeLabels();
  const { quest, project, issues, selectedStepId, isSelected, isStoryEntry, onOpenStep } = data;
  const hasError = issues.some((i) => i.level === 'error');
  const hasWarning = issues.some((i) => i.level === 'warning');
  const nodeState = hasError ? 'error' : hasWarning ? 'warning' : 'ok';
  const showStart = Boolean(isStoryEntry);
  const showLocked = isStoryLocked(quest);
  const showBrokenPrereq = Boolean(quest.chain.requires) && !prerequisiteResolved(quest, project);

  return (
    <div
      className={`flow-node-shell flow-node-type-${quest.type} ${isSelected ? 'selected' : ''} ${nodeState}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="flow-handle flow-handle-in"
        title={t('questNode.handleInTitle')}
        isConnectable
      />

      <div className="flow-node">
      <div className="flow-node-header">
        <div className="flow-node-header-main">
          <span className="flow-node-title">{quest.name || t('questNode.untitled')}</span>
          <div className="flow-node-badges">
            {showStart && (
              <span className="flow-node-badge start" title={t('questNode.startTitle')}>
                {t('questNode.startBadge')}
              </span>
            )}
            {showLocked && !showBrokenPrereq && (
              <span
                className="flow-node-badge locked"
                title={
                  quest.chain.requires
                    ? t('questNode.lockedRequires', { name: quest.chain.requires })
                    : t('questNode.lockedPrereq')
                }
              >
                {t('questNode.lockedBadge')}
              </span>
            )}
            {showBrokenPrereq && (
              <span className="flow-node-badge broken" title={t('questNode.orphanTitle')}>
                {t('questNode.orphanBadge')}
              </span>
            )}
          </div>
        </div>
        <span className="flow-node-type">{questTypeLabels[quest.type]}</span>
      </div>

      <PlaythroughTimeline
        quest={quest}
        project={project}
        issues={issues}
        selectedStepId={selectedStepId}
        onOpenStep={onOpenStep}
      />
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="flow-handle flow-handle-out"
        title={t('questNode.handleOutTitle')}
        isConnectable
      />
    </div>
  );
});
